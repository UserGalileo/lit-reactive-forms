import { AbstractControl } from "../abstract-control";

export type ValidationError = string;
export type ValidationStatus = 'VALID' | 'INVALID' | 'PENDING';

/**
 * A Validator takes an AbstractControl and returns either an error or null.
 */
export interface Validator<T = AbstractControl> {
  (control: T): ValidationError | null;
}

/**
 * Same as Validator, but returns a Promise.
 */
export interface AsyncValidator<T = AbstractControl> {
  (control: T): Promise<ValidationError | null>;
}

/**
 * A Validator can have 2 effects (functions), which are called when the
 * validator is added or removed to a control.
 * 
 * You can use these 2 functions to set/remove a11y attributes on the element.
 * `ValidatorsWithEffects` are validators with built-in effects. You can write your
 * own validators with your own effects, for example to check a custom element's
 * local name and decide which attribute to set (eg. some elements want `minLength`, not `minlength`).
 */
type ValidatorEffects = {
  connected: (element: HTMLElement, control: AbstractControl) => void;
  disconnected: (element: HTMLElement, control: AbstractControl) => void;
}

export type ValidatorWithEffects = Validator & ValidatorEffects;
export type AsyncValidatorWithEffects = AsyncValidator & ValidatorEffects;

