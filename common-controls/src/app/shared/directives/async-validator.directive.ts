import { Directive, Input, Injector } from '@angular/core';
import { AsyncValidator, AbstractControl, ValidationErrors, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Directive({
    selector: '[ntk-async-validator][ngModel]',
    providers: [
        { provide: NG_ASYNC_VALIDATORS, useExisting: AsyncValidatorDirective, multi: true }
    ]
})
export class AsyncValidatorDirective implements AsyncValidator {
    constructor(private _injector: Injector) { }

    @Input('asyncMethod') asyncMethod: (injector: Injector, propertyName: string, newValue: any, oldValue?: any, modelObject?: any) => Observable<boolean>;
    @Input('asyncModel') asyncModel: any;
    @Input('asyncPropertyName') asyncPropertyName: string;

    validate(control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
        if (this.asyncMethod) {
            let oldValue: any;
            if (this.asyncPropertyName)
                oldValue = control.parent.value[this.asyncPropertyName];
                
            //console.info('check async \"' + this.asyncPropertyName + '\": new: ' + control.value + ' --- old: ' + oldValue);
            if (control.value && oldValue && control.value != oldValue) {
                control.setErrors({ 'asyncValidatorDelay': true });
            }

            return this.asyncMethod(this._injector, this.asyncPropertyName, control.value, oldValue, this.asyncModel).pipe(map(data => {
                if (!data) {
                    let errors: { [key: string]: any } = {};
                    errors['asyncValidator'] = { invalid: true };

                    return errors;
                } else {
                    return null;
                }
            }));
        }

        return of(null);
    }
}
