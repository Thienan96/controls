import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {
    DatatableCell,
    DatatableCellMode,
    DatatableChanged,
    DatatableColumn,
    DatatableColumnPin,
    DatatableComponentInterface,
    DatatableDataType,
    DatatableGroup,
    DatatableKeyboardNavigation,
    DatatableRow,
    DatatableRowState,
    DatatableViewMode,
    ISort,
    NTK_DATATABLE
} from '../shared/datatable.model';
import {DatatableColumnComponent} from '../datatable-column/datatable-column.component';
import {DatatableBodyComponent} from '../datatable-body/datatable-body.component';
import {DatatableScrollerHorizontalComponent} from '../datatable-scroller-horizontal/datatable-scroller-horizontal.component';
import {DatatableService} from '../shared/datatable.service';
import {DatatableHeaderComponent} from '../datatable-header/datatable-header.component';
import {DatatableFooterComponent} from '../datatable-footer/datatable-footer.component';
import {tap} from 'rxjs/operators';
import * as _ from 'underscore';
import {Observable, of, Subscription} from 'rxjs';
import {Subject} from 'rxjs/Subject';
import {DatatableRowComponent} from '../datatable-row/datatable-row.component';
import {DatatableCellComponent} from '../datatable-cell/datatable-cell.component';
import {
    BACKSPACE,
    DELETE,
    DOWN_ARROW,
    ENTER,
    LEFT_ARROW,
    RIGHT_ARROW,
    SPACE,
    TAB,
    UP_ARROW
} from '@angular/cdk/keycodes';
import {TableEditableRow} from '../../table-editable/shared/table-editable.model';

@Component({
    selector: 'ntk-datatable',
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NTK_DATATABLE,
            useExisting: DatatableComponent
        }
    ]
})
export class DatatableComponent implements OnInit, AfterViewInit, OnDestroy, DatatableComponentInterface {
    @ContentChild('headerTemplate', {static: false}) headerTemplate: TemplateRef<any>;
    @ContentChild('footerTemplate', {static: false}) footerTemplate: TemplateRef<any>;
    @ContentChild('rowTemplate', {static: false}) rowTemplate: TemplateRef<any>;
    @ContentChild('defaultRowTemplate', {static: false}) defaultRowTemplate: TemplateRef<any>;
    @ContentChildren(DatatableColumnComponent) columnsComponent: QueryList<DatatableColumnComponent>;
    @ViewChild(DatatableBodyComponent, {static: false}) bodyComponent: DatatableBodyComponent;
    @ViewChild(DatatableHeaderComponent, {static: false}) headerComponent: DatatableHeaderComponent;
    @ViewChild(DatatableFooterComponent, {static: false}) footerComponent: DatatableFooterComponent;
    @ViewChild(DatatableScrollerHorizontalComponent, {static: false}) scrollerHorizontalComponent: DatatableScrollerHorizontalComponent;

    @Input() loadData: any;
    @Input() scrollLeft = 0;
    @Input() footer: any;
    @Input() itemHeight = 31;
    @Input() rowClass: any;
    @Input() showHeader = true;
    @Input() showFooter = false;
    @Input() hasAlternate = false;
    @Input() groups: DatatableGroup[] = [];
    @Input() autoHideColumnGroup = false;
    @Input() getGroupValue: any;
    @Input() pageSize = 31;
    @Input() defaultSort;
    @Input() autoLoad = false;
    @Input() selected: DatatableRow; // Contains rows which is selected

    @Output() select = new EventEmitter<DatatableRow>();
    @Output() rowDbClick = new EventEmitter<DatatableRow>();
    @Output() rowClick = new EventEmitter<DatatableRow>();
    @Output() columnResized = new EventEmitter<DatatableColumn>();
    @Output() columnSorted = new EventEmitter<ISort>();
    @Output() added = new EventEmitter<DatatableRow>();
    @Output() removed = new EventEmitter<DatatableRow>();


    viewMode = DatatableViewMode.grid; // grid|tree
    columns: DatatableColumn[] = []; // Columns which is display in viewport
    $element: JQuery;
    paddingRight = 0;
    bodyHeight: any = 'auto';
    items: DatatableRow[] = [];

    // Media-102: unsubscribe the previous request if new request is sent, so that we can see correct data at new
    loadingRequest: Subscription;

    private _rootloading = false;

    private _expandingRequest: { [index: string]: Subscription } = {};

    @Input() fitContent = false;
    // EJ4-2014: Navigate selected cell by press keyboard
    @Input() getNewRow: (cell: DatatableCell) => DatatableRow;
    @Input() isDisabledSelectionRow = false;
    private cellSelected: DatatableCell;
    prevCell: DatatableCell; // Store prev cell to merge cell
    rowReady = new Subject();
    leftWidth: number;
    rightWidth: number;
    centerWidth: number;
    cellSelectedMode = DatatableCellMode.View;
    rowsStateManager: DatatableRowState[] = [];
    protected changes: DatatableChanged = {
        added: [],
        deleted: [],
        edited: []
    };
    @Input() isEditable = false; // Control is editable
    @Input() originalRows: DatatableRow[] = [];
    @Input() isRef = (cell: DatatableCell): boolean => {
        return false;
    };
    @Input() getRef = (cell: DatatableCell): DatatableCell => {
        return cell;
    };
    @Input() isMerged = (cell: DatatableCell): boolean => {
        return cell !== this.getRef(cell);
    };
    @Input() isCellSelectable = (cell: DatatableCell): boolean => {
        return this.isCellSelectableDefault(cell);
    };
    @Input() isCellDisabled = (cell: DatatableCell): boolean => {
        return this.isCellDisabledDefault(cell);
    };
    @Input() isCellEditable = (cell: DatatableCell): boolean => {
        return this.isCellEditableDefault(cell);
    };
    @Input() isRowDisabled = (row: DatatableRow): boolean => {
        return false;
    };
    @Input() isRowEditable = (row: TableEditableRow): boolean => {
        return this.isRowEditableDefault(row);
    };
    @Input() getCellValue = (cell: DatatableCell): any => {
        return cell.row[cell.col.property];
    };


    isCellSelectableDefault(cell: DatatableCell): boolean {
        return this.isEditable ? cell.col.selectable : false;
    }

    isCellDisabledDefault(cell: DatatableCell): boolean {
        return this.isRowDisabled(cell.row);
    }

    isRowEditableDefault(row: TableEditableRow): boolean {
        return !this.isRowDisabled(row);
    }

    isCellEditableDefault(cell: DatatableCell): boolean {
        return this.isEditable ? cell.col.editable && this.isRowEditable(cell.row) && !this.isCellDisabled(cell) : false;
    }


    constructor(private elementRef: ElementRef,
                private datatableService: DatatableService,
                private cd: ChangeDetectorRef,
                private ngZone: NgZone) {
        this.$element = $(this.elementRef.nativeElement);
    }

    private get scroller(): Element {
        return this.$element.find(`ntk-virtual-scroll`)[0];
    }

