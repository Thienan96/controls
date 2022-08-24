import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import {HelperService} from '../../core/services/helper.service';


@Directive({
    selector: '[ntk-email-validator][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: EmailValidatorDirective, multi: true }
    ]
})
export class EmailValidatorDirective implements Validator {

    static validateFn(control: AbstractControl, helperService: HelperService): { [key: string]: any } {
        let isValid = false;
        if (control.value) {
            let regExp = helperService.UtilityService.getEmailRegularExpression();
            isValid = regExp.test(control.value);
        }

        return control.value && !isValid ? { 'emailValidator': { invalid: true } } : null;
    }
    constructor(private _helperService: HelperService) { }

    validate(control: AbstractControl): { [key: string]: any } {
        return EmailValidatorDirective.validateFn(control, this._helperService);
    }
}
