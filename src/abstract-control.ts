import { Observable } from "rxjs";
import { ValidationError, ValidationStatus } from "./validation/models";

export interface AbstractControl<T = any> {
  value: T;
  reset(clearStates?: boolean): void;
  set(value: T): void;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isBlurred: boolean;
  valueChanges(): Observable<T>;
  statusChanges(): Observable<ValidationStatus>;
  // Validation
  readonly status: ValidationStatus;
  readonly errors: ValidationError[];
  hasError(error: string): boolean;
  setFixedErrors(errors: ValidationError[]): void;
}