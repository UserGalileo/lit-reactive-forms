import { ReactiveController, ReactiveControllerHost } from 'lit';
import { bindFactory } from '../directives/bind.directive';
import { Observable, Subscription, from, combineLatest, of, BehaviorSubject, merge, ReplaySubject, catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { AbstractControl } from '../abstract-control';
import { UIState } from "../models";
import { AsyncValidator, ValidationError, ValidationStatus, Validator } from '../validation/models';
import { ControlAccessorFactory, getControlAccessor } from '../accessors/accessors';

export interface ControlConfig<T = any> {
  defaultValue: T;
  validators: Validator<FormControl<T>>[];
  asyncValidators: AsyncValidator<FormControl<T>>[];
  accessorFactory: ControlAccessorFactory;
  updateOn: 'input' | 'blur'
}

export class FormControl<T = any> implements AbstractControl, ReactiveController {
  public readonly config!: ControlConfig<T>;
  public readonly bind = bindFactory(this);
  private _isDirty = false;
  private _isTouched = false;
  private _isBlurred = false;
  private value$: BehaviorSubject<T>;
  private uiState$ = new BehaviorSubject<UIState>('ENABLED');
  private errorsSync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsAsync$ = new BehaviorSubject<ValidationError[]>([]);
  private errorsFixed$ = new BehaviorSubject<ValidationError[]>([]);
  private validatorsSub?: Subscription;
  private asyncValidatorsSub?: Subscription;
  private runningAsyncValidatorsCount = 0;
  public validatorsChanged$ = new ReplaySubject<void>(1);

  get value() {
    return this.value$.getValue();
  }

  get errors() {
    return Array.from(new Set([
      ...this.errorsSync$.getValue(),
      ...this.errorsAsync$.getValue(),
      ...this.errorsFixed$.getValue()
    ]));
  }

  get status() {
    if (this.errorsSync$.getValue().length > 0) return 'INVALID';
    if (this.errorsFixed$.getValue().length > 0) return 'INVALID';
    if (this.runningAsyncValidatorsCount > 0) return 'PENDING';
    return this.errorsAsync$.getValue().length < 1 ? 'VALID' : 'INVALID';
  }

  constructor(
    public host: ReactiveControllerHost,
    config: Pick<ControlConfig<T>, 'defaultValue'> & Partial<ControlConfig<T>>
  ) {
    this.config = {
      defaultValue: config.defaultValue,
      validators: config.validators ?? [],
      asyncValidators: config.asyncValidators ?? [],
      accessorFactory: config.accessorFactory ?? getControlAccessor,
      updateOn: config.updateOn ?? 'input'
    };
    this.value$ = new BehaviorSubject<T>(config.defaultValue);
    this.host.addController(this);
  }

  hostConnected() {
    this.validatorsChanged$.next();
    this.rerunValidators();
    this.rerunAsyncValidators();
  }

  hostDisconnected() {
    this.validatorsChanged$.next();
    this.validatorsSub?.unsubscribe();
    this.asyncValidatorsSub?.unsubscribe();
  }

  reset(clearStates = true) {
    this.value$.next(this.config.defaultValue);
    if (clearStates) {
      this._isDirty = false;
      this._isTouched = false;
      this._isBlurred = false;
    }
    this.host.requestUpdate();
  }

  set(value: T) {
    this.value$.next(value);
    this.host.requestUpdate();
  }

  /**
   * Returns true if the control has ever changed value.
   */
  get isDirty() {
    return this._isDirty;
  }

  /**
   * Returns true if the control has ever been touched.
   */
  get isTouched() {
    return this._isTouched;
  }

  /**
   * Returns true if the control has ever been blurred.
   */
  get isBlurred() {
    return this._isBlurred;
  }

  /**
   * The UI State of this control.
   * It's either `ENABLED`, `DISABLED` or `READONLY`.
   */
  get uiState() {
    return this.uiState$.getValue();
  }

  setDirty(isDirty = true) {
    this._isDirty = isDirty;
    this.host.requestUpdate();
  }

  setTouched(isTouched = true) {
    this._isTouched = isTouched;
    this.host.requestUpdate();
  }

  setBlurred(isBlurred = true) {
    this._isBlurred = isBlurred;
    this.host.requestUpdate();
  }

  setUIState(state: UIState) {
    this.uiState$.next(state);
    this.host.requestUpdate();
  }

  /**
   * Returns true if the control has a specific error.
   */
  hasError(error: string) {
    return this.errors.includes(error);
  }

  /**
   * Observable of the UI State of the control, including the initial state.
   */
  uiStateChanges(): Observable<UIState> {
    return this.uiState$.pipe(
      distinctUntilChanged(),
    )
  }

  /**
   * Observable of the value of the control, including the initial value.
   */
  valueChanges(): Observable<T> {
    return this.value$.asObservable();
  }

  /**
   * Observable of the validation status of the control, including the initial status.
   */
  statusChanges(): Observable<ValidationStatus> {
    return merge(this.errorsSync$, this.errorsAsync$, this.errorsFixed$).pipe(
      map(() => this.status),
      distinctUntilChanged()
    );
  }

  /**
   * Sets custom errors on the control. These errors won't be touched by validators.
   * You can later remove them by calling it again with new errors.
   */
  setFixedErrors(errors: ValidationError[]) {
    this.errorsFixed$.next(errors);
    this.host.requestUpdate();
  }

  /**
   * Replaces all validators.
   */
  setValidators(validators: Validator<FormControl<T>>[]) {
    this.config.validators = validators;
    this.validatorsChanged$.next();
    this.rerunValidators();
    this.host.requestUpdate();
  }

  /**
   * Replaces all asynchronous validators.
   */
  setAsyncValidators(asyncValidators: AsyncValidator<FormControl<T>>[]) {
    this.config.asyncValidators = asyncValidators;
    this.validatorsChanged$.next();
    this.rerunAsyncValidators();
    this.host.requestUpdate();
  }

  rerunValidators() {
    this.validatorsSub?.unsubscribe();

    this.validatorsSub = this.valueChanges().subscribe(() => {
      let errors: ValidationError[] = [];
      this.config.validators.forEach(validator => {
        const error = validator(this);
        if (error && !errors.includes(error)) {
          errors.push(error);
        }
      });
      this.errorsSync$.next(errors);
      this.host.requestUpdate();
    });
  }

  rerunAsyncValidators() {
    this.asyncValidatorsSub?.unsubscribe();

    this.asyncValidatorsSub = this.valueChanges().pipe(
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
