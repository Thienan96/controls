import { Injector, ViewChild, HostListener, AfterViewInit, OnDestroy, OnInit, AfterContentInit } from '@angular/core';
import { VirtualScrollerComponent, IPageInfo } from 'ngx-virtual-scroller';
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
// import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { Subscription } from 'rxjs/Subscription';
import { ILazyItem, IPageContent, PageStatus, ListQueryCondition } from '../../shared/models/common.info';
import { HelperService } from '../services/helper.service';
import * as _ from 'underscore';
import { BehaviorSubject } from 'rxjs';
import { StorageKeys, StorageLocation, StorageService } from '../services/storage.service';
import interact from 'interactjs';
import { map } from 'rxjs/operators';

export class VirtualScrollDataSource<T extends ILazyItem> implements AfterViewInit, OnDestroy {
    static readonly NUMBER_ITEMS_PER_PAGE: number = 40;

    private _lastNumberOfItemsRequested: number;
    private _dicPages: { [index: number]: IPageContent | undefined } = {};
    private _dataFirstPage: any;
    private _pendingRequests: Subscription[] = [];
    protected _settingsChangeSubscription: Subscription;
    private _selectedItem: T | undefined;
    private _coreHelperService: HelperService;
    private _preventRequestItem = false;
    private _lastStart: number;
    private _lastEnd: number;
    private _timerCheckLoadDataWhileNotActive: Subscription | undefined;
    private _storageSvc: StorageService;
    listMode = 'normal';
    private _isAlternateColor = false;
    protected itemHeight = 100;
    rowHeight = 50;
    private _indexToSelect?: number;

    isSelectAll: boolean;
    shouldShowCheck: boolean;
    checkedCount = 0;

    isExclude = false;
    excludeItems: T[] = [];

    viewPortItems: T[];
    items: T[];
    queryCondition: ListQueryCondition;

    _cacheMiddleLines: { [index: number]: boolean[] } = {};

    // drag&drop
    itemName: string;
    actionContent: string;
    childRowList = [];
    childRowIdList = [];
    childTargetList = [];
    lbMoveAfter: string;
    lbMoveBefore: string;
    lbMoveInside: string;
    msgUniqueCodeName: string;
    dragClass: string;
    mainDropZone: string;
    entityName: string;
    //
    @ViewChild(VirtualScrollerComponent, { static: false })
    protected _virtualScroll: VirtualScrollerComponent;

    @HostListener('window:resize')
    public onWindowResize() {
        this._virtualScroll.refresh();
    }

    @HostListener('mousedown', ['$event'])
    public onMouseDown(event: any) {
        if (event.offsetX >= event.currentTarget.clientWidth - 18) {
            this._preventRequestItem = true;
        }
    }

    @HostListener('mouseup', ['$event'])
    public onMouseUp(event: any) {
        // console.info("mouseup");
        this._preventRequestItem = false;

        // force to request to load items
        this.requestItems(this._lastStart, this._lastEnd);
    }

    constructor(injector: Injector) {
        this._storageSvc = injector.get(StorageService);
        this._coreHelperService = injector.get(HelperService);
        // const preferencesService = injector.get(PreferencesService);
        // this._settingsChangeSubscription = preferencesService.onSettingsChanged().subscribe(v => {
        //     console.log('asd')
        //     this.listMode = v.gridMode;
        //     this._isAlternateColor = v.gridAlternateColor;
        //     this.isSelectAll = false;
        //     this.shouldShowCheck = false;
        //     this.rowHeight = this.listMode === 'compact' ? 25 : 50;
        //     this.setSelectedItem(this.items[0]);
        //     this.refreshList(true);
        // });
    }

    ngAfterViewInit() {
        this._virtualScroll.scrollAnimationTime = 0;
    }

