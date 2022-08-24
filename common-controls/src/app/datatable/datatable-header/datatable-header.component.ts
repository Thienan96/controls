import {
    AfterContentInit,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    TemplateRef,
    ViewChildren
} from '@angular/core';
import {
    DatatableColumn,
    DatatableColumnPin,
    DatatableColumnsByPin,
    ISort,
    SortDirection
} from '../shared/datatable.model';
import {HeaderCellComponent} from './header-cell/header-cell.component';

@Component({
    selector: 'ntk-datatable-header',
    templateUrl: './datatable-header.component.html',
    styleUrls: ['./datatable-header.component.scss']
})
export class DatatableHeaderComponent implements AfterContentInit, OnChanges {
    @ViewChildren(HeaderCellComponent) headerCellChildren: QueryList<HeaderCellComponent>;

    @Input() cellTemplate: TemplateRef<any>;
    @Input() columns: DatatableColumn[];
    @Input() scrollLeft: number;
    @Input() defaultSort;
    @Input() rightWidth: number;

    @Output() columnResized = new EventEmitter<DatatableColumn>();
    @Output() columnSorted = new EventEmitter<ISort>();


    columnsByPin: DatatableColumnsByPin = new DatatableColumnsByPin();

    constructor() {
    }

    ngAfterContentInit() {
        this.updateColumns();
    }

    restoreSort() {
        // settimeout to make sure all column ready
        setTimeout(() => {
            if (this.defaultSort) {
                this.headerCellChildren.forEach((headerCell: HeaderCellComponent) => {
                    if (headerCell.columnDef.property === this.defaultSort.prop) {
                        headerCell.directionSort = this.defaultSort.dir === 'desc' ? -1 : 1;
                        headerCell.columnDef.activatedSort = true;
                    }
                });
            }
        }, 500);
    }

    updateColumns() {
        this.columnsByPin.reset();
        this.columns.forEach((column) => {
            if (column.show) {
                switch (column.pin) {
                    case DatatableColumnPin.left:
                        this.columnsByPin.left.push(column);
                        break;
                    case DatatableColumnPin.right:
                        this.columnsByPin.right.push(column);
                        break;
                    default:
                        this.columnsByPin.center.push(column);
                }
            }

        });
        this.restoreSort();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columns']) {
            // console.log('--header columns chamnged to', this.columns);
            this.updateColumns();
        }
    }

    onColumnResized($event: DatatableColumn) {
        this.columnResized.emit($event);
    }

    onColumnSorted(column) {
        this.headerCellChildren.forEach((headerCell: HeaderCellComponent) => {
            if (headerCell.columnDef.property === column.property) {
                if (headerCell.columnDef.activatedSort) {
                    headerCell.directionSort = -headerCell.directionSort;
                } else {
                    headerCell.columnDef.activatedSort = true;
                }
                this.columnSorted.emit({
                    prop: column.property,
                    dir: headerCell.directionSort === 1 ? SortDirection.Asc : SortDirection.Desc
                });
            } else {
                headerCell.columnDef.activatedSort = false;
                headerCell.directionSort = 1;
            }
        });
    }

}
