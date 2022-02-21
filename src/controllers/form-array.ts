import { ReactiveController, ReactiveControllerHost } from 'lit';
import { EMPTY, merge, Observable, ReplaySubject, switchMap, map, Subscription, from, of, combineLatest, BehaviorSubject, catchError, distinctUntilChanged, tap } from 'rxjs';
import { AbstractControl } from '../abstract-control';
import { AsyncValidator, ValidationError, ValidationStatus, Validator } from '../validation/models';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';

type ArrayValue<T> = T extends FormControl<infer C> ? C : (T extends FormGroup<infer F> ? F : never);

export interface FormArrayConfig<T extends AbstractControl> {
  initialItems: T[];
  validators: Validator<FormArray<T>>[];
  asyncValidators: AsyncValidator<FormArray<T>>[];
}

export class FormArray<T extends AbstractControl> implements AbstractControl, ReactiveController {
  public readonly config!: FormArrayConfig<T>;
  public controls: T[] = [];
  private runningAsyncValidatorsCount = 0;
  private errorsSync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsAsync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsFixed$ = new BehaviorSubject<ValidationError[]>([]);
  private validatorsSub?: Subscription;
  private asyncValidatorsSub?: Subscription;
  private structureChanged$ = new ReplaySubject<void>(1);

  get value(): ArrayValue<T>[] {
    return this.controls.map(c => c.value);
  }

  get errors() {
    return Array.from(new Set([
      ...this.errorsSync$.getValue(),
      ...this.errorsAsync$.getValue(),
      ...this.errorsFixed$.getValue()
    ]));
  }

  get status() {
    if (
      this.errorsSync$.getValue().length > 0
      || this.errorsAsync$.getValue().length > 0
      || this.errorsFixed$.getValue().length > 0
    ) return 'INVALID';
    const invalid = this.controls.find(c => c.status === 'INVALID');
    if (invalid) { return 'INVALID' }
    const pending = this.controls.find(c => c.status === 'PENDING');
    if (pending) { return 'PENDING' }
    if (this.runningAsyncValidatorsCount > 0) return 'PENDING';
    return 'VALID';
  }

  constructor(
    public host: ReactiveControllerHost,
    config?: Partial<FormArrayConfig<T>>
  ) {
    this.host.addController(this);
    this.config = {
      initialItems: config?.initialItems ?? [],
      validators: config?.validators || [],
      asyncValidators: config?.asyncValidators || []
    };
    this.controls = this.config.initialItems;
    this.structureChanged$.next();
  }

  hostConnected() {
    this.rerunValidators();
    this.rerunAsyncValidators();
  }

  hostDisconnected() {
    this.validatorsSub?.unsubscribe();
    this.asyncValidatorsSub?.unsubscribe();
  }

  /**
   * Retrieves a direct child by index.
   */
  get(index: number): T | undefined {
    return this.controls[index] ?? undefined;
  }

  /**
   * Calls `reset` on every child.
   * @param clearStates - Clears the states of every child.
   */
  reset(clearStates = true) {
    this.controls.forEach(c => c.reset(clearStates));
  }

  /**
   * Empties the array.
   */
  clear() {
    this.controls = [];
    this.structureChanged$.next();
    this.host.requestUpdate();
  }

  /**
   * Tries to set a new value for the array.
   * No controls are created by this method.
   */
  set(value: ArrayValue<T>[]) {
    this.controls.forEach((c, i) => {
      if (i + 1 <= value.length) {
        c.set(value[i]);
      }
    })
  }

  /**
   * true if at least one child is dirty.
   */
  get isDirty() {
    return this.controls.some(c => c.isDirty);
  }

  /**
   * true if at least one child is touched.
   */
  get isTouched() {
    return this.controls.some(c => c.isTouched);
  }

  /**
   * true if at least one child is blurred.
   */
  get isBlurred() {
    return this.controls.some(c => c.isBlurred);
  }

  /**
   * Returns true if the FormArray has the specified error.
   */
  hasError(error: string) {
    return this.errors.includes(error);
  }

  /**
   * Observable of the value of the array, including the initial value.
   * @param index - When specified, returns an Observable of the value of a specific control.
   */
  valueChanges(): Observable<ArrayValue<T>[]>;
  valueChanges(index: number): Observable<ArrayValue<T> | undefined>;
  valueChanges(index?: number): Observable<ArrayValue<T> | ArrayValue<T>[] | undefined> {
    if (index) {
      return this.structureChanged$.pipe(
        switchMap(() => this.get(index)?.valueChanges() ?? EMPTY),
      );
    }
    return this.structureChanged$.pipe(
      switchMap(() => {
        if (this.controls.length === 0) return of([]);
        const observables = this.controls.map(c => c.valueChanges());
        return merge(...observables).pipe(
          map(() => this.value),
        );
      })
    );
  }

