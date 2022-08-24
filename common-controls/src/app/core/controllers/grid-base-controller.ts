import {AfterViewInit, Injector, Input, OnDestroy, OnInit} from '@angular/core';
import {HelperService} from '../services/helper.service';
import {GridColumnDef, GridViewState, Page, SortDef, SortEvent} from '../../shared/models/ngxTable.model';
import {DataTableColumnDirective, DatatableComponent, SelectionType} from '@swimlane/ngx-datatable';
import {Observable, of, Subject, Subscription, timer} from 'rxjs';
import {ColumnsSelectionDialog} from '../dialogs/columns-selection-dialog/columns-selection.dialog';
import {StorageKeys, StorageLocation, StorageService} from '../services/storage.service';
import {IDataItems} from '../../shared/models/common.info';

import * as _ from 'underscore';
import {PreferencesService} from '../services/preferences.service';
import {debounceTime, distinctUntilChanged, map, takeUntil} from 'rxjs/operators';
import {BaseController} from './base-controller';

export class GridBaseController extends BaseController implements AfterViewInit, OnDestroy, OnInit {

    private _coreHelperService: HelperService;

    private _allPenndingLoad: Subscription[] = [];

    // this var is to allow to know if the page init has been init for first time or not
    // we initially use this.page.totalElements = -1 but it cause the grid error sometime.
    // so we replace by this variable
    private _isPageInit = false;
    page = new Page();
    rows = new Array<any>();
    private _loadedRows: boolean[] = [];
    columns: GridColumnDef[] = [];

    sorts?: SortDef[];

    loading: boolean;

    shouldShowCheck = false;

    isSelectAll = false;

    checkedCount = 0;

    selectedRows = [];

    listSelectedRows = [];

    isExclude = false;
    excludeItems: any[] = [];

    gridMode;

    // To allow EJ4 access
    isAlternateColor = false;  // NBSHD-3801: allow custom alternate color

    // In editing mode, we not allow the user reordering the column
    public allowReorderingColumns: boolean = true

    // To allow the user temporarily show/hide columns without save to the reference
    public keepColumnsConfiguration: boolean = true;

    public stateRestored: boolean = false;

    rowHeight = 31;
    cellMaxLines = 2;

    // different real start column index and start column on view
    variable = 1;

    appendRows: any[] = [];

    private _columnsHash: { [index: string]: GridColumnDef } = {};

    private _availableColumns: GridColumnDef[];

    private _currentSort?: string;

    protected _storageSvc: StorageService;

    private datatableBodyElement: Element;

    private _preOffsetX: number;

    private _preOffsetY = 0;
    private _needRestoreXOffset = false;

    // this flag to sure that it has call refresh at least one time to ready
    private _ready = false;

    private _indexToSelect?: number;
    private _dataFirstPage: any;
    private _pageSize: number;
    protected _settingsChangeSubscription: Subscription;

    private _loadPageSub: Subject<any>;
    /**
     * This method to update the tab header with the column body
     */
    @Input() storageKey: string;
    /** Depend on what we want the grid work we can set 'Setting' it will get from generel setting or it mode for fix */
    @Input() rowMode: 'Normal' | 'Compact' | 'Setting' = 'Setting';

    defaultColumns?: { name: string, width: number }[];

    private _cacheMiddleLines: { [index: number]: boolean[] } = {};
    private invalidateColumnsWidth() {
        if (this.getGidComponent()) {
            let header = this.getGidComponent().headerComponent;

            if (header && header.columns) {
                for (let i = 0; i < header.columns.length; i++) {
                    const col = <DataTableColumnDirective>header.columns[i];

                    if (col.resizeable) {
                        header.onColumnResized(col.width, col);
                    }
                }
            }
        }
    }

    /**
     *
     * @param injector : system injector (injector: Injector)
     * @param dataRowStyle : depend on data we pass as row, its a array of values or and object with properties
     */
    constructor(injector: Injector, protected dataRowStyle: 'array' | 'object' = 'array') {
        super(injector);
        this._coreHelperService = injector.get(HelperService);
        this._storageSvc = injector.get(StorageService);

        const preferencesService = injector.get(PreferencesService);

        this._settingsChangeSubscription = preferencesService.onSettingsChanged().subscribe(v => {
            if (this.rowMode === 'Setting' && v
                && (v.gridMode !== this.gridMode || v.gridAlternateColor !== this.isAlternateColor)) {
                const generalSettings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local) || {};
                generalSettings.gridMode = v.gridMode;
                generalSettings.gridAlternateColor = v.gridAlternateColor;
                this._ready = false;
                this.restoreGeneralSettings(generalSettings);
                this.forceCalculatePageSize();
                this.refresh();
                // GF-106: general setting from angular js
                let grid = this.getGidComponent();
                grid.rowClass = this.getRowClass.bind(this);
                //
            }
        });

        this._loadPageSub = new Subject();

