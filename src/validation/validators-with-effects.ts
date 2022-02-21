import { AbstractControl } from "../abstract-control";
import { Validator, ValidatorWithEffects } from "./models";
import { PureValidators } from "./pure-validators";

/**
 * Take an existing validator and add effects to it.
 */
export function addEffectsToValidator(
  validator: Validator<any>,
  connected: (element: HTMLElement, control: AbstractControl) => void,
  disconnected: (element: HTMLElement, control: AbstractControl) => void,
): ValidatorWithEffects {
  const f: ValidatorWithEffects = (control: AbstractControl) => validator(control);
  f.connected = connected;
  f.disconnected = disconnected;
  return f;
}

const required = addEffectsToValidator(PureValidators.required,
  (el) => { el.setAttribute('required', '') },
  (el) => { el.removeAttribute('required') }
);

const requiredTrue = addEffectsToValidator(PureValidators.requiredTrue,
  (el) => { el.setAttribute('required', '') },
  (el) => { el.removeAttribute('required') }
);

const email = PureValidators.email;

function minLength(n: number) {
  return addEffectsToValidator(PureValidators.minLength(n),
    (el) => { el.setAttribute('minlength', '' + n) },
    (el) => { el.removeAttribute('minlength') }
  );
}

function maxLength(n: number) {
  return addEffectsToValidator(PureValidators.maxLength(n),
    (el) => { el.setAttribute('maxlength', '' + n) },
    (el) => { el.removeAttribute('maxlength') }
  );
}

function min(n: number) {
  return addEffectsToValidator(PureValidators.min(n),
    (el) => { el.setAttribute('min', '' + n) },
    (el) => { el.removeAttribute('min') }
  );
}

function max(n: number) {
  return addEffectsToValidator(PureValidators.max(n),
    (el) => { el.setAttribute('max', '' + n) },
    (el) => { el.removeAttribute('max') }
  );
}

function pattern(stringOrRegexp: string | RegExp) {
  return addEffectsToValidator(PureValidators.pattern(stringOrRegexp),
    (el) => { el.setAttribute('pattern', stringOrRegexp.toString()) },
    (el) => { el.removeAttribute('pattern') }
  );
}

/**
 * These Validators are setup to make the `bind` Directive
 * set a11y attributes on the elements (required, minlength, maxlength, pattern...).
 * 
 * You can create your own Validators With Effects, check for the element's name and
 * set different attributes depending on it.
 */
 export const ValidatorsWithEffects = {
  required,
  requiredTrue,
  minLength,
  maxLength,
  min,
  max,
  email,
  pattern,
};
