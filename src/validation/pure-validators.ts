import { FormControl } from "../controllers/form-control";
import { Validator } from "./models";

const required: Validator = (control) => {
  if (!(control instanceof FormControl)) return null;
  if (control.value == null || control.value.length === 0) return 'required';
  return null;
}

const requiredTrue: Validator<FormControl> = (control) => {
  if (!(control instanceof FormControl)) return null;
  if (control.value === true) return null;
  return 'requiredTrue';
}

function minLength(n: number) {
  const f: Validator<FormControl> = (control) => {
    if (!(control instanceof FormControl)) return null;
    return ('' + control.value).length >= n ? null : 'minLength';
  }
  return f;
}

function maxLength(n: number) {
  const f: Validator<FormControl> = (control) => {
    if (!(control instanceof FormControl)) return null;
    return ('' + control.value).length <= n ? null : 'maxLength';
  }
  return f;
}

function min(n: number) {
  const f: Validator<FormControl> = (control) => {
    if (!(control instanceof FormControl)) return null;
    return +(control.value) >= n ? null : 'min';
  }
  return f;
}

function max(n: number) {
  const f: Validator<FormControl> = (control) => {
    if (!(control instanceof FormControl)) return null;
    return +(control.value) <= n ? null : 'max';
  }
  return f;
}

export const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const email: Validator<FormControl> = (control) => {
  if (!(control instanceof FormControl)) return null;
  return EMAIL_REGEXP.test(control.value) ? null : 'email';
}

function pattern(stringOrRegexp: string | RegExp): Validator<FormControl> {
  if (!stringOrRegexp) return () => null;
  let regex: RegExp;
  let regexStr: string;
  if (typeof stringOrRegexp === 'string') {
    regexStr = '';

    if (stringOrRegexp.charAt(0) !== '^') regexStr += '^';

    regexStr += stringOrRegexp;

    if (stringOrRegexp.charAt(stringOrRegexp.length - 1) !== '$') regexStr += '$';

    regex = new RegExp(regexStr);
  } else {
    regexStr = stringOrRegexp.toString();
    regex = stringOrRegexp;
  }
  const f: Validator<FormControl> = (control) => {
    if (!(control instanceof FormControl)) return null;
    return regex.test(control.value) ? null : 'pattern';
  };
  return f;
}

export const PureValidators = {
  required,
  requiredTrue,
  minLength,
  maxLength,
  min,
  max,
  email,
  pattern,
};