        this._loadPageSub.asObservable().pipe(
            takeUntil(this.destroy$),
            debounceTime(100),
            distinctUntilChanged()
        ).subscribe(x => {
            // console.log('---- start to load page data');
            this.loadPageData(x);
        });
        
    }

    // simulateRowModeChange() {
    //     if (this.rowMode === 'Compact') {
    //         this.rowMode = 'Normal';
    //     } else {
    //         this.rowMode = 'Compact';
    //     }

    //     this._ready = false;
    //     this.restoreGeneralSettings();
    //     this.refresh();
    // }

    ngOnInit(): void {
        this.restoreGeneralSettings();
    }

    ngAfterViewInit() {
        this._isPageInit = false;
        this.page.totalElements = 0;
        const lastState = this.restoreStates();
        this._availableColumns = [];

        // update customize default columns
        if (this.defaultColumns) {
            const allcols = this.getAllColumnsDef();

            _.forEach(this.defaultColumns, c => {
                const foundIdx = _.findIndex(allcols, (cc: GridColumnDef) => {
                    if (cc.name === c.name) {
                        cc.isDefault = true;
                        cc.initialWidth = c.width;
                        return true;
                    }

                    return false;
                });

                this._availableColumns.push(...allcols.splice(foundIdx, 1));
            });
            allcols.forEach(ccc => { ccc.isDefault = false; });
            this._availableColumns.push(...allcols);
        } else {
            this._availableColumns = this.getAllColumnsDef();
        }

        if (lastState) {
            for (let i = 0; i < lastState.visibleColumns.length; i++) {
                const colDef = _.find(this._availableColumns, c => c.property === lastState.visibleColumns[i].name);

                // Need to make sure the column still use
                if (colDef) {
                    const col = _.clone(colDef);
                    col.currentWidth = lastState.visibleColumns[i].width;
                    this.columns.push(col);
                    this._columnsHash[col.name] = col;
                }
            }


            setTimeout(() => {
                this.sorts = lastState.sortBy;
                if (!this.sorts) {
                    const defaultSort = this.getDefaultSort();
                    if (defaultSort) { this.sorts = [defaultSort]; }
                }
                // restore sort when init
                if (this.sorts && this.sorts.length > 0) {
                    const idx = _.findIndex(this.columns, c => c.property === this.sorts[0].prop);
                    this._currentSort = (this.sorts[0].dir === 'desc' ? '-' : '') + String(idx + this.variable);
                }
                this.invalidateColumnsWidth();

                this.stateRestored = true;

            }, 500);
        } else {
            // Fix: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'undefined'

            setTimeout(() => {
                this.sorts = [this.getDefaultSort()];

                this.stateRestored = true;
                
            }, 200);
            // this is the one by default state
            for (let i = 0; i < this._availableColumns.length; i++) {
                if (this._availableColumns[i].isDefault) {
                    const col = _.clone(this._availableColumns[i]);
                    // TODO: get from storerage
                    col.currentWidth = col.initialWidth;
                    this.columns.push(col);
                    this._columnsHash[col.name] = col;
                }
            }
        }

        this.datatableBodyElement = this.getGidComponent().element.querySelector('datatable-body');

        this.updateLimit(30);

        setTimeout(() => {
            let grid = this.getGidComponent();
            grid.selectionType = SelectionType.single;
            grid.externalPaging = true;
            grid.externalSorting = true;
            grid.rowClass = this.getRowClass.bind(this);


            grid.messages = {
                // Message to show when array is presented
                // but contains no values
                emptyMessage: 'No data to display',

                // Footer total message
                totalMessage: 'total',

                // Footer selected message
                selectedMessage: 'selected'
            };

            if (this._coreHelperService.TranslationService.isExistsTranslation('lbNoDataToDisplay')) {
                grid.messages.emptyMessage = this._coreHelperService.TranslationService.getTranslation('lbNoDataToDisplay');
            }
        }, 500);


    }

    ngOnDestroy(): void {
        if (this._settingsChangeSubscription) { this._settingsChangeSubscription.unsubscribe(); }
        this.stopAllCurrentRequests();
        super.ngOnDestroy();
    }

    private stopAllCurrentRequests() {
        this._allPenndingLoad.forEach(s => {
            s.unsubscribe();
        });
        this._allPenndingLoad = [];
        this.loading = false;
    }

    updateLimit(size) {
        if (this.getGidComponent()) {
            this.getGidComponent().limit = size;
            this.getGidComponent().recalculatePages();
        }
    }

    getColumnWidth(columnName: string) {
        return this._columnsHash[columnName].currentWidth;
    }

    getDefaultSort(): SortDef | undefined {
        return undefined;
    }

    getGidComponent(): DatatableComponent | undefined {
        throw new Error('not yet implemented getGidComponent function');
    }

    getAllColumnsDef(): GridColumnDef[] {
        throw new Error('not yet implemented getAllColumnsDef function');
    }

    loadData(startIndex: number, pageSize: number, columns: string[], sort: string): Observable<any> {
        throw new Error('not yet implemented loadData function');
    }

    onBeforeRefresh() {
        // console.log('onBeforeRefresh');
    }

    // Get json contains other value of custom fields
    protected getCustomValueSelectedRow(row?: any): any {
        let currentRow = row ? row : this.selectedRows[0];
        if (!currentRow) {
            return undefined;
        }
        return currentRow[this.getCurrentColumns().length];
    }

    // Get json contains other value of custom fields
    // Method to allow get and then set value (Prevent to try loop in get method getCustomValueSelectedRow)
    protected getToFillCustomValueSelectedRow(): any {
        let currentRow = this.selectedRows[0][0];
        if (currentRow) {
            let indexSelectedRow: number = _.findIndex(this.rows, (p: any) => p[0] === currentRow);

            if (indexSelectedRow >= 0) {
                return this.rows[indexSelectedRow][this.getCurrentColumns().length];
            }
        }
        return undefined;
    }

    protected getCurrentColumns(): string[] {
        const result = [];

        result.push('Id');
        _.forEach(this.columns, c => {
            result.push(c.property);
        });
        return result;
    }

    private internalLoadData() {

        if (!this._isPageInit) {
            return;
        }

        // console.log('---actual startindex = ', startIndex);
        // console.log('this._preOffsetY = ', this._preOffsetY);
        // console.log('this.rowHeight = ', this.rowHeight);
        let estimateIndex = Math.max(0, Math.floor(this._preOffsetY / this.rowHeight) - 2);

        let startIndex = estimateIndex;

        // console.log('---estimated startindex = ', estimateIndex);
        // console.log('---- actual this.page.size = ', this.page.size);

        //console.log('---this._loadedRows = ', this._loadedRows);

        let pageSize = this.page.size + 5;

        let bakPageSize = pageSize;

        // now we adjust the start index based on if the row is load
        for (let i = 0; i < bakPageSize; i++) {
            if (this._loadedRows[i + estimateIndex]) {
                pageSize--;
            } else {
                startIndex = i + estimateIndex;
                break;
            }
        }

        // console.log('---- final start index = ', startIndex);
        // console.log('---- final page size = ', pageSize);
        // console.log('----this.page.totalElements = ', this.page.totalElements);

        let totalCount = this.page.totalElements;

        if (startIndex + pageSize >= totalCount) {
            pageSize = totalCount - startIndex;
        }

        // console.log('---- final 2 page size = ', pageSize);

        if (startIndex >= totalCount || pageSize <= 0) {
            this.loading = false;
            return;
        }

        delete this._cacheMiddleLines;
        this._cacheMiddleLines = {};


        // let startIndex = this.page.pageNumber * this.page.size;


        // console.log('-----------------------------------load start startIndex=', startIndex, ' page size=', pageSize);
        // const page = this.page.pageNumber;

        this.loading = true;

        // temp hack to fix some page missing
        // if (startIndex > pageSize) {
        //     startIndex = startIndex - pageSize;
        // }



        // pageSize *= 3;

        let responseLoadData = (result: any) => {
            // console.log('-----------------------------------load finish startIndex=', startIndex, ' page size=', pageSize);

            const rows = [...this.rows];
            // insert rows into new position
            let actualIndex = startIndex;
            let foundSelected = false;

            if (result && result.ListItems) {
                for (let i = 0; i < result.ListItems.length; i++) {
                    // Prevent rows out of index
                    if (rows[i + startIndex]) {
                        Object.assign(rows[i + startIndex], result.ListItems[i]);
                        this._loadedRows[i + startIndex] = true;
                    }

                    if (this._indexToSelect === actualIndex || (-1 < this._indexToSelect && this._indexToSelect < (this.rows.length))) {
                        foundSelected = true;
                    }
                    actualIndex++;
                    // rows[i + startIndex] = items[i];
                }
                // if ((-1 < this._indexToSelect) && (this._indexToSelect < this.rows.length)) { // found index need to select
                //     foundSelected = true;
                // }
            }

            // set rows to our new rows
            this.rows = rows;
            let selectedIndex: number = this._indexToSelect; // keep index of selected a row (not use _indexToSelect where it was deleted)
            // Fix problem selected row has not yet loaded but it was selected to emit with wrong id (0: Number/Index row)
            if (this._indexToSelect <= (startIndex + pageSize)
                && (foundSelected || (this._indexToSelect === -1 && this.selectedRows.length === 0 && this.rows.length > 0))) {
                this.selectedRows = [this.rows[foundSelected ? this._indexToSelect : 0]];

                // console.log('row to select:', this.selectedRows);
                timer(800)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(() => {
                        this.onRowSelect({ selected: this.selectedRows });
                    }); // need to refector, in case data respronse more than 800ms will occur bugs

                if (foundSelected) { delete this._indexToSelect; }
            }
            this.loading = false;

            // Fix problem selected row has not yet loaded but it was selected to emit with wrong id (0: Number/Index row)
            // Scroll at first time (startIndex == 0)
            if (foundSelected && startIndex === 0 && selectedIndex >= 0) {
                setTimeout(() => {
                    if (this.getGidComponent()) {
                        this.datatableBodyElement.scrollTo({ top: this.rowHeight * selectedIndex });
                    }
                    this.restoreOffset();
                }, 1);
            } else {
                this.restoreOffset();
            }
        };
        if (startIndex === 0) {
            setTimeout(() => {
                responseLoadData({ ListItems: this._dataFirstPage });
            }, 1);
        } else {
            // console.log('----------------------------------- loadData: ', startIndex, '/', pageSize);
            this._allPenndingLoad.push(this._loadData(startIndex, pageSize, this.getCurrentColumns(), this._currentSort).subscribe(responseLoadData, (err) => {
                // console.log(err);
                this.loading = false;
            }));
        }
    }


    private initPageInfor(): Observable<any> {
        if (!this.getGidComponent()) { return of(null); }

        if (!this._isPageInit && !this.loading && this._pageSize > 0) {
            this.loading = true;
            this._isPageInit = true;

            // console.log('----init first page: ', this._pageSize);

            return this._loadData(0, Math.floor(this._pageSize + 5), this.getCurrentColumns(), this._currentSort).pipe(
                map(c => {
                    if (c) {
                        let countItems = 0;
                        let indexToSelect: number | undefined;
                        if (this._coreHelperService.UtilityService.isInteger(c)) {
                            indexToSelect = null;
                            countItems = c;
                        } else {
                            countItems = c.Count;
                            indexToSelect = c.Index;
                            this._indexToSelect = indexToSelect || -1;
                            this._dataFirstPage = c.ListItems;

                            // console.log('---- this._indexToSelect=', this._indexToSelect);
                        }
                        let templateRow: any;
                        let idIndex: any;

                        if (this.dataRowStyle === 'array') {
                            templateRow = {
                                0: '_0'
                            };
                            idIndex = 0;
                        } else {
                            templateRow = {
                                Id: '_0'
                            };
                            idIndex = 'Id';
                        }

                        if (this.dataRowStyle === 'array') {
                            for (let i = 1; i <= this.columns.length; i++) {
                                templateRow[i] = '';
                            }
                        }

                        for (let i = 0; i < countItems; i++) {
                            const r = _.clone(templateRow);
                            r[idIndex] = '_' + i;
                            this.rows.push(r);
                            this._loadedRows[i] = false;
                        }
                        // console.log('result: ', c);
                        this.page.totalElements = countItems;
                        this.page.totalPages = this.page.totalElements / this.page.size;
                        this.loading = false;

                        if (!countItems || countItems === 0) {
                            this.isSelectAll = false;

                            timer(500)
                                .pipe(takeUntil(this.destroy$))
                                .subscribe(() => {
                                    this.onRowSelect({selected: this.selectedRows});
                                });
                        }
                        this.checkedCount = this.isSelectAll ? this.rows.length : 0;
                        // console.log('initPageInfor finish: ', this.page);
                        return this.page.totalElements;
                    } else {
                        this.page.totalElements = 1;
                        return this.page.totalElements;
                    }
                })
            );

        } else {
            return of(this.page.totalElements);
        }
    }

    loadPageData(pageInfo) {
        // console.log('loadPageData:', pageInfo);

        this.page.pageNumber = pageInfo.offset;
        this.page.size = pageInfo.pageSize;

        if (!this._isPageInit) {
            // stop current peding request
            this.stopAllCurrentRequests();
            this._allPenndingLoad.push(this.initPageInfor().subscribe(x => {
                this.internalLoadData();
            }, (err) => {
                this.loading = false;
            }));
        } else {
            this.internalLoadData();
        }
    }
    /**
     * This calling from ngx-table
     * @param pageInfo: containt page need to load
     */
    setPage(pageInfo) {
        // console.log('set page:', _.clone(pageInfo));

        // if (isDevMode()) {
        //     console.log('set page:', pageInfo);
        // }
        if (pageInfo.pageSize === null ||
            pageInfo.pageSize === undefined ||
            pageInfo.pageSize <= 0 ||
            isNaN(pageInfo.pageSize)) {
            // console.log('------------------------------------ pagesize empty: ', pageInfo);
            return;
        }

        if (!this._ready) { return; }

        this._pageSize = pageInfo.pageSize;

        // in case page size changed we need to init page infor again
        if (this._isPageInit && this.page.size !== pageInfo.pageSize) {
            this._isPageInit = false;
        }

        // this.loading = true;
        this._loadPageSub.next(_.clone(pageInfo));

        // tslint:disable-next-line:curly
        // if (!this._coreHelperService.AuthenticationService.isAuthenticated) return;
    }

    protected forceCalculatePageSize() {
        if (!this.getGidComponent()) { return; }

        const grid = this.getGidComponent();
        grid.rowHeight = this.rowHeight;
        grid.recalculatePages();
    }

    refresh() {
        // tslint:disable-next-line:curly
        if (!this.getGidComponent()) return;

        this._ready = false;

        // console.log('----- refresh');
        const grid = this.getGidComponent();
        grid.bodyComponent.updateOffsetY(0);

        // if (isDevMode()) {
        //     console.log('grid body height:', grid.bodyHeight);
        //     console.log('grid row height:', grid.rowHeight);

        //     const size = Math.ceil(grid.bodyHeight / (grid.rowHeight as number));
        //     console.log('estimated page size=', size);
        // }

        // grid.calcPageSize();

        // if (isDevMode()) {
        //     console.log('actual size=', grid.pageSize);
        // }

        timer(200)
            .pipe(takeUntil(this.destroy$))
            .subscribe(()=>{
                this._ready = true;            // console.log('call internal refresh');
                this.internalRefresh();
            })
    }

    private internalRefresh(needRestore = true) {
        // tslint:disable-next-line:curly
        if (!this.getGidComponent()) return;

        this.onBeforeRefresh();

        delete this._cacheMiddleLines;
        this._cacheMiddleLines = {};

        // console.log('internalRefresh');
        this._isPageInit = false;
        this.page.totalElements = 0;
        this.page.totalPages = 0;
        this._loadedRows = [];
        this.rows = [];
        this.selectedRows = [];
        this.isSelectAll = false;
        this.shouldShowCheck = false;
        this._needRestoreXOffset = needRestore;
        this._preOffsetY = 0;
        this._pageSize = 0;

        // Reset Exclude
        this.isExclude = false;
        this.excludeItems.splice(0, this.excludeItems.length);
        this.getGidComponent().onBodyPage({ offset: 0 });
    }

    onTableScroll(scroll: any) {
        const offsetX = scroll.offsetX;
        const offsetY = scroll.offsetY;
        // can be undefined sometimes
        if (!!offsetX) {
            this._preOffsetX = offsetX;
        }

        if (!!offsetY) {
            // console.log('scroll to:', offsetY);
            this._preOffsetY = offsetY;
        }
    }

    private restoreOffset() {
        if (this._needRestoreXOffset) {
            this._needRestoreXOffset = false;

            if (this.datatableBodyElement) {
                setTimeout(() => {
                    this.datatableBodyElement.scrollLeft = this._preOffsetX;
                }, 1);
            }

            this.invalidateColumnsWidth();
        }
    }

    onSort(event: SortEvent) {
        // tslint:disable-next-line:curly
        if (!this.getGidComponent()) return;

        const idx = _.findIndex(this.columns, c => c.property === event.column.prop);
        this._currentSort = (event.newValue === 'desc' ? '-' : '') + String(idx + this.variable);

        this.refresh();

        this.saveStates();
    }

    onSortUnit(event: SortEvent) {
        // tslint:disable-next-line:curly
        if (!this.getGidComponent()) return;

        // const idx = _.findIndex(this.columns, c => { return c.property === event.column.prop});
        this._currentSort = (event.newValue === 'desc' ? '-' : '') + '1';

        this.refresh();

        // this.saveStates();
    }

    onColumnResize(event: { column: any, newValue: any }) {
        // console.log('onColumnResize: ', event);
        this.saveStates();
    }

    onColumnReOrder(event: { column: any, newValue: any, prevValue: any }) {
        this.saveStates();
    }

    private getCurrentSortByState(): any {
        const gridComponent = this.getGidComponent();
        if (!gridComponent) { return undefined; }

        return gridComponent.sorts;
    }

    private getCurrentColumnsState(): any {
        const gridComponent = this.getGidComponent();
        if (!gridComponent) { return undefined; }

        // console.log('gridComponent = ', gridComponent);
        const result = [];
        _.forEach(gridComponent._internalColumns, c => {
            if (c.prop) {
                result.push({ name: c.prop, width: c.width });
            }
        });
        return result;
    }

    saveStates() {
        // tslint:disable-next-line:curly
        if (!this.storageKey) return;

        // Do nothing of the user toggle of the save the configuration
        if (!this.keepColumnsConfiguration) return;

        const states: GridViewState = new GridViewState();
        states.visibleColumns = this.getCurrentColumnsState();
        states.sortBy = this.getCurrentSortByState();
        // tslint:disable-next-line:max-line-length
        let gridStatesDictionary: { [index: string]: GridViewState } = this._storageSvc.getUserValue(StorageKeys.GridViewStates, StorageLocation.Local);
        if (!gridStatesDictionary) { gridStatesDictionary = {}; }

        gridStatesDictionary[this.storageKey] = states;

        // console.log('Key to save:', this.storageKey);
        // console.log('State to save:', states);

        this._storageSvc.setLocalUserValue(StorageKeys.GridViewStates, gridStatesDictionary);
    }

    restoreStates(): GridViewState | undefined {
        // tslint:disable-next-line:curly
        if (!this.storageKey) return;

        // console.log('grid restore state with key:', this.storageKey);

        // tslint:disable-next-line:max-line-length
        const gridStatesDictionary: { [index: string]: GridViewState } = this._storageSvc.getUserValue(StorageKeys.GridViewStates, StorageLocation.Local);


        // tslint:disable-next-line:max-line-length
        if (!gridStatesDictionary || (gridStatesDictionary && _.isUndefined(gridStatesDictionary[this.storageKey]))) {
            return undefined;
        }

        const states: GridViewState = gridStatesDictionary[this.storageKey];

        return states;
    }
    // property setting used in case change general setting in ej4
    restoreGeneralSettings(settings?) {
        let generalSettings;
        if (!settings) {
            generalSettings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local);
        } else {
            generalSettings = settings;
        }

        // console.debug('restoreGeneralSettings - generalSettings=', generalSettings);

        if (this.rowMode === 'Setting') {
            if (generalSettings && generalSettings.gridMode) {
                this.gridMode = generalSettings.gridMode;
            } else {
                this.gridMode = 'normal';
            }
        } else {
            this.gridMode = this.rowMode.toLowerCase();
        }

        if (generalSettings && this.rowMode === 'Setting') {
            this.isAlternateColor = generalSettings.gridAlternateColor || false;
        }

        this.rowHeight = this.gridMode === 'compact' ? 31 : 50;
        this.cellMaxLines = this.gridMode === 'compact' ? 1 : 2;
        // setTimeout(() => {
        //     this.rowHeight = this.gridMode === 'compact' ? 31 : 50;
        //     this.cellMaxLines = this.gridMode === 'compact' ? 1 : 2;
        // }, 1);
    }

    selectedAllChanged() {
        // console.log('selected all changed: ', this.isSelectAll);
        this.shouldShowCheck = this.isSelectAll;

        _.forEach(this.rows, item => {
            if (item) { item.isChecked = this.isSelectAll; }
        });
        this.checkedCount = this.isSelectAll ? this.rows.length : 0;

        this.isExclude = this.isSelectAll;
        this.excludeItems.splice(0, this.excludeItems.length);
    }

    stateChanged(event: any, type?: string) {
        if (type === 'hierarchical-list') {
            let numberOfRowChanged = 1;
            let numberOfParentChanged = 0;
            const hierachicArray = this.selectHierarchical(event.source.value);
            hierachicArray.forEach(row => {
                if (row.isChecked !== event.checked) {
                    numberOfRowChanged++;
                }
                row.isChecked = event.checked;
            });
            if (event.checked) {
                let parentArray = [];
                if (event.source.value.IsArchived) {
                    parentArray = this.findParent(event.source.value);
                    parentArray.forEach(childRow => {
                        if (!childRow.isChecked) {
                            numberOfParentChanged++;
                            childRow.isChecked = true;
                        }
                    });
                }
                this.checkedCount += numberOfRowChanged + numberOfParentChanged;
                if (this.checkedCount === this.rows.length) {
                    this.isSelectAll = true;
                }

                if (this.isExclude) {
                    hierachicArray.every(e => {
                        if (this.excludeItems.indexOf(e) > -1) {
                            this.excludeItems.splice(this.excludeItems.findIndex(item => item === e), 1);
                        }
                        return true;
                    });

                }
            } else {
                let uncheckArray = [];
                if (event.source.value.IsArchived) {
                    let hierarchicalNode = [event.source.value, ...this.findParent(event.source.value)];
                    hierarchicalNode.forEach((item, index) => {
                        if (index <= hierarchicalNode.length - 2) {
                            if (this.findItemsSameLevelChecked(hierarchicalNode[index + 1], item).length === 0) {
                                uncheckArray.push(hierarchicalNode[index + 1]);
                                numberOfParentChanged++;
                                hierarchicalNode[index + 1].isChecked = false;
                            }
                        }
                    });
                } else {
                    uncheckArray = this.findParent(event.source.value);
                    uncheckArray.forEach(childRow => {
                        if (childRow.isChecked) {
                            numberOfParentChanged++;
                            childRow.isChecked = false;
                        }
                    });
                }
                this.checkedCount -= numberOfParentChanged + numberOfRowChanged;
                if (this.isSelectAll) { this.isSelectAll = false; }
                if (this.isExclude) {
                    this.excludeItems.push(...hierachicArray.concat(uncheckArray));
                }
            }
        } else {
            if (event.checked) {
                this.checkedCount++;
                if (this.checkedCount === this.rows.length) {
                    this.isSelectAll = true;
                }

                if (this.isExclude) {
                    const pos = this.excludeItems.findIndex((item) => {
                        return item[0] === event.source.value[0];
                    });
                    if (pos !== -1) {
                        this.excludeItems.splice(pos, 1);
                    }
                }
            } else {
                this.checkedCount--;
                if (this.isSelectAll) { this.isSelectAll = false; }
                if (this.isExclude) {
                    this.excludeItems.push(event.source.value);
                }
            }
        }
    }
    findItemsSameLevelChecked(parent, item): any[] {
        return this.selectHierarchical(parent).filter(row => row['Level'] === item['Level'] && row.isChecked);
    }
    findParent(rowUncheck): any[] {
        let hieraArray = this.rows.slice(0, this.rows.findIndex(row => row.Id === rowUncheck.Id));
        let i = hieraArray.length;
        let level = rowUncheck.Level;
        let arr = [];
        for (i >= 0; i--;) {
            if (hieraArray[i].Level < level) { // && hieraArray[i].isChecked
                level -= 1;
                arr.push(hieraArray[i]);
            }
            if (level === 1 || hieraArray[i].Level === 1) {
                { break; }
            }
        }
        return arr;
    }
    selectHierarchical(rowFinding): any[] {
        const indexRow = this.rows.findIndex(row => row.Id === rowFinding.Id);
        let hieraArray = this.rows.slice(indexRow);
        let endIndex = hieraArray.findIndex((row, index) => {
            if (index > 0) {
                // if (!row.Id) {
                //     return index;
                // }
                return row.Level === rowFinding.Level || row.Level < rowFinding.Level || !row.Id;
            }
        });
        endIndex = endIndex === -1 ? hieraArray.length : endIndex;
        return hieraArray.slice(0, endIndex);
    }
    getCheckedItemIds(): string[] {
        const checkedIds = [];
        _.forEach(this.rows, item => {
            if (item && item.isChecked) {
                checkedIds.push(item[0]);
            }
        });
        return checkedIds;
    }

    getCheckedEqtIds(): string[] {
        const checkedIds = [];
        _.forEach(this.rows, item => {
            if (item && item.isChecked) {
                checkedIds.push(item.Id);
            }
        });
        return checkedIds;
    }

    getCheckedItems(): any[] {
        const checkedItems = [];
        _.forEach(this.rows, item => {
            if (item && item.isChecked) {
                checkedItems.push(item);
            }
        });
        return checkedItems;
    }

    getExcludeItemIds(): string[] {
        return this.excludeItems.map((item) => {
            return item[0];
        });
    }

    onRowSelect(event: { selected: any[] }) {
        // console.log('onRowSelect: ', event);
    }

    onSelectColumns(refreshData: boolean = true) {

        const allColums = _.clone(this._availableColumns);
        const currentColumns = this.getCurrentColumnsState();
        let orderOfColumns = new Array(allColums.length);
        console.log('onSelectColumns currentColumns=', currentColumns, allColums);

        _.forEach(allColums, (c, index) => {
            // console.log('c=', c);
            const idx = _.findIndex(currentColumns, (cc: any) => cc.name === c.property);
            // console.log('idx=', idx);
            c.showing = (idx >= 0 ? true : false);
            // console.log('c.showing=', c.showing);
            if (idx >= 0) {
                c.currentWidth = currentColumns[idx].width;
                orderOfColumns[idx] = c;
            } else {
                orderOfColumns.push(c);
            }
        });
        console.log('onSelectColumns orderOfColumns= 2222', orderOfColumns);

        // need to reset the this._currentSort because the index of columns was changed
        let currentSortProperty: string = "";
        let currentSortDesc: boolean = false;
        if (this._currentSort) {
            currentSortDesc = this._currentSort.indexOf('-') === 0;
            let index = Math.abs(parseInt(this._currentSort));
            let columns = this.getCurrentColumns();
            if (index >= 0 && index < columns.length) {
                currentSortProperty = columns[index];
            }
        }

        orderOfColumns = orderOfColumns.filter(c => c.name && c.property);
        // console.log('onSelectColumns clone allColums=', _.clone(allColums));
        // console.log('onSelectColumns allColums=', allColums);
        const dialogData = { titleKey: 'btSelectColumns', items: orderOfColumns, defaultOrder: allColums, allowReorderingColumns: this.allowReorderingColumns };

        this._coreHelperService.DialogService.openDialog(ColumnsSelectionDialog, dialogData, '650px', '75vh').subscribe(result => {
            // console.log('columns result: ', result);

            if (result) {
                this.columns = [];
                this._columnsHash = {};
                for (let i = 0; i < result.length; i++) {
                    const colDef = _.find(this._availableColumns, c => c.property === result[i].property);

                    // Need to make sure the column still use
                    if (colDef) {
                        const col = _.clone(colDef);
                        if (result[i].currentWidth) {
                            col.currentWidth = result[i].currentWidth;
                        } else {
                            col.currentWidth = result[i].initialWidth;
                        }

                        this.columns.push(col);
                        this._columnsHash[col.name] = col;
                    }
                }
                
                if (currentSortProperty) {
                    let allColumns = this.getCurrentColumns();
                    let newIndex = allColumns.findIndex((c) => { return c === currentSortProperty});
                    if (newIndex >= 0) {
                        this._currentSort = (currentSortDesc? '-' : '') + String(newIndex);
                    }
                    else {
                        // The sorted column was remove in the column list
                        this._currentSort = "";
                    }
                }
                

                this.refreshColumns(refreshData);

            }
        });
    }

    // Use when there is no select columns function
    showColumn(column: GridColumnDef, isRefresh: boolean = true) {

        if (!this._availableColumns) return;
        
        let indexInAllColumns = this._availableColumns.findIndex((c) => { return c.name === column.name });
        // Do nothing when not available
        if (indexInAllColumns < 0) return;
        let indexInCurrentColumns = this.columns.findIndex((c) => { return c.name === column.name });
        // Do nothing when column already display
        if (indexInCurrentColumns >= 0) return;

        column.currentWidth = column.initialWidth;

        if (indexInAllColumns <= this.columns.length) {
            this.columns.splice(indexInAllColumns, 0, column);
        }
        else {
            this.columns.push(column);
        }

        this._columnsHash[column.name] = column;

        this.refreshColumns(isRefresh);

    }

    // Use when there is no select columns function
    hideColumn(column: GridColumnDef, isRefresh: boolean = true) {

        if (!this._availableColumns) return;

        let index = this._availableColumns.findIndex((c) => { return c.name === column.name });
        // Do nothing when not available
        if (index < 0) return;
        index = this.columns.findIndex((c) => { return c.name === column.name });
        // Do nothing when column already hide
        if (index < 0) return;

        this.columns.splice(index, 1);
        delete this._columnsHash[column.name];

        this.refreshColumns(isRefresh);

    }

    showAllColumns() {

        if (!this._availableColumns) return;

        let allColums = _.clone(this._availableColumns);
        _.forEach(allColums, (c) => {
            c.showing = true;
        });
        this.columns = [];
        this._columnsHash = {};
        for (let i = 0; i < allColums.length; i++) {
            const colDef = _.find(this._availableColumns, c => c.property === allColums[i].property);
            // Need to make sure the column still use
            if (colDef) {
                const col = _.clone(colDef);
                if (allColums[i].currentWidth) {
                    col.currentWidth = allColums[i].currentWidth;
                } else {
                    col.currentWidth = allColums[i].initialWidth;
                }
                this.columns.push(col);
                this._columnsHash[col.name] = col;
            }
        }
        this.refreshColumns(false);

    }


    toggleKeepColumnsConfiguration(keepColumnsConfiguration: boolean) {
        this.keepColumnsConfiguration = keepColumnsConfiguration;
    }


    restoreColumnStates() {
        const lastState = this.restoreStates();
        if (lastState) {
            this.columns = [];
            this._columnsHash = {};

            for (let i = 0; i < lastState.visibleColumns.length; i++) {
                const colDef = _.find(this._availableColumns, c => c.property === lastState.visibleColumns[i].name);
                // Need to make sure the column still use
                if (colDef) {
                    const col = _.clone(colDef);
                    col.currentWidth = lastState.visibleColumns[i].width;
                    this.columns.push(col);
                    this._columnsHash[col.name] = col;
                }
            }
            this.refreshColumns(false);

        }
    }


    protected onAfterColumnsChanged() {

    }

    private refreshColumns(refreshData: boolean = true) {
        let grid = this.getGidComponent();
        if (grid) {
            grid.headerComponent.offsetX = 0;
            grid.bodyComponent.updateOffsetY(0);
        }

        timer(500)
            .pipe(takeUntil(this.destroy$))
            .subscribe(()=>{
                this.onAfterColumnsChanged();

                if (refreshData)
                    this.internalRefresh(false);
                this.saveStates();
            });
    }

    updateSelectedRow(entity: any, startCoumnIndex = 1) {
        if (this.selectedRows && this.selectedRows.length > 0) {
            // console.log('updateSelectedRow this._lastSelected=', this._lastSelected);
            // console.log('updateSelectedRow incident=', incident);

            // console.log('this.selectedRows[0]=', JSON.stringify(this.selectedRows[0]));

            const gridComponent = this.getGidComponent();
            if (!gridComponent) { return; }

            let colIndex = startCoumnIndex;
            for (let i = 0; i < gridComponent._internalColumns.length; i++) {
                const p = <string>gridComponent._internalColumns[i].prop;
                if (p) {
                    // console.log('property path: ', p);
                    const value = p.split('.').reduce((acc, part) => acc && acc[part], entity);

                    // console.log('index: ', colIndex);
                    // console.log('value: ', value);
                    this.selectedRows[0][colIndex] = value;
                    colIndex++;
                }
            }
        }
    }

    getRowClass(row): string {
        if (this.isAlternateColor) {
            return 'row-alternate-color';
        } else {
            return '';
        }
    }

    /**
     * This is to serve the gid which need display like a tree
     * The method return if the line is the fist line in its level
     * @param index : row index in list
     */
    isFirstItemInLevel(index: number): boolean {
        if (this.rows && index > 0) {
            let item = this.rows[index];
            let pre = this.rows[index - 1];
            return pre.Level < item.Level;
        }

        return index === 0;
    }

    /**
     * This is to serve the gid which need display like a tree
     * The method return an array of indent level which tru/false depend on if need to draw the line on that level or not
     * @param index : row index in list
     */
    calculateIndentLines(index: number): boolean[] {

        if (this._cacheMiddleLines[index]) {
            return this._cacheMiddleLines[index];
        }
        if (this.rows) {
            let item = this.rows[index];

            // in case the line not yet perofomr lazy load finish
            if (!_.has(item, 'Level')) {
                return [];
            }

            let result: boolean[] = new Array(item.Level > 0 ? item.Level - 1 : 0).fill(false);

            // console.log('item =', item.Name, ' level=', item.Level);
            let lastLevel = item.Level;

            if (item.Level > 1) {
                for (let i = index + 1; i < this.rows.length; i++) {
                    if (this.rows[i].Level < lastLevel) {
                        if (this.rows[i].Level === 1) {
                            // console.log('found next item with smaller level =', this.rows[i].Name, ' lv=', this.rows[i].Level);
                            // console.log('return 1: ', result);
                            this._cacheMiddleLines[index] = result;
                            return result;
                        } else {
                            result[this.rows[i].Level - 2] = true;
                        }

                        lastLevel = this.rows[i].Level;
                    }
                }
            }
            // console.log('return 2: ', result);
            this._cacheMiddleLines[index] = result;
            return result;
        }
        // this._cacheMiddleLinesNumber[index] = 0;
        return [];
    }

    scrollToIndex(index: number) {
        if (this.getGidComponent()) {
            this.datatableBodyElement.scrollTo({ top: this.rowHeight * index });
        }
    }

    // Append rows on top
    private _loadData(startIndex: number, pageSize: number, columns: string[], sort: string): Observable<any> {
        let realStartIndex = startIndex;
        let firstDataPart: any[];

        // in case of the control load secodn page and there are append row from caller then we need to check that to adjust the index
        if (this.appendRows && startIndex > 0) {
            if (startIndex < this.appendRows.length) {
                if (startIndex + pageSize <= this.appendRows.length) {

                    let preResult = this.appendRows.slice(startIndex, startIndex + pageSize);
                    return of({ ListItems: preResult });
                } else {
                    firstDataPart = this.appendRows.slice(startIndex, this.appendRows.length);
                    realStartIndex = 0;
                    pageSize -= firstDataPart.length;
                }
            } else {
                realStartIndex -= this.appendRows.length;
            }
        }

        let obResult: Observable<IDataItems<any>> = this.loadData(realStartIndex, pageSize, columns, sort);

        if (obResult) {
            return obResult.pipe(
                map(data => {
                    let result = [];
                    if (startIndex === 0) {
                        // when loading firt page it may contains count and AppendRows
                        // then we need to take into account that to tell the scroller with more rows
                        if (!this.appendRows) this.appendRows = [];
                        let totalCount = 0;
                        if (data.AppendRows || this.appendRows.length > 0) {
                            if (data.AppendRows) this.appendRows.unshift(...data.AppendRows); // push items on top
                            result.push(...this.appendRows);
                            if (pageSize > this.appendRows.length && data.ListItems && data.ListItems.length > 0) {
                                result.push(...data.ListItems.slice(0, pageSize - this.appendRows.length));
                            }

                            totalCount = data.Count + this.appendRows.length;

                        } else {
                            totalCount = data.Count;
                            if (data.ListItems && data.ListItems.length > 0)
                                result.push(...data.ListItems);
                        }
                        let foundIndex = data.Index;
                        // There are some append rows => selected index + count of append rows
                        // Case found index in list (>= 0)
                        if (foundIndex >= 0) foundIndex += this.appendRows.length;

                        return { ListItems: result, Count: totalCount, Index: foundIndex };
                    } else {
                        if (firstDataPart) {
                            result.push(...firstDataPart);
                            if (data.ListItems && data.ListItems.length > 0)
                                result.push(...data.ListItems);
                            // console.log('case of first part:', result);
                            return { ListItems: result };
                        }
                        return data;
                    }
                }));
        }
    }

    isRowLoaded(rowIndex: number) {
        return this._loadedRows[rowIndex];
    }

    get loadedRows() {
        return this._loadedRows;
    }

}

