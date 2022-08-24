import { Input, Directive, SimpleChanges, OnChanges, ElementRef, Optional, Injector } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInput, MatSelect } from '@angular/material';
import { DropdownComponent } from '../../dropdown/dropdown.component';


@Directive({
    selector: `input[ntk-required][ngModel],
                ntk-mat-dropdown[ntk-required][ngModel],
                ntk-mat-dropdown[ntk-required][formControlName],
                select[ntk-required][ngModel], 
                input[ntk-required][formControlName],
                textarea[ntk-required][formControlName],
                textarea[ntk-required][ngModel]`,
    providers: [
        { provide: NG_VALIDATORS, useExisting: RequiredValidatorDirective, multi: true }
    ]
})

export class RequiredValidatorDirective implements Validator, OnChanges {
    @Input('ntk-required') public isRequired = true;

    private _onChange: () => void;
    static validateFn(control: AbstractControl): { [key: string]: any } {
        // console.log('---valid Fn = ', control);

        let v: any = control.value;
        if (typeof v === 'string') { v = v.trim(); }

        return !v ? { requiredValidator: { invalid: true } } : null;
    }

    /**
     *
     */
    constructor(private _inject: Injector) {
    }
    validate(control: AbstractControl): { [key: string]: any } {
        // console.log('---need validate = ', this.isRequired);
        // console.log('---need validate control = ', control);

        if (this.isRequired) {
            return RequiredValidatorDirective.validateFn(control);
        }

        return null;
    }

    private updateRequiredForInput() {
        let input = this._inject.get(MatInput, null);

        if (input) {
            // console.log('found input = ', input);
            input.required = this.isRequired;
            input.stateChanges.next();
        }
    }

    private updateRequiredForDropdown() {
        let dropdown = this._inject.get(DropdownComponent, null);

        if (dropdown) {
            // console.log('found dropdown = ', dropdown);
            dropdown.required = this.isRequired;
            dropdown.stateChanges.next();
        }
    }

    private updateRequiredForSelect() {
        let select = this._inject.get(MatSelect, null);

        if (select) {
            // console.log('found select = ', select);
            select.required = this.isRequired;
            select.stateChanges.next();
        }
    }
    ngOnChanges(changes: SimpleChanges): void {
        // console.log('---changed = ', changes);

        if ('isRequired' in changes) {
            if (this._onChange) { this._onChange(); }

            this.updateRequiredForInput();
            this.updateRequiredForDropdown();
            this.updateRequiredForSelect();
        }
    }

    registerOnValidatorChange(fn: () => void): void { this._onChange = fn; }
}

/** Error when invalid control is dirty, touched, or submitted. */
export class SubmittedErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && isSubmitted);
    }
}
