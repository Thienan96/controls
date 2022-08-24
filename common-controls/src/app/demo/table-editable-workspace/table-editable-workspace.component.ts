import {AfterViewInit, ChangeDetectorRef, Component, Injector, ViewChild, ViewContainerRef} from '@angular/core';
import {TableEditableComponent} from '../../table-editable/table-editable/table-editable.component';
import {GridColumnDef, SortDef} from '../../shared/models/ngxTable.model';
import {HelperService} from '../../core/services/helper.service';
import {BaseQueryCondition, GridQueryCondition} from '../../shared/models/common.info';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {IDropdownCallbackData, IDropdownGetDataEvent} from '../../dropdown/shared/dropdown.model';
import {Observable} from 'rxjs';
import * as _ from 'underscore';
import {
    TableEditableCell,
    TableEditableControlType,
    TableEditableEditMode,
    TableEditableRow
} from '../../table-editable/shared/table-editable.model';
import {MatMenuTrigger} from '@angular/material';
import moment from 'moment-es6';
import {TemplatePortal} from '@angular/cdk/portal';

@Component({
    selector: 'ntk-table-editable-workspace',
    templateUrl: './table-editable-workspace.component.html',
    styleUrls: ['./table-editable-workspace.component.scss']
})
export class TableEditableWorkspaceComponent extends TableEditableComponent implements AfterViewInit {
    @ViewChild('dataTable', {static: false}) dataTable: DatatableComponent;
    storageKey = 'TableEditable';
    sorts: SortDef[] = [{dir: 'desc', prop: 'Type'}];
    private _allColumns: GridColumnDef[] = [
        {name: 'Type', translationKey: 'Type', property: 'Type', isDefault: true, initialWidth: 100, minWidth: 100, mandatory: true, required: true},
        {name: 'Name', translationKey: 'Name', property: 'Name', isDefault: true, initialWidth: 100, minWidth: 100, mandatory: true, required: true},
        {name: 'Job', translationKey: 'Job', property: 'Job', isDefault: true, initialWidth: 100, minWidth: 100, mandatory: true, required: true},
        {
            name: 'Resource',
            translationKey: 'Resource',
            property: 'Resource',
            isDefault: true,
            initialWidth: 100,
            minWidth: 100,
            mandatory: false,

        },
        {name: 'UnitPrice', translationKey: 'Unit Price', property: 'UnitPrice', isDefault: true, initialWidth: 200, mandatory: true, required: true},
        {name: 'Quality', translationKey: 'Quality', property: 'Quality', isDefault: true, initialWidth: 150, mandatory: true, required: true},
        {name: 'CostPrice', translationKey: 'Cost Price', property: 'CostPrice', isDefault: true, initialWidth: 150, mandatory: false},
        {name: 'Fee', translationKey: 'Fee', property: 'Fee', isDefault: true, initialWidth: 200, mandatory: false},
        {name: 'Discount', translationKey: 'Discount', property: 'Discount', isDefault: true, initialWidth: 200, mandatory: false},
        {name: 'SalePrice', translationKey: 'Sale price', property: 'SalePrice', isDefault: true, initialWidth: 200, mandatory: false},
        {name: 'VatRate', translationKey: 'VAT Rate', property: 'VatRate', isDefault: true, initialWidth: 200, mandatory: false},
        {
            name: 'SalePriceVAT',
            translationKey: 'Sale Price <div class="sub">VAT included</div>',
            property: 'SalePriceVAT',
            isDefault: true,
            initialWidth: 200,
            mandatory: false
        },
        {name: 'Option', translationKey: 'Option', property: 'Option', isDefault: true, initialWidth: 100, maxWidth: 200, mandatory: false},
        {name: 'Date', translationKey: 'Date', property: 'Date', isDefault: true, initialWidth: 110, maxWidth: 200, mandatory: true, required: true}
    ];
    cachedData;

    preventMenuClose = false;
    closeMenuTimer: number;
    prevButtonTrigger;
    queryCondition: GridQueryCondition;
    shownToggleHeight = false;

    constructor(injector: Injector,
                protected viewContainerRef: ViewContainerRef,
                protected changeDetectorRef: ChangeDetectorRef) {
        super(injector, viewContainerRef, changeDetectorRef, 'object');
        injector.get(HelperService).StorageService.setUserContextKey('UserLogin');
        injector.get(HelperService).StorageService.setCompanyContextKey('CompanyContextKey');

        this.queryCondition = new GridQueryCondition();
    }


