import { AbstractControl } from "./abstract-control";
import { FormArray } from "./controllers/form-array";
import { FormControl } from "./controllers/form-control";
import { FormGroup } from "./controllers/form-group";

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`

/**
 * A field can be in one of these states at a time.
 */
export type UIState = 'ENABLED' | 'DISABLED' | 'READONLY';

/**
 * Given a FormGroup, returns all the possible keys for bindings with FormControls.
 * Includes nested keys (dotted syntax) only for nested FormGroups.
 * 
 * Examples:
 * 
 * OK: 'consent' (if it's a FormControl)
 * OK: 'user.name' (if "user" is a FormGroup and "name" is a FormControl)
 * NOT OK: 'user' (if "user" is a FormGroup, we can only bind FormControl's)
 * NOT OK: 'addresses[0].street' (FormArrays must be mapped in the template with map/repeat...)
 */
export type BindKey<T> = (
  T extends FormGroup<infer Shape>
  ? { [K in Exclude<keyof Shape, symbol>]:
    (
      Shape[K] extends FormControl
      ? K
      : Shape[K] extends FormGroup<infer InnerShape>
      ? `${K}${DotPrefix<BindKey<FormGroup<InnerShape>>>}`
      : never
    )
  }[Exclude<keyof Shape, symbol>]
  : never
) extends infer D ? Extract<D, string> : never;

/**
 * Extracts a value from an AbstractControl
 */
 export type ValueOf<T extends AbstractControl> = 
 T extends FormControl<infer U>
 ? U
 : T extends FormArray<infer U>
 ? ValueOf<U>[]
 : T extends FormGroup<infer U>
 ? { [k in keyof U]: ValueOf<U[k]> }
 : never;

/**
* Extracts a value from an AbstractControl, but makes FormControls undefineable
*/
export type EnabledValueOf<T extends AbstractControl> = 
T extends FormControl<infer U>
? U | undefined
: T extends FormArray<infer U>
? EnabledValueOf<U>[]
: T extends FormGroup<infer U>
? (
  // FormGroups and FormArrays are required to be in the final value
  Required<{ [k in keyof U as U[k] extends FormControl ? never : k]: EnabledValueOf<U[k]> }> &
  // FormControls may be missing if disabled
  Partial<{ [k in keyof U]: EnabledValueOf<U[k]> }>
)
: never;