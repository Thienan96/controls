import {AfterViewInit, Component, ContentChild, Injector, Input, NgZone} from '@angular/core';
import {TableEditableCellBase} from '../shared/table-editable-cell-base';
import {MatCheckbox} from '@angular/material';

@Component({
    selector: 'ntk-table-editable-cell-checkbox',
    templateUrl: './table-editable-cell-checkbox.component.html',
    styleUrls: ['./table-editable-cell-checkbox.component.css']
})
export class TableEditableCellCheckboxComponent extends TableEditableCellBase implements AfterViewInit {
    @ContentChild(MatCheckbox, {static: false}) input: MatCheckbox;

    @Input() selected: any;
    @Input() rowIndex: number;
    @Input() colIndex: number;
    @Input() datatable: any;
    @Input() readonly = false;

    constructor(protected injector: Injector,
                private zone: NgZone) {
        super(injector);
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();

        this.input.registerOnChange(() => {
            this.zone.run(() => {
                this.apply();
            });
        });
    }

    onReady() {
        if (this.selected && this.selected.row === this.rowIndex && this.selected.col === this.colIndex) {
            this.input.focus();
        }

        if (this.datatable) {
            setTimeout(() => {
                // Check readonly
                this.readonly = !this.datatable.isCellEditable(this.rowIndex, this.colIndex);
            });
        }
    }

    getValue() {
        return this.input.checked;
    }

    restoreValue() {
        this.input.checked = this.prevValue;
    }
}
