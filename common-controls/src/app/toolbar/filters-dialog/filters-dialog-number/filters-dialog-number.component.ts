import {Component, Inject, OnInit} from '@angular/core';
import {DataType, DisplayItem, FilterDefinition, FilterOperator} from '../../../shared/models/common.info';
import {ToolbarService} from '../../shared/toolbar.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';


@Component({
    selector: 'ntk-filters-dialog-number',
    templateUrl: './filters-dialog-number.component.html',
    styleUrls: ['./filters-dialog-number.component.css']
})
export class FiltersDialogNumberComponent implements OnInit {
    filter: FilterDefinition;
    operators: {
        value: string;
        translateKey: string;
    }[];
    form: FormGroup;
    maxLength: number;
    minValue: number;
    allowNegative: boolean;
    isSmallScreen: boolean;
    autoFocus: boolean;

    constructor(private dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA) data: any,
                private toolbarService: ToolbarService) {
        this.filter = data.filterDefinition;
        this.operators = this.filter.AvailableOperators ? this.filter.AvailableOperators : this.toolbarService.getOperators();
        this.minValue = this.filter.MinValue ? this.filter.MinValue : undefined;
        this.maxLength = this.filter.MaxLength ? this.filter.MaxLength : 15;
        this.allowNegative = this.filter.AllowNegative;
        this.isSmallScreen = data.isSmallScreen;
        this.autoFocus = data.autoFocus;

        this.form = new FormGroup({
            operator: new FormControl(this.filter.FilterOperator, [Validators.required]),
            fromValue: new FormControl('', [Validators.pattern('[0-9 ]*'), Validators.min(this.minValue), Validators.maxLength(this.maxLength), Validators.required, () => {
                return this.minMaxValidatorFrom();
            }]),
            toValue: new FormControl('', [Validators.pattern('[0-9 ]*'), Validators.min(this.minValue), Validators.maxLength(this.maxLength), Validators.required, () => {
                return this.minMaxValidatorTo();
            }])
        });
    }

    get DataType() {
        return DataType;
    }

    get FilterOperator() {
        return FilterOperator;
    }

    ngOnInit() {
        this.restoreData();
    }

    public onSubmit() {
        this.onOk();
    }

    public onOk() {
        this.form.markAllAsTouched();

        if (this.isFromValid()) {
            this.dialogRef.close(this.getFilterValues());
        }
    }


    public onCancel() {
        this.dialogRef.close(null);
    }

    onOperatorChanged() {
        // Reset to when change operator
        if (this.filter.FilterOperator !== FilterOperator.Between) {
            this.setValue('', this.form.controls.toValue);
        }
        if (this.form.controls.fromValue.getError('min')) {
            this.form.controls.fromValue.setErrors({min: null});
            this.form.controls.fromValue.updateValueAndValidity();
        }
    }

    protected getDisplayValue(value) {
        return value;
    }

    private getFilterValues() {
        let selectedItems: DisplayItem[] = [],
            from = this.form.controls.fromValue.value,
            to = this.form.controls.toValue.value;
        if (this.filter.FilterOperator === FilterOperator.Between) {
            from = this.parse(from);
            to = this.parse(to);
            selectedItems.push(new DisplayItem(from, this.getDisplayValue(from)));
            selectedItems.push(new DisplayItem(to, this.getDisplayValue(to)));
        } else {
            from = this.parse(from);
            selectedItems.push(new DisplayItem(from, this.getDisplayValue(from)));
        }
        let values = selectedItems.map((item) => {
            return item.Value;
        });
        return {
            SelectedItems: selectedItems,
            Value: values,
            FilterOperator: this.filter.FilterOperator
        };
    }

    private restoreData() {
        let from, to;
        // Restore data
        if (this.filter.Value.length > 0) {
            from = this.filter.Value[0];
        } else {
            from = '';
        }

        if (this.filter.Value.length === 2) {
            to = this.filter.Value[1];
        } else {
            to = '';
        }

        // set the real value in the form (data not formated)
        if (from || from === 0) {
            this.setValue(from, this.form.controls.fromValue); // value === 0(number) form invalid required
        }
        if (to || to === 0) {
            this.setValue(to, this.form.controls.toValue);
        }

    }

    minMaxValidatorFrom() {
        if (!this.form) {
            return null;
        }

        this.form.controls.toValue.updateValueAndValidity();
        return null;
    }

    minMaxValidatorTo() {
        if (!this.form) {
            return null;
        }
        if (this.filter.FilterOperator === FilterOperator.Between) {
            let from: any = this.form.controls.fromValue.value + '',
                to: any = this.form.controls.toValue.value + '';
            if (from && to) {
                from = this.parse(from);
                to = this.parse(to);
                let invalid = from > to;
                return invalid ? {invalidMinMax: true} : null;
            }
        }
        return null;
    }

    private isFromValid() {
        if (this.filter.FilterOperator === FilterOperator.Between) {
            return this.form.valid;
        } else {
            return this.form.controls.fromValue.valid;
        }
    }

    private parse(value: string | number) {
        value = ('' + value).replace(',', '.');
        return parseFloat(value);
    }

    protected setValue(value, formControl: AbstractControl) {
        formControl.setValue(value + '');
    }
}
