import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ToolbarService} from '../../shared/toolbar.service';
import {FiltersDialogNumberComponent} from '../filters-dialog-number/filters-dialog-number.component';
import {UtilityService} from '../../../core/services/utility.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {FilterOperator} from '../../../shared/models/common.info';
import {combineLatest} from 'rxjs';

@Component({
    selector: 'ntk-filters-dialog-duration',
    templateUrl: './filters-dialog-duration.component.html',
    styleUrls: ['./filters-dialog-duration.component.scss']
})
export class FiltersDialogDurationComponent extends FiltersDialogNumberComponent {
    constructor(dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA) data: any,
                toolbarService: ToolbarService,
                private utilityService: UtilityService) {
        super(dialogRef, data, toolbarService);
        this.form = new FormGroup({
            operator: new FormControl(this.filter.FilterOperator, [Validators.required]),
            fromValue: new FormControl('', [Validators.required, () => {
                return this.validatorFrom();
            }]),
            toValue: new FormControl('', [Validators.required, () => {
                return this.minMaxValidatorTo();
            }])
        });

        combineLatest([
            this.form.controls.operator.valueChanges,
            this.form.controls.fromValue.valueChanges
        ]).subscribe(() => {
            this.form.controls.fromValue.updateValueAndValidity({
                onlySelf: false,
                emitEvent: false
            });
        });
    }

    protected getDisplayValue(hour: number) {
        return this.utilityService.transformDurationToString(hour);
    }

    private validatorFrom() {
        let operator = this.form.controls.operator.value,
            fromValue = this.form.controls.fromValue.value;
        if (operator === FilterOperator.Less && (fromValue === 0 || fromValue === '0')) {
            return {less_than_0: true};
        } else {
            return null;
        }
    }
}