    restoreGeneralSettings() {
        const generalSettings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local);
        if (generalSettings) {
            this.listMode = generalSettings.gridMode;
            this._isAlternateColor = generalSettings.gridAlternateColor;
            this.rowHeight = this.listMode === 'compact' ? 25 : 50;
        }
    }
    ngOnDestroy() {
        if (this._timerCheckLoadDataWhileNotActive) {
            this._timerCheckLoadDataWhileNotActive.unsubscribe();
        }
        if (this._settingsChangeSubscription) {
            this._settingsChangeSubscription.unsubscribe();
        }
    }

    get itemCount(): number {
        if (this.items) {
            return this.items.length;
        }

        return 0;
    }

    getStartEndFromPageIndex(pageIndex: number): number[] {
        const start: number = pageIndex * VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE;
        const end: number = start + VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE;

        return [start, end];
    }

    getPageIndexFromStartEnd(start: number, end: number): number[] {
        const pages: number[] = [];

        const startPage: number = Math.floor(start / VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE);
        const endPage: number = Math.floor(end / VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    }

    updateViewPortChanged(viewPortItems: any[]) {
        this.viewPortItems = viewPortItems;
        this._lastNumberOfItemsRequested = viewPortItems.length;

    }

    onRequestItemsLoad(event: IPageInfo) {
        if (event.startIndex < 0 || event.endIndex < 0) { return; }

        this._lastStart = event.startIndex;
        this._lastEnd = event.endIndex;

        if (!this._preventRequestItem) {
            this.requestItems(this._lastStart, this._lastEnd);
        }
    }

    onRequestAllItems() {
        if (!this._preventRequestItem) {
            this.requestItems(0, 0);
        }
    }

    private requestItems(start: number, end: number, allowCheckingSelectedItem = false) {
        // console.log('requestItems: start:' + start + ' - end:' + end);

        const pages: number[] = this.getPageIndexFromStartEnd(start, end);

        let keptSelectedItem: T | undefined;
        if (this._selectedItem) {
            keptSelectedItem = <T>{};
            Object.assign(keptSelectedItem, this._selectedItem);
        }

        for (let i = 0; i < pages.length; i++) {
            const pageIndex: number = pages[i];
            // console.log('requesting item on page ' + pageIndex);

            let pageContent: IPageContent = this._dicPages[pageIndex];
            if (!pageContent || pageContent.Status === PageStatus.None) {
                if (pageContent) {
                    pageContent.Status = PageStatus.Loading;
                } else {
                    pageContent = { Status: PageStatus.Loading };
                }

                this._dicPages[pageIndex] = pageContent;

                const startEnd: number[] = this.getStartEndFromPageIndex(pageIndex);

                this.onFetchDataStart(pageIndex);

                let responseLoadData = (result: any) => {
                    delete this._cacheMiddleLines;
                    this._cacheMiddleLines = {};
                    let data: any[] = <any[]>result.ListItems || [];
                    // remove request in pending collection
                    this.removePendingRequest(subscription);


                    pageContent.Items = [];
                    let actualItemIndex: number = startEnd[0];

                    for (let k = 0; k < data.length; k++) {
                        // put item in content of page (review to check should or not)
                        const item: any = {};
                        Object.assign(item, data[k]);
                        pageContent.Items.push(item);
                        // copy data to real item
                        if (this.items[actualItemIndex]) { // check items[index] existing
                            Object.assign(this.items[actualItemIndex], item);
                        }
                        if (this._indexToSelect >= 0 && this._indexToSelect === actualItemIndex) {
                            keptSelectedItem = item;
                            // console.log('found item to select=', keptSelectedItem);

                            allowCheckingSelectedItem = true;
                        }
                        actualItemIndex++;
                    }

                    pageContent.Status = PageStatus.Loaded;

                    this.onFetchDataFinished(data);

                    // console.log('>>allowCheckingSelectedItem=', allowCheckingSelectedItem);
                    // check to auto select a item
                    if (!!allowCheckingSelectedItem) {
                        if (keptSelectedItem) {
                            if (this.items && this.items.length > 0) {
                                this.setSelectedItem(keptSelectedItem);
                            } else {
                                this.setSelectedItem(undefined);
                            }
                            // const found = _.find(data, itm => itm.Id === keptSelectedItem.Id);
                            // if (found) {
                            //     setTimeout(() => {
                            //         this.setSelectedItem(found);
                            //     }, 500);
                            // } else {
                            //     if (this.items && this.items.length > 0) {
                            //         this.setSelectedItem(this.items[0]);
                            //     } else {
                            //         this.setSelectedItem(undefined);
                            //     }
                            // }
                        } else {
                            if (this.items && this.items.length > 0) {
                                this.setSelectedItem(this.items[0]);
                            } else {
                                this.setSelectedItem(undefined);
                            }
                        }
                    }
                };

                // console.log('-----------------this._indexToSelect: ', this._indexToSelect);
                let subscription: Subscription;
                if (startEnd[0] === 0) {
                    let subject = new BehaviorSubject<any>({});
                    subject.next({ ListItems: this._dataFirstPage });
                    subscription = subject.asObservable().subscribe(responseLoadData);
                } else {
                    subscription = this.loadData(startEnd[0], VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE).pipe(
                        map(data => <any[]>data)
                    ).subscribe(responseLoadData);
                        
                }
                // keep request in pending collection
                this._pendingRequests.push(subscription);
            }
        }
    }

    refreshList(allowCheckingSelectedItem = false) {
        // clean data
        this.clean();

        // before starting count data
        this.onCountDataStart();

        const subscription = this.loadData(0, VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE).subscribe(data => {
            // remove request in pending collection
            this.removePendingRequest(subscription);

            let countItems = 0;
            let indexToSelect = -1;
            this._indexToSelect = undefined;

            if (this._coreHelperService.UtilityService.isInteger(data)) {
                countItems = data;
            } else {
                countItems = data.Count;
                indexToSelect = data.Index;
                this._dataFirstPage = data.ListItems;
                this._indexToSelect = indexToSelect;
            }

            // console.log('Count result 1: countItems: ' + countItems + ' - indexToSelect: ' + indexToSelect + ' - lastStart: ' + this._lastStart + ' - lastEnd: ' + this._lastEnd + ' - lastNumberOfItemsRequested: ' + this._lastNumberOfItemsRequested);

            const newItems: T[] = [];
            for (let i = 0; i < countItems; i++) {
                const item: any = { UniqueKey: i.toString(), Id: '', Name: '' };
                newItems.push(item);
            }

            this._dicPages = [];
            this.items = newItems;

            this.onCountDataFinished(countItems);

            if (countItems > 0) {
                if (indexToSelect >= 0) {
                    // ensure virtual container initialize OK to scroll correctly
                    // TimerObservable.create(200).subscribe(() => {
                    // console.log('scroll to:', it);

                    this._virtualScroll.scrollToIndex(indexToSelect);

                    // console.log('Count result 2: countItems: ' + countItems + ' - indexToSelect: ' + indexToSelect
                    // + ' - lastStart: ' + this._lastStart + ' - lastEnd: ' + this._lastEnd + ' - lastNumberOfItemsRequested: '
                    // + this._lastNumberOfItemsRequested);

                    if (indexToSelect < this._lastNumberOfItemsRequested) {
                        // when the selected item is in first page, some the scroll doesn't work
                        // we should call request the first page to make the list loaded
                        this.requestItems(0, this._lastNumberOfItemsRequested, allowCheckingSelectedItem);
                    } else {
                        // special case: tab browser is not visible
                        if (this._lastStart === 0 && this._lastEnd < 0 && this._lastNumberOfItemsRequested === 0) {
                            this.tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem, indexToSelect);
                        }
                    }
                    // });
                } else {
                    if (this._lastStart === 0 && this._lastEnd < 0 && this._lastNumberOfItemsRequested === 0) {
                        // special case: tab browser is not visible
                        this.tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem);
                    } else {
                        // the list load data in the first time
                        this.requestItems(0, this._lastNumberOfItemsRequested, allowCheckingSelectedItem);
                    }
                }
            } else {
                if (this._selectedItem) {
                    this.setSelectedItem(undefined);
                }

                if (this.isSelectAll) {
                    this.isSelectAll = false;
                }
            }

            this.checkedCount = this.isSelectAll ? this.itemCount : 0;
        });

        // keep request in pending collection
        this._pendingRequests.push(subscription);
    }

    // When the tab browser is invisible, the request item size work incorrectly (cause _lastNumberOfItemsRequested=0)
    // so we have to try to calculate this property and make a request to get data
    private tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem: boolean, indexToSelect?: number) {
        const heigthContainerElementRef: number = this._virtualScroll.childHeight;
        const heigthContentElementRef: number = this._virtualScroll.childHeight;

        // console.info('LoadDataTabInActive - HeightContainer: ' + heigthContainerElementRef + ' - HeightContent: ' + heigthContentElementRef);

        const height: number = heigthContentElementRef > 0 ? heigthContentElementRef : heigthContainerElementRef;
        if (height > 0) {
            let start = 0;
            let end = 0;
            const availableNumberOfItemsOnList: number = Math.floor(height / this.itemHeight) + 1;

            if (!indexToSelect) {
                // case No selected item (first time app load)
                end = Math.max(availableNumberOfItemsOnList, VirtualScrollDataSource.NUMBER_ITEMS_PER_PAGE);
            } else {
                // case with seleted item (click refresh list)
                // try to load one page which contain selected item
                const pageIndexs: number[] = this.getPageIndexFromStartEnd(indexToSelect, indexToSelect);
                const arr: number[] = this.getStartEndFromPageIndex(pageIndexs[0]);
                start = arr[0];
                end = arr[1];
            }

            // console.info('LoadDataTabInActive - availableNumberOfItemsOnList: ' + availableNumberOfItemsOnList + ' - allowCheckingSelectedItem: ' + allowCheckingSelectedItem + ' - indexToSelect: ' + indexToSelect + ' - start: ' + start + ' - end: ' + end);

            this.requestItems(start, end, allowCheckingSelectedItem);
        }
    }

    private clean() {
        this._pendingRequests.forEach(obs => {
            obs.unsubscribe();
        });

        // reset variables
        this._lastStart = 0;
        this._lastEnd = 0;
        this._lastNumberOfItemsRequested = 0;

        // clear list items
        this._dicPages = [];
        this.items = [];
        this._pendingRequests = [];

        this.isSelectAll = false;
        this.shouldShowCheck = false;
        this.isExclude = false;
        this.excludeItems.splice(0, this.excludeItems.length);
    }

    private removePendingRequest(subscription: Subscription) {
        const idxPendingRequest = this._pendingRequests.indexOf(subscription);
        if (idxPendingRequest >= 0) {
            this._pendingRequests = this._pendingRequests.splice(idxPendingRequest + 1, 1);
        }
    }

    getSelectedItem(): T | undefined {
        return this._selectedItem;
    }

    setSelectedItem(item: T | undefined, checkNullItemId = false, userInteract = false, ignoreRaiseEvent = false) {
        if (!!checkNullItemId) {
            // item is loading
            if (!item || !item.Id) { return; }
        }

        if (item) {
            // console.trace('-----setSelectedItem------', item);
        }

        this._selectedItem = item;
        // reset to make sure it is not select again
        this._indexToSelect = undefined;

        if (!ignoreRaiseEvent) {
            this.onSelectedItemChanged(item);
        }
    }

    isSelectedItem(item: T): boolean {
        if (item && this._selectedItem && item.Id === this._selectedItem.Id) {
            return true;
        }

        return false;
    }

    selectedAllChanged() {
        // console.log('selected all changed: ', this.isSelectAll);
        this.shouldShowCheck = this.isSelectAll;

        // console.log('this.itemCount: ', this.itemCount);
        _.forEach(this.viewPortItems, item => {
            if (item) { item.isChecked = this.isSelectAll; }
        });

        _.forEach(this.items, item => {
            if (item) { item.isChecked = this.isSelectAll; }
        });

        this.checkedCount = this.isSelectAll ? this.itemCount : 0;

        this.isExclude = this.isSelectAll;
        this.excludeItems.splice(0, this.excludeItems.length);
    }
    stateChanged(event: any, value) {
        let numberOfRowChanged = 0;
        let numberOfParentChanged = 0;
        const hierachicArray = this.selectHierarchical(value);
        hierachicArray.forEach(row => {
            if (row.isChecked !== event.checked) {
                numberOfRowChanged++;
            }
            row.isChecked = event.checked;
        });
        if (event.checked) {
            let parentArray = [];
            if (value.IsArchived) {
                parentArray = this.findParent(value);
                parentArray.forEach(childRow => {
                    if (!childRow.isChecked) {
                        numberOfParentChanged++;
                        childRow.isChecked = true;
                    }

                });
            }
            this.checkedCount += numberOfRowChanged + numberOfParentChanged;
            if (this.checkedCount === this.items.length) {
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
            if (value.IsArchived) {
                let hierarchicalNode = [value, ...this.findParent(value)];
                hierarchicalNode.forEach((item, index) => {
                    if (index <= hierarchicalNode.length - 2) {
                        if (this.findItemsSameLevelChecked(hierarchicalNode[index + 1], item).length === 0) {
                            if (hierarchicalNode[index + 1].isChecked) {
                                uncheckArray.push(hierarchicalNode[index + 1]);
                                numberOfParentChanged++;
                                hierarchicalNode[index + 1].isChecked = false;
                            }
                        }
                    }
                });
            } else {
                uncheckArray = this.findParent(value);
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
    }
    findItemsSameLevelChecked(parent, item): any[] {
        return this.selectHierarchical(parent).filter(row => row['Level'] === item['Level'] && row.isChecked);
    }
    findParent(rowUncheck): any[] {
        let hieraArray = this.items.slice(0, this.items.findIndex(row => row.Id === rowUncheck.Id));
        let i = hieraArray.length;
        let level = rowUncheck.Level;
        let arr = [];
        for (i >= 0; i--;) {
            if (hieraArray[i]['Level'] < level) { // && hieraArray[i].isChecked
                level -= 1;
                arr.push(hieraArray[i]);
            }
            if (level === 1 || hieraArray[i]['Level'] === 1) {
                { break; }
            }
        }
        return arr;
    }
    findFristParent(data, checkRow): any {
        if (data && data.length === 0) {
            return null;
        }
        let hieraArray = data.slice(0, data.findIndex(row => row.Id === checkRow.Id));
        let i = hieraArray.length;
        let level = checkRow.Level;
        for (i >= 0; i--;) {
            if (hieraArray[i]['Level'] < level) {
                level -= 1;
                return hieraArray[i];
            }
            if (level === 1 || hieraArray[i]['Level'] === 1) {
                { break; }
            }
        }
        return null;
    }
    selectHierarchical(rowFinding): any[] {
        const indexRow = this.items.findIndex(row => row.Id === rowFinding.Id);
        let hieraArray = this.items.slice(indexRow);
        let endIndex = hieraArray.findIndex((row, index) => {
            if (index > 0) {
                return row['Level'] === rowFinding.Level || row['Level'] < rowFinding.Level || !row.Id;
            }
        });
        endIndex = endIndex === -1 ? hieraArray.length : endIndex;
        return hieraArray.slice(0, endIndex);
    }

    getCheckedItemIds(): string[] {
        if (this.isExclude) {
            return [];
        }
        const checkedItems = [];
        _.forEach(this.items, item => {
            if (item.isChecked) {
                checkedItems.push(item.Id);
            }
        });

        return checkedItems;
    }

    getExcludeItemIds(): string[] {
        return this.excludeItems.map((item: T) => {
            return item.Id;
        });
    }

    getCheckedItems(): any[] {
        const checkedItems = [];
        _.forEach(this.items, item => {
            if (item.isChecked) {
                checkedItems.push(item);
            }
        });

        return checkedItems;
    }
    getCheckedIds(): string[] {
        const checkedIds = [];
        _.forEach(this.items, item => {
            if (item && item['isChecked']) {
                checkedIds.push(item['Id']);
            }
        });
        return checkedIds;
    }
    // onCountDataStart
    onCountDataStart() { }

    // onCountDataFinished
    onCountDataFinished(countItems: number) { }

    // onFetchDataStart
    onFetchDataStart(pageIndex: number) { }

    // onFetchDataFinished
    onFetchDataFinished<T>(items?: T[] | undefined) { }

    // onSelectedItemChanged
    onSelectedItemChanged(item?: T | undefined) { }

    loadData(startIndex: number, pageSize: number): Observable<any> {
        throw new Error('not yet implemented loadData function');
    }

    /**
     * This is to serve the gid which need display like a tree
     * The method return if the line is the fist line in its level
     * @param index : row index in list
     */
    isFirstItemInLevel(index: number): boolean {
        if (this.items && index > 0) {
            let item = this.items[index];
            let pre = this.items[index - 1];
            if (item && pre)
                return pre['Level'] < item['Level'];
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
        if (this.items) {
            let item = this.items[index];

            // in case the line not yet perofomr lazy load finish
            if (!_.has(item, 'Level')) {
                return [];
            }

            let result: boolean[] = new Array(item['Level'] > 0 ? item['Level'] - 1 : 0).fill(false);

            // console.log('item =', item.Name, ' level=', item.Level);
            let lastLevel = item['Level'];

            if (item['Level'] > 1) {
                for (let i = +index + 1; i < this.items.length; i++) {
                    if (this.items[i]['Level'] < lastLevel) {
                        if (this.items[i]['Level'] === 1) {
                            // console.log('found next item with smaller level =', this.rows[i].Name, ' lv=', this.rows[i].Level);
                            // console.log('return 1: ', result);
                            this._cacheMiddleLines[index] = result;
                            return result;
                        } else {
                            result[this.items[i]['Level'] - 2] = true;
                        }

                        lastLevel = this.items[i]['Level'];
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

    scrollToIndex(index: number, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void) {
        this._virtualScroll.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
    }

    // drag & drop
    public draggable(): void {
        const draggingBox = document.querySelector(`.${this.dragClass}`) as any;
        draggingBox.style.transform = 'scale(0)';
        const boxWidth = draggingBox.getBoundingClientRect().width;
        const boxHeight = draggingBox.getBoundingClientRect().height;
        draggingBox.style.transform = 'scale(1)';
        let currentOuterDropzone = null;
        let currentInnerDropzone = null;
        let lastInnerDropzone = null;
        let currentBeforeDropzone = null;
        let lastBeforeDropzone = null;
        let currentAfterDropzone = null;
        let lastAfterDropzone = null;
        let dragRowId: any;
        // let dragParentRowId: any; // ??
        let dragRowLevel: any;
        let dragRowIndex: any;
        let dragRowName: any;
        interact(`.${this.dragClass}`)
            .draggable({
                autoScroll: {
                    container: document.getElementById(this.mainDropZone)
                },
                onstart: event => {
                    dragRowId = JSON.parse(JSON.stringify(event.target.getAttribute('drag-row-Id')));
                    // dragParentRowId = JSON.parse(JSON.stringify(event.target.getAttribute('drag-parent-Id'))); // ??
                    dragRowLevel = JSON.parse(JSON.stringify(event.target.getAttribute('drag-row-Level')));
                    dragRowIndex = JSON.parse(JSON.stringify(event.target.getAttribute('drag-row-index')));
                    dragRowName = JSON.parse(JSON.stringify(event.target.getAttribute('drag-row-name')));
                    // best way is BE support api get child from ID
                    this.childRowList = this.getChildrenRow(this.items, dragRowId,
                        +dragRowLevel);
                    this.childRowIdList = this.childRowList.map(row => row.Id);
                    //
                    draggingBox.classList.remove('display-data');
                    draggingBox.style.position = 'fixed';
                    this.itemName = dragRowName;
                    draggingBox.style.transform = 'scale(1)';
                    draggingBox.style.left = event.clientX - boxWidth / 2 + 20 + 'px';
                    draggingBox.style.top = event.clientY - boxHeight / 2 - 20 + 'px';

                },
                onmove: event => {
                    // on safari, detect drag over not seem hover
                    draggingBox.style.left = event.clientX - boxWidth / 2 + 20 + 'px';
                    draggingBox.style.top = event.clientY - boxHeight / 2 - 20 + 'px';
                    currentOuterDropzone = document.querySelector('.dropzone.hover');
                    currentInnerDropzone = document.querySelector('.inner-dropzone.hover');
                    currentBeforeDropzone = document.querySelector('.before-dropzone.hover');
                    currentAfterDropzone = document.querySelector('.after-dropzone.hover');

                    if (currentOuterDropzone
                        && this.childRowIdList.indexOf(currentOuterDropzone.getAttribute('row-Id')) === -1) {
                        if (lastBeforeDropzone !== currentBeforeDropzone) {
                            if (currentBeforeDropzone) {

                                currentBeforeDropzone.classList.add('before-zone');
                                this.actionContent = this.lbMoveBefore.replace('{0}', currentOuterDropzone.getAttribute('row-name'));
                                if (currentInnerDropzone) {
                                    currentInnerDropzone.classList.remove('inner-zone');
                                }
                                if (currentAfterDropzone) {
                                    currentAfterDropzone.classList.remove('after-zone');
                                }
                            }
                            if (lastBeforeDropzone) {
                                lastBeforeDropzone.classList.remove('before-zone');
                            }
                            lastBeforeDropzone = currentBeforeDropzone;
                        }
                        if (lastInnerDropzone !== currentInnerDropzone) {
                            if (currentInnerDropzone) {
                                currentInnerDropzone.classList.add('inner-zone');
                                this.actionContent = this.lbMoveInside.replace('{0}', currentOuterDropzone.getAttribute('row-name'));
                                if (currentBeforeDropzone) {
                                    currentBeforeDropzone.classList.remove('before-zone');
                                }
                                if (currentAfterDropzone) {
                                    currentAfterDropzone.classList.remove('after-zone');
                                }
                            }
                            if (lastInnerDropzone) {
                                lastInnerDropzone.classList.remove('inner-zone');
                            }
                            lastInnerDropzone = currentInnerDropzone;
                        }
                        if (lastAfterDropzone !== currentAfterDropzone) {
                            if (currentAfterDropzone) {
                                currentAfterDropzone.classList.add('after-zone');
                                this.actionContent = this.lbMoveAfter.replace('{0}', currentOuterDropzone.getAttribute('row-name'));
                                if (currentBeforeDropzone) {
                                    currentBeforeDropzone.classList.remove('before-zone');
                                }
                                if (currentInnerDropzone) {
                                    currentInnerDropzone.classList.remove('inner-zone');
                                }
                            }
                            if (lastAfterDropzone) {
                                lastAfterDropzone.classList.remove('after-zone');
                            }
                            lastAfterDropzone = currentAfterDropzone;
                        }
                    } else {
                        this.actionContent = ``;
                        if (lastBeforeDropzone) {
                            lastBeforeDropzone.classList.remove('before-zone');
                        }
                        if (lastInnerDropzone) {
                            lastInnerDropzone.classList.remove('inner-zone');
                        }
                        if (lastAfterDropzone) {
                            lastAfterDropzone.classList.remove('after-zone');
                        }
                    }
                },
                onend: event => {
                    if (currentOuterDropzone) {
                        const rowId = currentOuterDropzone.getAttribute('row-Id');
                        const rowIndex = currentOuterDropzone.getAttribute('rowIndex');
                        const rowLevel = currentOuterDropzone.getAttribute('row-level');
                        this.childTargetList = this.getChildrenRow(this.items, rowId,
                            +rowLevel);
                        // if (rowId !== dragRowId) {
                        if (this.childRowIdList.indexOf(rowId) === -1) {
                            if (currentBeforeDropzone) {
                                let afterIndex = this.items[rowIndex - 1] ?
                                    this.items[rowIndex - 1].Id : null;
                                if (afterIndex) {
                                    if (this.childRowIdList.indexOf(afterIndex) !== -1) {
                                        afterIndex = this.items[rowIndex - this.childRowIdList.length - 1] ?
                                            this.items[rowIndex - this.childRowIdList.length - 1].Id : null;
                                    }
                                }
                                this.changeOrder(dragRowId, rowId, afterIndex, dragRowIndex, rowIndex, 'before');
                                currentBeforeDropzone.classList.remove('before-zone');
                            }
                            if (currentInnerDropzone) {
                                this.changeOrder(dragRowId, null, rowId, dragRowIndex, rowIndex);
                                currentInnerDropzone.classList.remove('inner-zone');
                            }
                            if (currentAfterDropzone) {
                                if (this.childTargetList.slice(-1)[0].Id === this.childRowIdList.slice(-1)[0]) {
                                    // if (this.childTargetList.map(t => t.Id).indexOf(this.childRowIdList.slice(-1)[0]) !== -1) {
                                    this.childTargetList.splice(this.childTargetList.findIndex(target => target.Id === this.childRowIdList[0]));
                                    this.changeOrder(dragRowId, rowId, this.childTargetList.slice(-1)[0].Id, dragRowIndex, rowIndex);
                                } else {
                                    this.changeOrder(dragRowId, rowId, this.childTargetList.slice(-1)[0].Id, dragRowIndex, rowIndex);
                                }
                                currentAfterDropzone.classList.remove('after-zone');
                            }
                        }
                    }
                    draggingBox.classList.add('display-data');
                    draggingBox.style.position = 'unset';
                    draggingBox.style.transform = 'scale(0)';
                },
            });
    }

    getChildrenRow(data, rowID, rowLevel): any[] {
        const indexRow = data.findIndex(row => row.Id === rowID);
        let hieraArray = data.slice(indexRow);
        let endIndex = hieraArray.findIndex((row, index) => {
            if (index > 0) {
                return row.Level === rowLevel || row.Level < rowLevel;
            }
        });
        endIndex = endIndex === -1 ? hieraArray.length : endIndex;
        return hieraArray.slice(0, endIndex);
    }

    changeOrder(moveItemId?, rowId?, afterItemId?, dragIndex?, targetIndex?, position?, options?: any) {
        this._coreHelperService.BlockUIService.start();
        let params;
        if (rowId) {
            this.getDetailEntityById(rowId).subscribe(respon => {                
                params = {};
                params[`Move${this.entityName}Id`] = moveItemId;
                params[`ParentOfMove${this.entityName}Id`] = respon[`Parent${this.entityName}Id`];
                params[`After${this.entityName}Id`] = afterItemId;
                this.onChangeOrder(params, options).subscribe(() => {
                    this.queryCondition.ItemIdToGetIndex = moveItemId;
                    this.updateUI(moveItemId, +dragIndex, +targetIndex, position);
                },
                    err => {
                        this._coreHelperService.BlockUIService.stop();
                    });
            });
        } else {
            params = {};
            params[`Move${this.entityName}Id`] = moveItemId;
            params[`ParentOfMove${this.entityName}Id`] = afterItemId;
            params[`After${this.entityName}Id`] = afterItemId;
            this.onChangeOrder(params, options).subscribe(() => {
                this.queryCondition.ItemIdToGetIndex = moveItemId;
                this.updateUI(moveItemId, +dragIndex, +targetIndex, position);
            },
                err => {
                    this._coreHelperService.BlockUIService.stop();
                });
        }
    }

    updateUI(dragId, dragIndex, targetIndex, position) {
        if (dragIndex > targetIndex) { // move up
            if (position === 'before') {
                this.queryCondition.StartIndex = (targetIndex - this.childRowList.length) < 0 ? 0 : (targetIndex - this.childRowList.length);
                this.queryCondition.PageSize = 1 + dragIndex + this.childRowList.length -
                    ((targetIndex - this.childRowList.length) < 0 ? 0 : (targetIndex - this.childRowList.length));
            } else {
                this.queryCondition.StartIndex = targetIndex;
                this.queryCondition.PageSize = 1 + dragIndex + this.childRowList.length + this.childTargetList.length - targetIndex;
            }
        } else { // move down
            this.queryCondition.StartIndex = dragIndex;
            this.queryCondition.PageSize = targetIndex + this.childTargetList.length + this.childRowList.length - dragIndex;
        }
        this.getHierarchicalOfEntity(this.queryCondition).subscribe((c) => {
            delete this._cacheMiddleLines;
            this._cacheMiddleLines = {};
            c['HierarchicalData'].forEach((element, index) => {
                Object.assign(this.items[index + this.queryCondition.StartIndex], element);
            });
            const newIndexDrag = this.items.findIndex(row => row.Id === dragId);
            this.setSelectedItem(this.items[newIndexDrag], true, true);
            this._coreHelperService.BlockUIService.stop();
        });
    }

    getDetailEntityById(id): Observable<any> {
        throw new Error('not yet implemented getDetailEntityById function');
    }

    onChangeOrder(param, options?): Observable<any> {
        throw new Error('not yet implemented onChangeOrder function');
    }

    getHierarchicalOfEntity(query): Observable<any> {
        throw new Error('not yet implemented onChangeOrder function');
    }

    onmouseenter(e) {
        e.target.classList.add('hover');
    }
    onmouseleave(e) {
        e.target.classList.remove('hover');
    }
    //
}