    @HostListener('window:keydown', ['$event']) onKeyDown(ev: KeyboardEvent) {
        if ($(ev.target).closest(this.$element).length > 0) {
            let value = ev['key'],
                keyCode = ev[`keyCode`],
                isTab = value === 'Tab' || keyCode === TAB,
                isEnter = value === 'Enter' || keyCode === ENTER,
                isLeftArrow = value === 'ArrowLeft' || value === 'Left' || keyCode === LEFT_ARROW,
                isRightArrow = value === 'ArrowRight' || value === 'Right' || keyCode === RIGHT_ARROW,
                isArrowUp = value === 'ArrowUp' || value === 'Up' || keyCode === UP_ARROW,
                isArrowDown = value === 'ArrowDown' || value === 'ArrowDown' || keyCode === DOWN_ARROW,
                isBackspace = value === 'Backspace' || keyCode === BACKSPACE,
                isDelete = value === 'Delete' || keyCode === DELETE,
                isSpace = value === 'Space' || keyCode === SPACE;

            if (!this.cellSelected) {
                return;
            }

            if (isTab) { // Tab
                ev.preventDefault();
                if (ev.shiftKey) {
                    this.gotoPrev(true);
                } else {
                    this.gotoNext(true);
                }
                return;
            }

            if (this.cellSelectedMode === DatatableCellMode.View) {
                if (isLeftArrow) { // Arrow left
                    ev.preventDefault();
                    this.goLeftCell();
                    return;
                }
                if (isRightArrow) { // Arrow Right
                    ev.preventDefault();
                    this.goRightCell();
                    return;
                }
                if (isArrowUp) { // Arrow Up
                    ev.preventDefault();
                    this.goUpCell();
                    return;
                }
                if (isArrowDown) { // Arrow Down
                    ev.preventDefault();
                    this.goDownCell();
                    return;
                }


                let controlType = <DatatableDataType>this.cellSelected.col.dataType;
                if (this.isCellEditable(this.cellSelected)) {

                    // Checkbox, Check|UnCheck if press space, go down if press enter
                    if (controlType === DatatableDataType.Checkbox) {
                        // Go to down if press enter
                        if (isEnter) {
                            this.goDownCell();
                        }
                        // Toggle checkbox when press space
                        if (isSpace) {
                            let checked: boolean = this.cellSelected.row[this.cellSelected.col.property];
                            this.setCellComponentValue(this.cellSelected, !!!checked);
                        }

                        // Delete cell, go to edit mode if Backspace, DELETE
                        if (isBackspace || isDelete) {
                            this.setCellComponentValue(this.cellSelected, false);
                        }
                        ev.preventDefault();
                        return;
                    }


                    // Delete cell, go to edit mode if Backspace, DELETE
                    if (isBackspace || isDelete) {
                        // Arrow Down
                        this.changeToEditMode(this.cellSelected);
                        this.setCellComponentValue(this.cellSelected, ``);
                        ev.preventDefault();
                        return;
                    }

                    if (controlType === DatatableDataType.Select) {
                        // Can search
                        if (this.isValidKey(value)) {
                            let celComponent = this.getCellComponentFromCell(this.cellSelected);
                            celComponent.searchText = value;
                            setTimeout(() => {
                                this.changeToEditMode(this.cellSelected);
                            }, 100);
                        }
                        if (isSpace || isEnter) {
                            this.changeToEditMode(this.cellSelected);
                        }
                        ev.preventDefault();
                        return;
                    }


                    // Date
                    // Show Dropdown if press space
                    if (controlType === DatatableDataType.Date) {
                        if (isSpace || isEnter) {
                            this.changeToEditMode(this.cellSelected);
                        }

                        ev.preventDefault();
                        return;
                    }

                    // Number
                    if (this.isDatatableDataTypeNumber(controlType)) {
                        if (isSpace) {
                            this.changeToEditMode(this.cellSelected);
                            this.setCellComponentValue(this.cellSelected, ``);
                            ev.preventDefault();
                            return;
                        }
                        if (isEnter) {
                            this.changeToEditMode(this.cellSelected);
                            ev.preventDefault();
                            return;
                        }
                        // Accept - if number is negative
                        if (this.isDatatableDataTypeNegative(controlType) && value === '-') {
                            this.setCellComponentValue(this.cellSelected, value);
                            this.changeToEditMode(this.cellSelected);

                            ev.preventDefault();
                            return;
                        }
                        if (!this.isNumber(value) && !isEnter) {
                            ev.preventDefault();
                            return;
                        }
                    }


                    // Empty cell if press space
                    if (isSpace) {
                        this.changeToEditMode(this.cellSelected);
                        this.setCellComponentValue(this.cellSelected, ``);
                        ev.preventDefault();
                        return;
                    }
                }


                if (isEnter) {
                    if (this.isCellEditable(this.cellSelected)) {
                        this.changeToEditMode(this.cellSelected);
                    } else {
                        this.goDownCell();
                    }
                    ev.preventDefault();
                    return;
                }


                // default
                if (this.isCellEditable(this.cellSelected) && this.isValidKey(value)) {
                    ev.preventDefault();

                    // Update Cell when typing
                    this.changeToEditMode(this.cellSelected);
                    this.setCellComponentValue(this.cellSelected, value);
                }
            }
        }
    }

    ngOnInit() {
        // Scroll Horizontal
        this.$element[0].addEventListener('wheel', this.onWheel.bind(this), {
            capture: true,
            passive: false
        });

        // Set tabindex to allow control can focus to fix issue keyboard
        this.$element.attr('tabindex', 1);
    }

    ngAfterViewInit() {
        // Update columns if columns was change
        this.columnsComponent.changes.subscribe(() => {
            this.updateColumns(false);
        });
        // Update page for body
        if (this.bodyComponent) {
            this.bodyComponent.pageSize = this.pageSize;
        }
        this.updateColumns(this.autoLoad);
    }

    ngOnDestroy() {
        if (this.loadingRequest) {
            this.loadingRequest.unsubscribe();
        }
    }

    private getAllColumns(): DatatableColumn[] {
        let left = [],
            right = [],
            center = [];
        this.columnsComponent.toArray().forEach((item: any) => {
            let column = new DatatableColumn(item);
            switch (column.pin) {
                case DatatableColumnPin.left:
                    left.push(column);
                    break;
                case DatatableColumnPin.right:
                    right.push(column);
                    break;
                case DatatableColumnPin.center:
                    center.push(column);
                    break;
            }
        });
        return Array.prototype.concat(left, center, right);
    }

    private calcWidth() {
        this.leftWidth = 0;
        this.rightWidth = 0;
        this.centerWidth = 0;
        this.columns
            .filter((col) => {
                return col.show;
            })
            .forEach((col) => {
                switch (col.pin) {
                    case DatatableColumnPin.left:
                        this.leftWidth = this.leftWidth + col.width;
                        break;
                    case DatatableColumnPin.right:
                        this.rightWidth = this.rightWidth + col.width;
                        break;
                    case DatatableColumnPin.center:
                        this.centerWidth = this.centerWidth + col.width;
                        break;
                }
            });
    }

