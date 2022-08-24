import {Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef} from '@angular/core';
import {DatatableColumn, DatatableColumnPin, DatatableColumnsByPin, DatatableRow} from '../shared/datatable.model';

@Component({
    selector: 'ntk-datatable-footer',
    templateUrl: './datatable-footer.component.html',
    styleUrls: ['./datatable-footer.component.scss']
})
export class DatatableFooterComponent implements OnInit, OnChanges {
    @Input() footer: DatatableRow;
    @Input() template: TemplateRef<any>;
    @Input() columns: DatatableColumn[];
    @Input() scrollLeft: number;
    columnsByPin: DatatableColumnsByPin = new DatatableColumnsByPin();

    constructor() {
    }

    ngOnInit() {
        this.updateColumns();
    }

    updateColumns() {
        this.columnsByPin.reset();
        this.columns
            .filter((column) => {
                return column.show;
            })
            .forEach((c: DatatableColumn) => {
                let column: DatatableColumn = new DatatableColumn(c);
                column.value = this.footer[column.property];
                switch (column.pin) {
                    case DatatableColumnPin.left:
                        this.columnsByPin.left.push(column);
                        break;
                    case DatatableColumnPin.center:
                        this.columnsByPin.center.push(column);
                        break;
                    case DatatableColumnPin.right:
                        this.columnsByPin.right.push(column);
                        break;
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columns']) {
            // console.log('--footer bar detect columns chamnged to', this.columns);
            setTimeout(() => {
                this.updateColumns();
            }, 200);
        }
    }
}
