import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    QueryList,
    SimpleChanges,
    TemplateRef,
    ViewChildren
} from '@angular/core';
import {
    DatatableColumn,
    DatatableColumnPin,
    DatatableColumnsByPin,
    DatatableComponentInterface,
    DatatableRow,
    NTK_DATATABLE
} from '../shared/datatable.model';
import {Subject} from 'rxjs';
import {DatatableCellComponent} from '../datatable-cell/datatable-cell.component';

@Component({
    selector: 'ntk-datatable-row',
    templateUrl: './datatable-row.component.html',
    styleUrls: ['./datatable-row.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.disabled]': 'disabled',
        '[class.is-group]': 'row.isGroup'
    }
})
export class DatatableRowComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChildren(DatatableCellComponent) cellComponents: QueryList<DatatableCellComponent>;

    @Input() row: DatatableRow;
    @Input() columns: DatatableColumn[];
    @Input() scrollLeft: number;
    @Input() dataChanged: Subject<any>;
    @Input() template: TemplateRef<any>;
    columnsByPin: DatatableColumnsByPin = new DatatableColumnsByPin();
    unRegister: any;
    @Input() index: number;
    disabled = false;

    constructor(@Inject(NTK_DATATABLE) public  datatableComponent: DatatableComponentInterface,
                private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.updateRow(this.row);
        this.unRegister = this.dataChanged.asObservable().subscribe(() => {
            this.updateRow(this.row);
            this.safeApply();
        });
        this.disabled = this.datatableComponent.isRowDisabled(this.row);


        if (this.row.Id !== -1) {
            this.datatableComponent.rowReady.next([this.row, this]);
        }
    }

    ngOnDestroy() {
        this.unRegister.unsubscribe();
    }

    private updateRow(row) {
        this.columnsByPin.reset();
        this.columns
            .filter((column) => {
                return column.show;
            })
            .forEach((c: DatatableColumn) => {
                let column: DatatableColumn = new DatatableColumn(c);
                column.value = row[column.property];
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

        // Update layout
        if (this.cellComponents) {
            this.cellComponents.forEach((cellComponent) => {
                cellComponent.updateLayout();
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columns']) {
            // console.log('--row columns chamnged to', this.columns);
            this.updateRow(this.row);

            // if (this.row.Id !== -1) {
            //     this.datatableComponent.rowReady.next([this.row, this]);
            // }
        }
    }

    safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    trackByColumn(index: number, column: DatatableColumn) {
        return column.property;
    }

    onCellChanged() {
        this.cellComponents.forEach((c) => {
            c.checkStatus();
            c.checkValid();
        });
    }
}
