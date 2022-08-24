import {
    AfterViewInit,
    ChangeDetectorRef,
    ElementRef,
    HostListener,
    Injector,
    OnDestroy,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {
    TabledEditableChanged,
    TableEditableCell,
    TableEditableCellMode,
    TableEditableControlType,
    TableEditableEditMode,
    TableEditableKeyboardNavigation,
    TableEditableRow
} from '../shared/table-editable.model';
import moment from 'moment-es6';
import {Subject} from 'rxjs';
import * as _ from 'underscore';
import {GridBaseController} from '../../core/controllers/grid-base-controller';
import {TableEditableService} from '../shared/table-editable.service';
import {TemplatePortal} from '@angular/cdk/portal';
import {BACKSPACE, DELETE, ENTER, SPACE} from '@angular/cdk/keycodes';
import {isNumber} from 'util';


export class TableEditableComponent extends GridBaseController implements AfterViewInit, OnDestroy {
    @ViewChild('selectTemplate', {static: true}) selectTemplate: TemplateRef<any>;
    @ViewChild('dateTemplate', {static: true}) dateTemplate: TemplateRef<any>;
    @ViewChild('inputTemplate', {static: true}) inputTemplate: TemplateRef<any>;
    @ViewChild('numberTemplate', {static: true}) numberTemplate: TemplateRef<any>;
    @ViewChild('decimalTemplate', {static: true}) decimalTemplate: TemplateRef<any>;
    @ViewChild('currencyTemplate', {static: true}) currencyTemplate: TemplateRef<any>;
    @ViewChild('textareaTemplate', {static: true}) textareaTemplate: TemplateRef<any>;
    @ViewChild('percentTemplate', {static: true}) percentTemplate: TemplateRef<any>;
    @ViewChild('percentNegativeTemplate', {static: true}) percentNegativeTemplate: TemplateRef<any>;
    @ViewChild('decimalNegativeTemplate', {static: true}) decimalNegativeTemplate: TemplateRef<any>;



    editMode: TableEditableEditMode = TableEditableEditMode.Standard; // Standard|QuickEdit;

    cellSelected: TableEditableCell = null;
    cellSelectedMode = TableEditableCellMode.View;
    $element: JQuery;
    rowSubject = new Subject();
    prevCellSelected: {
        cell: TableEditableCell,
        keyName: TableEditableKeyboardNavigation
    };
    tableEditableService: TableEditableService;
    sortSubject: any;
    selectedSubject: any;
    changed: TabledEditableChanged = new TabledEditableChanged();
    originalRows: any[] = [];
    scrollbarWidth = 0;

    render: Renderer2;
    templatePortal: TemplatePortal<any>;

    columnResizeTimer: any; // Timer of column when is resizing

    readonly = false;

    // Can have the case readonly = false but not allow create new row
    canCreateNewRow:boolean = true;


    rowsStateManager = [];

    constructor(protected injector: Injector,
                protected viewContainerRef: ViewContainerRef,
                protected changeDetectorRef: ChangeDetectorRef,
                dataRowStyle: 'array' | 'object' = 'array') {
        super(injector, dataRowStyle);
        this.render = injector.get(Renderer2, null);
        this.$element = $(injector.get(ElementRef).nativeElement);
        this.tableEditableService = injector.get(TableEditableService);

        this.allowReorderingColumns = false;
    }

    get scroller(): Element {
        return this.getGidComponent().element.querySelector('datatable-body');
    }

    @HostListener('window:keydown', ['$event']) onKeyDown(ev: KeyboardEvent) {
        if ($(ev.target).closest(this.$element).length > 0) {

            if (!this.cellSelected) {
                return;
            }

            let value = ev['key'],
                selectedCellValue = this.getSelectedCellValue(),
                cellSelectedMode = this.cellSelectedMode,
                columnName = this.getColumnName(this.cellSelected.col),
                controlType = this.getControlType(columnName);


            if (ev.key === 'Tab' || ev['keyCode'] === 9) { // Tab
                ev.preventDefault();
                ev.stopImmediatePropagation();
                if (ev.shiftKey) {
                    this.gotoPrev();
                } else {
                    this.gotoNext();
                }

                return;
            }

            if ((this.editMode === TableEditableEditMode.Standard && cellSelectedMode === TableEditableCellMode.View) || this.editMode === TableEditableEditMode.QuickEdit) {
                if (ev.key === 'ArrowLeft' || ev['keyCode'] === 37) { // Arrow left
                    this.goLeftCell();

                    ev.preventDefault();
                    return;
                }
                if (ev.key === 'ArrowUp' || ev['keyCode'] === 38) { // Arrow Up
                    this.goUpCell();

                    ev.preventDefault();
                    return;
                }
                if (ev.key === 'ArrowRight' || ev['keyCode'] === 39) { // Arrow Right
                    this.goRightCell();

                    ev.preventDefault();
                    return;
                }
                if (ev.key === 'ArrowDown' || ev['keyCode'] === 40) { // Arrow Down
                    this.goDownCell();

                    ev.preventDefault();
                    return;
                }
                if (this.isCellEditable(this.cellSelected.row, this.cellSelected.col) && ((ev.code === 'Backspace' || ev['keyCode'] === BACKSPACE) || (ev.key === 'Delete' || ev['keyCode'] === DELETE))) { // Arrow Down
                    this.changeToEditMode('');
                    this.setCell(this.cellSelected.row, this.cellSelected.col, '');

                    ev.preventDefault();
                    return;
                }
            }


            // Don't do anything if cell is checkbox
            if (controlType === TableEditableControlType.Checkbox) {
                // Toggle checkbox
                if (this.isCellEditable(this.cellSelected.row, this.cellSelected.col) && (ev.code === 'Space' || ev['keyCode'] === SPACE)) {
                    let checked = this.getCell(this.cellSelected.row, this.cellSelected.col);
                    this.setCell(this.cellSelected.row, this.cellSelected.col, !checked);
                }
                ev.preventDefault();
                return;
            }


            // Switch view to edit
            if (this.editMode === TableEditableEditMode.Standard && cellSelectedMode === TableEditableCellMode.View) {

                if (ev.key === 'Enter' || ev['keyCode'] === ENTER) {
                    if (this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {
                        this.changeToEditMode(selectedCellValue);
                    } else {
                        this.goDownCell();
                    }
                    ev.preventDefault();
                    return;
                }

                if (ev.code === 'Space' || ev['keyCode'] === SPACE) {
                    if (this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {
                        if (controlType === TableEditableControlType.Select || controlType === TableEditableControlType.Date) {
                            this.changeToEditMode(selectedCellValue);
                        } else {
                            this.changeToEditMode('');
                        }
                        ev.preventDefault();
                        return;
                    }
                    ev.preventDefault();
                }


                if ((controlType === TableEditableControlType.Number
                    || controlType === TableEditableControlType.Decimal
                    || controlType === TableEditableControlType.Currency
                    || controlType === TableEditableControlType.Percent
                )
                ) {
                    if (this.isNumber(ev) && this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {


                        this.changeToEditMode(parseInt(value, 10));

                        // Update Cell when typing
                        this.setCell(this.cellSelected.row, this.cellSelected.col, value);

                        ev.preventDefault();
                        return;
                    } else {
                        return;
                    }
                }

                if (controlType === TableEditableControlType.DecimalNegative || controlType === TableEditableControlType.PercentNegative) {
                    if ((value === "-" || this.isNumber(ev)) && this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {

                        let inputValue = value === "-" ? value :  parseInt(value, 10);
                        this.changeToEditMode(inputValue);
                        // Update Cell when typing
                        this.setCell(this.cellSelected.row, this.cellSelected.col, value);

                        ev.preventDefault();
                        return;
                    } else {
                        return;
                    }
                }


                if (controlType === TableEditableControlType.Select && this.canSearchDropDown(columnName) && this.isValidKey(ev) && this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {
                    ev.preventDefault();
                    this.changeToEditMode(value, {
                        searchText: value
                    });
                    return;
                }


                if (controlType === TableEditableControlType.Date
                        && this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {
                    ev.preventDefault();
                    let valueToEdit = selectedCellValue ? selectedCellValue : undefined;
                    this.changeToEditMode(valueToEdit, {
                        showDropDown: false,
                        autoFocus: true,
                        startingValue : selectedCellValue ? undefined : this.isNumber(ev) ? value : undefined,
                    });
                    return;
                }

                if (controlType === TableEditableControlType.Select) {
                    return;
                }

                if (this.isValidKey(ev) && this.isCellEditable(this.cellSelected.row, this.cellSelected.col)) {
                    ev.preventDefault();
                    this.changeToEditMode(value);

                    // Update Cell when typing
                    this.setCell(this.cellSelected.row, this.cellSelected.col, value);
                }

            }
        }
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();


        //  Override window resize
        Object.defineProperty(this.getGidComponent(), 'onWindowResize', {
            get: () => {
                return () => {
                };
            },
            set: () => {
            }
        });


        this.scrollbarWidth = this.getScrollbarWidth();

        // Set tabindex to allow control can focus to fix issue keyboard
        this.$element.attr('tabindex', 1);

    }

    ngOnDestroy() {
        if (this.selectedSubject) {
            this.selectedSubject.unsubscribe();
        }
        if (this.sortSubject) {
            this.sortSubject.unsubscribe();
        }
    }

    /**
     * The cell was clicked to select a cell and un-select prevCell
     * @param {null} rowIndex
     * @param {null} colIndex
     * @param {MouseEvent} ev
     */
    onCellClick(rowIndex: number, colIndex: number, ev: MouseEvent) {
        ev.stopImmediatePropagation();


        // Remove prevCellSelected
        this.prevCellSelected = null;


        this.setSelected(rowIndex, colIndex, $(<any> ev.currentTarget));

        if (this.editMode === TableEditableEditMode.QuickEdit && this.isCellEditable(rowIndex, colIndex)) {
            let value = this.getCell(rowIndex, colIndex);
            this.changeToEditMode(value);
        }
    }

    /**
     * DbClick on when to change to edit-mode
     * @param {number} rowIndex
     * @param {number} colIndex
     */
    onCellDblClick(rowIndex: number, colIndex: number) {
        if (this.editMode === TableEditableEditMode.Standard && this.isCellEditable(rowIndex, colIndex)) {
            let value = this.getCell(rowIndex, colIndex);
            this.changeToEditMode(value);
        }
    }

    onRowUpdated(row: TableEditableRow) {
        if (this.cellSelected) {
            let rowSelected = this.rows[this.cellSelected.row];
            if (this.getId(row) === this.getId(rowSelected)) {
                this.rowSubject.next({
                    value: row
                });
            }
        }
    }

    /**
     * Get class of cell
     * @param {number} rowIndex
     * @param {number} colIndex
     * @returns {any}
     */
    getCellClass(rowIndex: number, colIndex: number) {
        let clasess = [];
        if (this.isCellSelected(rowIndex, colIndex)) {
            clasess.push('selected');
        }
        if (!this.isCellValidate(rowIndex, colIndex)) {
            clasess.push('invalid');
        }

        if (this.isCellDisabled(rowIndex, colIndex)) {
            clasess.push('disabled');
        }

        if (!this.isCellEditable(rowIndex, colIndex)) {
            clasess.push('non-editable');
        }

        clasess.push('col-' + this.columns[colIndex].property);


        return clasess.join(' ');
    }

    /**
     * Create a new row after rowIndex when click on content menu
     * @param {number} rowIndex
     */
    onRowCreated(rowIndex: number, forceFocus: boolean = true) {
        // Un-Select cell
        this.unSelectedCell();

        this.createANewRow(rowIndex);

        // calc header
        this.calcColumnsWidth();

        if (forceFocus) {
            setTimeout(() => {
                // Select first cell of next row
                this.setSelected(rowIndex + 1, 0, null, TableEditableEditMode.QuickEdit);
            }, 100);
        }

    }

    /**
     * Delete a row when click on content menu
     * @param row
     */
    onRowDeleted(row: TableEditableRow) {
        this.unSelectedCell();
        this.deleteRow(row);

        // Fire select
        this.getGidComponent().onBodySelect({
            selected: []
        });

        // calc header
        this.calcColumnsWidth();
    }

    /**
     * Copy a row when click on content menu
     * @param {number} rowIndex
     * @param row
     */
    onRowCopy(rowIndex: number, row: TableEditableRow) {
        // Un-Select cell
        this.unSelectedCell();

        // Copy row
        this.copyRow(rowIndex, row);


        // calc header
        this.calcColumnsWidth();


        setTimeout(() => {
            // Select first cell
            this.setSelected(rowIndex + 1, 0, null, TableEditableEditMode.QuickEdit);
        }, 100);
    }

    findState(rowIndex: number, colIndex: number) {
        let row = this.rows[rowIndex],
            id = this.getId(row),
            rowState = _.find(this.rowsStateManager, {Id: id});
        return rowState ? rowState[this.getProperty(colIndex)] : null;
    }

    /**
     * Check cell is valid
     * @param {number} rowIndex
     * @param {number} colIndex
     * @returns {boolean}
     */
    isCellValidate(rowIndex: number, colIndex: number) {
        let validate = true,
            value = this.getCell(rowIndex, colIndex),
            row = this.rows[rowIndex];


        // Do not validate in the not editabel cell
        if (!this.isCellEditable(rowIndex, colIndex)) return true;

        let isInValid = this.isRowLoaded(rowIndex) && this.isEmpty(value) && this.columns[colIndex].required;

        if (!isInValid && this.isRowLoaded(rowIndex) && !this.isEmpty(value) && this.columns[colIndex].negativeCheck) {
            if (isNumber(value) && value < 0) isInValid = true;
            let numberValue = this.transformNumber(value);
            if (numberValue !== null && numberValue < 0) isInValid = true;
        }

        if (this.isNewRow(row)) {
            let state = this.findState(rowIndex, colIndex);
            if (state && state.touched && isInValid) {
                validate = false;
            }
        } else {
            // Required
            if (isInValid) {
                validate = false;
            }
        }
        return validate;
    }

    preventDefault(ev: MouseEvent) {
        ev.stopImmediatePropagation();
    }

    onCheckboxEnter() {
        this.goDownCell();
    }

    onCheckboxValueChanged(rowIndex: number, colIndex: number, data) {
        this.setCell(rowIndex, colIndex, data);
    }

    onSelectedCellDestroy(data) {
        // Focus to control if selected-cell is removed to fix keyboard
        if (!data.blured) {
            this.$element[0].focus();
        }
    }

    onSelectedCellLoad(data) {
        // Re-Select cell-selected
        this.cellSelected.container = $(data.element).closest('.cell-editable');
    }

    /**
     * Check control validation
     * @returns {boolean}
     */
    isDataValid() {
        // Touch control if row is new
        this.rowsStateManager.forEach((row) => {
            this.columns.forEach((c) => {
                let name = c.property;
                let status = row[name];
                if (status) {
                    status.touched = true;
                }
            });
        });

        return this.getFirstCellInvalid() === null;
    }

    getRowClass(row: TableEditableRow): string {
        let classNames = [super.getRowClass(row)];
        classNames.push('datatable-body-row-id-' + this.getId(row));

        // Row is disabled
        if (this.isRowDisabled(row)) {
            classNames.push('datatable-row-disabled');
        }

        if (!this.isRowEditable(row)) {
            classNames.push('datatable-row-none-editable');
        }

        return classNames.join(' ');
    }

    /**
     * Unselect a cell
     */
    public unSelectedCell() {
        let cell = this.cellSelected;
        if (!cell) {
            return;
        }

        if (cell.container) {
            this.getCellControl(cell.container).triggerHandler('blurCell');
        }


        // Unselect cell
        this.cellSelected = null;

        // Unselect arrow
        this.selectedRows.splice(0, this.selectedRows.length);
    }

    public getRowsRef() {
        return [];
    }

    /**
     * Change order of a row
     * @param {string} fromId
     * @param {string} toId
     * @param {boolean} isEnded
     * @returns {boolean}
     */
    public moveRow(fromId: string, toId: string, isEnded: boolean) {
        let fromPosition = this.rows.findIndex((r) => {
                return fromId === this.getId(r);
            }),
            fromRow = this.rows[fromPosition],
            toPosition = this.rows.findIndex((r) => {
                return toId === this.getId(r);
            }),
            gidComponent = this.getGidComponent(),
            bodyComponent = gidComponent.bodyComponent,
            rows = this.getRowsRef(),
            fromRef = rows[fromPosition];

        // Don't move if item don't update position
        if (fromPosition === toPosition || (fromPosition + 1 === toPosition && !isEnded)) {
            return false;
        }

        if (fromPosition < toPosition) { // up-down
            if (isEnded) {
                this.rows.splice(toPosition + 1, 0, fromRow);
                bodyComponent.rows.splice(toPosition + 1, 0, fromRow);
                rows.splice(toPosition + 1, 0, fromRef);
            } else {
                this.rows.splice(toPosition, 0, fromRow);
                bodyComponent.rows.splice(toPosition, 0, fromRow);
                rows.splice(toPosition, 0, fromRef);
            }


            let removeIndex = this.rows.findIndex((r) => {
                return this.getId(fromRow) === this.getId(r);
            });

            this.rows.splice(removeIndex, 1);
            bodyComponent.rows.splice(removeIndex, 1);
            rows.splice(removeIndex, 1);
        } else { // down-up
            let removeIndex = this.rows.findIndex((r) => {
                return this.getId(fromRow) === this.getId(r);
            });
            this.rows.splice(removeIndex, 1);
            bodyComponent.rows.splice(removeIndex, 1);
            rows.splice(removeIndex, 1);

            this.rows.splice(toPosition, 0, fromRow);
            bodyComponent.rows.splice(toPosition, 0, fromRow);
            rows.splice(toPosition, 0, fromRef);
        }
        this.onMoveRow(fromId, toId, isEnded);
        this.changeDetectorRef.detectChanges();
    }

    selectRowById(id: string) {
        let row = this.rows.find((item) => {
            return this.getId(item) === id;
        });
        if (row) {
            this.selectedRows.splice(0, this.selectedRows.length);
            this.selectedRows.push(row);

            // Fire select
            this.getGidComponent().onBodySelect({
                selected: [row]
            });
        }
    }

    /**
     * Select a row
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {JQuery} container
     * @param {TableEditableEditMode} mode
     * @returns {TableEditableCell}
     */
    public setSelected(rowIndex: number, colIndex: number, container?: JQuery, mode?: TableEditableEditMode) {
        if (mode === undefined || mode === null) {
            mode = this.editMode;
        }
        if (container === undefined || container === null) {
            container = this.getCellElement(rowIndex, colIndex, 'up');
        }

        // Don't do any thing if re-select cell
        if (this.cellSelected && rowIndex === this.cellSelected.row && colIndex === this.cellSelected.col) {
            return this.cellSelected;
        } else {

            // Remove selected element
            if (this.cellSelected) {
                this.unSelectedCell();
            }

            let columnName = this.getColumnName(colIndex);

            // Set selected
            this.cellSelected = {
                row: rowIndex,
                col: colIndex,
                container: container,
                columnName: columnName
            };

            // Set selected row
            this.selectedRows.splice(0, this.selectedRows.length);
            this.selectedRows.push(this.rows[rowIndex]);

            // Fire select
            this.getGidComponent().onBodySelect({
                selected: [this.rows[rowIndex]]
            });


            // Focus cell
            container[0].focus({
                preventScroll: true
            });


            // Focus checkbox if cell is selected
            if (this.getControlType(columnName) === TableEditableControlType.Checkbox) {
                container.find('input')[0].focus();
            }


            this.scrollToCell(rowIndex, colIndex, container);


        }


        if (mode === TableEditableEditMode.Standard) {
            this.changeToViewMode();
        }
        if (mode === TableEditableEditMode.QuickEdit) {
            let value = this.getCell(rowIndex, colIndex);
            this.changeToEditMode(value, {
                showDropDown: false
            });
        }


    }

    public safeApply() {
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Get value of cell
     * @param {number} rowIndex
     * @param {number} colIndex
     * @returns {any}
     */
    getCell(rowIndex: number, colIndex: number): any {
        let row = this.rows[rowIndex];
        return this.getCellValue(row, colIndex);
    }

    getHeaderClass(data: any) {
        return ' not-selectable col-' + data.column.prop;
    }

    hasHorizontal() {
        return this.tableEditableService.hasHorizontal(this.getDataTableElement());
    }

    hasVertical() {
        return this.tableEditableService.hasVertical(this.getDataTableElement());
    }

    isHorizontal(){
        return this.tableEditableService.isHorizontal(this.getDataTableElement());
    }

    onMoveRow(fromId: string, toId: string, isEnded: boolean) {
        console.log(fromId, toId, isEnded);
    }

    getRowCount() {
        return this.getGidComponent().rowCount;
    }

    getDataTableElement(): JQuery {
        return this.$element.find('ngx-datatable');
    }

    /**
     * Call When column was resized
     * @param {{column: any; newValue: any}} event
     */
    onColumnResize(event: { column: any, newValue: any }) {
        super.onColumnResize(event);

        // re-recalculate if change last column
        let pos = this.columns.findIndex((column) => {
            return column.property === event.column.prop;
        });
        if (pos === this.columns.length - 1) {
            this.getGidComponent().recalculate();
        }


        // Trigger resize, delay 200 to wait content is ready
        clearTimeout(this.columnResizeTimer);
        this.columnResizeTimer = setTimeout(() => {
            this.fixRightColumn();
        }, 200);
    }

    onResize() {
        if (this.getGidComponent()) {

            // re-calculate the grid
            this.getGidComponent().recalculate();


            // Re-Calc column to fix
            this.calcColumnsWidth();


            setTimeout(() => {
                this.fixRightColumn();
            }, 100);
        }
    }

    fixRightColumn() {
        this.tableEditableService.fixRightColumn(this);
    }

    /**
     * Get id of row
     * @param row
     * @returns {any}
     */
    protected getId(row: TableEditableRow): any {
        return row[this.getIdProperty()];
    }

    /**
     * Set Id of row
     * @param row
     * @param id
     */
    protected setId(row: TableEditableRow, id) {
        row[this.getIdProperty()] = id;
    }

    protected canGotoCell(cell: TableEditableCell, prevCell: TableEditableCell): boolean {
        return true;
    }

    /**
     * Get dropdown from columnName
     * @param columnName
     * @param data
     */
    protected onGetDropdownData(columnName, data) {
        throw new Error('not yet implemented onGetDropdownData function');
    }

    onGetDropdownDisplayText(columnName: string, value) {
        if (_.isObject(value)) {
            return value.Name;
        } else {
            return value;
        }
    }


    // To format the model value after the user input
    onCellBlur(rowIndex, colIndex) {

    }


    /**
     * Get type of control
     * @param {string} columnName
     * @returns {TableEditableControlType}
     */
    getControlType(columnName: string): TableEditableControlType {
        throw new Error('not yet implemented getControlType function');
    }

    /**
     * Set value for cell
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {string | number | boolean | null} value
     */
    protected setCell(rowIndex: number, colIndex: number, value: string | number | null | boolean) {
        let row = this.rows[rowIndex];
        this.setCellValue(row, colIndex, value);
    }

    protected setCellValue(row: TableEditableRow, colIndex: number, value) {
        let property: string = this.getProperty(colIndex);
        row[property] = value;
        this.markCellModified(row);
    }

    protected getCellValue(row: TableEditableRow, colIndex: number): any {
        let property = this.getProperty(colIndex);
        return row[property];
    }

    /**
     * Cell mark modified
     * @param {TableEditableRow} row
     */
    protected markCellModified(row: TableEditableRow) {
        if (!this.isNewRow(row)) { // Row is not new
            let pos: number = this.changed.edited.findIndex((r) => {
                return this.getId(r) === this.getId(row);
            });
            if (pos === -1) { // row is not in edited
                if (this.isRowModified(row)) {
                    this.changed.edited.push(row);
                }
            } else {
                if (!this.isRowModified(row)) {
                    this.changed.edited.splice(pos, 1);
                }
            }
        }
    }

    makeNewRow(): any {
        let row;
        if (this.dataRowStyle === 'array') {
            row = [null];
            this.columns.forEach(() => {
                row.push(null);
            });
        } else {
            row = {};
            this.columns.forEach((column) => {
                row[column.property] = null;
            });
            let id = _.uniqueId('row-');
            this.setId(row, id);
        }
        return row;
    }

    protected onAfterRowAutomaticallyCreated() {

    }

    /**
     * Create a new empty row at position
     * @param {number} pos
     */
    protected createANewRow(pos: number) {
        let row = this.makeNewRow();
        this.insertAfterRow(pos, row);

    }

    /**
     * Delete a row
     */
    protected deleteRow(row: TableEditableRow) {
        this.onBeforeDeleteRow(row);

        // Row row by position
        let gidComponent = this.getGidComponent(),
            bodyComponent = gidComponent.bodyComponent;

        // Find position
        let pos = this.rows.findIndex((r) => {
            return this.getId(r) === this.getId(row);
        });

        // Delete row out rows
        this.rows.splice(pos, 1);
        bodyComponent.rows.splice(pos, 1);

        // Decrease count
        gidComponent.count = gidComponent.count - 1;


        // Update page
        this.page.totalElements = gidComponent.count;
        this.page.totalPages = this.page.totalElements / this.page.size;

        // Remove item out deleted list  if row in server
        if (!this.isNewItem(row)) {
            this.changed.deleted.push(row);
        }

        // Remove item out addedd list
        let addPosition = this.changed.added.findIndex((item) => {
            return this.getId(item) === this.getId(row);
        });
        if (addPosition !== -1) {
            this.changed.added.splice(addPosition, 1);
        }


        // Remove item out edited list
        let editPosition = this.changed.edited.findIndex((item) => {
            return this.getId(item) === this.getId(row);
        });
        if (editPosition !== -1) {
            this.changed.edited.splice(editPosition, 1);
        }


        // Remove row out loadedRows
        this.loadedRows.splice(pos, 1);

        // Apply change
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Copy row
     * @param {number} rowIndex
     * @param row
     */
    protected copyRow(rowIndex: number, row: TableEditableRow) {
        let cloned = this.clone(row),
            id = _.uniqueId('row-');
        this.setId(cloned, id);
        this.insertAfterRow(rowIndex, cloned);
    }

    /**
     * Insert a new row after position
     * @param {number} pos
     * @param row
     */
    protected insertAfterRow(pos: number, row: TableEditableRow) {
        this.onBeforeCreateRow(pos, row);

        let gidComponent = this.getGidComponent(),
            bodyComponent = gidComponent.bodyComponent;

        // Push row into rows
        this.rows.splice(pos + 1, 0, row);
        bodyComponent.rows.splice(pos + 1, 0, row);

        // Increase count
        gidComponent.count = gidComponent.count + 1;


        // Update page
        this.page.totalElements = gidComponent.count;
        this.page.totalPages = this.page.totalElements / this.page.size;


        // Mark row loaded
        this.loadedRows.splice(pos + 1, 0, true);


        // Push to added list
        this.changed.added.push(row);


        // Init state of row
        let rowStates = {
            Id: this.getId(row)
        };
        this.columns.forEach((c) => {
            rowStates[c.property] = {
                touched: false
            };
        });
        this.rowsStateManager.push(rowStates);

        this.changeDetectorRef.detectChanges();


    }

    /**
     * Detect row disabled
     * @param {number} row
     * @returns {boolean}
     */
    protected isRowDisabled(row: TableEditableRow): boolean {
        return false;
    }

    protected isRowEditable(row: TableEditableRow): boolean {
        return !this.readonly && !this.isRowDisabled(row);
    }

    /**
     * Detect cell disabled
     * @param {number} rowIndex
     * @param {number} colIndex
     * @returns {boolean}
     */
    protected isCellDisabled(rowIndex: number, colIndex: number): boolean {
        let row = this.rows[rowIndex];
        return this.isRowDisabled(row);
    }

    isCellEditable(rowIndex: number, colIndex: number): boolean {
        let row = this.rows[rowIndex];
        return this.isRowEditable(row) && !this.isCellDisabled(rowIndex, colIndex);
    }

    /**
     * Is Cell merged
     * @param {number} rowIndex
     * @param {number} colIndex
     * @returns {boolean}
     */
    protected isCellMerged(rowIndex: number, colIndex: number): boolean {
        return false;
    }

    /**
     * Get reference of  merged cell
     * @param {number} rowIndex
     * @param {number} colIndex
     */
    protected getRefMerge(rowIndex: number, colIndex: number) {
        return {
            rowIndex: rowIndex,
            colIndex: colIndex
        };
    }

    /**
     * Get column name by colIndex
     * @param {number} colIndex
     * @returns {any}
     */
    getColumnName(colIndex: number) {
        return this.columns[colIndex].property;
    }

    /**
     * Check dropdown can search
     * @param {string} columnName
     * @returns {boolean}
     */
    protected canSearchDropDown(columnName: string) {
        return false;
    }

    /**
     * Get the changes from grid
     * @returns {TabledEditableChanged}
     */
    protected getChanged(): TabledEditableChanged {
        let edited: any[] = this.changed.edited.filter((rowEdit) => {
            return this.changed.deleted.findIndex((rowDelete) => {
                return this.getId(rowEdit) === this.getId(rowDelete);
            }) === -1;
        });
        return {
            added: this.changed.added,
            edited: edited,
            deleted: this.changed.deleted
        };
    }

    /**
     * Get element of cell
     *      'down': Go to top of selected
     *      'up': Go to bottom of selected
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {string} position
     * @returns {JQuery}
     */
    protected getCellElement(rowIndex: number, colIndex: number, position: string): JQuery {
        let row = this.rows[rowIndex];

        // Scroll to element and render element if element don't exist in dom so that make sure element in viewport

        // Find element in dom
        let el = this.$element.find('.datatable-body-row-id-' + this.getId(row));
        if (el.length === 0) {
            // Scroll to element
            this.gotoRow(rowIndex, position);
            el = this.$element.find('.datatable-body-row-id-' + this.getId(row));
        } else {
            let cell = this.getCellInRow(el, colIndex);
            if (!this.isRowInViewPort(cell)) {
                this.scrollToRow(rowIndex, position);
            }
        }
        return this.getCellInRow(el, colIndex).find('.cell-editable');
    }

    protected getCellInRow(rowEl: JQuery, colIndex: number): JQuery {
        return $(rowEl).find('datatable-body-cell:eq(' + colIndex + ')');
    }

    /**
     * Set focus a cell
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {JQuery} container
     */
    protected scrollToCell(rowIndex: number, colIndex: number, container: JQuery) {
        if (!this.isCellContainViewPort(container)) {
            let left = null,
                top = null,
                scroller = $(this.scroller),
                cell = container.closest('datatable-body-cell'),
                scrollerContent = container.closest('datatable-scroller');

            let direction = {
                left: this.isCellInLeftViewPort(container),
                right: this.isCellInRightViewPort(container),
                top: this.isCellInTopViewPort(container),
                bottom: this.isCellInBottomViewPort(container)
            };


            if (!direction.left) {
                let leftWidth = container.closest('datatable-row-wrapper').find('.datatable-row-left').width();
                left = this.scroller.scrollLeft - (scroller.offset().left - cell.offset().left) - leftWidth;
            }
            if (!direction.right) {
                let rightWidth = container.closest('datatable-row-wrapper').find('.datatable-row-right').width(),
                    scrollerWidth = scroller.width() - this.getVerticalScrollBarSize() - rightWidth;
                if (cell.width() < scrollerWidth) {
                    left = (cell.offset().left - scrollerContent.offset().left) + cell.width() - scrollerWidth;
                }
            }
            if (!direction.top) {
                top = this.scroller.scrollTop - (scroller.offset().top - cell.offset().top);
            }
            if (!direction.bottom) {
                let scrollerHeight = scroller.height() - this.getHorizontalScrollBarSize();
                top = (cell.offset().top - scrollerContent.offset().top) + cell.height() - scrollerHeight;
            }


            if (left !== null) {
                this.scroller.scrollLeft = left;
            }
            if (top !== null) {
                this.scroller.scrollTop = top;
            }
        }
    }

    /**
     * Get first cell which is invalid
     * @returns {any}
     */
    protected getFirstCellInvalid() {
        for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
            for (let colIndex = 0; colIndex < this.columns.length; colIndex++) {
                let isCellMerged = this.isCellMerged(rowIndex, colIndex),
                    ref = this.getRefMerge(rowIndex, colIndex);
                if (isCellMerged) {
                    if (ref.rowIndex === rowIndex && ref.colIndex === colIndex) { // cell is merge and is ref
                        if (!this.isCellValidate(rowIndex, colIndex)) {
                            return {
                                rowIndex: rowIndex,
                                colIndex: colIndex
                            };
                        }
                    }
                } else {
                    if (!this.isCellValidate(rowIndex, colIndex)) {
                        return {
                            rowIndex: rowIndex,
                            colIndex: colIndex
                        };
                    }
                }
            }
        }
        return null;
    }

    protected onBeforeCreateRow(pos: number, row: TableEditableRow) {
    }

    protected onBeforeDeleteRow(row: TableEditableRow) {
    }

    private setTemplate(columnName: string, value: any, rowIndex: number, colIndex: number, options) {
        let prevValue = options.prevValue;
        if (options.value) {
            value = options.value;
        }
        if (!options.prevValue) {
            prevValue = this.getCell(rowIndex, colIndex);
        }

        let unSubscribe;
        let templatePortalContent,
            scope = {
                value: value,
                isDestroy: false,
                required: this.columns[colIndex].required,
                autoFocus: options.autoFocus,
                showDropDown: options.showDropDown,
                canSearchDropDown: options.canSearchDropDown,
                searchText: options.searchText,
                prevValue: prevValue,
                onLoad: () => {
                    unSubscribe = this.rowSubject.asObservable().subscribe((data: any) => {
                        scope.value = this.getCellValue(data.value, colIndex);
                    });
                },
                onValueChanged: (data: any) => {
                    let newData = this.getCellValueByColumnName(columnName, data);
                    this.setCell(rowIndex, colIndex, newData);
                },
                onGetDropdownData: (data) => {
                    return this.onGetDropdownData(columnName, data);
                },
                getDisplayText: (data) => {
                    return this.onGetDropdownDisplayText(columnName, data);
                },
                onDestroy: (data) => {
                    // Update scope to fix bug re-enter cell
                    scope.value = data.value;

                    // Unregister
                    unSubscribe.unsubscribe();

                    // Hide dropdown when re-enter cell which is removed if is outside
                    scope.showDropDown = false;
                },
                onEnter: () => {
                    this.goDownCell();
                },
                onEscape: () => {
                    this.changeToViewMode();
                },
                preventDefault: (ev) => {
                    ev.stopImmediatePropagation();
                },
                onBlur: () => {
                    // Set touched when touch on new-row
                    if (this.isNewRow(this.rows[rowIndex])) {
                        let state = this.findState(rowIndex, colIndex);
                        if (state) {
                            state.touched = true;
                        }
                    }

                    this.onCellBlur(rowIndex, colIndex);
                }
            };
        Object.assign(scope, options);

        let controlType = this.getControlType(columnName);

        // Input control
        if (controlType === TableEditableControlType.Input ||
            controlType === TableEditableControlType.Number ||
            controlType === TableEditableControlType.Currency ||
            controlType === TableEditableControlType.Decimal ||
            controlType === TableEditableControlType.Percent ||
            controlType === TableEditableControlType.DecimalNegative ||
            controlType === TableEditableControlType.PercentNegative ||
            controlType === TableEditableControlType.Textarea) {
            templatePortalContent = this.getTemplateTextControl(columnName);
        }

        // Date control
        if (controlType === TableEditableControlType.Date) {
            templatePortalContent = this.dateTemplate;
        }

        // Select control
        if (controlType === TableEditableControlType.Select) {
            templatePortalContent = this.getTemplateSelectControl(columnName);
        }


        // Create portal
        if (templatePortalContent) {
            this.templatePortal = new TemplatePortal(templatePortalContent, this.viewContainerRef, {
                $implicit: scope
            });
        } else {
            if (this.templatePortal) {
                this.templatePortal.detach();
            }
            this.templatePortal = null;
        }

        this.cellSelectedMode = TableEditableCellMode.Edit;
        this.clearSelection();
    }

    private isEmpty(value) {
        let empty = value === null || value === undefined || value === '';
        if (!empty && value) {
            empty = (value + '').trim() === '';
        }
        return empty;
    }

    private isCellSelected(rowIndex: number, colIndex: number) {
        let cellSelected = this.cellSelected;
        return cellSelected && cellSelected.row === rowIndex && cellSelected.col === colIndex;
    }

    /**
     * Get Value of cell by Column-Name
     * @param {string} columnName
     * @param value
     * @returns {any}
     */
    protected getCellValueByColumnName(columnName: string, value): any {
        let controlType = this.getControlType(columnName);
        switch (controlType) {
            case TableEditableControlType.Select:
                return value;
            case TableEditableControlType.Number:
            case TableEditableControlType.Decimal:
            case TableEditableControlType.Currency:
            case TableEditableControlType.DecimalNegative:
                return this.transformNumber(value);
            case TableEditableControlType.Date:
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
    private transformNumber(value): number | null {
        if(value === null) {
            value = ``;
        }
        value = ('' + value).replace(',', '.');
        value = value.trim();
        if (value === '') {
            return null;
        } else {
            let newValue = parseFloat(value).toFixed(2);
            return parseFloat(newValue);
        }
    }

    getTemplateInputControl(columnName: string) {
         return this.inputTemplate;
    }

    /**
     * Get template for text-control
     * @param {string} columnName
     * @returns {TemplateRef<any>}
     */
    private getTemplateTextControl(columnName: string) {
        let controlType = this.getControlType(columnName);
        if (controlType === TableEditableControlType.Number) {
            return this.numberTemplate;
        }
        if (controlType === TableEditableControlType.Currency) {
            return this.currencyTemplate;
        }
        if (controlType === TableEditableControlType.Decimal) {
            return this.decimalTemplate;
        }
        if (controlType === TableEditableControlType.Percent) {
            return this.percentTemplate;
        }
        if (controlType === TableEditableControlType.PercentNegative) {
            return this.percentNegativeTemplate;
        }
        if (controlType === TableEditableControlType.DecimalNegative) {
            return this.decimalNegativeTemplate;
        }
        if (controlType === TableEditableControlType.Input) {

            return this.getTemplateInputControl(columnName);
        }
        if (controlType === TableEditableControlType.Textarea) {
            return this.textareaTemplate;
        }
    }

    getTemplateSelectControl(columnName: string) {
        return this.selectTemplate;
    }

    /**
     * Go to next cell by press tab on keyboard
     * - Always go to next cell if next-cell isn't last-cell on a row
     * - If next-cell is last-cell , next-cell is first cell of next row
     * - If next-row is last-row, create a new a row and next-cell is first cell of this row
     */
    private gotoNext() {
        if (this.cellSelected) {
            let cell = this.getNextCell(this.cellSelected);
            if (cell) {
                cell.container = this.getCellElement(cell.row, cell.col, 'up');

                if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                    this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyRight);
                }

                this.setSelected(cell.row, cell.col, cell.container);

            }
        }
    }

    /**
     * Get next-cell by tab
     * @param {TableEditableCell} cell
     * @returns {TableEditableCell}
     */
    private getNextCell(cell: TableEditableCell): TableEditableCell {
        let cellSelected = this.getRightCell(cell, TableEditableKeyboardNavigation.KeyRight);
        if (cellSelected) {
            return cellSelected;
        } else {
            let firstCell = new TableEditableCell({
                row: cell.row,
                col: 0,
                container: cell.container.closest('datatable-row-wrapper').find('datatable-body-cell').find('.cell-editable')
            });
            cellSelected = this.getDownCell(firstCell, TableEditableKeyboardNavigation.KeyDown);
            if (!cellSelected && !this.readonly && this.canCreateNewRow) {
                this.createANewRow(this.rows.length);

                this.onAfterRowAutomaticallyCreated();

                return new TableEditableCell({
                    row: this.getGidComponent().rowCount - 1,
                    col: 0,
                    container: cell.container.closest('datatable-row-wrapper').next().find('datatable-body-cell:eq(1)').find('.cell-editable')
                });
            }
        }
        return cellSelected;
    }

    /**
     * Go to prev cell by press shift + tab on keyboard
     * - Always go to prev cell if prev-cell isn't first-cell on a row
     * - If prev-cell is first-cell , prev-cell is last cell of prev row
     */
    private gotoPrev() {
        if (this.cellSelected) {
            let cell = this.getPrevCell(this.cellSelected);
            if (cell) {
                cell.container = this.getCellElement(cell.row, cell.col, 'down');

                if (cell.row === this.cellSelected.row) {
                    if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                        this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyLeft);
                    }
                } else {
                    this.prevCellSelected = null;
                }


                this.setSelected(cell.row, cell.col, cell.container);

            }
        }
    }

    /**
     * Get prev-cell by shift + tab
     * @param {TableEditableCell} cell
     * @returns {TableEditableCell}
     */
    private getPrevCell(cell: TableEditableCell): TableEditableCell {
        let cellSelected = this.getLeftCell(cell, TableEditableKeyboardNavigation.KeyLeft);
        if (cellSelected) {
            return cellSelected;
        } else {
            let lastCell = this.getLastCellOfRow(cell.row - 1);
            cellSelected = new TableEditableCell({
                row: lastCell.rowIndex,
                col: lastCell.colIndex
            });

        }
        return cellSelected;
    }

    private getLastCellOfRow(rowIndex: number) {
        for (let columnIndex = this.columns.length - 1; columnIndex >= 0; columnIndex--) {
            if (this.isCellMerged(rowIndex, columnIndex)) {
                return this.getRefMerge(rowIndex, columnIndex);
            } else {
                return {
                    rowIndex: rowIndex,
                    colIndex: columnIndex
                };
            }
        }
    }

    /**
     * Go to up cell
     */
    private goUpCell() {
        if (this.cellSelected) {
            let upCell = this.getUpCell(this.cellSelected, TableEditableKeyboardNavigation.KeyUp);
            if (upCell) {
                upCell.container = this.getCellElement(upCell.row, upCell.col, 'down');

                if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                    this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyUp);
                }

                this.setSelected(upCell.row, upCell.col, upCell.container);
            }
        }
    }

    /**
     * Get up-cell
     * @param {TableEditableCell} cell
     * @param {TableEditableKeyboardNavigation} keyName
     * @returns {TableEditableCell | null}
     */
    private getUpCell(cell: TableEditableCell, keyName: TableEditableKeyboardNavigation): TableEditableCell | null {
        let columns: number[] = [];
        for (let i = cell.row - 1; i >= 0; i--) {
            columns.push(i);
        }
        return this.getUpDownCell(cell, columns, keyName);
    }

    /**
     * Go to down-cell
     */
    private goDownCell() {
        if (this.cellSelected) {
            let upCell = this.getDownCell(this.cellSelected, TableEditableKeyboardNavigation.KeyDown);
            if (upCell) {


                upCell.container = this.getCellElement(upCell.row, upCell.col, 'up');

                if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                    this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyDown);
                }

                this.setSelected(upCell.row, upCell.col, upCell.container);
            }
        }
    }

    /**
     * Get down-cell
     * @param {TableEditableCell} cell
     * @param {TableEditableKeyboardNavigation} keyName
     * @returns {TableEditableCell | null}
     */
    private getDownCell(cell: TableEditableCell, keyName: TableEditableKeyboardNavigation): TableEditableCell | null {
        let columns: number[] = [];
        for (let i = cell.row + 1; i < this.getGidComponent().count; i++) {
            columns.push(i);
        }
        return this.getUpDownCell(cell, columns, keyName);
    }

    /**
     * Go to left-cell
     */
    private goLeftCell() {
        if (this.cellSelected) {
            let upCell = this.getLeftCell(this.cellSelected, TableEditableKeyboardNavigation.KeyLeft);
            if (upCell) {
                // Update container
                upCell.container = this.getCellElement(upCell.row, upCell.col, 'down');

                // Update prev-select-cell if selected-cell is not merge
                if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                    this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyLeft);
                }

                // Set selected-cell
                this.setSelected(upCell.row, upCell.col, upCell.container);


            }
        }
    }

    private getLeftCell(cell: TableEditableCell, keyName: TableEditableKeyboardNavigation): TableEditableCell | null {
        let columns: number[] = [];
        for (let i = cell.col - 1; i >= 0; i--) {
            columns.push(i);
        }
        return this.getLeftRightCell(cell, columns, keyName);
    }

    private goRightCell() {
        if (this.cellSelected) {
            let upCell = this.getRightCell(this.cellSelected, TableEditableKeyboardNavigation.KeyRight);
            if (upCell) {
                // Update container
                upCell.container = this.getCellElement(upCell.row, upCell.col, 'down');

                // Update prev-select-cell if selected-cell is not merge
                if (!this.isCellMerged(this.cellSelected.row, this.cellSelected.col)) {
                    this.setPrevCellSelected(this.cellSelected, TableEditableKeyboardNavigation.KeyRight);
                }

                // Set selected-cell
                this.setSelected(upCell.row, upCell.col, upCell.container);


            }
        }
    }

    private getLeftRightCell(cell: TableEditableCell, columns: number[], keyName: TableEditableKeyboardNavigation): TableEditableCell | null {
        for (let i of columns) {
            let rowIndex = cell.row,
                colIndex = i;
            if (this.canGotoCell(new TableEditableCell({row: rowIndex, col: colIndex}), cell)) {
                if (this.isCellMerged(cell.row, cell.col) && this.isCellMerged(rowIndex, colIndex)) {
                    let ref = this.getRefMerge(rowIndex, colIndex);
                    if (ref.rowIndex === cell.row && ref.colIndex === cell.col) {
                        continue;
                    } else {
                        rowIndex = ref.rowIndex;
                        colIndex = ref.colIndex;
                    }
                }

                if (!this.isCellMerged(cell.row, cell.col) && this.isCellMerged(rowIndex, colIndex)) {
                    let refMerged = this.getRefMerge(rowIndex, colIndex);
                    rowIndex = refMerged.rowIndex;
                    colIndex = refMerged.colIndex;
                }


                if (this.prevCellSelected && this.isCellMerged(cell.row, cell.col) && !this.isCellMerged(rowIndex, colIndex) && keyName === this.prevCellSelected.keyName) {
                    rowIndex = this.prevCellSelected.cell.row;
                }

                let clonedCell = Object.assign({}, cell);
                clonedCell.row = rowIndex;
                clonedCell.col = colIndex;
                clonedCell.container = null;
                clonedCell.columnName = this.getColumnName(colIndex);

                if (this.canGotoCell(clonedCell, cell)) {
                    return clonedCell;
                }

            }

        }
        return null;
    }

    private getUpDownCell(cell: TableEditableCell, columns: number[], keyName: TableEditableKeyboardNavigation) {
        for (let i of columns) {
            let rowIndex = i,
                colIndex = cell.col;
            if (this.canGotoCell(new TableEditableCell({row: rowIndex, col: colIndex}), cell)) {
                if (this.isCellMerged(cell.row, cell.col) && this.isCellMerged(rowIndex, colIndex)) {
                    let ref = this.getRefMerge(rowIndex, colIndex);
                    if (ref.rowIndex === cell.row && ref.colIndex === cell.col) {
                        continue;
                    } else {
                        rowIndex = ref.rowIndex;
                        colIndex = ref.colIndex;
                    }
                }
                if (!this.isCellMerged(cell.row, cell.col) && this.isCellMerged(rowIndex, colIndex)) {
                    let refMerged = this.getRefMerge(rowIndex, colIndex);
                    rowIndex = refMerged.rowIndex;
                    colIndex = refMerged.colIndex;
                }


                if (this.prevCellSelected && this.isCellMerged(cell.row, cell.col) && !this.isCellMerged(rowIndex, colIndex) && keyName === this.prevCellSelected.keyName) {
                    colIndex = this.prevCellSelected.cell.col;
                }

                let clonedCell: TableEditableCell = Object.assign({}, cell);
                clonedCell.row = rowIndex;
                clonedCell.col = colIndex;
                clonedCell.container = null;
                clonedCell.columnName = this.getColumnName(colIndex);

                if (this.canGotoCell(clonedCell, cell)) {
                    return clonedCell;
                }
            }
        }
        return null;
    }

    private getRightCell(cell: TableEditableCell, keyName: TableEditableKeyboardNavigation) {
        let columns: number[] = [];
        for (let i = cell.col + 1; i < this.columns.length; i++) {
            columns.push(i);
        }
        return this.getLeftRightCell(cell, columns, keyName);
    }

    /**
     * Scroll to postion and render
     * @param {number} rowIndex
     * @param {string} position
     */
    private gotoRow(rowIndex: number, position: string) {
        let top = this.scrollToRow(rowIndex, position);
        let bodyComponent = this.getGidComponent().bodyComponent;
        bodyComponent.offsetY = top;
        bodyComponent.updateIndexes();
        bodyComponent.updatePage(position);
        bodyComponent.updateRows();
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Scroll to row by row-index
     * @param {number} rowIndex
     * @param {string} position
     * @returns {number}
     */
    private scrollToRow(rowIndex: number, position: string): number {
        let top = this.rowHeight * rowIndex;
        if (position === 'up') {
            top = this.rowHeight * rowIndex - this.getBodyContentHeight() + this.rowHeight;
        }

        this.scroller.scrollTo({top: top});

        return top;
    }

    /**
     * Get height of body-content
     * @returns {number}
     */
    private getBodyContentHeight() {
        return this.getGidComponent().bodyHeight - this.getHorizontalScrollBarSize();
    }

    /**
     * Get the width of horizontal
     * @returns {number}
     */
    private getHorizontalScrollBarSize(): number {
        return this.hasHorizontal() ? this.scrollbarWidth : 0;
    }

    /**
     * Get the width of vertical
     * @returns {number}
     */
    private getVerticalScrollBarSize(): number {
        return this.hasVertical() ? this.scrollbarWidth : 0;
    }

    private isRowInViewPort(container: JQuery) {
        return this.isCellInTopViewPort(container) || this.isCellInBottomViewPort(container);
    }

    /**
     * Check cell in view-port
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellContainViewPort(container: JQuery): boolean {
        let inViewPort = true;
        if (!this.isCellInLeftViewPort(container) ||
            !this.isCellInRightViewPort(container) ||
            !this.isCellInTopViewPort(container) ||
            !this.isCellInBottomViewPort(container)) {
            inViewPort = false;
        }
        return inViewPort;
    }

    /**
     * Check cell in the left
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInLeftViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container.closest('datatable-body-cell'),
            offset_1 = cell.offset(),
            left_1 = offset_1.left,
            rightWidth = container.closest('datatable-row-wrapper').find('.datatable-row-right').width(),
            leftWidth = container.closest('datatable-row-wrapper').find('.datatable-row-left').width(),
            offset_2 = scroller.offset(),
            left_2 = offset_2.left + leftWidth,
            right_2 = left_2 + scroller.width() - this.getVerticalScrollBarSize() - rightWidth;
        return left_2 <= left_1 && left_1 <= right_2;
    }

    /**
     * Check cell in the right
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInRightViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container.closest('datatable-body-cell'),
            offset_1 = cell.offset(),
            left_1 = offset_1.left,
            right_1 = left_1 + cell.width(),
            rightWidth = container.closest('datatable-row-wrapper').find('.datatable-row-right').width(),
            offset_2 = scroller.offset(),
            left_2 = offset_2.left,
            right_2 = left_2 + scroller.width() - this.getVerticalScrollBarSize() - rightWidth;
        return (left_2 <= right_1 && right_1 <= right_2);
    }

    /**
     * Check cell in the bottom
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInTopViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container.closest('datatable-body-cell'),
            offset_1 = cell.offset(),
            top_1 = offset_1.top,
            offset_2 = scroller.offset(),
            top_2 = offset_2.top,
            bottom_2 = top_2 + scroller.height() - this.getHorizontalScrollBarSize();
        return (top_2 <= top_1 && top_1 <= bottom_2);
    }

    /**
     * Check cell in the bottom
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInBottomViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container.closest('datatable-body-cell'),
            offset_1 = cell.offset(),
            top_1 = offset_1.top,
            bottom_1 = top_1 + cell.height(),
            offset_2 = scroller.offset(),
            top_2 = offset_2.top,
            bottom_2 = top_2 + scroller.height() - this.getHorizontalScrollBarSize();
        return (top_2 <= bottom_1 && bottom_1 <= bottom_2);
    }

    /**
     * Set prev selected cell
     * @param {TableEditableCell} cell
     * @param {TableEditableKeyboardNavigation} keyName
     */
    private setPrevCellSelected(cell: TableEditableCell, keyName: TableEditableKeyboardNavigation) {
        this.prevCellSelected = {
            cell: Object.assign({}, cell),
            keyName: keyName
        };
    }

    /**
     * Get cell-control
     * @param container
     * @returns {any}
     */
    private getCellControl(container) {
        return container.closest('datatable-body-cell');
    }

    private changeToViewMode() {
        this.removeTemplate();

        // Move focus to cell to fix lose focus
        if (this.cellSelected) {
            this.cellSelected.container[0].focus({
                preventScroll: true
            });
        }


        // Change viewMode of cell-selected
        this.cellSelectedMode = TableEditableCellMode.View;
    }

    /**
     * Remove template
     */
    private removeTemplate() {
        // Remove Template
        if (this.templatePortal && this.templatePortal.isAttached) {
            this.templatePortal.detach();
        }
        this.templatePortal = null;
    }

    /**
     * Get the value of selected-cell
     * @returns {string | number | boolean | null}
     */
    private getSelectedCellValue() {
        return this.getCell(this.cellSelected.row, this.cellSelected.col);
    }

    /**
     * Switch the mode of cell from view to edit
     * @param value
     * @param options
     */
    private changeToEditMode(value, options?) {
        if (!options) {
            options = {};
        }
        let rowIndex = this.cellSelected.row,
            colIndex = this.cellSelected.col,
            columnName = this.getColumnName(colIndex);
        options = Object.assign({
            autoFocus: true,
            showDropDown: true,
            canSearchDropDown: this.canSearchDropDown(columnName)
        }, options);
        this.setTemplate(columnName, value, rowIndex, colIndex, options);


    }

    /**
     * Check key's event is valid
     * @param {KeyboardEvent} ev
     * @returns {boolean}
     */
    private isValidKey(ev: KeyboardEvent) {
        let charList = 'abcdefghijklmnopqrstuvwxyz0123456789`~-_=+[{]}\\|;:\'",<.>/?',
            key = ev['key'].toLowerCase();
        return charList.indexOf(key) !== -1;
    }

    /**
     * Check key of keyboard-event is number
     * @param {KeyboardEvent} ev
     * @returns {any}
     */
    private isNumber(ev: KeyboardEvent) {
        let value: any = parseFloat(ev['key']);
        return typeof value === 'number' && isFinite(value);
    }



    /**
     * Check row modified
     * @param {TableEditableRow} row
     * @returns {boolean}
     */
    private isRowModified(row: TableEditableRow): boolean {
        let clone1 = row,
            clone2 = this.originalRows.find((originalRow) => {
                return this.getId(clone1) === this.getId(originalRow);
            }),
            isModified = false;
        this.columns.forEach((column, colIndex) => {
            let values1 = this.getCellValue(clone1, colIndex);
            let value2 = (clone2 && this.getCellValue(clone2, colIndex)) || null;
            if (JSON.stringify(values1) !== JSON.stringify(value2)) {
                isModified = true;
            }
        });
        return isModified;
    }

    /**
     * Check row new
     * @param {TableEditableRow} row
     * @returns {boolean}
     */
    isNewRow(row: TableEditableRow) {
        return this.changed.added.findIndex((item) => {
            return this.getId(row) === this.getId(item);
        }) !== -1;
    }

    /**
     * Clear the selection
     */
    private clearSelection() {
        let documentSelection = document['selection'];
        if (documentSelection && documentSelection.empty) {
            documentSelection.empty();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    /**
     * Get width of scrolbar
     * @returns {number}
     */
    private getScrollbarWidth() {
        return this.tableEditableService.getScrollbarWidth() + 4;
    }

    private getProperty(colIndex: number) {
        let columnName: string;
        if (this.dataRowStyle === 'object') {
            columnName = this.getColumnName(colIndex);
        }
        if (this.dataRowStyle === 'array') {
            columnName = (colIndex + 1) + '';
        }
        return columnName;
    }

    private getIdProperty() {
        if (this.dataRowStyle === 'array') {
            return '0';
        } else {
            return 'Id';
        }
    }

    private clone(row: TableEditableRow): TableEditableRow {
        return JSON.parse(JSON.stringify(row));
    }

    private isNewItem(row: TableEditableRow) {
        let id = this.getId(row);
        return (id + '').indexOf('row-') === 0;
    }

    /**
     * Re-calc header columns
     */
    private calcColumnsWidth() {
        if (this.getGidComponent()) {
            let header = this.getGidComponent().headerComponent;
            if (header && header.columns) {
                header.columns.forEach((col) => {
                    if (col.resizeable) {
                        header.onColumnResized(col.width, col);
                    }
                });
            }
        }
    }

    showDropdown(rowIndex: number, colIndex: number, ev: MouseEvent) {
        let value = this.getCell(rowIndex, colIndex);

        ev.stopImmediatePropagation();
        this.setSelected(rowIndex, colIndex, $(<any> ev.currentTarget));
        this.changeToEditMode(value);
    }
}
