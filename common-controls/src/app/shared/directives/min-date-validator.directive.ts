import {Directive, Injector, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControlDirective, NG_VALIDATORS, NgControl, Validator} from '@angular/forms';
import {DateValidatorsService} from '../../core/services/date-validators.service';

@Directive({
    selector: '[ntk-min-date-validator]',
    providers: [{
        provide: NG_VALIDATORS,
        useExisting: MinDateValidatorDirective,
        multi: true
    }]
})
export class MinDateValidatorDirective implements OnInit, OnChanges, Validator {
    @Input('ntk-min-date-validator') min: Date;
    private _control: FormControlDirective;
    private _dateValidatorsService: DateValidatorsService;

    constructor(private _injector: Injector) {
    }

    ngOnInit() {
        this._control = this._injector.get(NgControl, null);
        this._dateValidatorsService = this._injector.get(DateValidatorsService, null);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.min.isFirstChange() && this._control) {
            let formControl: AbstractControl = this._control.control;
            // Touch formControl that show error if have error
            formControl.markAsTouched();
            formControl.updateValueAndValidity();
        }
    }

    validate(control: AbstractControl): { [key: string]: any } {
        let from: Date = this.min,
            to: Date = control.value;
        return this._dateValidatorsService.validateMin(from, to) ? null : {'min-date': true};
    }
}