  /**
   * Observable of the validation status of the array, including the initial status.
   */
  statusChanges(): Observable<ValidationStatus> {
    return merge(this.errorsSync$, this.errorsAsync$, this.errorsFixed$).pipe(
      map(() => this.status),
      distinctUntilChanged()
    );
  }

  /**
   * Inserts a new control at the specified index (if possible).
   */
  insertAt(control: T, index: number) {
    if (index <= this.controls.length) {
      this.controls.splice(index, 0, control);
      this.structureChanged$.next();
      this.host.requestUpdate();
    }
  }

  /**
   * Inserts a new control at the head of the array.
   */
  append(control: T) {
    this.insertAt(control, this.controls.length);
  }

  /**
   * Inserts a new control at the tail of the array.
   */
  prepend(control: T) {
    this.insertAt(control, 0);
  }
  
  /**
   * Removes the control at the specified index (if possible).
   */
  removeAt(index: number) {
    if (this.controls.length >= (index + 1)) {
      this.controls.splice(index, 1);
      this.structureChanged$.next();
      this.host.requestUpdate();
    }
  }

  /**
   * Removes the last control of the array.
   */
  pop() {
    this.removeAt(this.controls.length - 1);
  }

  /**
   * Swaps the control at the first index with the one at the second index.
   */
  swap(indexA: number, indexB: number) {
    const validA = this.controls.length >= (indexA + 1);
    const validB = this.controls.length >= (indexB + 1);
    if (validA && validB) {
      const previousA = this.controls[indexA];
      this.controls[indexA] = this.controls[indexB];
      this.controls[indexB] = previousA;
      this.structureChanged$.next();
      this.host.requestUpdate();
    }
  }

  /**
   * Moves the control at the first index to the second index.
   */
  move(from: number, to: number) {
    const validFrom = this.controls.length >= (from + 1);
    const validTo = this.controls.length >= (to + 1);
    if (validFrom && validTo) {
      const previousFrom = this.controls[from];
      this.controls.splice(from, 1);
      this.controls.splice(to, 0, previousFrom);
      this.structureChanged$.next();
      this.host.requestUpdate();
    }
  }

  /**
   * Sets custom errors on the array. These errors won't be touched by validators.
   * You can later remove them by calling it again with new errors.
   */
  setFixedErrors(errors: ValidationError[]) {
    this.errorsFixed$.next(errors);
    this.host.requestUpdate();
  }

  /**
   * Replaces all validators.
   */
  setValidators(validators: Validator<FormArray<T>>[]) {
    this.config.validators = validators;
    this.rerunValidators();
    this.host.requestUpdate();
  }

  /**
   * Replaces all asynchronous validators.
   */
  setAsyncValidators(asyncValidators: AsyncValidator<FormArray<T>>[]) {
    this.config.asyncValidators = asyncValidators;
    this.rerunAsyncValidators();
    this.host.requestUpdate();
  }

  rerunValidators() {
    this.validatorsSub?.unsubscribe();

    this.validatorsSub = merge(this.structureChanged$, this.valueChanges()).subscribe(() => {
      let errors: ValidationError[] = [];

      this.config.validators.forEach(validator => {
        const error = validator(this);
        if (error && !errors.includes(error)) {
          errors.push(error);
        }
      });
      this.errorsSync$.next(errors);
      this.host.requestUpdate();
    })
  }

  rerunAsyncValidators() {
    this.asyncValidatorsSub?.unsubscribe();

    this.asyncValidatorsSub = merge(this.structureChanged$, this.valueChanges()).pipe(
      switchMap(() => {
        this.runningAsyncValidatorsCount = 0;
        const observables = this.config.asyncValidators.map(v => {
          this.runningAsyncValidatorsCount++;
          this.host.requestUpdate();
          return from(v(this)).pipe(
            tap(() => {
              this.runningAsyncValidatorsCount--; 
              this.host.requestUpdate();
            }),
            catchError(() => {
              this.runningAsyncValidatorsCount--;
              this.host.requestUpdate();
              return of(null)
            }),
          )
        });

        return combineLatest(observables).pipe(
          map((values) => values.filter((v) => v !== null))
        );
      })
    ).subscribe(e => {
      this.errorsAsync$.next(e as string[]);
      this.host.requestUpdate();
    });
  }
}
