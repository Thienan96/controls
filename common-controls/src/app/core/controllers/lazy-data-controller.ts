import {Injector, ViewChild, HostListener, AfterViewInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { VirtualScrollerComponent, IPageInfo } from 'ngx-virtual-scroller';
// import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { Subscription } from 'rxjs/Subscription';
import { ILazyItem, IPageContent, PageStatus, IDataItems } from '../../shared/models/common.info';
import { HelperService } from '../services/helper.service';
import * as _ from 'underscore';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';

export class LazyDataController<T extends ILazyItem> implements AfterViewInit, OnDestroy {
    NUMBER_ITEMS_PER_PAGE = 20;

    protected _lastNumberOfItemsRequested: number;
    protected _dicPages: { [index: number]: IPageContent | undefined } = {};
    protected _dataFirstPage: T[];
    protected _pendingRequests: Subscription[] = [];
    protected _selectedItem: T | undefined;
    protected _coreHelperService: HelperService;
    private _preventRequestItem = false;
    protected _lastStart: number;
    protected _lastEnd: number;
    private _timerCheckLoadDataWhileNotActive: Subscription | undefined;

    @Input() itemHeight = 100;

    protected _indexToSelect?: number;


    protected _useMouseUpToLoad = true;

    appendRows: T[] = [];
    isSelectAll = false;
    shouldShowCheck: boolean;
    checkedCount = 0;

    isExclude = false;
    excludeItems: T[] = [];

    viewPortItems: T[] = [];
    items: T[] = [];
    @Output ('totalItem') $totalItem = new EventEmitter<any>(); // create to get total Document (support document module)

    @ViewChild(VirtualScrollerComponent, { static: true })
    protected _virtualScroll: VirtualScrollerComponent;

    @HostListener('window:resize')
    public onWindowResize() {
        // console.info('window:resize: ' + this._virtualScroll.childHeight + " --- " + this._virtualScroll.scrollbarHeight);
        if (this._virtualScroll) {
            this._virtualScroll.refresh();
        }
    }

    @HostListener('mousedown', ['$event'])
    public onMouseDown(event: any) {
        // console.info("mousedown --- " + event.offsetX + ' --- ' + event.currentTarget.clientWidth);
        if (this. _useMouseUpToLoad && event.offsetX >= event.currentTarget.clientWidth - 18) {
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
        this._coreHelperService = injector.get(HelperService);
    }

    ngAfterViewInit() {
        if (this._virtualScroll) {
            this._virtualScroll.scrollAnimationTime = 0;
        }
    }

    ngOnDestroy() {
        if (this._timerCheckLoadDataWhileNotActive) {
            this._timerCheckLoadDataWhileNotActive.unsubscribe();
        }
    }

    get itemCount(): number {
        if (this.items) {
            return this.items.length;
        }

        return 0;
    }

    getItem(itemIndex: number) {
        const page: number = Math.floor(itemIndex / this.NUMBER_ITEMS_PER_PAGE);
        const index: number = itemIndex % this.NUMBER_ITEMS_PER_PAGE;

        // console.log('get item at page: ', page, ' at index:', index);
        const pageContent: IPageContent = this._dicPages[page];

        if (pageContent && pageContent.Status === PageStatus.Loaded && pageContent.Items && index < pageContent.Items.length) {
            return pageContent.Items[index];
        }

        return undefined;
    }

    getStartEndFromPageIndex(pageIndex: number): number[] {
        const start: number = pageIndex * this.NUMBER_ITEMS_PER_PAGE;
        const end: number = start + this.NUMBER_ITEMS_PER_PAGE;

        return [start, end];
    }

    getPageIndexFromStartEnd(start: number, end: number): number[] {
        const pages: number[] = [];

        const startPage: number = Math.floor(start / this.NUMBER_ITEMS_PER_PAGE);
        const endPage: number = Math.floor(end / this.NUMBER_ITEMS_PER_PAGE);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    }

    updateViewPortChanged(viewPortItems: any[]) {
        // console.info('updateViewPortChanged: ' + viewPortItems.length);
        this.viewPortItems = viewPortItems;
        this._lastNumberOfItemsRequested = viewPortItems.length;

    }

    onRequestItemsLoad(event: IPageInfo) {
        // console.info('onRequestItemsLoad: start:' + event.start + ' - end:' + event.end);

        // tslint:disable-next-line:curly
        if (event.startIndex < 0 || event.endIndex < 0) return;

        this._lastStart = event.startIndex;
        this._lastEnd = event.endIndex;


        // in case, count data finish, but tab browser is not visible, the requestItems fires with event.end=-1
        // we have to add this check to try to load items when the tab browser is selected
        /*if (this._lastEnd < 0 && !this._timerCheckLoadDataWhileNotActive) {
            this._timerCheckLoadDataWhileNotActive = IntervalObservable.create(500).subscribe(e => {
                //console.log('--loop to check load data 1 --- ' + this._lastEnd);
                if (this._lastEnd < 0)
                    this._virtualScroll.refresh(true);

                //console.log('--loop to check load data 2 --- ' + this._lastEnd);
                if (this._lastEnd >= 0) {
                    this._timerCheckLoadDataWhileNotActive.unsubscribe();
                    this._timerCheckLoadDataWhileNotActive = undefined;
                }
            });

            return;
        }*/

        if (!this._preventRequestItem) {
            this.requestItems(this._lastStart, this._lastEnd);
        }
    }

    protected requestItems(start: number, end: number, allowCheckingSelectedItem = false) {
        // console.log('requestItems: start:' + start + ' - end:' + end);

        const pages: number[] = this.getPageIndexFromStartEnd(start, end);

        let keptSelectedItem: T | undefined;
        if (this._selectedItem) {
            keptSelectedItem = <T>{};
            Object.assign(keptSelectedItem, this._selectedItem);
        }

        // tslint:disable-next-line: prefer-for-of
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

                let subscription: Subscription;

                let responseLoadData = (result: any) => {
                    let data: any[] = <any[]> result.ListItems || [];
                    // remove request in pending collection
                    if (subscription) {
                        this.removePendingRequest(subscription);
                    }

                    pageContent.Items = [];
                    let actualItemIndex: number = startEnd[0];

                    // tslint:disable-next-line: prefer-for-of
                    for (let k = 0; k < data.length; k++) {
                        // put item in content of page (review to check should or not)
                        const item: any = {};
                        Object.assign(item, data[k]);
                        pageContent.Items.push(item);

                        // copy data to real item
                        if (this.items[actualItemIndex]) {
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
                            const found = _.find(this.items, itm => itm.Id === keptSelectedItem.Id);
                            if (found) {
                                setTimeout(() => {
                                    this.setSelectedItem(found);
                                }, 500);
                            } else {
                                if (this.items && this.items.length > 0) {
                                    this.setSelectedItem(this.items[0]);
                                } else {
                                    this.setSelectedItem(undefined);
                                }
                            }
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
                
                if (startEnd[0] === 0) {
                    let subject = new BehaviorSubject<any>({});
                    subject.next({ ListItems: this._dataFirstPage });
                    subscription = subject.asObservable().subscribe(responseLoadData);

                } else {
                    subscription = this._loadData(startEnd[0], this.NUMBER_ITEMS_PER_PAGE)
                        .pipe(map(data => <any[]> data)).subscribe(responseLoadData);
                }

                // keep request in pending collection
                this._pendingRequests.push(subscription);
            }
        }
    }

    protected refreshList(allowCheckingSelectedItem = false, refreshOnTopKeepSelect = false, keepCurrentItems?: boolean) {
        // clean data
        this.clean(keepCurrentItems);

        // before starting count data
        this.onCountDataStart();

        const subscription = this._loadData(0, this.NUMBER_ITEMS_PER_PAGE).subscribe(data => {
            // remove request in pending collection
            this.removePendingRequest(subscription);

            let countItems = 0;
            let indexToSelect = -1;
            this._indexToSelect = undefined;

            if (this._coreHelperService.UtilityService.isInteger(data)) {
                countItems = data;
            } else {
                countItems = data.Count;
                indexToSelect = !refreshOnTopKeepSelect ? data.Index : undefined;
                this._dataFirstPage = data.ListItems;
                this._indexToSelect = indexToSelect;
            }
            



            console.log('Count result 1: countItems: ' + countItems + ' - indexToSelect: ' + indexToSelect + ' - lastStart: ' + this._lastStart + ' - lastEnd: ' + this._lastEnd + ' - lastNumberOfItemsRequested: ' + this._lastNumberOfItemsRequested);

            const newItems: T[] = [];
            for (let i = 0; i < countItems; i++) {
                const item: any = { UniqueKey: i.toString(), Id: '', Name: '' };
                newItems.push(item);
            }

            this._dicPages = [];
            this.items = newItems;
            this.$totalItem.emit(countItems);

            this.onCountDataFinished(countItems, indexToSelect);

            if (countItems > 0) {
                if (indexToSelect >= 0) {
                    // ensure virtual container initialize OK to scroll correctly
                    TimerObservable.create(200).subscribe(() => {
                        let it = this.items[indexToSelect];
                        // console.log('scroll to:', it);

                        this._virtualScroll.scrollInto(this.items[indexToSelect]);

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
                    });
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
                this.onFetchDataFinished([]);
            }
            if(refreshOnTopKeepSelect && data.Index) {
                this.setSelectedItem(this.items[data.Index])
            }

            this.checkedCount = this.isSelectAll ? this.itemCount : 0;
        });

        // keep request in pending collection
        this._pendingRequests.push(subscription);
    }

    // When the tab browser is invisible, the request item size work incorrectly (cause _lastNumberOfItemsRequested=0)
    // so we have to try to calculate this property and make a request to get data
    protected tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem: boolean, indexToSelect?: number) {
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
                end = Math.max(availableNumberOfItemsOnList, this.NUMBER_ITEMS_PER_PAGE);
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

    protected clean(keepCurrentItems?: boolean) {
        this._pendingRequests.forEach(obs => {
            obs.unsubscribe();
        });

        // reset variables
        this._lastStart = 0;
        this._lastEnd = 0;
        this._lastNumberOfItemsRequested = 0;

        // clear list items
        this._dicPages = [];
        this.items = keepCurrentItems ? this.items : [];
        this._pendingRequests = [];
        this.appendRows = [];
        
        this.isSelectAll = false;

        this.isExclude = false;
        this.excludeItems.splice(0, this.excludeItems.length);
    }

    protected removePendingRequest(subscription: Subscription) {
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

        let isSame = _.isEqual(this._selectedItem, item);

        this._selectedItem = item;
        // reset to make sure it is not select again
        this._indexToSelect = undefined;

        if (!ignoreRaiseEvent && !isSame) {
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

    stateChanged(event: any) {
        if (event.checked) {
            this.checkedCount++;
            if (this.checkedCount === this.itemCount) {
                this.isSelectAll = true;
            }

            if (this.isExclude) {
                const pos = this.excludeItems.findIndex((item: T) => {
                    return item.Id === event.source.value.Id;
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

    // onCountDataStart
    protected onCountDataStart() { }

    // onCountDataFinished
    protected onCountDataFinished(countItems: number, selectedItemIndex?: number) { }

    // onFetchDataStart
    protected onFetchDataStart(pageIndex: number) { }

    // onFetchDataFinished
    protected onFetchDataFinished<T>(items?: T[] | undefined) { }

    // onSelectedItemChanged
    protected onSelectedItemChanged(item?: T | undefined) { }

    protected loadData(startIndex: number, pageSize: number): Observable<any> {
        throw new Error('not yet implemented loadData function');
    }

    protected _scrollToIndex(index: number) {
       //  this._virtualScroll.scrollToIndex(index, true, 0, 1 /* we need to make it fast (1ms) so that dont see the animation */);
    }

    // Append rows on top
    protected _loadData(startIndex: number, pageSize: number): Observable<any> {
        let realStartIndex = startIndex;
        let firstDataPart: ILazyItem[];

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

        let obResult: Observable<IDataItems<any>> = this.loadData(realStartIndex, pageSize);

        if (obResult) {
            return obResult.pipe(
                map(data => {
                    let result = [];
                    if (startIndex === 0) {
                        // when loading firt page it may contains count and AppendRows
                        // then we need to take into account that to tell the scroller with more rows
                        if (!this.appendRows) { this.appendRows = []; }
                        let totalCount = 0;
                        if (data.AppendRows || this.appendRows.length > 0) {
                            if (data.AppendRows) { this.appendRows.unshift(...data.AppendRows); } // push items on top
                            result.push(...this.appendRows);
                            if (pageSize > this.appendRows.length && data.ListItems && data.ListItems.length > 0) {
                                result.push(...data.ListItems.slice(0, pageSize - this.appendRows.length));
                            }

                            totalCount = data.Count + this.appendRows.length;

                        } else {
                            totalCount = data.Count;
                            if (data.ListItems && data.ListItems.length > 0) {
                                result.push(...data.ListItems);
                            }
                        }

                        let foundIndex = data.Index;
                        // There are some append rows => selected index + count of append rows
                        // Case found index in list (>= 0)
                        if (foundIndex >= 0) { foundIndex += this.appendRows.length; }

                        return { ListItems: result, Count: totalCount, Index: foundIndex };
                    } else {
                        if (firstDataPart) {
                            result.push(...firstDataPart);
                            if (data.ListItems && data.ListItems.length > 0) {
                                result.push(...data.ListItems);
                            }
                            // console.log('case of first part:', result);
                            return { ListItems: result };
                        }
                        return data;
                    }
                }));
        }
    }


}
