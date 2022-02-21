import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { FormGroup, FormControl, FormBuilder, ValidatorsWithEffects as V, BindConfig } from '../src';
import * as CV from './custom_validators';
import { styles } from './my-element.styles';
import { Counter, CounterAccessor } from './counter';

const counterBindConfig: Partial<BindConfig<Counter>> = {
  accessor: CounterAccessor,
}

@customElement('my-element')
export class MyElement extends LitElement {

  static styles = styles;

  private fb = new FormBuilder(this);
 
  form = this.fb.group({
    user: this.fb.group({
      name: this.fb.control('Michele', [V.required, V.minLength(2)]),
      surname: this.fb.control('Stieven'),
      gender: this.fb.control<'M' | 'F'>('M'),
    }, {
      asyncValidators: [CV.forbiddenCredentials('mario', 'rossi')] 
    }),
    agreement: this.fb.control(false),
    counter: this.fb.control(1),
    phones: this.fb.array<FormControl<string>>([], [CV.allRequired]),
    addresses: this.fb.array<FormGroup<{
      street: FormControl<string>,
      nr: FormControl<string>
    }>>(),
  }, {
    validators: [CV.sameLength('phones', 'addresses')]
  });

  submit(e: SubmitEvent) {
    e.preventDefault();
    console.log(this.form.value);
  }

  render() {
    const { bind } = this.form;

    return html`
      <h3>Form</h3>
      <form @submit=${this.submit}>
        <input type="text" name="name" ${bind('user.name')}>
        <input type="text" ${bind('user.surname')}>
        <select ${bind('user.gender')}>
          <option value="">-</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        <input type="checkbox" ${bind('agreement')}>
        <app-counter ${bind('counter', counterBindConfig)}></app-counter>
        <hr>
        Phones: ${this.form.get('phones').controls.map(c => html`
          <br><input type="text" ${c.bind()}>
        `)}
        <br>
        <button type="button" @click=${this.addPhone}>add</button>
        <button type="button" @click=${this.removePhone}>remove</button>
        <hr>
        Addresses: ${this.form.get('addresses').controls.map(c => html`
          <br>
          <input placeholder="street" type="text" ${c.bind('street')}>
          <input placeholder="nr" type="text" ${c.bind('nr')}>
        `)}
        <br>
        <button type="button" @click=${this.addAddress}>add</button>
        <button type="button" @click=${this.removeAddress}>remove</button>

        <hr>
        <button type="button" @click=${() => this.form.reset()}>reset</button>
        <button type="button" @click=${this.patchForm}>patch</button>
        <button type="button" @click=${
          () => this.form.get('user').get('name').setUIState('DISABLED')
        }>disable name</button>
        <button type="button" @click=${
          () => this.form.get('user').get('name').setUIState('ENABLED')
        }>enable name</button>
        <button>submit</button>
      </form>
      ${this.renderDebugForm()}
    `;
  }

  renderDebugForm(form = this.form) {
    return html`
      <hr>
      Value: <pre>${JSON.stringify(form.value, null, 2)}</pre>
      Enabled Value: <pre>${JSON.stringify(form.enabledValue, null, 2)}</pre>
      Name dirty: ${form.get('user').get('name').isDirty}<br>
      Name touched: ${form.get('user').get('name').isTouched}<br>
      Name blurred: ${form.get('user').get('name').isBlurred}<br>
      Name UI State: ${form.get('user').get('name').uiState}<br>
      Name status: ${form.get('user').get('name').status}<br>
      Name errors: ${JSON.stringify(form.get('user').get('name').errors)}<br>
      User status: ${form.get('user').status}<br>
      User errors: ${JSON.stringify(form.get('user').errors)}<br>
      Phones status: ${form.get('phones').status}<br>
      Phones errors: ${JSON.stringify(form.get('phones').errors)}<br>
      Form status: ${form.status}<br>
      Form errors: ${JSON.stringify(form.errors)}<br>
    `
  }

  addPhone() {
    this.form.get('phones').append(
      this.fb.control('')
    ); 
  }

  removePhone() {
    this.form.get('phones').pop();
  }

  addAddress() {
    this.form.get('addresses').append(
      this.fb.group({
        street: this.fb.control('', [V.required]),
        nr: this.fb.control('', [V.required])
      })
    );
  }

  removeAddress() {
    this.form.get('addresses').pop();
  }

  patchForm() {
    this.form.patch({
      user: {
        name: 'new name',
        surname: 'new surname',
        gender: 'F',
      },
      agreement: true,
      counter: 3
    })
  }
}
