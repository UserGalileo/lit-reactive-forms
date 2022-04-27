import { UIState } from "../models";
import { ValidationStatus } from "../validation/models";

export interface ControlAccessor<T = any> {
  getValue(): T;
  setValue(value: T): void;
  setUIState?(state: UIState): void;
  setValidity?(status: ValidationStatus | null): void;
  registerOnChange(fn: () => void): void;
  registerOnTouch?(fn: () => void): void;
  registerOnBlur?(fn: () => void): void;
  onDisconnect?(): void;
}

export class BaseControlAccessor<E extends HTMLElement = HTMLElement, T = any> implements ControlAccessor<T> {
  onChange = () => {};
  onTouch = () => {};
  onBlur = () => {};

  constructor(public el: E) {}

  getValue() {
    if ('value' in this.el) return (this.el as any).value;
  }

  setValue(value: T) {
    if ('value' in this.el) (this.el as any).value = value;
  }

  setUIState(uiState: UIState | null) {
    switch (uiState) {
      case 'DISABLED': {
        if ('disabled' in this.el) { (this.el as any).disabled = true; }
        if ('readOnly' in this.el) { (this.el as any).readOnly = false; }
        break;
      }
      case 'READONLY': {
        if ('disabled' in this.el) { (this.el as any).disabled = false; }
        if ('readOnly' in this.el) { (this.el as any).readOnly = true; }
        break;
      }
      default: {
        if ('disabled' in this.el) { (this.el as any).disabled = false; }
        if ('readOnly' in this.el) { (this.el as any).readOnly = false; }
        break;
      }
    }
  }

  setValidity(status: ValidationStatus) {
    switch (status) {
      case 'VALID':
        this.el.setAttribute('valid', '');
        this.el.removeAttribute('invalid');
        this.el.removeAttribute('pending');
        break;
      case 'INVALID':
        this.el.setAttribute('invalid', '');
        this.el.removeAttribute('valid');
        this.el.removeAttribute('pending');
        break;
      case 'PENDING':
        this.el.setAttribute('pending', '');
        this.el.removeAttribute('valid');
        this.el.removeAttribute('invalid');
        break;
      default:
        this.el.removeAttribute('pending');
        this.el.removeAttribute('valid');
        this.el.removeAttribute('invalid');
    }
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn;
    this.el.addEventListener('input', this.onChange);
  }

  registerOnTouch(fn: () => void) {
    this.onTouch = fn;
    this.el.addEventListener('focus', this.onTouch);
  }

  registerOnBlur(fn: () => void) {
    this.onBlur = fn;
    this.el.addEventListener('blur', this.onBlur);
  }

  onDisconnect() {
    this.el.removeEventListener('input', this.onChange);
    this.el.removeEventListener('focus', this.onTouch);
    this.el.removeEventListener('blur', this.onBlur);
  }
}
