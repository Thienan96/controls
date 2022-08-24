import {
    DatatableCell,
    DatatableColumn,
    DatatableGroup,
    DatatableRow,
    DatatableViewState,
    ISort
} from '../../datatable/shared/datatable.model';
import {DatatableComponent} from '../../datatable/datatable/datatable.component';
import {ChangeDetectorRef, EventEmitter, Injector, Input, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {debounceTime, tap} from 'rxjs/operators';
import {forkJoin, of, Subject, Subscription} from 'rxjs';
import {StorageKeys, StorageLocation, StorageService} from '../services/storage.service';
import {PreferencesService} from '../services/preferences.service';
import * as _ from 'underscore';
import {ColumnsSelectionDialog} from '../dialogs/columns-selection-dialog/columns-selection.dialog';
import {HelperService} from '../services/helper.service';
import {MatCheckboxChange} from '@angular/material';
import {BaseController} from './base-controller';
import {LinkListItem} from '../tree/LinkListItem';
import {CheckListItemWrapper} from '../../expandable/shared/expandable.model';
import {DatatableService} from '../../datatable/shared/datatable.service';

export class DatatableController extends BaseController implements OnInit, OnDestroy {

    @ViewChild(DatatableComponent, {static: true}) datatable: DatatableComponent;

    @Input() storageKey: string;
    /** Depend on what we want the grid work we can set 'Setting' it will get from generel setting or it mode for fix */
    @Input() rowMode: 'normal' | 'compact' | 'setting' = 'setting';

    // value to know different real start column index and start column on view
    variable = 1;
    checkedCount = 0;
    excludeItems: any[] = [];
    rowHeight: number;
    cellMaxLines: number = 1 || 2;
    isAlternateColor: boolean;
    isSelectAll: boolean;
    defaultSort: ISort;
    visibleColumns: DatatableColumn[];

    protected allColumns: DatatableColumn[];
    selectedRows: DatatableRow;
    rowSelected: DatatableRow;
    protected isExclude: boolean;
    protected _storageSvc: StorageService;

    private _settingsChangeSubscription: Subscription;
    private gridMode: string; // normal, compact
    protected currentSortState: ISort;
    private _coreHelperService: HelperService;

    // multiple request reload data
    private debouncer: Subject<any> = new Subject<any>();

    protected root: LinkListItem<DatatableRow> = new LinkListItem<DatatableRow>({
        UniqueKey: -1
    });
    protected groups: DatatableGroup[] = [];
    protected zone: NgZone;
    protected sortChanged = new EventEmitter();
    forceRefresh = true;

    constructor(public cd: ChangeDetectorRef, protected injector: Injector) {
        super(injector);
        this._coreHelperService = injector.get(HelperService);
        this._storageSvc = injector.get(StorageService);
        this.zone = injector.get(NgZone);
        const preferencesService = injector.get(PreferencesService);

        this.debouncer.pipe(debounceTime(500)).subscribe(() => {
            this.saveStates();

            // Have to refresh data if press sort
            this.datatable.items.splice(0, this.datatable.items.length);
            this.refreshDatatable(true, true);
        });

        this._settingsChangeSubscription = preferencesService.onSettingsChanged().subscribe(v => {
            if (this.rowMode === 'setting' && v
                && (v.gridMode !== this.gridMode || v.gridAlternateColor !== this.isAlternateColor)) {
                this.restoreGeneralSettings();
                this.refreshDatatable(this.forceRefresh);
            }
        });
    }

    ngOnInit() {
        this.visibleColumns = _.clone(this.allColumns);
        this.restoreGeneralSettings();
        this.restoreGridStates();
    }

    ngOnDestroy() {
        if (this._settingsChangeSubscription) {
            this._settingsChangeSubscription.unsubscribe();
        }

        super.ngOnDestroy();
    }

    onSelect(row: DatatableRow) {
        this.selectedRows = row;
        this.rowSelected = row;
    }

    onRowDbClick(row: DatatableRow) {
        console.log('dbClick', row);
    }

    selectedAllChanged($event: MatCheckboxChange) {
        this.isSelectAll = $event.checked;
        this.datatable.items.forEach(item => {
            if (item) {
                item.isChecked = this.isSelectAll;
            }
        });
        this.checkedCount = this.isSelectAll ? this.datatable.items.length : 0;
        this.isExclude = this.isSelectAll;
        this.excludeItems.splice(0, this.excludeItems.length);
    }

    stateChanged(event: MatCheckboxChange, row: any) {

        // GF-210: problem of cannot scroll on Chome when checked, we need to blur all elements
        if (event && event.source && event.source._inputElement) {
            event.source._inputElement.nativeElement.blur();
        }

        row.isChecked = event.checked;
        if (event.checked) {
            this.checkedCount++;
            if (this.checkedCount === this.datatable.items.length) {
                this.isSelectAll = true;
            }

            if (this.isExclude) {
                const pos = this.excludeItems.findIndex((item) => {
                    return item['Id'] === event.source.value['Id'];
                });
                if (pos !== -1) {
                    this.excludeItems.splice(pos, 1);
                }
            }
        } else {
            this.checkedCount--;
            if (this.isSelectAll) {
                this.isSelectAll = false;
            }
            if (this.isExclude) {
                this.excludeItems.push(event.source.value);
            }
        }

        this.safeApply();
    }

    onColumnSorted(event: ISort) {
        if (!this.datatable) {
            return;
        }
        this.setSort(event);
        this.debouncer.next();
    }

    columnResized(event: DatatableColumn) {
        const c = this.visibleColumns.find(vc => vc.property === event.property);
        if (c) {
            c.width = event.width;
        }
        this.saveStates();
    }

    openSelectColumnsDialog(): Observable<DatatableColumn[]> {
        const allColumns = _.clone(this.allColumns);
        const visibleColumns = _.clone(this.visibleColumns);
        let orderOfColumns = new Array(allColumns.length);

        allColumns.forEach((c) => {
            const idx = visibleColumns.findIndex((cc: any) => cc.property === c.property);
            c.showing = (idx >= 0 ? true : false);
            if (idx >= 0) {
                c.width = visibleColumns[idx].width;
                orderOfColumns[idx] = c;
            } else {
                orderOfColumns.push(c);
            }
        });
        orderOfColumns = orderOfColumns.filter(c => c.property && c.property);

        const dialogData = {titleKey: 'btSelectColumns', items: orderOfColumns, defaultOrder: allColumns};

        return this._coreHelperService.DialogService.openDialog(ColumnsSelectionDialog, dialogData, '650px', '75vh').pipe(tap((result) => {
            if (result) {
                this.visibleColumns = [];
                for (let selected of result) {
                    let idx = this.allColumns.findIndex(c => c.property === selected.property);
                    this.visibleColumns.push(this.allColumns[idx]);
                }
                this.saveStates();
            }
        }));
    }

    onSelectColumns() {
        this.openSelectColumnsDialog().subscribe((result) => {
            if (result) {
                setTimeout(() => { // delay to render
                    // Refresh grid
                    this.refreshDatatable(this.forceRefresh);
                }, 100);
            }
        });
    }

    clearSort() {
        this.defaultSort = undefined;
        this.currentSortState = undefined;
    }

    protected getCurrentSort(): string {
        return this.currentSortState
            ? this.parseSortDirectionToSortId(this.currentSortState)
            : this.defaultSort
                ? this.parseSortDirectionToSortId(this.defaultSort)
                : undefined;
    }

    protected getDefaultSort(): ISort | undefined {
        return undefined;
    }

    protected loadData(row: DatatableRow, startIndex: number, pageSize: number, options?: any): Observable<any> {
        throw new Error('not yet implemented loadData function');
    }

    /**
     * Refresh list
     */
    onRefresh() {
        this.refreshDatatable(true);
    }

    onGroupChanged() {
        this.datatable.updateColumns();
    }


    protected onExpandedChanged(ev) {
    }

    protected getCheckedItemIds(): string[] {
        const checkedIds = [];
        this.datatable.items.forEach(item => {
            if (item && item.isChecked) {
                checkedIds.push(item.Id);
            }
        });
        return checkedIds;
    }

    protected getCheckedItems(): any[] {
        const checkeds = [];
        this.datatable.items.forEach(item => {
            if (item && item.isChecked) {
                checkeds.push(item);
            }
        });
        return checkeds;
    }

    protected getExcludeItemIds(): string[] {
        return this.excludeItems.map((item) => {
            return item.Id;
        });
    }

    protected saveStates() {
        if (!this.storageKey) {
            return;
        }

        const states: DatatableViewState = new DatatableViewState();
        states.visibleColumns = this.getCurrentColumnsState();
        states.sortBy = this.currentSortState;

        let gridStatesDictionary: { [index: string]: DatatableViewState } = this._storageSvc.getUserValue(StorageKeys.GridViewStates, StorageLocation.Local);
        if (!gridStatesDictionary) {
            gridStatesDictionary = {};
        }

        gridStatesDictionary[this.storageKey] = states;

        this._storageSvc.setLocalUserValue(StorageKeys.GridViewStates, gridStatesDictionary);
    }

    protected restoreColumnStates(visibleColumns) {
        this.visibleColumns = [];
        visibleColumns.forEach(c => {
            const colState = this.allColumns.find(vc => vc.property === c.name);
            if (colState) {
                colState.width = c.width;
                this.visibleColumns.push(colState);
            }
        });
    }

    protected restoreGridStates(): any {
        if (!this.storageKey) {
            return;
        }
        const gridStatesDictionary: { [index: string]: DatatableViewState } = this._storageSvc.getUserValue(StorageKeys.GridViewStates, StorageLocation.Local);
        if (!gridStatesDictionary || !gridStatesDictionary[this.storageKey]) {
            this.restoreSort(this.getDefaultSort());
            this.restoreColumnStates(this.getDefaultColumns());
            return undefined;
        }

        const datatableState = gridStatesDictionary[this.storageKey];
        this.restoreSort(datatableState.sortBy);

        if (datatableState.visibleColumns) {
            this.restoreColumnStates(datatableState.visibleColumns);
        } else {
            this.restoreColumnStates(this.getDefaultColumns());
        }
        return datatableState;
    }

    private parseSortDirectionToSortId(event): string {
        const columnIndex = this.visibleColumns.findIndex(c => c.property === event.prop);
        return (event.dir === 'desc' ? '-' : '') + String(columnIndex + this.variable);
    }

    protected restoreSort(sort: ISort) {
        let newSort = sort;
        if (!newSort) {
            newSort = this.getDefaultSort();
        }
        this.setSort(newSort);
    }

    protected setSort(sort: ISort) {
        this.defaultSort = sort;
        this.currentSortState = sort;
        this.sortChanged.emit(sort);
    }

    protected getDefaultColumns() {
        let defaultColumns = [];
        defaultColumns.push(...this.allColumns.filter(c => c.isDefault).map(c => {
            return {name: c.property, width: c.width};
        }));
        return defaultColumns;
    }

    private getCurrentColumnsState(): Array<{ name: string, width: number }> {
        if (this.datatable) {
            return this.visibleColumns.map(c => {
                return {name: c.property, width: c.width};
            });
        }
    }

    private restoreGeneralSettings() {
        const generalSettings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local);

        if (this.rowMode === 'setting') {
            if (generalSettings && generalSettings.gridMode) {
                this.gridMode = generalSettings.gridMode;
            } else {
                this.gridMode = 'normal';
            }
        } else {
            this.gridMode = this.rowMode.toLowerCase();
        }

        if (generalSettings && this.rowMode === 'setting') {
            this.isAlternateColor = generalSettings.gridAlternateColor || false;
        }

        this.rowHeight = this.gridMode === 'compact' ? 31 : 50;
        this.cellMaxLines = this.gridMode === 'compact' ? 1 : 2;
    }

    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    onCellClick(cell: DatatableCell, $event: MouseEvent) {
        if (this.datatable.isCellSelectable(cell)) {
            $event.stopImmediatePropagation();
            this.datatable.onCellClick(cell);
        }
    }

    onCellDblClick(cell: DatatableCell, $event: MouseEvent) {
        if (this.datatable.isCellSelectable(cell)) {
            this.datatable.onCellDblClick(cell);
        }
    }

    onDatePickerClick(cell: DatatableCell, $event: MouseEvent) {
        if (this.datatable.isCellSelectable(cell)) {
            $event.stopImmediatePropagation();
            this.zone.run(() => {
                this.datatable.setSelectedCell(cell);
                this.datatable.changeToEditMode(cell);
            });
        }
    }

    onDropdownClick(cell: DatatableCell, $event: MouseEvent) {
        if (this.datatable.isCellSelectable(cell)) {
            $event.stopImmediatePropagation();
            this.zone.run(() => {
                this.datatable.setSelectedCell(cell);
                this.datatable.changeToEditMode(cell);
            });
        }
    }

    onLineAdded(row: DatatableRow) {
        // Create new row
        let newRowData: DatatableRow = {
            Id: this.createGuid(),
            level: row.level,
            parentId: row.parentId,
            isNew: true
        };

        // Update properties by group
        this.groups.forEach((group) => {
            newRowData[group.property] = row[group.property];
        });

        // Insert to list (viewport)
        let rowIndex = this.datatable.items.indexOf(row);

        this.zone.run(() => {
            this.datatable.insertRow(newRowData, rowIndex + 1);
        });
    }

    onLineAfterAdded(row: DatatableRow, list: DatatableRow[]) {
        let position = this.datatable.items.indexOf(row);
        let prevRow = this.datatable.items[position - 1]; // Item is up of row
        let positionInCache = 0;
        if (prevRow) {
            positionInCache = list.findIndex((item: DatatableRow) => {
                return item.Id === prevRow.Id;
            });
            if (positionInCache === -1) {
                positionInCache = 0;
            } else {
                positionInCache = positionInCache + 1;
            }
        }
        list.splice(positionInCache, 0, row);
    }

    onGroupAfterAdded(row: DatatableRow) {
        let parent: DatatableRow = this.datatable.items.find((item) => {
            return item.UniqueKey === row.parentId;
        });
        if (!parent) {
            parent = this.root.itemData;
        }
        let children = this.datatable.items.filter((item) => {
            return item.parentId === parent.UniqueKey;
        });
        let position = children.indexOf(row);
        let prevRow = children[position - 1]; // Item is up of row

        let insertedNode: LinkListItem<DatatableRow>;
        if (prevRow) {
            // Insert after preRow
            let prevNode = this.root.find((item) => {
                return prevRow.Id === item.Id;
            });
            insertedNode = LinkListItem.insertAfter(prevNode, row);
        } else {
            // Insert to parent if prevRow is null
            let nodeParent = this.root.find((item) => {
                return parent.Id === item.Id;
            });
            insertedNode = LinkListItem.newItem(nodeParent, row);
        }

        // Check group was loaded
        if (row.isGroup) {
            insertedNode.isLoaded = true;
        }
    }


    onLineRemoved(row: DatatableRow) {
        this.zone.run(() => {
            this.datatable.removeRow(row);
        });
    }

    onGroupRemoved(row: DatatableRow) {
        this.forceLoadRow(row).subscribe((needDeleted) => {
            this.datatable.removeRow(needDeleted);
        });
    }

    onLineAfterRemoved(row: DatatableRow, list: DatatableRow[]) {
        let position = list.findIndex((item) => {
            return item.Id === row.Id;
        });
        list.splice(position, 1);
    }

    onGroupAfterRemoved(row: DatatableRow, list: DatatableRow[]) {
        let node = this.getNode(row);
        if (node) {
            node.removeItem();
        }
        this.onLineAfterRemoved(row, list);
    }

    onLineCopied(row: DatatableRow) {
        let newRow: DatatableRow = this.clone(row);
        newRow.Id = this.createGuid();
        newRow.UniqueKey = null;
        newRow.isNew = true;
        this.zone.run(() => {
            this.copyLine(newRow, row);
        });
    }

    /**
     * Generate new-row
     */
    createGuid() {
        return `new-id-` + this._coreHelperService.UtilityService.createGuid();
    }

    copyLine(newLine: DatatableRow, preRow: DatatableRow) {
        let index = this.datatable.getIndexOfRow(preRow);
        return this.datatable.insertRow(newLine, index + 1);
    }

    private forceLoadRow(row: DatatableRow): Observable<any> {
        let rows: DatatableRow[] = [row];
        let node = this.getNode(row);
        if (node.itemData.isGroup) {
            return new Observable((subscriber) => {
                this.datatable.forceLoadRow(row).subscribe((data: any) => {
                    let obs = [];
                    data.ListItems.forEach((item) => {
                        obs.push(this.forceLoadRow(item));
                    });
                    if (obs.length === 0) {
                        subscriber.next(rows);
                        subscriber.complete();
                    } else {
                        forkJoin(obs).subscribe((result) => {
                            result.forEach((items) => {
                                rows = rows.concat(items);
                            });
                            subscriber.next(rows);
                            subscriber.complete();
                        });
                    }

                });
            });
        } else {
            return of(rows);
        }

    }

    protected copyGroup(newGroup: DatatableRow, oldGroup: DatatableRow) {
        this.forceLoadRow(oldGroup).subscribe(() => {
            let position = this.getPositionOfNewGroup(oldGroup);
            let insertedRow = this.datatable.insertRow(newGroup, position + 1);
            let insertedNode = this.getNode(insertedRow);


            let newNode = this.cloneChildrenNode(this.getNode(oldGroup));
            newNode.getChildren().forEach((n) => {
                n.itemData[newGroup.queryOptions.groupBy] = newGroup.Value; // Update from value
                n.appendChild(insertedNode);
            });


            insertedNode.getDescendants().forEach((n) => {
                this.datatable.afterInsertRow(n.itemData);
            });
        });
    }


    protected getNode(row: DatatableRow): LinkListItem<DatatableRow> {
        return this.root.find((item) => {
            return item.Id === row.Id;
        });
    }

    /**
     * Clone node and
     * @param node
     * @private
     */
    private cloneChildrenNode(node: LinkListItem<DatatableRow>): LinkListItem<DatatableRow> {
        let parentItem: DatatableRow = this.clone(node.itemData);
        let list: DatatableRow[] = [parentItem];
        node.getDescendants().forEach((item) => {
            let cloned: DatatableRow = this.clone(item.itemData);
            cloned.Id = this.createGuid();
            cloned.isNew = true;
            list.push(cloned);
        });
        let tree = this.buildTreeStructure(list, parentItem);
        tree.travel((n) => {
            n.isLoaded = true;
        });
        return tree;
    }


    private getItemsInBranch(items: DatatableRow[], rootBranchItem: DatatableRow, isExcludeRootBranchItem: boolean): DatatableRow[] {
        // all the visit items are already well sorted
        // that mean the parent item is always have lower index than the child item
        let startIndex: number = items.findIndex((item) => {
            return item.UniqueKey === rootBranchItem.UniqueKey;
        });

        if (startIndex < 0) {
            return [];
        }

        let itemsInBranch: DatatableRow[] = [];
        itemsInBranch.push(rootBranchItem);

        let idsInBranch = [];
        idsInBranch.push(rootBranchItem.UniqueKey);

        for (let i = startIndex + 1; i < items.length; i++) {
            let parentItemId = items[i].parentId;

            // branch item must belong the current branch
            if (!parentItemId || idsInBranch.indexOf(parentItemId) < 0) {
                break;
            }

            idsInBranch.push(items[i].UniqueKey);
            itemsInBranch.push(items[i]);
        }

        // delete the first one
        if (isExcludeRootBranchItem) {
            idsInBranch.splice(0, 1);
            itemsInBranch.splice(0, 1);
        }

        return itemsInBranch;
    }

    /**
     * Convert array to tree
     * @param items
     * @param rootItem
     * @protected
     */
    protected buildTreeStructure(items: any[], rootItem: any = null): LinkListItem<CheckListItemWrapper> {
        // calculate the range of items effected.
        let processItems: any[] = [];
        let rootNode: LinkListItem;
        if (!rootItem) { // Is Root
            rootNode = new LinkListItem(null);
            items.forEach((item) => {
                processItems.push(item);
            });
        } else {
            rootNode = new LinkListItem(rootItem);
            processItems = this.getItemsInBranch(items, rootItem, true);
        }

        while (processItems.length > 0) {
            // pop first item to create node
            let currentItem = processItems[0];

            // remove all item relative to this current items
            let branchItems = this.getItemsInBranch(processItems, currentItem, false);

            // remove all items in current branch
            for (let i = processItems.length - 1; i >= 0; i--) {
                if (branchItems.indexOf(processItems[i]) >= 0) {
                    processItems.splice(i, 1);
                }
            }
            // build the current node based on current visit item and append it to the rootNode
            let newNode: LinkListItem<CheckListItemWrapper>;
            if (branchItems.length > 1) {
                newNode = this.buildTreeStructure(branchItems, currentItem);
            } else {
                newNode = new LinkListItem(currentItem);
            }
            newNode.appendChild(rootNode);
        }

        return rootNode;
    }

    protected clone(data) {
        return JSON.parse(JSON.stringify(data));
    }


    protected getPositionOfNewGroup(row: DatatableRow) {
        let position = this.datatable.items.findIndex((item) => {
            return item.UniqueKey === row.UniqueKey;
        });
        let children = this.datatable.items.filter((item) => {
            return item.parentId === row.UniqueKey;
        });
        if (children.length > 0) {
            position = this.datatable.items.indexOf(children[children.length - 1]);
        }
        return position;
    }

    getGroupValue(row: DatatableRow, groupBy) {
        return row.Value;
    }

    refreshDatatable(forceRefresh: boolean, keepLeftScrollOffset = false) {
        this.checkedCount = 0;
        this.isSelectAll = false;
        this.isExclude = false;

        // Change to view-mode
        this.datatable.changeToViewMode();

        // Unselect cell
        this.datatable.unSelectCell();
        this.datatable.unSelectRow();


        if (forceRefresh) {
            // Clear flag cache
            this.root.isLoaded = false;
            this.root.travel((item) => {
                item.isLoaded = false;
            });

            this.datatable.updateColumns(false);

            this.datatable.refreshGrid({keepScroll: keepLeftScrollOffset});

        } else {
            // Collapse tree
            this.collapseTree();


            let topIndex = this.datatable.getTopIndex();

            // Select Row
            let firstItem = this.datatable.items[topIndex];
            this.datatable.setSelectedRow(firstItem);

            // Scroll to topIndex
            this.datatable.bodyComponent.scrollToIndex(topIndex);

            // Scroll to left
            if (!keepLeftScrollOffset) {
                this.datatable.scrollTo(0);
            }


            // Update columns
            this.datatable.updateColumns(false);
        }

    }


    protected collapseTree() {
        // Collapse children of root
        this.root.getChildren().forEach((node) => {
            this.datatable.collapseChildren(node.itemData);
        });

        // Raise update tree
        let datatableService = this.injector.get(DatatableService);
        datatableService.raisExpandCollapseChanged();
    }

    protected isRowLoaded(parent: DatatableRow) {
        if (parent === null) {
            return this.root.isLoaded;
        } else {
            let node = this.root.find((item) => {
                return item.Id === parent.Id;
            });
            return node ? node.isLoaded : false;
        }
    }

    isDataValid(): boolean {
        return this.datatable.isDataValid();
    }

    updateLayout() {
        this.datatable.updateLayout();
    }
}
