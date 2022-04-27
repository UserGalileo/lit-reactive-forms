import { BaseControlAccessor, ControlAccessor } from "./control-accessor";

/**
 * Accessors for any kind of native HTML control.
 */
export class TextAccessor extends BaseControlAccessor<HTMLInputElement, string> {}
export class SelectAccessor extends BaseControlAccessor<HTMLSelectElement, string> {}

export class NumberAccessor extends BaseControlAccessor<HTMLInputElement, number> {
  getValue() {
    return +this.el.value;
  }

  setValue(value: number) {
    this.el.value = '' + value;
  }
}

export class CheckboxAccessor extends BaseControlAccessor<HTMLInputElement, boolean> {
  getValue() {
    return this.el.checked;
  }

  setValue(value: boolean) {
    this.el.checked = !!value;
  }
}

export class SelectMultipleAccessor extends BaseControlAccessor<HTMLSelectElement, string[]> {
  getValue() {
    const options = this.el.selectedOptions;
    let results: string[] = [];
    for (let i = 0; i < options.length; i++) {
      results.push(options[i].value);
    }
    return results;
  }

  setValue(value: string[]) {
    for (let i = 0; i < this.el.options.length; i++) {
      this.el.options[i].selected = value.includes(this.el.options[i].value);
    }
  }
}
export class RadioAccessor extends BaseControlAccessor<HTMLInputElement, string> {
  getValue() {
    return this.el.checked ? this.el.value : null;
  }

  setValue(value: string) {
    this.el.checked = value === this.el.value;
  }
}

export type ControlAccessorFactory<C extends HTMLElement = HTMLElement, T = any> = (el: C) => ControlAccessor<T>;

export const getControlAccessor: ControlAccessorFactory = (el) => {
  if (el.localName === 'input' && el.getAttribute('type') === 'checkbox') {
    return new CheckboxAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'input' && el.getAttribute('type') === 'number') {
    return new NumberAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'input' && el.getAttribute('type') === 'range') {
    return new NumberAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'input' && el.getAttribute('type') === 'text') {
    return new TextAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'input' && el.getAttribute('type') === 'radio') {
    return new RadioAccessor(el as HTMLInputElement);
  }
  if (el.localName === 'select' && el.hasAttribute('multiple')) {
    return new SelectMultipleAccessor(el as HTMLSelectElement);
  }
  if (el.localName === 'select') {
    return new SelectAccessor(el as HTMLSelectElement);
  }
  return new BaseControlAccessor(el);
}