    onCellBlur(rowIndex, colIndex) {
        console.log('onCellBlur with:', rowIndex, colIndex);
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();


        let Count = 100,
            Index = -1,
            ListItems: any[] = [],
            lipsumText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at luctus magna, et cursus nulla. Curabitur ut ex varius ligula blandit porttitor at nec erat. Proin consequat interdum tortor vel placerat. Suspendisse quam justo, bibendum et ultricies vel, consequat pulvinar enim. Sed lacus lacus, mattis sed lorem a, ornare placerat nulla. Interdum et malesuada fames ac ante ipsum primis in faucibus. Phasellus laoreet turpis sit amet neque dignissim gravida. Ut vestibulum lorem id purus varius finibus. Pellentesque et risus rutrum, posuere est ut, venenatis mi. Nullam sed quam et ipsum tincidunt vestibulum in at nunc. Phasellus aliquam sapien eu tortor ultricies, et hendrerit sapien sollicitudin. Nam porta quam et eros convallis sodales.';
        for (let i = 0; i < Count; i++) {
            let id = 'id-' + i,
                type = {
                    Id: 2,
                    Name: 'Extension'
                },
                name = 'Name - ' + i,
                job = 'Job ' + i + ' - ' + lipsumText,
                resource = 'Resource ' + i + ' - ' + lipsumText,
                unitPrice = Math.round((Math.random() * 1000) * 100) / 100,
                quanity = Math.round(Math.random() * 1000),
                costPrice = Math.round((Math.random() * 1000) * 100) / 100,
                fee = Math.round(Math.random() * 100),
                discount = Math.round(Math.random() * 100).toString() + '.00091%',
                salePrice = Math.round((Math.random() * 1000) * 100) / 100,
                vatRate = Math.round(Math.random() * 100),
                salePriceVAT = Math.round((Math.random() * 1000) * 100) / 100,
                option = true,
                date = moment().add(i, 'days').format('YYYY-MM-DD');
            if (!(i % 5) && i != 0) {
                type = {
                    Id: 1,
                    Name: 'Text'
                }
            }
            if (!(i % 2)) {
                option = false;
            }

            ListItems.push({
                Id: id,
                Type: type,
                Name: name,
                Job: job,
                Resource: resource,
                UnitPrice: unitPrice,
                Quality: quanity,
                CostPrice: costPrice,
                Fee: fee,
                Discount: discount,
                SalePrice: salePrice,
                VatRate: vatRate,
                SalePriceVAT: salePriceVAT,
                Option: option,
                Date: date
            });

        }

        this.cachedData = {
            Count: Count,
            Index: Index,
            ListItems: ListItems
        };

        setTimeout(() => {
            this.refreshGrid();
        }, 500);

    }

    getAllColumnsDef(): GridColumnDef[] {
        return this._allColumns;
    }

    getDefaultSort(): SortDef {
        return {prop: 'Id', dir: 'desc'};
    }

    getGidComponent(): DatatableComponent | undefined {
        return this.dataTable;
    }

    loadData(startIndex: number, pageSize: number, columns: string[], sort?: string): Observable<any> {
        let query: GridQueryCondition = new GridQueryCondition();
        Object.assign(query, this.queryCondition);

        query.StartIndex = startIndex;
        query.PageSize = pageSize;
        query.DataFields = columns;
        query.SortByDataFieldIndex = sort;


        let Count = this.cachedData.Count,
            Index = this.cachedData.Index,
            ListItems: any[] = this.cachedData.ListItems;
        ListItems = ListItems.slice(startIndex, startIndex + pageSize);


        ListItems = ListItems.map((item) => {
            let id = this.getId(item);
            if (id) {
                let result = this.rows.find((row) => {
                    return id === this.getId(row);
                });
                if (result) {
                    return result;
                }
            }
            return item;
        });
        return new Observable((ob) => {
            // Save original
            ListItems.forEach((row, index) => {
                let position = this.originalRows.findIndex((originalRow) => {
                    return this.getId(originalRow) === this.getId(row);
                });
                if (position === -1) {
                    this.originalRows.push(row);
                } else {
                    this.originalRows[position] = row;
                }
            });


            ob.next({
                Count: Count,
                Index: Index,
                ListItems: ListItems
            });
            ob.complete();

            setTimeout(() => {
                ListItems.forEach((row) => {
                    this.onRowUpdated(row);
                });

            }, 500);

        });

    }

    public refreshGrid(queryCondition?: BaseQueryCondition, itemIdToGetIndex?: string) {
        this.queryCondition.ItemIdToGetIndex = itemIdToGetIndex; // navigate to select item
        if (queryCondition) {
            this.queryCondition.SearchKeyword = queryCondition.SearchKeyword;
            this.queryCondition.ColumnFilters = queryCondition.ColumnFilters;
            this.queryCondition.ArchiveType = queryCondition.ArchiveType;
        }

        this.refresh();
    }


    onChange(row, col, changes) {
        this.setCell(row, col, changes.checked);
    }

    onCheckBoxClicked(row, col) {
        let value = this.getCell(row, col);
        this.setCell(row, col, !value);
    }


