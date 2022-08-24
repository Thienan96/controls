import { AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Directive } from '@angular/core';
@Directive({
    selector: '[required]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: NoBlankStringValidatorDirective, multi: true }
    ]
})
export class NoBlankStringValidatorDirective {
    validate(control: AbstractControl): ValidationErrors | null {
        try {
            let isWhitespace;
            isWhitespace = (control.value || '').trim().length === 0;
            if (isWhitespace) {
                return { required: true };
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}
