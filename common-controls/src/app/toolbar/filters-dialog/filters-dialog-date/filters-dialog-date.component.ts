import {Component, Inject} from '@angular/core';
import {DisplayItem, FilterDefinition, FilterOperator} from '../../../shared/models/common.info';
import {ToolbarService} from '../../shared/toolbar.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
    selector: 'ntk-filters-dialog-date',
    templateUrl: './filters-dialog-date.component.html',
    styleUrls: ['./filters-dialog-date.component.css']
})
export class FiltersDialogDateComponent {
    public outDateFormat = 'dd/MM/yyyy';
    public filter: FilterDefinition;
    public operators: any[];
    public from = this.getCurrentDate();
    public to = this.getCurrentDate();

    constructor(
        private dialogRef: MatDialogRef<FiltersDialogDateComponent>,
        @Inject(MAT_DIALOG_DATA)  data: any,
        private toolbarService: ToolbarService) {

        if (data.outDateFormat) {
            this.outDateFormat = data.outDateFormat;
        }

        this.filter = data.filterDefinition;
        this.operators = this.toolbarService.getOperators();
        this.restoreData();
    }

    public getFilterValues() {
        let selectedItems: DisplayItem[] = [];

        if (this.from) {
            selectedItems = this.toolbarService.getSelectedItemsFromDateFilter({
                filterOperator: this.filter.FilterOperator,
                from: this.from,
                to: this.to
            });
        }

        const values = selectedItems.map((item) => {
            return item.Value;
        });
        return {
            SelectedItems: selectedItems,
            Value: values,
            FilterOperator: this.filter.FilterOperator
        };
    }

    public onSubmit() {
        this.onOk();
    }

    public onOk() {
        this.dialogRef.close(this.getFilterValues());
    }

    public onCancel() {
        this.dialogRef.close(null);
    }

    private restoreData() {
        // Restore date
        if (this.filter.SelectedItems.length >= 1) {
            this.from = new Date(this.filter.SelectedItems[0].Value);
        }
        if (this.filter.SelectedItems.length === 2) {
            if (this.filter.FilterOperator === FilterOperator.Between) {
                this.to = new Date(this.filter.SelectedItems[1].Value);
            }
        }

    }

    private getCurrentDate() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

}
