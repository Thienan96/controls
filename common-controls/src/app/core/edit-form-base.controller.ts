import { FormGroup, AbstractControl } from '@angular/forms';
import {HelperService} from './services/helper.service';


export class EditFormBaseController {
    formGroup: FormGroup;

    constructor() {

    }

    public getControl(name: string): AbstractControl {
        if (!this.formGroup) {
            throw new Error('form group not yet initalize.');
        }
        return this.formGroup.get(name);
    }

    public getvalue(controlName: string, propertyName?: string, defaultValue?: any): any {
        if (!this.formGroup) {
            throw new Error('form group not yet initalize.');
        }

        let value = this.formGroup.get(controlName).value;

        if (value) {
            // console.log('getvalue ', controlName, '.', propertyName, ' = ', value);

            if (propertyName) {
                return value[propertyName];
            }

            return value;
        }

        return defaultValue;
    }

    public isValueEmpty(controlName: string): boolean {
        if (!this.formGroup) {
            throw new Error('form group not yet initalize.');
        }

        return !this.getControl(controlName).value;
    }

}
