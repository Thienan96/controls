import {AfterViewInit, ChangeDetectorRef, Component, Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
    DatatableCell,
    DatatableColumn,
    DatatableColumnPin,
    DatatableDataType,
    DatatableGroup,
    DatatableRow,
    ISort,
    SortDirection
} from '../../../datatable/shared/datatable.model';
import {Observable} from 'rxjs';
import {DatatableController} from '../../../core/controllers/ntk-datatable-controller';
import * as _ from 'underscore';
import {MatSlideToggleChange} from '@angular/material';
import moment from 'moment-es6';
import {IDropdownCallbackData, IDropdownGetDataEvent} from '../../../dropdown/shared/dropdown.model';

@Component({
    selector: 'ntk-datatable-sort',
    templateUrl: './datatable-sort.component.html',
    styleUrls: ['./datatable-sort.component.scss']
})
export class DatatableSortComponent extends DatatableController implements AfterViewInit {
    cachedList: DatatableRow[] = [];
    originalRows: DatatableRow[] = [];
    groups: DatatableGroup[] = [];
    footer = {
        Type: `Type`,
        Name: `Name`
    };

    defaultSort: ISort = {prop: 'UnitPrice', dir: SortDirection.Desc};
    storageKey = `Datatable-Sort-Test`;
    allColumns: DatatableColumn[] = [
        {
            translationKey: 'Type',
            displayValue: 'Type',
            property: 'Type',
            width: 150,
            isDefault: true,
            mandatory: true,
            dataType: DatatableDataType.Select,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'Name',
            displayValue: 'Name',
            property: 'Name',
            width: 150,
            isDefault: true,
            sortable: true,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'Description',
            displayValue: 'Description',
            property: 'Description',
            width: 150,
            isDefault: true,
            editable: true,
            selectable: true
        },
        {
            translationKey: 'UnitPrice',
            displayValue: 'UnitPrice',
            property: 'UnitPrice',
            width: 150,
            isDefault: true,
            sortable: true,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Number,
            required: true
        },
        {
            translationKey: 'Quality',
            displayValue: 'Quality',
            property: 'Quality',
            width: 80,
            isDefault: true,
            sortable: false,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Number,
            required: true
        },
        {
            translationKey: 'Date',
            displayValue: 'Date',
            property: 'Date',
            width: 250,
            sortable: true,
            isDefault: true,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Date,
            required: true
        },
        {
            translationKey: 'Option',
            displayValue: 'Option',
            property: 'Option',
            width: 100,
            isDefault: true,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Checkbox,
            required: true
        },
        {
            translationKey: 'Editable',
            displayValue: 'Editable',
            property: 'Editable',
            width: 100,
            isDefault: true,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'Disabled',
            displayValue: 'Disabled',
            property: 'Disabled',
            width: 100,
            isDefault: true,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'actions',
            displayValue: 'Actions',
            property: 'actions',
            width: 90,
            pin: DatatableColumnPin.right,
            isDefault: true
        }
    ];

    isShowBorder = false;
    isEditable = false;
    isDisabledSelectionRow = false;

    constructor(private httpClient: HttpClient,
                cd: ChangeDetectorRef,
                injector: Injector) {
        super(cd, injector);
        this.sortChanged.asObservable().subscribe((currentSortState) => {
            let listSorted = _.sortBy(this.cachedList, currentSortState.prop);
            if (this.currentSortState.dir === 'desc') {
                listSorted = listSorted.reverse();
            }
            this.cachedList = listSorted;
        });
    }

    ngAfterViewInit() {


        for (let i = 0; i < 200; i++) {
            let description = 'Description ' + i;
            let type = {
                Id: 2,
                Name: `Extension`

            };
            if (i % 5 === 1) {
                description = 'Description ' + i + ` A map of external dependencies and their correspondent UMD module identifiers. Map keys are TypeScript / EcmaScript module identifiers. Map values are UMD module ids. The purpose of this map is to correctly bundle an UMD module file (with rollup). By default, rxjs, tslib and @angular dependency symbols are supported.`;
                type = {
                    Id: 1,
                    Name: `Text`
                };
            }

            // Type,Name,Description,UnitPrice,Quality,Date,Total
            this.cachedList.push({
                Id: _.uniqueId(`Id-`),
                Name: 'name ' + i,
                Type: type,
                Description: description,
                UnitPrice: i,
                Quality: i,
                Date: moment().add(i, `days`).toISOString(),
                Option: true,
                Editable: i % 2,
                Disabled: !(i % 2),
                RowDisabled: i % 7 === 0
            });
        }


        this.forceRefresh = !this.isEditable;
        // this.selectedRows = this.cachedList[1];
        this.onRefresh();
    }