    private onColumnsUpdated() {
        if (this.autoHideColumnGroup) {
            this.checkVisibleColumns(this.groups);
        }

        this.calcWidth();

        this.setLastColumn();
    }

    /**
     * Call this method to re-render the columns when the columns collection has changed
     * @param withRefresh need to refresh data after re-render the column or not? by default is TRUE
     */
    updateColumns(withRefresh = true) {
        // Update Columns
        this.columns = this.getAllColumns();
        this.onColumnsUpdated();
        if (this.bodyComponent) {
            this.bodyComponent.updateColumns();
        }

        // Refresh grid
        if (withRefresh) {
            this.refreshGrid();
        }

    }

    private setLastColumn() {
        // Set LastColumn
        this.columns.forEach((column) => {
            column.isLastColumn = false;
        });
        for (let i = this.columns.length - 1; i >= 0; i--) {
            if (this.columns[i].show && this.columns[i].pin === DatatableColumnPin.right) {
                this.columns[i].isLastColumn = true;
                return;
            }
        }
        for (let i = this.columns.length - 1; i >= 0; i--) {
            if (this.columns[i].show && this.columns[i].pin === DatatableColumnPin.center) {
                this.columns[i].isLastColumn = true;
                return;
            }
        }
        for (let i = this.columns.length - 1; i >= 0; i--) {
            if (this.columns[i].show && this.columns[i].pin === DatatableColumnPin.left) {
                this.columns[i].isLastColumn = true;
                return;
            }
        }
    }

    private checkSize() {
        this.checkPadding();
        if (this.fitContent) {
            this.checkBodyHeight();
        }

    }

    onResizeSensor() {
        this.checkSize();
    }

    scrollContent(left: number) {
        this.setScrollLeft(left);
        this.$element.find('.scroller-horizontal-content').css({
            transform: 'translate(-' + left + 'px,0px)',
            '-webkit-transform': 'translate(-' + left + 'px,0px)'
        });
    }

    setScrollLeft(left: number) {
        this.scrollLeft = left;
    }

    /**
     * Set scroll at footer,
     * @param left
     */
    scrollTo(left: number) {
        this.scrollerHorizontalComponent.scrollTo(left);
    }

    onWheel(ev: WheelEvent) {
        this.scrollerHorizontalComponent.onWheel(ev);
    }

    onDrag(ev) {
        this.scrollerHorizontalComponent.onDrag(ev);
    }

    onFetchDataFinished() {
        this.checkSize();
    }

    onRowSelected(row: DatatableRow) {
        this.select.emit(row);
    }

    onRowDbClick(row: DatatableRow) {
        this.rowDbClick.emit(row);
    }

    onRowClick(row: DatatableRow) {
        this.rowClick.emit(row);
    }

    onExpandedChanged(row: DatatableRow, groups: DatatableGroup[]) {
        if (!row.expanded) {
            // if the row is expanding and not yet finish, then we stop directly
            if (row.isExpanding && this._expandingRequest[row.UniqueKey]) {
                this._expandingRequest[row.UniqueKey].unsubscribe();
                delete this._expandingRequest[row.UniqueKey];
                row.isExpanding = false;
                this.datatableService.raisExpandCollapseChanged();
            }

            this.collapseRow(row);
            this.checkSize();
        } else {
            row.isExpanding = true;
            this.datatableService.raisExpandCollapseChanged();
            // fix problem indicator still display while api is response
            this.safeApply();
            this._expandingRequest[row.UniqueKey] = this.expandRow(row, groups).subscribe(() => {
                let rowExpanded = this.items.find((item) => {
                    return item.UniqueKey === row.UniqueKey;
                });
                if (rowExpanded) {
                    row.isExpanded = true;
                    rowExpanded.isExpanding = false;
                    this.datatableService.raisExpandCollapseChanged();
                    this.checkSize();
                    // fix problem indicator still display while api is response
                    this.safeApply();
                }

                if (this._expandingRequest[row.UniqueKey]) {
                    delete this._expandingRequest[row.UniqueKey];
                }
            });
        }
    }


    private checkPadding() {
        setTimeout(() => {
            this.ngZone.run(() => {
                this.paddingRight = this.datatableService.getPaddingRight(this.$element);
            });
        }, 100);
    }

    private collapseRow(row: DatatableRow) {
        this.collapseChildren(row);
        this.bodyComponent.virtualScroll.refresh();
    }


    /**
     * Collapse the children of row
     * @param row
     * @private
     */
    collapseChildren(row: DatatableRow) {
        // Collapse
        row.expanded = false;
        let item = this.items.find((r) => {
            return r.UniqueKey === row.UniqueKey;
        });
        if (item) {
            item.expanded = false;
        }

        let children = this.items.filter((r) => {
            return r.parentId === row.UniqueKey;
        });
        children.forEach((child: DatatableRow) => {
            if (child.hasChildren && child.Id !== -1) {
                this.collapseChildren(child);
            }
        });

        // Remove children
        this.removeArray(this.items, children);
    }

    private removeArray(array: DatatableRow[], arrayToDelete: DatatableRow[]) {
        for (let needDelete of arrayToDelete) {
            let pos = array.indexOf(needDelete);
            if (pos !== -1) {
                array.splice(pos, 1);
            }
        }
    }

    public getIndexOfRow(from: DatatableRow): number {
        return this.items.findIndex((r) => r.UniqueKey === from.UniqueKey);
    }

    public removeRowsRange(from: DatatableRow, count: number, include = true) {
        let fromIdx = this.getIndexOfRow(from);

        if (!include) {
            fromIdx++;
        }
        this.items.splice(fromIdx, count);

        this.bodyComponent.virtualScroll.refresh();
    }

    public updateRow(sourceRow: DatatableRow, updatedRow: DatatableRow) {
        if (sourceRow.Id === updatedRow.Id) {
            Object.assign(sourceRow, updatedRow);
        }
    }

    private insertDataAt(data, position: number, options: {
        parentId?: any,
        level?: number,
        hasChildren?: boolean,
        queryOptions?: any
    } = {}): DatatableRow[] {
        let parentId = options.parentId,
            hasChildren: boolean = options.hasChildren,
            level: number = options.level,
            queryOptions = options.queryOptions;

        let reserveRows = [];
        let inserted = [];

        for (let i = 0; i < data.Count; i++) {
            let noneData: any = {
                UniqueKey: _.uniqueId('UniqueKey-'),
                Id: -1,
                parentId: parentId,
                level: level,
                hasChildren: hasChildren,
                queryOptions: queryOptions,
                $$index: i
            };
            reserveRows.push(noneData);
        }

        // Add rows to viewport and fix splice if Uncaught RangeError: Maximum call stack size exceeded
        this.splice(this.items, position, reserveRows);


        // Update rows
        if (data.ListItems && data.ListItems.length > 0) {
            data.ListItems.forEach((row, i) => {
                let oldItem = this.items[position + i];
                // row = { ...row };
                row.$$index = oldItem.$$index;
                row.UniqueKey = oldItem.UniqueKey;
                row.level = level;
                row.parentId = parentId;
                row.hasChildren = hasChildren;
                row.queryOptions = queryOptions;
                this.items[position + i] = row;
                inserted.push(row);
            });
        }

        return inserted;
    }

