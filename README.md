# Lit Reactive Forms

Heavily inspired by Angular Forms, this package provides utilities for complex Model-driven form management in Lit-based Web Components.

## Status

🚧 This library is published in order to get feedback, it's not production ready, and it's not yet published to npm. 🚧

## Features

- Single source of truth (Model-driven)
- Fully type-safe, no nullable values unless explicitly defined
- 3 composable Controllers: `FormControl`, `FormGroup`, `FormArray`
- Template bindings
- State tracking (_dirty_, _touched_, _blurred_)
- UI State helpers (_disabled_, _readonly_)
- Imperative manipulation (_set_, _patch_, _setDirty_, _setTouched_...)
- Dynamic forms (_FormArray_) with convenience methods: _move_, _swap_, _insertAt_, _removeAt_, _append_...
- Support for binding multiple elements to the same control
- Built-in validators which automatically add attributes to the bound elements (optional)
- Utility for creating custom validators with side-effects (eg. change the default a11y attributes)
- Asynchronous Validators
- Validation status (`VALID`, `INVALID`, `PENDING`)
- Cross-field validation (_FormGroup_, _FormArray_)
- Imperatively add/remove Validators
- Imperatively re-run validators
- **RxJS Observables**
- Support for custom controls
  - Create your own `ControlAccessor`s for custom-elements, in order to:
    - Manipulate its value
    - React to custom events
    - React to a `ValidationState` change (eg. set custom attributes)
    - React to a `UIState` change (eg. set `disabled` or `readonly` attributes)

## Philosophy

This package provides 3 main classes which you can use to compose your forms:
- `FormControl`, represents a single control
- `FormGroup`, represents a group of controls
- `FormArray`, represents an array of controls

Nested controls are allowed, so you can represent any kind of hierarchy.

A convenience class is also exported to make it easier to compose forms, called `FormBuilder`. It can reduce the boilerplate and apply the same configuration to all the `FormControl`s it generates.

The form's model is fully typed and expects default values on declaration, which will be used upon calling `reset()`.

## Validation

Validators are also provided to validate your `FormControl`s:

- `required`
- `requiredTrue`
- `minLength`
- `maxLength`
- `min`
- `max`
- `email`
- `pattern`

You're free to write and use your owns as simple functions.

This library also lets you specify Asynchronous Validators (which must return a Promise), and both Synchronous and Asynchronous Validators for `FormGroup`s and `FormArray`s (Cross-field Validation).

Given the hierarchical nature of `FormGroup`s, JavaScript is expected to handle form submissions. No progressive enchancement feature is planned, because nested objects would not be sent in a regular form submission.

**RxJS** is a required peerDependency, as the library provides some Observables to observe field changes and uses Observables intensively.

### FormControl

Represents a single control.

```ts 
// Standard syntax (only `defaultValue` is mandatory)
name = new FormControl(this, {
  defaultValue: 'John', // The control is inferred as FormControl<string>
  validators: [],
  asyncValidators: [],
  ...
})

// With FormBuilder
fb = new FormBuilder(this);

name = this.fb.control('John');


// Binding
render() {
  return html`
    <input type="text" ${this.name.bind()}>
  `
}
```

#### API
- `config: FormControlConfig`: the configuration for the control. It contains:
  - `validators: Validator[]`, an array of validators
  - `asyncValidators: AsyncValidator[]`, an array of asynchronous validators
  - `updateOn: 'input' | 'blur'`, strategy for when the model should be updated
  - `accessorFactory: ControlAccessorFactory`, a factory function which accepts an `HTMLElement` and returns a `ControlAccessor`
