import { ReactiveController, ReactiveControllerHost } from 'lit';
import { FormArray } from './form-array';
import { FormControl } from './form-control';
import { FormGroup, GroupShape } from './form-group';
import { Validator, AsyncValidator } from '../validation/models';
import { AbstractControl } from '../abstract-control';
import { ControlAccessorFactory } from '../accessors/accessors';

export interface FormBuilderConfig {
  updateOn: 'input' | 'blur';
  accessorFactory: ControlAccessorFactory;
}

/**
 * Convenience methods to create any kind of control.
 * If passed a config, it'll use the same config for all FormControl's.
 */
export class FormBuilder implements ReactiveController {
  
  constructor(
    public host: ReactiveControllerHost,
    private config?: Partial<FormBuilderConfig>
  ) {
    this.host.addController(this);
  }

  control<T = any>(
    defaultValue: T,
    validators: Validator<FormControl>[] = [],
    asyncValidators: AsyncValidator<FormControl>[] = [],
  ) {
    return new FormControl(this.host, {
      defaultValue,
      validators,
      asyncValidators,
      accessorFactory: this.config?.accessorFactory,
      updateOn: this.config?.updateOn
    });
  }

  group<T extends GroupShape>(
    shape: T,
    config?: {
      validators?: Validator<FormGroup<T>>[],
      asyncValidators?: AsyncValidator<FormGroup<T>>[]
    }
  ) {
    return new FormGroup(this.host, shape, {
      validators: config?.validators || [],
      asyncValidators: config?.asyncValidators || [],
    });
  }

  array<T extends AbstractControl>(
    initialItems: T[] = [],
    validators: Validator<FormArray<any>>[] = [],
    asyncValidators: AsyncValidator<FormArray<any>>[] = []
  ) {
    return new FormArray<T>(this.host, {
      initialItems,
      validators,
      asyncValidators
    });
  }

  hostConnected() {}

  hostDisconnected() {}
}