    /**
     * Uncaught RangeError: Maximum call stack size exceeded
     * @param items
     * @param position
     * @param reserveRows
     * @private
     */
    private splice(items: any[], position: number, reserveRows: any[]) {
        let leftArray = items.slice(0, position);
        let rightArray = items.slice(position, items.length);
        items.splice(0, items.length);
        leftArray.forEach((item) => {
            items.push(item);
        });
        reserveRows.forEach((item) => {
            items.push(item);
        });
        rightArray.forEach((item) => {
            items.push(item);
        });
    }

    /**
     * Insert row to items at a position
     * @param row
     * @param position
     */
    insertRow(row: DatatableRow, position: number): DatatableRow {
        let data = {
            ListItems: [row],
            Count: 1
        };
        let options = {
            parentId: row.parentId,
            hasChildren: row.hasChildren,
            level: row.level,
            queryOptions: row.queryOptions
        };
        let insertedRow = this.insertDataAt(data, position, options)[0];

        this.afterInsertRow(insertedRow);

        return insertedRow;
    }

    /**
     * Update state after insert row
     * @param insertedRow
     */
    afterInsertRow(insertedRow: DatatableRow) {
        // Init state of row
        let rowStates: DatatableRowState = new DatatableRowState({
            Id: insertedRow.Id
        });
        this.columns.forEach((c) => {
            rowStates[c.property] = {
                touched: false
            };
        });
        this.rowsStateManager.push(rowStates);


        this.changes.added.push(insertedRow);

        this.added.emit(insertedRow);
    }

    private getChildOptions(row: DatatableRow) {
        let groups = this.groups;
        let level = row.level + 1;
        let groupBy = groups[level] ? groups[level].property : '';

        // Build Query
        let rowQueryOptions = this.clone(row.queryOptions || {});
        let query = rowQueryOptions.query || {};
        query[rowQueryOptions.groupBy] = this.getRowValue(row, groupBy);
        let queryOptions = {level: level, groupBy: groupBy, query: query};
        return {
            parentId: row.UniqueKey,
            hasChildren: level < groups.length,
            level: level,
            queryOptions: queryOptions
        };
    }

    expandRow(row: DatatableRow, groups?: DatatableGroup[]): Observable<any> {
        let options = this.getChildOptions(row);
        return this.loadData(row, 0, this.getPageSize(), options.queryOptions).pipe(tap((data: any) => {
            let pos = this.items.findIndex((r) => {
                return r.UniqueKey === row.UniqueKey;
            });
            if (pos !== -1) {
                this.insertDataAt(data, pos + 1, options);
            }
        }));
    }

    forceLoadRow(row: DatatableRow): Observable<DatatableRow[]> {
        let options = this.getChildOptions(row);
        return this.loadData(row, 0, 10000, options.queryOptions).pipe(tap((data: any) => {
            let list: DatatableRow[] = data.ListItems;
            list.forEach((item) => {
                item.UniqueKey = _.uniqueId('UniqueKey-');
                item.parentId = options.parentId;
                item.queryOptions = options.queryOptions;
                item.level = options.level;
                item.hasChildren = options.hasChildren;
            });
        }));
    }


    public safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    // this method to correct the height of body but durithe text we thin that its not necessary, but the method is keep for later use
    private checkBodyHeight() {
        // Reset
        this.$element.removeClass('content-is-fit');
        this.bodyHeight = 'auto';


        let bodyHeight = this.bodyComponent.itemCount * this.bodyComponent.itemHeight;
        let bHeight = this.$element.find('ntk-datatable-body').height();

        // Fit body if content is less than body's viewport
        if (bHeight && bodyHeight && bodyHeight < bHeight) {
            this.$element.addClass('content-is-fit');
            this.bodyHeight = bodyHeight;
        }
    }

    private checkVisibleColumns(groups: DatatableGroup[]) {
        // Reset columns
        this.columns.forEach((column) => {
            column.show = true;
        });

        // Hide the columns which contain in groups
        groups.forEach((group) => {
            this.columns.forEach((column) => {
                if (column.property === group.property) {
                    column.show = false;
                }
            });
        });
    }

    private hideColumns(groups: DatatableGroup[]) {
        this.checkVisibleColumns(groups);

        this.headerComponent.updateColumns();
        this.footerComponent.updateColumns();
        this.bodyComponent.updateColumns();
        this.scrollerHorizontalComponent.updateColumns();
    }

    private loadRoot(groups: DatatableGroup[]) {
        if (this._rootloading) {
            return;
        }
        this._rootloading = true;

        let groupBy = groups.length > 0 ? groups[0].property : '',
            level = 0,
            query = {},
            queryOptions = {level: level, groupBy: groupBy, query: query},
            options = {
                parentId: -1,
                hasChildren: groups.length > 0,
                level: level,
                queryOptions: queryOptions
            };

        this.items.splice(0, this.items.length);
        return this.loadData(null, 0, this.bodyComponent.pageSize, queryOptions).pipe(tap((data: any) => {
            // Insert root to items
            this.insertDataAt(data, 0, options);


            // media: fix bug not load data
            this._rootloading = false;
        }, () => {
            this._rootloading = false;
        }));
    }

    setSelectedRow(row: DatatableRow) {
        this.bodyComponent.onRowSelect(row);
    }

    setSelectedCell(cell: DatatableCell) {
        this.ngZone.run(() => {
            if (cell.row.Id !== -1) {
                this.cellSelected = cell;
                this.datatableService.raiseCellSelectedChanged();

                this.changeToViewMode();

                this.setSelectedRow(cell.row);

                // Apply change for rows
                this.bodyComponent.safeApplyChildren();


                // Focus cell
                this.elementRef.nativeElement.focus({
                    preventScroll: true
                });

                // Scroll to cell if cell is outside viewport
                this.makeRowExistInDom(cell.row, `down`).subscribe(() => {
                    let rowContainer = this.getRowContainerFromId(cell.row);
                    this.scrollToCell(this.cellSelected, rowContainer);
                });
            }
        });
    }

    unSelectCell() {
        let cellComponent = this.getCellComponentFromCell(this.cellSelected);
        this.cellSelected = null;
        if (cellComponent) {
            cellComponent.updateCellSelected();
        }
    }

    unSelectRow() {
        this.selected = null;
    }