- `bind`: a Lit Directive to bind the control to an HTMLElement
- `value: T`: the current value
- `status: ValidationStatus`: either `VALID`, `INVALID` or `PENDING`
- `errors: string[]`: current errors
- `hasError(error: string): boolean`: if the control has a particular error
- `reset(clearStates = true): void`: sets to the default value, `clearStates` sets dirty/touched/blurred to `false`
- `set(value: T): void`: sets a new value
- `isDirty: boolean`: if the value has *ever* been changed by the user
- `isTouched: boolean`: if the field has been touched by the user
- `isBlurred: boolean`: if the field has been blurred by the user
- `uiState: UIState`: either `ENABLED`, `DISABLED` or `READONLY`
- `setDirty(is = true): void`
- `setTouched(is = true): void`
- `setBlurred(is = true): void`
- `setUIState(state: UIState): void`
- `setFixedErrors(errors: ValidationError[]): void`: use this to set custom errors, they won't be erased by validators
- `setValidators(validators: Validator[]): void`: replaces the validators
- `setAsyncValidators(asyncValidators: AsyncValidator[]): void`: replaces the async validators
- `rerunValidators`
- `rerunAsyncValidators`
- `valueChanges(): Observable<T>`
- `uiStateChanges(): Observable<UIState>`
- `statusChanges(): Observable<ValidationStatus>`

### FormGroup

Represents a group of controls.

```ts 
fb = new FormBuilder(this);

form = this.fb.group({
    user: this.fb.group({
        name: this.fb.control(''),
        surname: this.fb.control(''),
    }),
    consent: this.fb.control(false)
}, {
    validators: [],
    asyncValidators: [],
});


// Binding (dotted syntax for nested FormGroups)
render() {
  const { bind } = this.form;
  
  return html`
    <input type="text" ${bind('user.name')}>
    <input type="text" ${bind('user.surname')}>
    <input type="text" ${bind('consent')}>
  `
}
```

#### API
- `controls: T`: the structure you provided
- `config: FormGroupConfig`: the configuration for the group. It contains:
  - `validators: Validator[]`, an array of validators
  - `asyncValidators: AsyncValidator[]`, an array of asynchronous validators
- `bind: (key: BindKey<T>, config: BindConfig) => Directive`: a Lit Directive to bind the controls to HTMLElements
- `bindWith: (config) => (key) => Directive`: a curried version of bind with the argument in reverse order, useful for reusing the same configuration for every field
- `value: GroupValue<T>`: the current value of the entire form
- `enabledValue: EnabledGroupValue<T>`: the current value of the entire form, without disabled fields
- `status: ValidationStatus`: either `VALID`, `INVALID` or `PENDING`. It combines child validators with the group's validators. Invalid or pending if one child is invalid or pending.
- `errors: string[]`: current cross-field errors
- `hasError(error: string): boolean`: if the form has a particular cross-field error
- `get(key: K): T[K]`: retrieves a control
- `reset(clearStates = true): void`: sets to the default value, `clearStates` sets dirty/touched/blurred to `false` for each control
- `set(value: GroupValue<T>): void`: sets a new value, use this method if you want to be sure to set every field
- `patch(value: Partial<GroupValue<T>>): void`: sets a new value (partial)
- `isDirty: boolean`: if at least one child is dirty
- `isTouched: boolean`: if at least one child is touched
- `isBlurred: boolean`: if at least one child is blurred
- `setFixedErrors(errors: ValidationError[]): void`: use this to set custom errors, they won't be touched by validators
- `setValidators(validators: Validator[]): void`: replaces the validators
- `setAsyncValidators(asyncValidators: AsyncValidator[]): void`: replaces the async validators
- `rerunValidators`
- `rerunAsyncValidators`
- `valueChanges(): Observable<GroupValue<T>>`
- `statusChanges(): Observable<ValidationStatus>`
- `addControl(name: string, control: AbstractControl)`: adds a control to the group [_experimental_]
- `setControl(name: string, control: AbstractControl)`: replaces a control of the group [_experimental_]
- `removeControl(name: string)`: removes a control of the group [_experimental_]

### FormArray

Represents an array of controls. They can be any of the 3 classes (FormControl, FormGroup or FormArray).

```ts 
fb = new FormBuilder(this);
// The first argument is the initial controls, there's no "default" controls with FormArray's.
phones = this.fb.array<FormControl<string>>([]),

// Binding
render() {
  return html`
    ${this.phones.controls.map(c => html`
        <input type="text" ${c.bind()}>
    `)}
  `
}
```

