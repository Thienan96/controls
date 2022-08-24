import { ErrorStateMatcher, CanUpdateErrorStateCtor, mixinErrorState } from '@angular/material';
import { NgForm, FormGroupDirective, NgControl } from '@angular/forms';

class MatInputBase {
    constructor(public _defaultErrorStateMatcher: ErrorStateMatcher,
                public _parentForm: NgForm,
                public _parentFormGroup: FormGroupDirective,
                /** @docs-private */
                public ngControl: NgControl) {}
  }

export const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase =
    mixinErrorState(MatInputBase);
