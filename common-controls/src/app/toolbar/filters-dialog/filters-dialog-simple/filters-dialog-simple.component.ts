import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FilterDefinition} from '../../../shared/models/common.info';
import {ENTER, ESCAPE} from '@angular/cdk/keycodes';

@Component({
    selector: 'ntk-filters-dialog-simple',
    templateUrl: './filters-dialog-simple.component.html',
    styleUrls: ['./filters-dialog-simple.component.css']
})
export class FiltersDialogSimpleComponent {
    public searchKeyword: string;
    public filter: FilterDefinition;
    isSmallScreen: boolean;
    autoFocus: boolean;

    constructor(private dialogRef: MatDialogRef<FiltersDialogSimpleComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
        this.filter = data.filterDefinition;
        this.searchKeyword = this.getSearchKeyword();
        this.isSmallScreen = data.isSmallScreen;
        this.autoFocus = data.autoFocus;
    }

    isEmptyOrSpaces(str) {
        return str === undefined || str === null || str.match(/^ *$/) !== null;
    }

    getFilterValues() {
        let value = [],
            checkedAll = true;
        if (!this.isEmptyOrSpaces(this.searchKeyword)) {
            value = [this.searchKeyword];
            checkedAll = false;
        }
        return {
            Value: value,
            CheckedAll: checkedAll
        };
    }

    onSubmit() {
        this.dialogRef.close(this.getFilterValues());
    }

    onCancel() {
        this.cancel();
    }

    onKeyDown(ev: KeyboardEvent) {
        if (this.getKeyCode(ev) === ESCAPE) {
            this.cancel();
        }
        if (this.getKeyCode(ev) === ENTER) {
            this.dialogRef.close(this.getFilterValues());
        }
    }

    private cancel() {
        this.dialogRef.close(null);
    }

    private getKeyCode(keyEvent: KeyboardEvent): number {
        return keyEvent['which'] || keyEvent['keyCode'];
    }

    private getSearchKeyword() {
        return this.filter.Value.length > 0 ? this.filter.Value[0] : '';
    }
}