#### API
- `controls: T[]`: the controls at each moment
- `config`: the configuration for the array. It contains:
  - `initialItems: T[]`: initial items to be added to the array
  - `validators: Validator[]`, an array of validators
  - `asyncValidators: AsyncValidator[]`, an array of asynchronous validators
- `bind`: a Lit Directive to bind the controls to HTMLElements
- `value: ArrayValue<T>[]`: the current value of the array
- `status: ValidationStatus`: either `VALID`, `INVALID` or `PENDING`. It combines child validators with the array's validators. Invalid or pending if one child is invalid or pending.
- `errors: string[]`: current cross-field errors
- `hasError(error: string): boolean`: if the form has a particular cross-field error
- `get(index: number): T | null`: retrieves a control
- `reset(clearStates = true): void`: resets each child (does not reset the array)
- `set(value: ArrayValue<T>[]): void`: sets a new value for the array, if compatible. Does NOT create new controls
- `clear(): void`: removes all controls
- `isDirty: boolean`: if at least one child is dirty
- `isTouched: boolean`: if at least one child is touched
- `isBlurred: boolean`: if at least one child is blurred
- `setFixedErrors(errors: ValidationError[]): void`: use this to set custom errors, they won't be touched by validators
- `setValidators(validators: Validator[]): void`: replaces the validators
- `setAsyncValidators(asyncValidators: AsyncValidator[]): void`: replaces the async validators
- `rerunValidators`
- `rerunAsyncValidators`
- `valueChanges(): Observable<ArrayValue<T>[]>`
- `valueChanges(index: number): Observable<ArrayValue<T> | null>`
- `statusChanges(): Observable<ValidationStatus>`
- `insertAt(control: T, index: number): void`
- `append(control: T): void`
- `prepend(control: T): void`
- `removeAt(index: number): void`
- `pop(): void`
- `swap(indexA: number, indexB: number): void`: swaps only if both indexes are valid
- `move(from: number, to: number): void`: moves only if both indexes are valid

## FAQ

#### Disabled & Readonly
The `value` property of a `FormControl` is not nullable by default, even if the field gets disabled you'll be able to retrieve its value. Same goes with `FormGroup`s, its value always respects its shape.

But if you need a way to strip disabled fields from a `FormGroup`, you can use the `enabledValue` property which makes all `FormControl`s optional. However, `FormGroup`s and `FormArray`s will always be there in the value: they cannot be `disabled` per-se, it doesn't make sense. So, in case of nested forms, you'll have groups and arrays' properties in your final object.

The library also supports the `readonly` state: a `FormControl` can either be `ENABLED`, `DISABLED` or `READONLY` (one at a time). Controls which are marked as `readonly` will always be there even in the `enabledValue`. This attribute may be useful for accessibility, but watch out: not all native controls support it! But if you want to use it in certain cases, you could write your own `FieldAccessor` to set the underlying control as `disabled` even though it's in a `READONLY` state.

#### Native validation
The library exports a set of `ValidatorsWithEffects` which resemble the native ones (`required`, `minLength`, `pattern`...). They'll automatically set a11y attributes on your bound elements. If you don't want this behavior, use `PureValidators`, which have no side-effects on the DOM.

You're free to not use the library's validators and use other libraries for that (eg. `Yup`). The library provides an utility method for all controls, called `setFixedErrors`, which lets you append custom errors to your controls and won't be erased unless you call the function again with new errors. Think of it as a "cauldron" for errors, it may be useful.

You can write your own validators if you're not satisfied with the built-in effects: for example, you may want to support Custom Elements which require `maxLength` (camelCase) instead of `maxlength`. You can reuse the same built-in logic and add your own effects like this:

