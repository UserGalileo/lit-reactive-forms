import type { IWindow } from 'happy-dom'
import { beforeEach, describe, it, vi, expect, afterEach, SpyInstance } from 'vitest'
import { FormControl, PureValidators } from '../src';
import { LitElement, html } from 'lit';

declare global {
  interface Window extends IWindow {}
}

export class MyElement extends LitElement {

  formControl = new FormControl(this, {
    defaultValue: 'test value',
    updateOn: 'input',
  });

  render() {
    return html`
    <input type="text" ${this.formControl.bind()}>
  `
  }
}
customElements.define('my-element', MyElement);

describe('FormControl', async () => {

  let element: MyElement;
  let requestUpdate: SpyInstance;

  beforeEach(async () => {
    document.body.innerHTML = '<my-element></my-element>'
    await window.happyDOM.whenAsyncComplete()
    await new Promise(resolve => setTimeout(resolve, 0));

    element = document.querySelector('my-element')!;
    requestUpdate = vi.spyOn(element as any, 'requestUpdate');
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have default value', () => {
    expect(element.formControl.value).toBe('test value');
  })

  it('should change value imperatively', () => {
    element.formControl.set('new value');
    expect(element.formControl.value).toBe('new value');
    expect(requestUpdate).toHaveBeenCalled();
  })

  it('should reset correctly', () => {
    element.formControl.set('new value');
    element.formControl.setDirty(true);
    element.formControl.setTouched(true);
    element.formControl.setBlurred(true);
    element.formControl.reset();

    expect(element.formControl.value).toBe('test value');
    expect(element.formControl.isTouched).toBe(false);
    expect(element.formControl.isBlurred).toBe(false);
    expect(element.formControl.isDirty).toBe(false);
    element.formControl.reset(false);

    expect(element.formControl.value).toBe('test value');
    element.formControl.setDirty(true);
    element.formControl.setTouched(true);
    element.formControl.setBlurred(true);
    expect(element.formControl.isTouched).toBe(true);
    expect(element.formControl.isBlurred).toBe(true);
    expect(element.formControl.isDirty).toBe(true);
  })

  describe('Model to View & viceversa', () => {
    it('should update the DOM', () => {
      const input = element.shadowRoot!.querySelector('input')!;
      expect(input.value).toBe('test value');
      element.formControl.set('new value');
      expect(input.value).toBe('new value');
    })

    it('should reflect the DOM to the model', () => {
      const input = element.shadowRoot!.querySelector('input')!;
      expect(input.value).toBe('test value');
      input.value = 'new value';
      input.dispatchEvent(new Event('input'));
      expect(element.formControl.value).toBe('new value');
    })
  })

  describe('Dirty, Touched, Blurred', () => {
    it('should initially be pristine, untouched, unblurred', () => {
      expect(element.formControl.isBlurred).toBe(false);
      expect(element.formControl.isDirty).toBe(false);
      expect(element.formControl.isTouched).toBe(false);
    })

    it('should become touched on focus', () => {
      const input = element.shadowRoot!.querySelector('input')!;
      input.focus();
      expect(element.formControl.isTouched).toBe(true);
    })

    it('should become blurred on blur', () => {
      const input = element.shadowRoot!.querySelector('input')!;
      input.focus();
      input.blur();
      expect(element.formControl.isBlurred).toBe(true);
    })

    it('should become dirty on input', () => {
      const input = element.shadowRoot!.querySelector('input')!;
      input.dispatchEvent(new Event('input'));
      expect(element.formControl.isDirty).toBe(true);
    })

    it('should imperatively set dirty, touched, blurred', () => {
      element.formControl.setDirty(false);
      expect(element.formControl.isDirty).toBe(false);
      element.formControl.setDirty(true);
      expect(element.formControl.isDirty).toBe(true);

      element.formControl.setTouched(false);
      expect(element.formControl.isTouched).toBe(false);
      element.formControl.setTouched(true);
      expect(element.formControl.isTouched).toBe(true);

      element.formControl.setBlurred(false);
      expect(element.formControl.isBlurred).toBe(false);
      element.formControl.setBlurred(true);
      expect(element.formControl.isBlurred).toBe(true);
    })
  })

  describe('UI State', () => {
    it('should be ENABLED by default', () => {
      expect(element.formControl.uiState).toBe('ENABLED');
    })

    it('should set UI state', () => {
      const input = element.shadowRoot!.querySelector('input')!;

      element.formControl.setUIState('ENABLED');
      expect(element.formControl.uiState).toBe('ENABLED');
      expect(input.disabled).toBe(false);
      expect(input.readOnly).toBe(false);

      element.formControl.setUIState('DISABLED');
      expect(element.formControl.uiState).toBe('DISABLED');
      expect(input.disabled).toBe(true);
      expect(input.readOnly).toBe(false);

      element.formControl.setUIState('READONLY');
      expect(element.formControl.uiState).toBe('READONLY');
      expect(input.disabled).toBe(false);
      expect(input.readOnly).toBe(true);
    })
  })

  describe('Validators', () => {
    it('should set validators, valid and invalid states', () => {
      expect(element.formControl.status).toBe('VALID');
      element.formControl.setValidators([PureValidators.required]);
      expect(element.formControl.status).toBe('VALID');
      element.formControl.set('');
      expect(element.formControl.status).toBe('INVALID');
      expect(element.formControl.errors).toContain('required');
      expect(element.formControl.errors.length).toBe(1);
      expect(element.formControl.hasError('required')).toBe(true);
      element.formControl.setValidators([]);
      expect(element.formControl.status).toBe('VALID');
      expect(element.formControl.errors).not.toContain('required');
      expect(element.formControl.errors.length).toBe(0);
      expect(element.formControl.hasError('required')).toBe(false);
    })

    it('should set fixed errors', () => {
      expect(element.formControl.status).toBe('VALID');
      element.formControl.setFixedErrors(['a', 'b', 'c']);
      expect(element.formControl.status).toBe('INVALID');
      expect(element.formControl.errors).toContain('a');
      expect(element.formControl.errors).toContain('b');
      expect(element.formControl.errors).toContain('c');
      expect(element.formControl.errors.length).toBe(3);
      expect(element.formControl.hasError('a')).toBe(true);
      expect(element.formControl.hasError('b')).toBe(true);
      expect(element.formControl.hasError('c')).toBe(true);
      element.formControl.setFixedErrors([]);
      expect(element.formControl.status).toBe('VALID');
      expect(element.formControl.errors.length).toBe(0);
    })
  })

  describe('Asynchronous validators', () => {

    it('should set validators, pending and invalid states', async () => {
      element.formControl.set('');
      expect(element.formControl.status).toBe('VALID');
      element.formControl.setAsyncValidators([
        c => Promise.resolve(!!c.value ? null : 'required'),
        c => Promise.resolve(c.value.length > 2 ? null : 'minLength'),
      ]);
      expect(element.formControl.status).toBe('PENDING');
      expect(element.formControl.errors.length).toBe(0);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formControl.status).toBe('INVALID');
      expect(element.formControl.hasError('required')).toBe(true);
      expect(element.formControl.hasError('minLength')).toBe(true);
      element.formControl.set('ne');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formControl.hasError('required')).toBe(false);
      expect(element.formControl.hasError('minLength')).toBe(true);
      element.formControl.set('new value');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formControl.hasError('required')).toBe(false);
      expect(element.formControl.hasError('minLength')).toBe(false);
      expect(element.formControl.status).toBe('VALID');
      element.formControl.set('');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formControl.hasError('required')).toBe(true);
      expect(element.formControl.hasError('minLength')).toBe(true);
      element.formControl.setAsyncValidators([
        c => Promise.resolve(!!c.value ? null : 'required'),
      ]);
      expect(element.formControl.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formControl.status).toBe('INVALID');
      expect(element.formControl.errors.length).toBe(1);
      element.formControl.setAsyncValidators([]);
      expect(element.formControl.status).toBe('VALID');
    })
  })
})
