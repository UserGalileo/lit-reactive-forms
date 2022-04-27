import type { IWindow } from 'happy-dom'
import { beforeEach, describe, it, vi, expect, afterEach } from 'vitest'
import { FormControl, FormGroup, PureValidators } from '../src';
import { LitElement, html, nothing } from 'lit';

declare global {
  interface Window extends IWindow {}
}

export class MyElement extends LitElement {

  formGroup = new FormGroup(this, {
    name: new FormControl(this, { defaultValue: 'name' }),
    surname: new FormControl(this, { defaultValue: 'surname' }),
  });

  render() {
    return html`
      <input type="text" ${this.formGroup.bind('name')}>
      <input type="text" ${this.formGroup.bind('surname')}>
    `
  }
}
customElements.define('my-element', MyElement);

describe('FormGroup', async () => {

  let element: MyElement;

  beforeEach(async () => {
    document.body.innerHTML = '<my-element></my-element>'
    await window.happyDOM.whenAsyncComplete()
    await new Promise(resolve => setTimeout(resolve, 0));

    element = document.querySelector('my-element')!;
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should get an existing child', () => {
    expect(element.formGroup.get('name')).toBeDefined();
    expect(element.formGroup.get('surname')).toBeDefined();
    expect(element.formGroup.get('test' as any)).toBeUndefined();
  })

  it('should bind to an existing child', () => {
    expect(element.formGroup.bind('name')).toBeDefined()
    expect(element.formGroup.bind('surname')).toBeDefined()
    expect(element.formGroup.bind('test')).toBe(nothing);
  })

  it('should have the whole value', () => {
    expect(element.formGroup.value).toEqual({
      name: 'name',
      surname: 'surname'
    });
    element.formGroup.get('name').set('test');
    expect(element.formGroup.value).toEqual({
      name: 'test',
      surname: 'surname'
    });
  })

  it('should skip disabled values in enabledValue', () => {
    expect(element.formGroup.enabledValue).toEqual({
      name: 'name',
      surname: 'surname'
    });
    element.formGroup.get('name').setUIState('DISABLED');
    expect(element.formGroup.enabledValue).toEqual({
      surname: 'surname'
    });
    element.formGroup.get('surname').setUIState('DISABLED');
    expect(element.formGroup.enabledValue).toEqual({});
    element.formGroup.get('name').setUIState('ENABLED');
    element.formGroup.get('surname').setUIState('ENABLED');
    expect(element.formGroup.enabledValue).toEqual({
      name: 'name',
      surname: 'surname'
    });
  })

  it('should set and patch children', () => {
    element.formGroup.set({ name: 'a', surname: 'b' });
    expect(element.formGroup.get('name').value).toBe('a');
    expect(element.formGroup.get('surname').value).toBe('b');
    element.formGroup.patch({ name: 'c' });
    expect(element.formGroup.get('name').value).toBe('c');
    expect(element.formGroup.get('surname').value).toBe('b');
  })

  it('should reset all children', () => {
    element.formGroup.set({ name: 'a', surname: 'b' });
    element.formGroup.reset();
    expect(element.formGroup.value).toEqual({ name: 'name', surname: 'surname' });
    element.formGroup.set({ name: 'a', surname: 'b' });
    element.formGroup.get('name').setDirty(true);
    element.formGroup.get('name').setTouched(true);
    element.formGroup.get('name').setBlurred(true);
    element.formGroup.reset(false);
    expect(element.formGroup.value).toEqual({ name: 'name', surname: 'surname' });
    expect(element.formGroup.get('name').isDirty).toBe(true);
    expect(element.formGroup.get('name').isTouched).toBe(true);
    expect(element.formGroup.get('name').isBlurred).toBe(true);
  })

  describe('Dirty, Touched, Blurred', () => {

    it('should be dirty if at least 1 child is dirty', () => {
      element.formGroup.get('name').setDirty(false);
      element.formGroup.get('surname').setDirty(false);
      expect(element.formGroup.isDirty).toBe(false);
      element.formGroup.get('name').setDirty(true);
      expect(element.formGroup.isDirty).toBe(true);
    })

    it('should be touched if at least 1 child is touched', () => {
      element.formGroup.get('name').setTouched(false);
      element.formGroup.get('surname').setTouched(false);
      expect(element.formGroup.isTouched).toBe(false);
      element.formGroup.get('name').setTouched(true);
      expect(element.formGroup.isTouched).toBe(true);
    })

    it('should be blurred if at least 1 child is blurred', () => {
      element.formGroup.get('name').setBlurred(false);
      element.formGroup.get('surname').setBlurred(false);
      expect(element.formGroup.isBlurred).toBe(false);
      element.formGroup.get('name').setBlurred(true);
      expect(element.formGroup.isBlurred).toBe(true);
    })
  })

  describe('Validation', () => {

    it('should be VALID if all children are VALID, INVALID if at least 1 is INVALID', () => {
      element.formGroup.get('name').setFixedErrors(['a']);
      element.formGroup.get('surname').setFixedErrors(['b']);
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual([]);
      element.formGroup.get('name').setFixedErrors([]);
      expect(element.formGroup.status).toBe('INVALID');
      element.formGroup.get('surname').setFixedErrors([]);
      expect(element.formGroup.status).toBe('VALID');
    })

    it('should be PENDING if at least 1 child is PENDING and others are VALID', async () => {
      element.formGroup.get('name').setAsyncValidators([
          c => Promise.resolve(c.value ? null : 'required')
      ]);
      expect(element.formGroup.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formGroup.status).toBe('VALID');
      // The second field is now INVALID, we don't expect a PENDING state
      element.formGroup.get('surname').setValidators([
        () => 'error'
      ]);
      element.formGroup.patch({ name: 'new name' });
      expect(element.formGroup.status).toBe('INVALID');
    })

    it('should set fixed errors', () => {
      element.formGroup.setFixedErrors(['a', 'b']);
      expect(element.formGroup.errors).toEqual(['a', 'b']);
    })

    it('should have its own validators', () => {
      element.formGroup.set({ name: '', surname: '' });
      element.formGroup.get('name').setValidators([PureValidators.required]);
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual([]);
      element.formGroup.setValidators([
        c => c.get('name').value.length < 2 ? 'minLength' : null
      ]);
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual(['minLength']);
      element.formGroup.get('surname').setValidators([PureValidators.required]);
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual(['minLength']);
      element.formGroup.set({ name: 'test', surname: 'test' });
      expect(element.formGroup.status).toBe('VALID');
    })

    it('should have its own asynchronous validators', async () => {
      element.formGroup.set({ name: '', surname: '' });
      element.formGroup.get('name').setAsyncValidators([ c => Promise.resolve(c.value ? null : 'required') ]);
      expect(element.formGroup.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual([]);
      element.formGroup.setAsyncValidators([
        c => Promise.resolve(c.get('name').value.length < 2 ? 'minLength' : null)
      ]);
      // Invalid because of the child, but in reality it's pending
      expect(element.formGroup.status).toBe('INVALID');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formGroup.errors).toEqual(['minLength']);
      element.formGroup.get('surname').setAsyncValidators([ c => Promise.resolve(c.value ? null : 'required') ]);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formGroup.status).toBe('INVALID');
      expect(element.formGroup.errors).toEqual(['minLength']);
      element.formGroup.set({ name: 'test', surname: 'test' });
      expect(element.formGroup.get('name').status).toBe('PENDING');
      expect(element.formGroup.get('surname').status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formGroup.status).toBe('VALID');
      expect(element.formGroup.errors).toEqual([]);
    })
  })
})