```ts
import { addEffectsToValidator, PureValidators } from 'lit-reactive-forms';

// Simple validator
const requiredTrue = addEffectsToValidator(PureValidators.requiredTrue,
    // This function will be called when the validator is connected...
    (el) => { el.setAttribute('whatever', '') },
    // ...and this one when it's disconnected
    (el) => { el.removeAttribute('whatever') }
);

// Validator factory
function maxLength(n: number) {
  return addEffectsToValidator(PureValidators.maxLength(n),
      (el) => { el.setAttribute('maxLength', '' + n) },
      (el) => { el.removeAttribute('maxLength') }
  );
}
```

#### Asynchronous Validators 
If you come from *Angular* (which is the main inspiration for this project), you'll know that validators behave in an interesting way: they don't run if the field is already invalidated by synchronous validators. Same goes for cross-field validation: if a child is invalid, they don't run. Also, disabled fields are not validated.

Although this is a cool feature and can potentially save resources, many developers always want to know all the errors for a field, and therefore all validators must run. It can get frustrating pretty easily, forcing you to wrap your controls in nested groups just because otherwise validators wouldn't run.

This library **always** runs asynchronous validators for a field when its value changes and it doesn't care if its disabled or not. Some may use the `disabled` state just to stop interaction, but may want to validate the control anyway.

If you want to, you can debounce your validators yourself with a helper, knowing that the library will stop the API call and abort the Promise should the value change in the meantime. This way, the API call will be made either way but at least you won't make too many calls while the user is typing. Another option would be to not use asynchronous validators but listen to the form by yourself via the provided Observables (`valueChanges`, `statusChanges`). This way, you can fine-tune your calls and use `setFixedErrors` to set your errors manually.

Beware that synchronous validators always have precedence: this means that if a field is "synchronously" invalid, its asynchronous validators will run, but its state will be `INVALID`, not `PENDING` in the meantime.

#### Accessing nested controls
The `bind` directive lets you bind to nested controls this way:

```ts
bind('user.name')
```

But if you're dealing with a `FormArray`, you should map its controls yourself and bind each one individually.

Either way, if you need to *get* a control, `FormGroup` and `FormArray` both have a `get` method, which takes a property for the former or an index for the latter.

You can access nested controls this way:

```ts 
form.get('user').get('name');
```

#### DefaultValues vs initialValues
A `FormControl` must have a default value, which will be used when calling `reset`. This way, there are no nullable values by default. The default value is also used initially.

A `FormGroup` doesn't really have a "value", it has controls. Its shape is fixed and cannot change: calling `reset` on it will cause the calling of `reset` on every child, nothing strange.

A `FormArray` works a bit differently. Since it doesn't work with values but with other controls, there's no "default value" for it, in order not to cause problems with cloning. Calling `reset` will *not* empty the array, but it will call `reset` on every child. If you wish to empty the array, use `clear`.

However, a `FormArray` can have an initial value: an array of controls. Beware that these are *not* default values, as calling `reset` doesn't care about them being there or not: it doesn't care.

#### Progressive Enhancement
This library is fundamentally different from how native forms work: for example, with native forms it's not possible to send nested objects. Also, disabled fields are a controversial topic: some developers use `disabled` to interrupt interaction, but they want the value anyway, but this is not how native form submissions work. And in case of nested controls: should the property be there or not? That's an opinion.

This library is opinionated and meant to work with JavaScript enabled in order for you to submit your values via API call. For this reason, it makes no attempt to be "progressively enhanced" in any way (as, for example, *Remix* does).

#### `ControlAccessor`s for Custom Elements

Different controls yield different values: for example, an `<input type="text">` works with strings, `<input type="number">` works with numbers.

This library detects what kind of element is bound with the `bind` directive and sets up an appropriate `ControlAccessor`, which provides methods to interact with the element.

There are different Accessors, you'll probably never touch them: `TextAccessor`, `NumberAccessor`, `SelectMultipleAccessor`...

If the library encounters a Custom Element, it cannot know how to communicate with it. By default, it tries with the `BaseControlAccessor` which treats it like an `<input>`.

You may want to write your own `ControlAccessor`s for your Custom Elements: it's pretty easy! They're just classes.

