import {Injectable} from '@angular/core';
import {AbstractControl, ValidatorFn} from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class DateValidatorsService {
    min(from: Date): ValidatorFn {
        return (control: AbstractControl): { [key: string]: boolean } | null => {
            let to: Date = control.value;
            return this.validateMin(from, to) ? null : {'min-date': true};
        };
    }

    validateMin(from: Date, to: Date) {
        return !from || !to || (from && to && to >= from);
    }
}
