import {Component, Injector, Input, ViewChild} from '@angular/core';
import {MatDatepicker, MatDatepickerInput} from '@angular/material';
import {TableEditableCellBase} from '../shared/table-editable-cell-base';
import {SPACE} from '@angular/cdk/keycodes';

@Component({
    selector: 'ntk-table-editable-cell-date',
    templateUrl: './table-editable-cell-date.component.html',
    styleUrls: ['./table-editable-cell-date.component.scss']
})
export class TableEditableCellDateComponent extends TableEditableCellBase {
    @ViewChild('picker', {static: false}) picker: MatDatepicker<any>;
    @ViewChild('input', {static: false}) input: MatDatepickerInput<any>;
    @Input() showDropDown = false;

    constructor(protected injector: Injector) {
        super(injector);
    }

    onReady() {
        super.onReady();

        if (this.autoFocus) {
            $(this.elementRef.nativeElement).find('input')[0].focus();
        }

        if (this.showDropDown) {
            setTimeout(() => {
                this.picker.open();
            }, 10);
        }

        if (this.input) {
            // Update cell if have any change
            this.input.registerOnChange((value) => {
                let val = $(this.elementRef.nativeElement).find('input').val();
                if (!val) {
                    this.valueChanged.emit(value);
                }
            });
        }
    }

    onDateChange() {
        this.apply();
    }

    getValue() {
        return this.input.value;
    }

    restoreValue() {
        this.input.value = this.prevValue;
        this.apply();
    }

    onKeyDown(ev: KeyboardEvent) {
        super.onKeyDown(ev);

        // Press Space to open calendar
        if (ev.code === 'Space' || ev['keyCode'] === SPACE) {
            this.picker.open();
        }
    }

}