This is the interface they have to implement:

```ts
interface ControlAccessor<T = any> {
  getValue(): T;
  setValue(value: T): void;
  setUIState?(state: UIState): void;
  setValidity?(status: ValidationStatus | null): void;
  registerOnChange(fn: () => void): void;
  registerOnTouch?(fn: () => void): void;
  registerOnBlur?(fn: () => void): void;
  onDisconnect?(): void;
}
```

Instead of writing your accessor from zero, it's convenient to extend the `BaseControlAccessor` which implements all methods and already has a constructor setup correctly (must accept an element instance) and properties for saving the 3 callbacks for the `registerOn` methods.

Suppose we have a `Counter` element (`<my-counter>`), which deals with a `number`. This is what we could do:

```ts
export class CounterAccessor extends BaseControlAccessor<Counter, number> {
  
  // Here we tell the library how to retrieve its value (DOM -> Model).
  getValue() {
    return this.el.value;
  }

  // Here we tell the library how to set its value (Model -> DOM).
  setValue(x: number) {
    this.el.value = x;
  }

  // This gets called whenever the UIState changes.
  setUIState(uiState: UIState) {
    this.el.disabled = uiState === 'DISABLED' || uiState === 'READONLY';
  }

  // The element may emit a custom event which is not called `input`: here we setup event listeners.
  // We must notify the library when the value changes. The value isn't needed: it'll take it from `getValue`.
  // We save the callback function to remove the listener later.
  registerOnChange(fn: () => void) {
    this.onChange = fn;
    this.el.addEventListener('counterChange', this.onChange);
  }

  // Same as above, but for the `isTouched` property. We could also use the standard `focus` event.
  registerOnTouch(fn: () => void) {
    this.onTouch = fn;
    this.el.addEventListener('counterFocus', this.onTouch);
  }

  // Same as above, but for the `isBlurred` property.
  registerOnBlur(fn: () => void) {
    this.onBlur = fn;
    this.el.addEventListener('counterBlur', this.onBlur);
  }

  // Here we remove all the listeners.
  onDisconnect() {
    this.el.removeEventListener('counterChange', this.onChange);
    this.el.removeEventListener('counterFocus', this.onTouch);
    this.el.removeEventListener('counterBlur', this.onBlur);
  }
}
```

Once you have this, you can pass it to the `bind` directive when binding the element:

```ts
html`
  <my-counter ${this.counter.bind({accessor: CounterAccessor})}></my-counter>
`
```

However passing it every time can cause a lot of noise: more on this in the next section.

#### FormBuilder

You can use `FormBuilder` to remove a lot of boilerplate. For example, you can set a custom configuration which will be used by all controls:

```ts
// Every control will update the model on blur
fb = new FormBuilder(this, {
  updateOn: 'blur'
});
```

But you can always override this "group" configuration with the `bind` directive:

```ts
html`
  <!-- This field will update the model on input -->
  <input ${bind('name', { updateOn: 'input' })}>
`
```

Or, if you're using custom elements which require `ControlAccessor`s, you can replace the `accessorFactory`, the function which chooses the correct Accessor for each element:

```ts
fb = new FormBuilder(this, {
  accessorFactory: myAccessorFactory
});
```

This way you don't have to specify the accessor every time with the `bind` directive.

This is what the default `ControlAccessorFactory` looks like:

```ts
export const getControlAccessor: ControlAccessorFactory = (el) => {
  if (el.localName === 'input' && el.getAttribute('type') === 'checkbox') {
    return new CheckboxAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'input' && el.getAttribute('type') === 'number') {
    return new NumberAccessor(el as HTMLInputElement);
  }
  ...
  return new BaseControlAccessor(el);
}
```

You may want to reuse it, like this:

```ts
export const myAccessorFactory: ControlAccessorFactory = (el) => {
  if (el.localName === 'my-counter') {
    return new CounterAccessor(el as Counter);
  }
  return getControlAccessor(el);
}
```
