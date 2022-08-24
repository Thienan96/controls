import {EventEmitter, Injector, Input, Output, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {IPageInfo} from 'ngx-virtual-scroller';
import {DatatableRow} from './datatable.model';
import {DatatableVirtualScrollComponent} from '../datatable-virtual-scroll/datatable-virtual-scroll.component';
import {UtilityService} from '../../core/services/utility.service';
import * as _ from 'underscore';
import {forkJoin, of} from 'rxjs';
import {flatMap} from 'rxjs/operators';

export class DatatableDataController<T extends DatatableRow> {
    @ViewChild(DatatableVirtualScrollComponent, {static: false}) virtualScroll: DatatableVirtualScrollComponent;
    @Input() items: T[];
    @Input() selectedItem: T;
    @Output() selectedItemChange = new EventEmitter();
    isDataLazy = true;
    viewPortItems: T[] = [];
    pageSize = 30;
    loadDataOb: any;
    utilityService: UtilityService;
    preventRequestItem = false;

    constructor(injector: Injector) {
        this.utilityService = injector.get(UtilityService, null);
    }

    get itemCount() {
        return this.items.length;
    }

    setSelectedItem(row: T) {
        let isSame = this.selectedItem && this.selectedItem.UniqueKey === row.UniqueKey;
        if (isSame) {
            return;
        }
        this.selectedItem = row;
        this.selectedItemChange.emit(this.selectedItem);
    }


    loadData(row: DatatableRow, startIndex: number, pageSize: number, options?: any): Observable<any> {
        throw new Error('not yet implemented loadData function');
    }

    updateViewPortChanged(viewPortItems: any[]) {
        this.viewPortItems = viewPortItems;
    }

    getViewPortInfor(): IPageInfo | undefined {
        return this.virtualScroll ? this.virtualScroll.viewPortInfo : undefined;
    }

    onRequestItemsLoad(event: IPageInfo) {
        let start = event.startIndex,
            end = event.endIndex;
        if (event.startIndex < 0 || event.endIndex < 0) {
            return;
        }
        // ??
        if (this.items.slice(start, end + 1).length === 0) {
            return;
        }
        if (!this.preventRequestItem) {
            this.requestItems(start, end);
        }
    }


    isSelectedItem(item: T): boolean {
        return (item && this.selectedItem && item.UniqueKey === this.selectedItem.UniqueKey);
    }


    onFetchDataFinished() {
    }


    trackByFunction(index: number, item: DatatableRow) {
        return item.UniqueKey + '-' + item.Id;
    }

    cancelRequest() {
        if (this.loadDataOb) {
            this.loadDataOb.unsubscribe();
            this.loadDataOb = null;
        }
    }

    private requestItems(start: number, end: number) {
        this.cancelRequest();

        let rows: DatatableRow[] = this.items.slice(start, end + 1);

        let localStart = 0;
        let localEnd = rows.length;
        // console.log('local start/end 1 = ', localStart, '/', localEnd);
        // start first
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].Id !== -1) {
                start++;
                localStart++;
            } else {
                break;
            }
        }

        // then end
        // tslint:disable-next-line: prefer-for-of
        for (let j = rows.length - 1; j >= 0; j--) {
            if (rows[j].Id !== -1) {
                end--;
                localEnd--;
            } else {
                break;
            }
        }

        // console.log('start/end 2 = ', start, '/', end);

        // console.log('local start/end 2 = ', localStart, '/', localEnd);

        rows = rows.slice(localStart, localEnd);
        // console.log('rows to load 2 = ', rows.map(c => ({ Id: c.Id})));

        if (rows.length === 0) {
            this.onFetchDataFinished();
            return;
        }


        let groups: any[] = [];
        let currentQuery = rows[0].queryOptions;
        let index = 0;

        groups[0] = {
            items: [rows[0]],
            index: start
        };
        for (let i = 1; i < rows.length; i++) {
            let row = rows[i];
            if (_.isEqual(currentQuery, row.queryOptions)) {
                groups[index].items.push(row);
            } else {
                currentQuery = row.queryOptions;
                index = index + 1;
                if (!groups[index]) {
                    groups[index] = {
                        items: [row],
                        index: start + i
                    };
                }
            }
        }

        let requests = [];
        groups.forEach((group: any) => {
            let firstRowInGroup: DatatableRow = group.items[0];
            let rowsInGroup: T[] = this.items.filter((item) => {
                return _.isEqual(item.queryOptions, firstRowInGroup.queryOptions);
            });
            let startIndex = rowsInGroup.findIndex((r) => {
                return firstRowInGroup.UniqueKey === r.UniqueKey;
            });
            let pageSize = group.items.length;

            let parentRow = firstRowInGroup.parentId === -1 ? null : this.items.find((r) => {
                return firstRowInGroup.parentId === r.UniqueKey;
            });

            let request = this.loadData(parentRow, startIndex, pageSize, group.items[0].queryOptions).pipe(flatMap((data) => {
                return of({
                    data: data,
                    startIndex: startIndex,
                    index: group.index
                });
            }));
            requests.push(request);
        });
        this.loadDataOb = forkJoin(requests).subscribe((results) => {
            results.forEach((resultData: any) => {
                let position = resultData.index,
                    data = resultData.data;
                data.ListItems.forEach((row, i) => {
                    let oldData = this.items[position + i];
                    row.UniqueKey = oldData.UniqueKey;
                    Object.assign(oldData, row);
                    Object.assign(row, oldData);
                    //  console.log('loading at position = ', position + i, ' row =', row);
                    // this.items[position + i] = row;
                });
            });


            let viewport = this.virtualScroll.getViewPort(),
                viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ? this.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
            this.viewPortItems.splice(0, this.viewPortItems.length);
            viewPortItems.forEach((viewPort) => {
                this.viewPortItems.push(viewPort);
            });

            this.onFetchDataFinished();
        });


    }

}