    refreshGrid(options = {keepScroll: false}) {
        // Cancel all request
        this.bodyComponent.cancelRequest();
        // return undefined if grid doesn't have data
        this.selected = null;

        for (let r in this._expandingRequest) {
            if (this._expandingRequest[r]) {
                this._expandingRequest[r].unsubscribe();
            }
        }

        this._expandingRequest = {};

        // Empty grid
        this.items.splice(0, this.items.length);

        // Check viewmode
        this.viewMode = this.getViewMode();

        // Is Support Lazy
        this.bodyComponent.isDataLazy = this.viewMode === DatatableViewMode.grid;

        if (this.autoHideColumnGroup) {
            this.hideColumns(this.groups);
        }

        if (this.loadingRequest) {
            this.loadingRequest.unsubscribe();
            this._rootloading = false;
        }

        if (!this._rootloading) {
            this.loadingRequest = this.loadRoot(this.groups).pipe().subscribe((data) => {
                // Wait to render
                setTimeout(() => {
                    this.bodyComponent.updateColumns();


                    // Scroll Horizontal to 0
                    if (options && !options.keepScroll) {
                        this.scrollTo(0);
                    }

                    // Select scroll data.Index or first item
                    if (data.Index && data.Index !== -1) {
                        this.bodyComponent.scrollToIndex(data.Index);
                    } else {
                        let topIndex = this.getTopIndex();
                        this.bodyComponent.scrollToIndex(topIndex);
                    }
                    this.checkSize();


                }, 100);
            });
        }
    }

    private getViewMode(): DatatableViewMode {
        return this.groups.length > 0 ? DatatableViewMode.tree : DatatableViewMode.grid;
    }


    private getPageSize() {
        return this.bodyComponent.pageSize;
    }

    private getRowValue(row: DatatableRow, groupBy?: string) {
        if (this.getGroupValue) {
            return this.getGroupValue(row, groupBy);
        } else {
            return row.Id;
        }
    }

    onColumnResized($event: DatatableColumn) {
        this.ngZone.run(() => {
            // update for current keeping column
            let resized = this.columns.find(c => c.property === $event.property);
            if (resized) {
                resized.width = $event.width;
            }

            this.calcWidth();

            if (this.bodyComponent) {
                this.bodyComponent.updateColumns();
            }

            if (this.footerComponent) {
                this.footerComponent.updateColumns();
            }

            this.columnResized.emit($event);
        });

    }

    onColumnSorted(event: ISort) {
        this.columnSorted.emit(event);
    }


    /**
     * Get next-cell by tab
     * @param {DatatableCell} cell
     * @param canGoToNextItem
     * @returns {DatatableCell}
     */
    private getPrevCell(cell: DatatableCell, canGoToNextItem: boolean): DatatableCell {
        let cellSelected = this.getLeftCell(cell);
        if (cellSelected) {
            return cellSelected;
        } else {
            if (canGoToNextItem) {
                cellSelected = this.getLastCell(cell);
            }
        }
        return cellSelected;
    }

    /**
     * Go to prev cell by press shift + tab on keyboard
     * - Always go to prev cell if prev-cell isn't first-cell on a row
     * - If prev-cell is first-cell , prev-cell is last cell of prev row
     */
    private gotoPrev(canGoToNextItem = false) {
        let cell = this.getPrevCell(this.cellSelected, canGoToNextItem);
        if (cell) {
            // Clear history of prev cell
            this.setPrevCellSelected(null);

            this.setSelectedCell(cell);
        }
    }


