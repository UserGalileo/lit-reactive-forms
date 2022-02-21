import { nothing, ReactiveController, ReactiveControllerHost } from 'lit';
import { Observable, merge, ReplaySubject, Subscription, from, of, combineLatest, BehaviorSubject, map, switchMap, tap, catchError, distinctUntilChanged } from 'rxjs';
import { FormControl } from './form-control';
import { AbstractControl } from '../abstract-control';
import { BindKey, EnabledValueOf, ValueOf } from '../models';
import { DirectiveResult } from 'lit/directive';
import { AsyncValidator, ValidationError, ValidationStatus, Validator } from '../validation/models';
import { BindConfig } from '../directives/bind.directive';

export type GroupShape = Record<string, AbstractControl>;

export interface FormGroupConfig<T extends GroupShape> {
  validators: Validator<FormGroup<T>>[];
  asyncValidators: AsyncValidator<FormGroup<T>>[];
}

export class FormGroup<T extends GroupShape> implements AbstractControl, ReactiveController {
  public readonly config!: FormGroupConfig<T>;
  private structureChanged$ = new ReplaySubject<void>(1);
  private runningAsyncValidatorsCount = 0;
  private errorsSync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsAsync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsFixed$ = new BehaviorSubject<ValidationError[]>([]);
  private validatorsSub?: Subscription;
  private asyncValidatorsSub?: Subscription;

  get value(): ValueOf<this> {
    let value: ValueOf<this> = {} as any;
    Object.keys(this.controls).forEach((key: keyof T) => {
      value[key] = this.controls[key].value
    });
    return value;
  }

  /**
   * Strips disabled FormControl's
   */
  get enabledValue(): EnabledValueOf<this> {
    let value: EnabledValueOf<this> = {} as any;
    Object.keys(this.controls).forEach((key: keyof T) => {
      const control = this.controls[key];
      if (control instanceof FormControl && control.uiState === 'DISABLED') {
        return;
      }
      if (control instanceof FormGroup) {
        value[key] = control.enabledValue as any;
        return;
      }
      value[key] = control.value
    });
    return value;
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
    const invalid = Object.values(this.controls).find(c => c.status === 'INVALID');
    if (invalid) { return 'INVALID' }
    const pending = Object.values(this.controls).find(c => c.status === 'PENDING');
    if (pending) { return 'PENDING' }
    if (this.runningAsyncValidatorsCount > 0) return 'PENDING';
    return 'VALID';
  }

  constructor(
    public host: ReactiveControllerHost,
    public controls: T,
    config?: Partial<FormGroupConfig<T>>
  ) {
    this.host.addController(this);
    this.config = {
      validators: config?.validators ?? [],
      asyncValidators: config?.asyncValidators ?? []
    };
    this.structureChanged$.next();
    this.reset();
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
   * Bind to every nested control (only FormControl's).
   */
  bind: (field: BindKey<FormGroup<T>>, config?: Partial<BindConfig>) => DirectiveResult = (field, config) => {
    const control = this.get(field);

    if (control instanceof FormControl) {
      return control.bind(config ?? {});
    }
    const splitted = ('' + field).split('.');
    const [firstKey, ...nested] = splitted;
    const x = this.get(firstKey);

    if (x instanceof FormGroup) {
      return x.bind(nested.join('.'), config ?? {});
    }
    return nothing;
  }

  /**
   * Curried utility for using the same configuration on multiple fields.
   */
  bindWith = (config: Partial<BindConfig>) => (field: BindKey<FormGroup<T>>) => {
    return this.bind(field, config);
  }

  /**
   * Retrieves a direct child by key.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.controls[key];
  }

  /**
   * Calls `reset` on every child.
   * @param clearStates - Clears the states of every child.
   */
  reset(clearStates = true) { 
    Object.keys(this.controls).forEach((key) => {
      this.get(key as keyof T).reset(clearStates);
    });
  }

  /**
   * Tries to set a value for this group. Use this to make sure you specify all properties.
   * @param value - The complete value of the group.
   */
  set(value: ValueOf<this>) {
    this.patch(value);
  }

  /**
   * Tries to set a value for this group.
   * @param value - A partial value of the group.
   */
  patch(value: Partial<ValueOf<this>>) {
    Object.keys(value).forEach((key: keyof T) => {
      this.controls[key]?.set(value[key]);
    });
  }

  /**
   * true if at least one child is dirty.
   */
  get isDirty() {
    return Object.keys(this.controls).some(key => this.controls[key].isDirty);
  }

  /**
   * true if at least one child is touched.
   */
  get isTouched() {
    return Object.keys(this.controls).some(key => this.controls[key].isTouched);
  }

  /**
   * true if at least one child is blurred.
   */
  get isBlurred() {
    return Object.keys(this.controls).some(key => this.controls[key].isBlurred);
  }

  /**
   * Returns true if the group has a specific error.
   */
  hasError(error: string) {
    return this.errors.includes(error);
  }

  /**
   * Observable of the value of the group, including the initial value.
   */
  valueChanges(): Observable<ValueOf<this>> {
    return this.structureChanged$.pipe(
      switchMap(() => {
        if (Object.keys(this.controls).length === 0) return of(this.value);
        const observables = Object.keys(this.controls).map(key => this.get(key).valueChanges())
        return merge(...observables).pipe(
          map(() => this.value),
        );
      })
    );
  }

  /**
   * Observable of the validation status of the group, including the initial status.
   */
  statusChanges(): Observable<ValidationStatus> {
    return merge(this.errorsSync$, this.errorsAsync$, this.errorsFixed$).pipe(
      map(() => this.status),
      distinctUntilChanged()
    );
  }

  /**
   * Sets custom errors on the group. These errors won't be touched by validators.
   * You can later remove them by calling it again with new errors.
   */
  setFixedErrors(errors: ValidationError[]) {
    this.errorsFixed$.next(errors);
    this.host.requestUpdate();
  }

  /**
   * Replaces all validators.
   */
  setValidators(validators: Validator<FormGroup<T>>[]) {
    this.config.validators = validators;
    this.rerunValidators();
    this.host.requestUpdate();
  }

  /**
   * Replaces all asynchronous validators.
   */
  setAsyncValidators(asyncValidators: AsyncValidator<FormGroup<T>>[]) {
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

  /**
   * Experimental: the Group must be typed accordingly! The base type wont' include the new control
   */
  addControl(name: string, control: AbstractControl) {
    if (name in this.controls) {
      throw new Error(`There's already a control named ${name}.`);
    }
    (this.controls as any)[name] = control;
    this.structureChanged$.next();
    this.host.requestUpdate();
  }

  /**
   * Experimental: the Group must be typed accordingly! The base type will have the old control type
   */
  setControl(name: string, control: AbstractControl) {
    if (!(name in this.controls)) {
      throw new Error(`There's no control named ${name}.`);
    }
    (this.controls as any)[name] = control;
    this.structureChanged$.next();
    this.host.requestUpdate();
  }

  /**
   * Experimental: the Group must be typed accordingly! The base type will include the removed control
   */
  removeControl(name: string) {
    if (!(name in this.controls)) {
      throw new Error(`There's no control named ${name}.`);
    }
    delete this.controls[name];
    this.structureChanged$.next();
    this.host.requestUpdate();
  }
}
