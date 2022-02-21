import { FormArray, FormControl, FormGroup, AsyncValidator, Validator, PureValidators } from '../src';

// Validators for testing purposes

export const allRequired: Validator<FormArray<FormControl<string>>> = (a) => {
  return a.controls.every(c => !PureValidators.required(c)) ? null : 'allRequired';
}

export const sameLength = (...fields: string[]): Validator<FormGroup<any>> => (g) => {
  const hasError = fields.some(field => {
    const array = g.get(field) as FormArray<any>;
    const firstArray = g.get(fields[0]) as FormArray<any>;
    return array?.controls.length !== firstArray?.controls.length;
  })
  return hasError ? 'sameLength' : null;
}

export const forbiddenCredentials = (
  forbiddenName: string,
  forbiddenSurname: string
): AsyncValidator<FormGroup<any>> => (g) => {
  return new Promise((res) => {
    setTimeout(() => {
      const name = g.get('name') as FormControl<string>;
      const surname = g.get('surname') as FormControl<string>;
      res(
        name?.value === forbiddenName && surname?.value === forbiddenSurname
          ? 'forbiddenCredentials'
          : null
      )
    }, 1000);
  })
}
