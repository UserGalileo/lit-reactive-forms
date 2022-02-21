import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseControlAccessor, UIState } from '../src';

@customElement('app-counter')
export class Counter extends LitElement {

  @property({ type: Number })
  value = 0;

  @property({ type: Boolean })
  disabled = false;

  render() {
    return html`
      <span @focus=${this.onFocus} @blur=${this.onBlur}>
        <button @click=${this.minus} ?disabled=${this.disabled}>-</button>
        ${this.value}
        <button @click=${this.plus} ?disabled=${this.disabled}>+</button>
      </span>
    `;
  }

  minus() {
    this.value--;
    this.onChange();
  }

  plus() {
    this.value++;
    this.onChange();
  }

  onChange() {
    this.dispatchEvent(new CustomEvent('counterChange', {
      detail: this.value
    }))
  }

  onFocus() {
    this.dispatchEvent(new CustomEvent('counterFocus'));
  }

  onBlur() {
    this.dispatchEvent(new CustomEvent('counterBlur'));
  }
}

/**
 * Our "app-counter" is a custom control. Its properties and events have custom names.
 * Here we tell the library how its events are called and how to manipulate its values from the outside.
 */
 export class CounterAccessor extends BaseControlAccessor<Counter, number> {
  
  getValue() {
    return this.el.value;
  }

  setValue(x: number) {
    this.el.value = x;
  }

  setUIState(uiState: UIState) {
    this.el.disabled = uiState === 'DISABLED' || uiState === 'READONLY';
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn;
    this.el.addEventListener('counterChange', this.onChange);
  }

  registerOnTouch(fn: () => void) {
    this.onTouch = fn;
    this.el.addEventListener('counterFocus', this.onTouch);
  }

  registerOnBlur(fn: () => void) {
    this.onBlur = fn;
    this.el.addEventListener('counterBlur', this.onBlur);
  }

  onDisconnect() {
    this.el.removeEventListener('counterChange', this.onChange);
    this.el.removeEventListener('counterFocus', this.onTouch);
    this.el.removeEventListener('counterBlur', this.onBlur);
  }
}
