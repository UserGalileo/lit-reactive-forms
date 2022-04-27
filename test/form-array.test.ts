import type { IWindow } from 'happy-dom'
import { beforeEach, describe, it, vi, expect, afterEach } from 'vitest'
import { FormArray, FormControl, PureValidators } from '../src';
import { LitElement, html } from 'lit';

declare global {
  interface Window extends IWindow {}
}

export class MyElement extends LitElement {

  formArray = new FormArray<FormControl>(this, {
    initialItems: []
  });

  render() {
    return html`
      ${this.formArray.controls.map(c => html`
        <input type="text" ${c.bind()}>
      `)}
  `
  }
}
customElements.define('my-element', MyElement);

describe('FormArray', async () => {

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

  describe('Items manipulation', () => {

    it('should append', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      expect(element.formArray.controls.length).toBe(1);
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      expect(element.formArray.controls.length).toBe(3);
      expect(element.formArray.controls.map(c => c.value)).toEqual(['test 1', 'test 2', 'test 3'])
    })

    it('should clear', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test' }));
      expect(element.formArray.controls.length).toBe(2);
      element.formArray.clear();
      expect(element.formArray.controls.length).toBe(0);
    })

    it('should insertAt', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      element.formArray.insertAt(new FormControl(element, { defaultValue: 'test 1.5' }), 1);
      expect(element.formArray.controls.length).toBe(4);
      expect(element.formArray.get(0)!.value).toBe('test 1');
      expect(element.formArray.get(1)!.value).toBe('test 1.5');
      expect(element.formArray.get(2)!.value).toBe('test 2');
      expect(element.formArray.get(3)!.value).toBe('test 3');
    })

    it('should prepend', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      expect(element.formArray.controls.length).toBe(1);
      element.formArray.prepend(new FormControl(element, { defaultValue: 'test 0' }));
      expect(element.formArray.controls.length).toBe(2);
      expect(element.formArray.controls.map(c => c.value)).toEqual(['test 0', 'test 1'])
    })

    it('should removeAt', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      element.formArray.removeAt(1);
      expect(element.formArray.controls.length).toBe(2);
      expect(element.formArray.get(0)!.value).toBe('test 1');
      expect(element.formArray.get(1)!.value).toBe('test 3');
    })

    it('should pop', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      element.formArray.pop();
      expect(element.formArray.controls.length).toBe(2);
      expect(element.formArray.get(0)!.value).toBe('test 1');
      expect(element.formArray.get(1)!.value).toBe('test 2');
    })

    it('should swap', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      element.formArray.swap(0, 2);
      expect(element.formArray.controls.length).toBe(3);
      expect(element.formArray.get(0)!.value).toBe('test 3');
      expect(element.formArray.get(1)!.value).toBe('test 2');
      expect(element.formArray.get(2)!.value).toBe('test 1');
    })

    it('should move', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 3' }));
      element.formArray.move(0, 2);
      expect(element.formArray.controls.length).toBe(3);
      expect(element.formArray.get(0)!.value).toBe('test 2');
      expect(element.formArray.get(1)!.value).toBe('test 3');
      expect(element.formArray.get(2)!.value).toBe('test 1');
    })

  })

  it('should reset all children', () => {
    element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
    element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
    element.formArray.get(0)!.set('new 1');
    element.formArray.get(1)!.set('new 2');
    expect(element.formArray.get(0)!.value).toBe('new 1');
    expect(element.formArray.get(1)!.value).toBe('new 2');
    element.formArray.reset();
    expect(element.formArray.get(0)!.value).toBe('test 1');
    expect(element.formArray.get(1)!.value).toBe('test 2');
  })

  describe('Dirty, Touched, Blurred', () => {

    it('should be dirty if at least 1 child is dirty', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      expect(element.formArray.isDirty).toBe(false);
      (element.formArray.get(0)! as FormControl).setDirty(true);
      expect(element.formArray.isDirty).toBe(true);
      (element.formArray.get(0)! as FormControl).setDirty(false);
      expect(element.formArray.isDirty).toBe(false);
    })

    it('should be touched if at least 1 child is touched', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      expect(element.formArray.isTouched).toBe(false);
      (element.formArray.get(0)! as FormControl).setTouched(true);
      expect(element.formArray.isTouched).toBe(true);
      (element.formArray.get(0)! as FormControl).setTouched(false);
      expect(element.formArray.isTouched).toBe(false);
    })

    it('should be blurred if at least 1 child is blurred', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      expect(element.formArray.isBlurred).toBe(false);
      (element.formArray.get(0)! as FormControl).setBlurred(true);
      expect(element.formArray.isBlurred).toBe(true);
      (element.formArray.get(0)! as FormControl).setBlurred(false);
      expect(element.formArray.isBlurred).toBe(false);
    })
  })

  describe('Validation', () => {

    it('should be VALID if all children are VALID', () => {
      expect(element.formArray.status).toBe('VALID');
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      expect(element.formArray.status).toBe('VALID');
    })

    it('should be INVALID if at least 1 child is INVALID', () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      element.formArray.get(0)!.setFixedErrors(['a', 'b']);
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
    })

    it('should be PENDING if at least 1 child is PENDING and others are VALID', async () => {
      element.formArray.append(new FormControl(element, { defaultValue: 'test 1' }));
      element.formArray.append(new FormControl(element, { defaultValue: 'test 2' }));
      (element.formArray.get(0)! as FormControl).setAsyncValidators([
        () => Promise.resolve('error')
      ])
      expect(element.formArray.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
      // Even if the second item is PENDING, the first one is INVALID so the whole array is INVALID
      (element.formArray.get(1)! as FormControl).setAsyncValidators([
        () => Promise.resolve('error')
      ])
      expect(element.formArray.get(1)!.status).toBe('PENDING');
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
    })

    it('should set fixed errors', () => {
      element.formArray.setFixedErrors(['a', 'b']);
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual(['a', 'b']);
    })

    it('should have its own validators', () => {
      element.formArray.append(new FormControl(element, { defaultValue: '', validators: [PureValidators.required] }));
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
      element.formArray.setValidators([
        c => c.controls.length < 2 ? 'minLength' : null
      ]);
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual(['minLength']);
      element.formArray.append(new FormControl(element, { defaultValue: '', validators: [PureValidators.required] }));
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
      element.formArray.set(['test', 'test']);
      expect(element.formArray.status).toBe('VALID');
    })

    it('should have its own asynchronous validators', async () => {
      element.formArray.append(new FormControl(element, { defaultValue: '', asyncValidators: [ c => Promise.resolve(c.value ? null : 'required') ] }));
      expect(element.formArray.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
      element.formArray.setAsyncValidators([
        c => Promise.resolve(c.controls.length < 2 ? 'minLength' : null)
      ]);
      // Invalid because of the child, but in reality it's pending
      expect(element.formArray.status).toBe('INVALID');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formArray.errors).toEqual(['minLength']);
      element.formArray.append(new FormControl(element, { defaultValue: '', asyncValidators: [ c => Promise.resolve(c.value ? null : 'required') ] }));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formArray.status).toBe('INVALID');
      expect(element.formArray.errors).toEqual([]);
      element.formArray.set(['test', 'test']);
      expect(element.formArray.status).toBe('PENDING');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(element.formArray.errors).toEqual([]);
      expect(element.formArray.status).toBe('VALID');
    })
  })
})