    protected onGetDropdownData(columnName, event: IDropdownGetDataEvent) {
        switch (columnName) {
            case 'Type':
                let list = [{
                    Id: 1,
                    Name: 'Text'
                }, {
                    Id: 2,
                    Name: 'Extension'
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
                break;
        }
    }

    getControlType(columnName: string): TableEditableControlType {
        switch (columnName) {
            case 'Type':
                return TableEditableControlType.Select;
            case 'Name':
            case 'Resource':
                return TableEditableControlType.Input;
            case 'Job':
                return TableEditableControlType.Textarea;
            case 'Discount':
                return TableEditableControlType.Percent;
            case 'Quality':
            case 'Fee':
            case 'VatRate':
                return TableEditableControlType.Number;
            case 'UnitPrice':
                return TableEditableControlType.DecimalNegative;
            case 'CostPrice':
            case 'SalePrice':
            case 'SalePriceVAT':
                return TableEditableControlType.Currency;
            case 'Date':
                return TableEditableControlType.Date;
            case 'Option':
                return TableEditableControlType.Checkbox;
        }
    }


    getRowClass(row): string {
        let classNames = [super.getRowClass(row)];
        if (this.getTypeName(row) === 'Text') {
            classNames.push('is-type-text');
        }
        return classNames.join(' ');
    }

    protected isRowDisabled(row: TableEditableRow): boolean {
        if (row) {
            let id = parseInt(this.getId(row).split('-')[1]);
            return (id % 7 === 0) && id !== 0;
        }
        return super.isRowDisabled(row);
    }


    protected isCellDisabled(rowIndex: number, colIndex: number): boolean {
        if (rowIndex === 2)
            return colIndex === 2 || colIndex === 12;
        return super.isCellDisabled(rowIndex, colIndex);
    }

    isRowEditable(row: TableEditableRow) {
        if (row) {
            let id = parseInt(this.getId(row).split('-')[1]);
            return !(id % 4 === 0 && id !== 0);
        }
        return super.isRowEditable(row);
    }

    isCellEditable(rowIndex: number, colIndex: number): boolean {
        if (rowIndex === 1) {
            return !(colIndex === 1 || colIndex === 12);
        }
        return super.isCellEditable(rowIndex, colIndex);
    }

    protected isCellMerged(rowIndex: number, colIndex: number): boolean {
        let row = this.rows[rowIndex];
        if (this.getTypeName(row) === 'Text' && colIndex >= 1) {
            return true;
        }
        return false;
    }

    protected getRefMerge(rowIndex: number, colIndex: number) {
        let row = this.rows[rowIndex];
        if (this.getTypeName(row) === 'Text' && colIndex >= 1) {
            return {
                rowIndex: rowIndex,
                colIndex: 1
            };
        }
        return {
            rowIndex: rowIndex,
            colIndex: colIndex
        };
    }

    hideMenu(trigger: MatMenuTrigger) {
        clearTimeout(this.closeMenuTimer);
        this.preventMenuClose = false;
        this.prevButtonTrigger = null;
        trigger.closeMenu();
    }

    protected canGotoCell(cell: TableEditableCell, prevCell: TableEditableCell) {
        let result = super.canGotoCell(cell, prevCell),
            rowIndex = cell.row,
            colIndex = cell.col,
            row = this.rows[rowIndex];
        if (this.getTypeName(row) === 'Text' && colIndex >= 2) {
            result = false;
        }
        return result;
    }

    protected canSearchDropDown(columnName: string) {
        return true;
    }

    onSave() {
        if (!this.isDataValid()) { // The control is invalid, go to first cell
            let firstCell = this.getFirstCellInvalid(),
                cell = this.getCellElement(firstCell.rowIndex, firstCell.colIndex, 'down');
            this.unSelectedCell();
            this.setSelected(firstCell.rowIndex, firstCell.colIndex, cell, TableEditableEditMode.QuickEdit);
        } else { // Control is valid the control
            console.log('submit:', this.getChanged());
        }
    }

    protected getCellInRow(rowEl: JQuery, colIndex: number) {
        return rowEl.find('datatable-body-cell:eq(' + (colIndex + 1) + ')');
    }


    private getTypeName(row: TableEditableRow) {
        if (row['Type']) {
            return row['Type'].Name;
        } else {
            return '';
        }
    }

    onBeforeCreateRow(pos: number, row) {
        this.cachedData.ListItems.splice(pos + 1, 0, row);
        this.cachedData.Count = this.cachedData.Count + 1;
    }

    onBeforeDeleteRow(row: TableEditableRow) {
        let index = this.cachedData.ListItems.findIndex((item) => {
            return this.getId(item) === this.getId(row);
        });
        if (index !== -1) {
            this.cachedData.ListItems.splice(index, 1);
            this.cachedData.Count = this.cachedData.Count - 1;
        }

    }

    onToggleHeight() {
        this.shownToggleHeight = !this.shownToggleHeight;
    }

    onRefresh() {
        this.refreshGrid();
    }

    onSelect(event) {
        console.log('onSelect', event);
    }

    getRowsRef() {
        return this.cachedData.ListItems;
    }
}
