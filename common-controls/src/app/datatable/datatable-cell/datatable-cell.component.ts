import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import {
    DatatableCell,
    DatatableColumn,
    DatatableComponentInterface,
    DatatableDataType,
    DatatableRow,
    NTK_DATATABLE
} from '../shared/datatable.model';
import moment from 'moment-es6';
import {DatatableService} from '../shared/datatable.service';
import {Subscription} from 'rxjs/Subscription';


@Component({
    selector: 'ntk-datatable-cell',
    templateUrl: './datatable-cell.component.html',
    styleUrls: ['./datatable-cell.component.scss'],
    host: {
        '[class.is-selected]': 'isSelected',
        '[class.is-merged]': 'isMerged',
        '[class.is-ref]': 'isRef',
        '[class.disabled]': 'disabled',
        '[class.invalid]': '!isValid',
        '[class.hide-active-border]': '!cell.showActiveBorder'
    }
})
export class DatatableCellComponent implements OnInit, OnDestroy {
    @Input() cell: DatatableColumn;
    @Input() row: DatatableRow;
    @Input() rowIndex: number;
    @Output() changed = new EventEmitter();
    isMerged = false; // cell merge to ref`
    isRef = false;
    value: any;
    private prevValue: any;
    isEditMode = false; // Check mode of edit mode
    searchText: string;
    editable = false;
    disabled = false;
    isValid = true;
    isSelected = false;
    cellSelectedChanged: Subscription;

    constructor(@Inject(NTK_DATATABLE) public datatableComponent: DatatableComponentInterface,
                private cd: ChangeDetectorRef,
                private zone: NgZone,
                protected datatableService: DatatableService) {
        this.cellSelectedChanged = this.datatableService.onRaiseCellSelectedChanged().subscribe(() => {
            this.checkCellSelected();
        });
    }

    ngOnInit() {
        let cell = this.getCell();
        this.prevValue = this.value;
        this.value = cell.row[cell.col.property];
        this.checkStatus();

        // Update selected cell
        this.checkCellSelected();

        // Valid control
        this.checkValid();
    }

    ngOnDestroy() {
        this.cellSelectedChanged.unsubscribe();
    }

    /**
     * Change to view mode when press escape
     */
    onEscape() {
        this.datatableComponent.changeToViewMode();
    }

    /**
     * Go to down cell if press enter
     */
    onEnter() {
        this.datatableComponent.goDownCell();
    }

    /**
     * Update value, row, check valid, emit changed
     * @param value
     */
    setValue(value) {
        // Update value
        this.value = value;

        let cell = this.getCell();

        // Update data in row
        cell.row[cell.col.property] = this.getCellValueByColumnName(cell.col, value);


        this.checkStatus();


        // Update state and Valid cell
        this.datatableComponent.markCellModified(cell);
        this.datatableComponent.updateState(cell);

        // Valid cell
        this.checkValid();


        this.changed.emit(value);

    }

    /**
     * Fire when control was changed
     * @param value
     */
    onValueChanged(value) {
        this.setValue(value);
    }


    onEditableControlInit() {
    }

    onEditableControlDestroy() {
        // Reset value
        this.searchText = ``;
        this.prevValue = null;

        // Touch control and valid
        this.zone.run(() => {
            let cell = this.getCell();
            this.datatableComponent.markCellModified(cell);
            this.datatableComponent.updateState(cell);
            this.checkValid();
            this.cd.detectChanges();
        });
    }

    /**
     * Valid cell
     */
    checkValid() {
        this.isValid = this.datatableComponent.isCellValidate(this.getCell());
    }

    /**
     * Update class after udate value
     * @private
     */
    checkStatus() {
        let cell = this.getCell();
        // Update status
        this.isMerged = this.datatableComponent.isMerged(cell);
        this.isRef = this.datatableComponent.isRef(cell);
        this.editable = this.datatableComponent.isCellEditable(cell);
        this.disabled = this.datatableComponent.isCellDisabled(cell);
    }

    /**
     * Get Value of cell by Column-Name
     * @param col
     * @param value
     * @returns {any}
     */
    private getCellValueByColumnName(col: DatatableColumn, value): any {
        switch (col.dataType) {
            case DatatableDataType.Decimal:
            case DatatableDataType.Number:
            case DatatableDataType.PositiveNumber:
            case DatatableDataType.PositiveDecimal:
                return this.transformNumber(value);
            case DatatableDataType.Date:
                return moment(value).toISOString();
            default:
                return value;
        }
    }

    /**
     * Convert value to number
     * @param value
     * @returns {number | null}
     */
    private transformNumber(value): number | string | null {
        value = ('' + value).replace(',', '.');
        value = value.trim();
        if (value === '' || value === `-`) {
            return null;
        } else {
            let newValue = parseFloat(value).toFixed(2);
            return parseFloat(newValue);
        }
    }

    /**
     * Get cell
     * @private
     */
    private getCell(): DatatableCell {
        return {row: this.row, col: this.cell};
    }

    private checkCellSelected() {
        let cellSelected = this.datatableComponent.getCellSelected();
        this.isSelected = !!(cellSelected && cellSelected.row.UniqueKey === this.row.UniqueKey && this.cell.property === cellSelected.col.property);
    }

    updateCellSelected() {
        this.checkCellSelected();
        this.cd.markForCheck();
    }

    updateLayout() {
        this.value = this.row[this.cell.property];
    }
}