    get isFullWidth() {
        return this.visibleColumns.length === 1;
    }

    getDefaultSort(): ISort {
        return this.defaultSort;
    }

    loadData(row: DatatableRow, startIndex: number, pageSize: number, options?: any) {
        let rows = this.cachedList.slice(startIndex, startIndex + pageSize);
        let result = {
            Count: this.cachedList.length,
            Index: -1,
            ListItems: rows
        };

        // Save original
        rows.forEach((item) => {
            let data = this.clone(item);
            let position = this.originalRows.findIndex((originalRow) => {
                return originalRow.Id === item.Id;
            });
            if (position === -1) {
                this.originalRows.push(data);
            } else {
                this.originalRows[position] = data;
            }
        });

        return new Observable((ob) => {
            ob.next(result);
            ob.complete();
        });
    }


    onRowDbClick(row: DatatableRow) {
        console.log('dbClick', row);
    }

    onCheckIds() {
        console.log('checked ids:', this.getCheckedItemIds());
        console.log('excluded ids:', this.getExcludeItemIds());
    }

    changeSelected() {
        this.selectedRows.Name = `test`;
        this.updateLayout();
    }

    onShowBorderButtonChange(change: MatSlideToggleChange) {
        this.isShowBorder = change.checked;
    }

    onEditableButtonChange(change: MatSlideToggleChange) {
        this.isEditable = change.checked;
        if (this.isEditable) {
            this.isDisabledSelectionRow = true;
            this.forceRefresh = false;
        } else {
            // Change to viewmode
            this.datatable.changeToViewMode();

            // Unselect cell
            this.datatable.unSelectCell();

            // Turn on select row, disable select cell
            this.isDisabledSelectionRow = false;

            this.forceRefresh = true;
        }
    }

    onGetTypeData(event: IDropdownGetDataEvent) {
        let list = [{
            Id: 1,
            Name: `Text`
        }, {
            Id: 2,
            Name: `Extension`
        }];
        list = list.filter((item) => {
            let searchText = event.searchText || '';
            let match = item.Name.toUpperCase().indexOf(searchText.toUpperCase());
            return match > -1;
        });
        let data: IDropdownCallbackData = {
            Count: list.length,
            ListItems: list,
            AppendRows: []
        };
        event.callBack.next(data);
        event.callBack.complete();
    }

    onGetTypeDisplayText(value) {
        if (value) {
            return typeof value === `object` ? value.Name : value;
        }
    }

    onAfterAdded(row: DatatableRow) {
        this.onLineAfterAdded(row, this.cachedList);
    }

    onAfterRemoved(row: DatatableRow) {
        this.onLineAfterRemoved(row, this.cachedList);
    }

    onSave() {
        if (!this.datatable.isDataValid()) { // The control is invalid, go to first cell
            let firstCell = this.datatable.getFirstCellInvalid();
            this.datatable.setSelectedCell(firstCell);
        } else { // Control is valid the control
            console.log('submit:', this.datatable.getChanges());
        }
    }

    isRef(cell: DatatableCell): boolean {
        let colIndex = this.datatable.columns.findIndex((c) => {
            return c.property === cell.col.property;
        });
        if (cell.row.Type && cell.row.Type.Name === 'Text' && colIndex === 2) {
            return true;
        }
        return false;
    }


    /**
     * Get reference of  merged cell
     * @param cell
     */
    getRef(cell: DatatableCell): DatatableCell {
        let colIndex = this.datatable.columns.findIndex((c) => {
            return c.property === cell.col.property;
        });
        if (cell.row.Type && cell.row.Type.Name === 'Text' && colIndex > 2 &&
            cell.col.property !== `actions`) {
            return {
                row: cell.row,
                col: this.datatable.columns[2]
            };
        }
        return cell;
    }

    isCellEditable(cell: DatatableCell): boolean {
        if (cell.col.property === `Editable`) {
            return cell.row.Editable;
        }
        return this.datatable.isCellEditableDefault(cell);
    }

    isCellDisabled(cell: DatatableCell): boolean {
        if (cell.col.property === `Disabled`) {
            return cell.row.Disabled;
        }
        return this.datatable.isCellDisabledDefault(cell);
    }

    isRowDisabled(row: DatatableRow): boolean {
        return row.RowDisabled;
    }
}