    private getLeftRightCell(cell: DatatableCell, columns: DatatableColumn[]): DatatableCell {
        let row = cell.row;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < columns.length; i++) {
            let column = columns[i];
            if (this.isCellSelectable({row: row, col: column})) {
                let clonedCell: DatatableCell = {
                    row: row,
                    col: column
                };
                let ref = this.getRef(clonedCell);
                if (ref !== clonedCell) {
                    if (this.isCellSelectable(ref)) {
                        return ref;
                    } else {
                        continue;
                    }
                }
                if (this.isCellSelectable(clonedCell)) {
                    return clonedCell;
                }
            }
        }
        return null;
    }

    private getColumnIndex(cell: DatatableCell): number {
        let columns = this.getColumns();
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].property === cell.col.property) {
                return i;
            }
        }
    }

    private getRightCell(cell: DatatableCell): DatatableCell {
        let columns = this.getColumns();
        let columnsFilters: DatatableColumn[] = [];
        for (let i = this.getColumnIndex(cell) + 1; i < columns.length; i++) {
            columnsFilters.push(columns[i]);
        }
        return this.getLeftRightCell(cell, columnsFilters);
    }

    private getLeftCell(cell: DatatableCell): DatatableCell {
        let columns = this.getColumns();
        let columnsFilters: DatatableColumn[] = [];
        for (let i = this.getColumnIndex(cell) - 1; i >= 0; i--) {
            columnsFilters.push(columns[i]);
        }
        return this.getLeftRightCell(cell, columnsFilters);
    }

    /**
     * Get next-cell by tab
     * @param {DatatableCell} cell
     * @param canGoToNextItem
     * @returns {DatatableCell}
     */
    private getNextCell(cell: DatatableCell, canGoToNextItem: boolean): DatatableCell {
        let cellSelected = this.getRightCell(cell);
        if (cellSelected) {
            return cellSelected;
        } else {
            if (canGoToNextItem) {
                cellSelected = this.getFirstCell(cell);
            }

        }
        return cellSelected;
    }

    private _getNewRow(cell: DatatableCell): DatatableRow {
        if (this.getNewRow) {
            return this.getNewRow(cell);
        } else {
            return {
                level: 0,
                parentId: -1
            };
        }
    }

    private getFirstCell(cell: DatatableCell): DatatableCell {
        let rowIndex = this.getIndexOfRow(cell.row);
        if (rowIndex >= this.getRows().length - 1) {
            // Create new row
            this.insertDataAt({
                Count: 1,
                ListItems: [this._getNewRow(cell)]
            }, this.getRows().length, {});

        }


        let nextRow = this.getRows()[rowIndex + 1];
        for (let col of this.getColumns()) {
            let iCell = {col: col, row: nextRow};
            let ref = this.getRef(iCell);
            if (this.isCellSelectable(ref)) {
                return ref;
            }
        }
    }

    private getLastCell(cell: DatatableCell): DatatableCell {
        let rowIndex = this.getIndexOfRow(cell.row);
        if (rowIndex > 0) {
            let prevRow = this.getRows()[rowIndex - 1],
                columns = this.getColumns();
            for (let i = columns.length - 1; i >= 0; i--) {
                let col = columns[i];
                let iCell = {col: col, row: prevRow};
                if (this.isCellSelectable(iCell)) {
                    return iCell;
                }
            }
        }
    }

    private gotoNext(canGoToNextItem = false) {
        let cell = this.getNextCell(this.cellSelected, canGoToNextItem);
        if (cell) {
            // Clear history of prev cell
            this.setPrevCellSelected(null);

            this.makeRowExistInDom(cell.row, `up`).subscribe(() => {
                this.setSelectedCell(cell);
            });
        }

    }

    getColumns(): DatatableColumn[] {
        let columns: DatatableColumn[] = [];
        this.headerComponent.headerCellChildren.forEach((col) => {
            columns.push(col.columnDef);
        });
        return columns;
    }

    private getRows(): DatatableRow[] {
        return this.bodyComponent.items;
    }

    /**
     * Check cell in the left
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInLeftViewPort(container: JQuery): boolean {
        let scroller = this.$element.find(`ntk-datatable-scroller-horizontal .aside-center`),
            cell = container,
            left_1 = cell.offset().left,
            left_2 = scroller.offset().left,
            right_2 = left_2 + scroller.outerWidth();
        return left_2 <= left_1 && left_1 <= right_2;
    }


    /**
     * Check cell in the right
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInRightViewPort(container: JQuery): boolean {
        let scroller = this.$element.find(`ntk-datatable-scroller-horizontal .aside-center`),
            cell = container,
            left_1 = cell.offset().left,
            right_1 = left_1 + cell.outerWidth(),
            left_2 = scroller.offset().left,
            right_2 = left_2 + scroller.outerWidth();
        return (left_2 <= right_1 && right_1 <= right_2);
    }

    /**
     * Check cell in the bottom
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInTopViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container,
            offset_1 = cell.offset(),
            top_1 = offset_1.top,
            offset_2 = scroller.offset(),
            top_2 = offset_2.top,
            bottom_2 = top_2 + scroller.outerHeight();
        return (top_2 <= top_1 && top_1 <= bottom_2);
    }

    /**
     * Check cell in the bottom
     * @param {JQuery} container
     * @returns {boolean}
     */
    private isCellInBottomViewPort(container: JQuery): boolean {
        let scroller = $(this.scroller),
            cell = container,
            offset_1 = cell.offset(),
            top_1 = offset_1.top,
            bottom_1 = top_1 + cell.outerHeight(),
            offset_2 = scroller.offset(),
            top_2 = offset_2.top,
            bottom_2 = top_2 + scroller.outerHeight();
        return (top_2 <= bottom_1 && bottom_1 <= bottom_2);
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

    private getRowContainerFromId(row: DatatableRow): JQuery {
        return this.$element.find('#datatable-row-id-' + row.UniqueKey);
    }

    private onRowUpdated(row: DatatableRow): Observable<DatatableRow> {
        return new Observable((subscriber) => {
            let ob = this.rowReady.asObservable().subscribe((data) => {
                let item = data[0],
                    rowComponent: DatatableRowComponent = data[1];
                if (row.UniqueKey === item.UniqueKey) {
                    setTimeout(() => {
                        rowComponent.safeApply();
                        subscriber.next(item);
                        subscriber.complete();
                        ob.unsubscribe();
                    }, 100);
                }
            });
        });
    }


    private makeRowExistInDom(row: DatatableRow, position: string): Observable<any> {
        // Find element in dom
        let rowContainer = this.getRowContainerFromId(row);
        if (row.Id === -1 || rowContainer.length === 0) {
            return new Observable((subscriber) => {
                let rowIndex = this.getIndexOfRow(row);
                // Scroll to row
                this.scrollToRowIndex(rowIndex, position);

                // Scroll complete
                this.onRowUpdated(row).subscribe(() => {
                    subscriber.next();
                    subscriber.complete();
                });
            });
        } else {
            return of(true);
        }

    }

    /**
     * Scroll to cell if cell is outside view
     * @param cell
     * @param rowContainer
     * @private
     */
    private scrollToCell(cell: DatatableCell, rowContainer: JQuery) {
        let colIndex = this.getColumnIndex(cell);
        let container = this.getElementCellInRow(rowContainer, colIndex);
        if (!this.isCellContainViewPort(container)) {
            let left = null,
                top = null,
                scroller = $(this.scroller),
                cellElement = container.closest('ntk-datatable-cell'),
                virtualScroll = this.$element.find(`ntk-datatable-scroller-horizontal .aside-center`);

            let direction = {
                left: this.isCellInLeftViewPort(container),
                right: this.isCellInRightViewPort(container),
                top: this.isCellInTopViewPort(container),
                bottom: this.isCellInBottomViewPort(container)
            };


            if (!direction.left) {
                left = virtualScroll.scrollLeft() - (virtualScroll.offset().left - cellElement.offset().left);
            }
            if (!direction.right) {
                let scrollerWidth = virtualScroll.width(),
                    virtualScrollContent = this.$element.find(`ntk-datatable-scroller-horizontal .aside-center .fixed-table-horizontal-thumb`);
                if (container.width() < scrollerWidth) {
                    left = (cellElement.offset().left - virtualScrollContent.offset().left) + cellElement.outerWidth() - scrollerWidth;
                }
            }
            if (!direction.top) {
                top = this.scroller.scrollTop - (scroller.offset().top - cellElement.offset().top);
            }
            if (!direction.bottom) {
                let scrollerHeight = scroller.height(),
                    scrollerContent = $(this.scroller).find(`.total-padding`);
                top = (cellElement.offset().top - scrollerContent.offset().top) + cellElement.outerHeight() - scrollerHeight;
            }


            if (left !== null && cell.col.pin === DatatableColumnPin.center) {
                this.$element.find('ntk-datatable-scroller-horizontal .aside-center').scrollLeft(left);
            }
            if (top !== null) {
                this.scroller.scrollTop = top;
            }
        }
    }


    /**
     * Scroll to row by row-index
     * @param {number} rowIndex
     * @param {string} position
     * @returns {number}
     */
    private scrollToRowIndex(rowIndex: number, position?: string) {
        let top = this.itemHeight * rowIndex;
        if (position === 'up') {
            let bodyHeight = $(this.scroller).height();
            top = this.itemHeight * rowIndex - bodyHeight + this.itemHeight;
        }
        this.scroller.scrollTop = top;
    }

    private getElementCellInRow(rowEl: JQuery, colIndex: number): JQuery {
        return rowEl.find('ntk-datatable-cell:eq(' + colIndex + ')');
    }


    /**
     * Set prev selected cell
     * @param {DatatableCell} cell
     */
    private setPrevCellSelected(cell: DatatableCell) {
        this.prevCell = cell;
    }

    /**
     * Go to left-cell
     */
    private goLeftCell() {
        if (this.cellSelected) {
            let upCell = this.getLeftCell(this.cellSelected);
            if (upCell) {
                // Clear history of prev cell
                this.setPrevCellSelected(null);

                // Set selected-cell
                this.setSelectedCell(upCell);
            }
        }
    }

    private goRightCell() {
        if (this.cellSelected) {
            let upCell = this.getRightCell(this.cellSelected);
            if (upCell) {
                // Clear history of prev cell
                this.setPrevCellSelected(null);

                // Set selected-cell
                this.setSelectedCell(upCell);
            }
        }
    }

    /**
     * Go to down-cell
     */
    goDownCell() {
        if (this.cellSelected) {
            let cell = this.getDownCell(this.cellSelected, DatatableKeyboardNavigation.KeyDown);
            if (cell) {
                this.makeRowExistInDom(cell.row, `up`).subscribe(() => {
                    if (!this.isRef(this.cellSelected)) {
                        this.setPrevCellSelected(this.cellSelected);
                    }
                    this.setSelectedCell(cell);
                });

            }
        }
    }


    /**
     * Get down-cell
     * @param {DatatableCell} cell
     * @param {TableEditableKeyboardNavigation} keyName
     * @returns {DatatableCell | null}
     */
    private getDownCell(cell: DatatableCell, keyName: DatatableKeyboardNavigation): DatatableCell {
        let rows = this.getRows();
        let columnsFilters: any[] = [];
        for (let i = this.getIndexOfRow(cell.row) + 1; i < rows.length; i++) {
            columnsFilters.push(rows[i]);
        }
        return this.getUpDownCell(cell, columnsFilters);
    }

    /**
     * Get up-cell
     * @param {DatatableCell} cell
     * @param {TableEditableKeyboardNavigation} keyName
     * @returns {DatatableCell | null}
     */
    private getUpCell(cell: DatatableCell, keyName: DatatableKeyboardNavigation): DatatableCell {
        let columns: DatatableRow[] = [];
        for (let i = this.getIndexOfRow(cell.row) - 1; i >= 0; i--) {
            columns.push(this.bodyComponent.items[i]);
        }
        return this.getUpDownCell(cell, columns);
    }

    /**
     * Go to up cell
     */
    private goUpCell() {
        if (this.cellSelected) {
            let cell = this.getUpCell(this.cellSelected, DatatableKeyboardNavigation.KeyUp);
            if (cell) {
                this.makeRowExistInDom(cell.row, `down`).subscribe(() => {
                    if (!this.isRef(this.cellSelected)) {
                        this.setPrevCellSelected(this.cellSelected);
                    }
                    this.setSelectedCell(cell);
                });
            }
        }
    }

    private getUpDownCell(cell: DatatableCell, rows: DatatableRow[]): DatatableCell | null {
        let col = cell.col;
        for (let row of rows) {
            if (this.isCellSelectable({row: row, col: col})) {
                if (this.isRef(cell) && this.prevCell) {
                    col = this.prevCell.col;
                }
                let clonedCell: DatatableCell = {row: row, col: col};
                let ref = this.getRef(clonedCell);
                if (ref !== clonedCell) {
                    if (this.isCellSelectable(ref)) {
                        return ref;
                    } else {
                        continue;
                    }
                }
                if (this.isCellSelectable(clonedCell)) {
                    return clonedCell;
                }
            }
        }
        return null;
    }

    isEqual(cell1: DatatableCell, cell2: DatatableCell) {
        if (cell1 === cell2) {
            return true;
        }
        if ((cell1 && !cell2) || (!cell1 && cell2)) {
            return false;
        }
        return cell1.col.property === cell2.col.property && cell1.row.UniqueKey === cell2.row.UniqueKey;
    }

    onCellClick(cell: DatatableCell) {
        if (this.isEqual(this.cellSelected, cell)) {
            return;
        }
        this.setPrevCellSelected(null);
        this.setSelectedCell(cell);
    }

    onCellDblClick(cell: DatatableCell) {
        this.changeToEditMode(cell);
    }

    changeToViewMode() {
        this.cellSelectedMode = DatatableCellMode.View;
        this.getCells().forEach((cellComponent) => {
            cellComponent.isEditMode = false;
        });
    }

    changeToEditMode(cell: DatatableCell) {
        if (!this.isCellEditable(cell)) {
            return;
        }
        this.cellSelectedMode = DatatableCellMode.Edit;
        let cellComponent = this.getCellComponentFromCell(cell);
        if (cellComponent) {
            cellComponent.isEditMode = true;
        }
    }

    getCellComponentFromCell(cell: DatatableCell): DatatableCellComponent {
        if (!cell) {
            return null;
        }
        let row = this.bodyComponent.rowComponents.find((item) => {
            return item.row.UniqueKey === cell.row.UniqueKey;
        });
        if (row) {
            return row.cellComponents.find((item) => {
                return item.cell.property === cell.col.property;
            });
        }
        return null;
    }

    private getCells(): DatatableCellComponent[] {
        let cells = [];
        this.bodyComponent.rowComponents.forEach((row) => {
            row.cellComponents.forEach((cell) => {
                cells.push(cell);
            });
        });
        return cells;
    }

    private setCellComponentValue(cell: DatatableCell, value: any) {
        let cellComponent = this.getCellComponentFromCell(cell);
        if (cellComponent) {
            cellComponent.setValue(value);
        }
    }

    private isValidKey(key: string) {
        let charList = 'abcdefghijklmnopqrstuvwxyz0123456789`~-_=+[{]}\\|;:\'",<.>/?',
            strKey = key.toLowerCase();
        return charList.indexOf(strKey) !== -1;
    }

    private isNumber(value: any) {
        return isFinite(parseFloat(value + ``));
    }

    private isDatatableDataTypeNegative(controlType: DatatableDataType): boolean {
        let result: boolean;
        switch (controlType) {
            case DatatableDataType.PositiveNumber:
            case DatatableDataType.PositiveDecimal:
                result = true;
                break;
            default:
                result = false;
        }
        return result;
    }

    private isDatatableDataTypeNumber(controlType: DatatableDataType): boolean {
        let result: boolean;
        switch (controlType) {
            case DatatableDataType.Decimal:
            case DatatableDataType.Number:
            case DatatableDataType.PositiveNumber:
            case DatatableDataType.PositiveDecimal:
                result = true;
                break;
            default:
                result = false;
        }
        return result;
    }

    /**
     * Get first cell which is invalid
     * @returns {any}
     */
    getFirstCellInvalid(): DatatableCell {
        let rows = this.getRowsExpandedGroup(),
            cols = this.getColumns();
        // tslint:disable-next-line:prefer-for-of
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            let row = rows[rowIndex];
            if (row.Id === -1) {
                continue;
            }
            // tslint:disable-next-line:prefer-for-of
            for (let colIndex = 0; colIndex < cols.length; colIndex++) {
                let cell = {row: row, col: cols[colIndex]};
                let ref = this.getRef(cell);
                if (ref !== cell) {
                    if (ref.row.UniqueKey === cell.row.UniqueKey) { // cell is merge and is ref
                        if (!this.isCellValidate(ref)) {
                            return ref;
                        }
                    }
                } else {
                    if (!this.isCellValidate(cell)) {
                        return cell;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Check cell is valid
     * @param cell {DatatableCell}
     * @private
     */
    isCellValidate(cell: DatatableCell): boolean {
        let validate = true,
            row = cell.row,
            col = cell.col,
            value = this.getCellValue(cell);

        // Do not validate in the not editable cell
        if (!this.isCellEditable(cell)) {
            return true;
        }

        let isInValid = this.isRowLoaded(row) && this.isEmpty(value) && col.required;
        if (cell.col.dataType === DatatableDataType.Checkbox && value === false) {
            isInValid = true;
        }
        if (this.isNewRow(row)) {
            let state = this.findState(cell);
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

    private isRowLoaded(row: DatatableRow) {
        return row.Id !== -1;
    }

    private isEmpty(value) {
        let empty = value === null || value === undefined || value === '';
        if (!empty && value) {
            empty = (value + '').trim() === '';
        }
        return empty;
    }


    /**
     * Check row new
     * @param {TableEditableRow} row
     * @returns {boolean}
     */
    private isNewRow(row: DatatableRow): boolean {
        return this.changes.added.findIndex((item) => {
            return row.Id === item.Id;
        }) !== -1;
    }


    private findState(cell: DatatableCell): DatatableRowState {
        let row = cell.row,
            rowState = _.find(this.rowsStateManager, {Id: row.Id});
        return rowState ? rowState[cell.col.property] : null;
    }


    private clone(row: DatatableRow): DatatableRow {
        return JSON.parse(JSON.stringify(row));
    }


    /**
     * remove row|rows in viewport
     * @param data
     */
    removeRow(data: DatatableRow | DatatableRow[]) {
        // Convert object|array to array
        let rows: DatatableRow[] = [];
        if (_.isArray(data)) {
            rows = <DatatableRow[]>data;
        } else {
            rows.push(data);
        }


        // Remove rows in viewport
        this.removeArray(this.items, rows);

        let pos = this.items.indexOf(data);
        if (pos !== -1) {
            this.items.splice(pos, 1);
        }

        // Add to changes for saving
        rows.forEach((row) => {
            this.changes.deleted.push(row);
            this.removed.emit(row);
        });

        this.fixRender();
    }

    private fixRender() {
        let viewport = this.bodyComponent.virtualScroll.getViewPort(),
            viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ? this.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
        this.bodyComponent.viewPortItems.splice(0, this.bodyComponent.viewPortItems.length);
        viewPortItems.forEach((viewPort) => {
            this.bodyComponent.viewPortItems.push(viewPort);
        });
    }

    /**
     * Check control validation
     * @returns {boolean}
     */
    isDataValid(): boolean {
        this.updateStates();
        return this.getFirstCellInvalid() === null;
    }

    getChanges() {
        let added = this.changes.added.filter((item) => {
                return !item.isGroup;
            }),
            edited = this.changes.edited.filter((item) => {
                return !item.isGroup;
            }),
            deleted = this.changes.deleted.filter((item) => {
                return !item.isGroup;
            });
        edited = edited.filter((row) => {
            return this.changes.deleted.findIndex((item) => {
                    return row.Id === item.Id;
                }) === -1 &&
                this.changes.added.findIndex((item) => {
                    return row.Id === item.Id;
                }) === -1;
        });
        added = added.filter((row) => {
            return this.changes.deleted.findIndex((item) => {
                return row.Id === item.Id;
            }) === -1;
        });
        deleted = deleted.filter((row) => {
            return this.changes.added.findIndex((item) => {
                return row.Id === item.Id;
            }) === -1;
        });
        return {
            added: added,
            edited: edited,
            deleted: deleted
        };
    }

    /**
     * Check row modified
     * @param {DatatableRow} row
     * @returns {boolean}
     */
    private isRowModified(row: DatatableRow): boolean {
        let clone1 = row,
            clone2 = this.originalRows.find((originalRow) => {
                return clone1.Id === originalRow.Id;
            }),
            isModified = false;
        this.columns
            .filter((col) => {
                return this.isCellEditable({row: row, col: col});
            })
            .forEach((column) => {
                let values1 = this.getCellValue({row: clone1, col: column});
                let value2 = (clone2 && this.getCellValue({row: clone2, col: column})) || null;
                if (JSON.stringify(values1) !== JSON.stringify(value2)) {
                    isModified = true;
                }
            });
        return isModified;
    }

    markCellModified(cell: DatatableCell) {
        let row = cell.row;
        if (!this.isNewRow(row)) { // Row is not new
            let pos = this.changes.edited.findIndex((r) => {
                return r.Id === row.Id;
            });
            if (pos === -1) { // row is not in edited
                if (this.isRowModified(row)) {
                    this.changes.edited.push(row);
                }
            } else {
                if (!this.isRowModified(row)) {
                    this.changes.edited.splice(pos, 1);
                }
            }
        }
    }

    private updateStates() {
        // Touch control if row is new
        this.rowsStateManager.forEach((rowState) => {
            this.columns.forEach((c) => {
                let name = c.property;
                let status = rowState[name];
                if (status) {
                    status.touched = true;
                    let row = this.items.find((r) => {
                        return r.Id === rowState.Id;
                    });
                    if (row) {
                        let cell = {row: row, col: c};
                        let cellComponent = this.getCellComponentFromCell(cell);
                        if (cellComponent) {
                            cellComponent.checkValid();
                        }
                    }
                }
            });
        });
    }

    updateState(cell: DatatableCell) {
        let state = this.findState(cell);
        if (state) {
            state.touched = true;
        }
    }

    getTopIndex(): number {
        let index = 0;
        if (this.selected) {
            index = this.getIndexOfRow(this.selected);
        }
        return index;
    }

    getCellSelected(): DatatableCell {
        return this.cellSelected;
    }


    /**
     * Render control from data, dont use to refresh data
     */
    updateLayout() {
        this.bodyComponent.updateColumns();
    }

    forceExpandRow(currentRow: DatatableRow) {
        let rows = this.getRows();
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            if (row.isGroup && row.isExpanded && !row.expanded) {
                let list: DatatableRow[] = [];
                this.getRowExpandRecursive(row, list);
                let pos = list.indexOf(currentRow);
                if (pos !== -1) {
                    row.expanded = true;
                    this.datatableService.raisExpandCollapseChanged();
                    let options = this.getChildOptions(row);
                    this.loadData(row, 0, 10000, options.queryOptions).subscribe((data: any) => {
                        this.insertDataAt(data, i + 1, options);
                    });
                }
            }
        }
    }

    private getRowExpandRecursive(row: DatatableRow, list) {
        list.push(row);
        if (row.isGroup && row.isExpanded && !row.expanded) {
            let options = this.getChildOptions(row);
            this.loadData(row, 0, 10000, options.queryOptions).subscribe((data: any) => {
                data.ListItems.forEach((item: DatatableRow) => {
                    this.getRowExpandRecursive(item, list);
                });
            });
        }
    }

    private getRowsExpandedGroup() {
        let rows: DatatableRow[] = this.getRows();
        let list: DatatableRow[] = [];
        rows.forEach((row) => {
            this.getRowExpandRecursive(row, list);
        });
        return list;
    }
}
