import { Observable } from 'rxjs';
import { VirtualDataSource } from './virtual-datasource';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import * as _ from 'underscore';
import { IDataItems } from '../../shared/models/common.info';
import { ChangeDetectorRef, OnInit } from '@angular/core';

export class VirtualScrollBaseController<T> implements OnInit {

    dataSource: any;

    selectedItem: any;

    selectedIndex = -1;

    selectedRows = [];

    listSelectedRows = [];

    isSelectAll: boolean;

    checkedCount = 0;

    defaultSize = 20;

    _cacheMiddleLines: { [index: number]: boolean[] } = {};

    private _idToSelectLater?: string;
    private _indexToSelectLater?: number;
    itemClick(item: any, index?: number) {
        //  console.log('VirtualScrollBaseController - Click on:', item);
        this.selectedItem = item;

        let newIndex = -1;
        if (index !== undefined && this.selectedIndex !== index) {
            newIndex = index;
        } else {
            const ds = <VirtualDataSource<any>>this.dataSource;
            newIndex = ds.getIndexOf(this.selectedItem);
        }

        if (newIndex !== this.selectedIndex) {
            this.selectedIndex = newIndex;
            this.onSelectionChanged(this.selectedIndex);
        }
    }

    constructor(private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        const dataSource = new VirtualDataSource<T>(this.cd,
            (startIndex, pageSize) => this._loadData(startIndex, pageSize)
            , this.defaultSize  /*page size*/);
        dataSource.onGetPageFinish.subscribe((startIndex) => {
            this.loadPageFinish(startIndex);
        });
        this.dataSource = dataSource;
    }

    refresh(idToSelect?: string, indexToSelectect?: number) {
        this._idToSelectLater = idToSelect;
        this._indexToSelectLater = indexToSelectect;

        if (this.dataSource && this.dataSource.reset) {
            this.dataSource.reset();
            const ds = this.dataSource;
            this.dataSource = [];

            setTimeout(() => {
                this.dataSource = ds;
            }, 100);
        }
    }

    loadPageFinish(startIndex: number) {
        delete this._cacheMiddleLines;
        this._cacheMiddleLines = {};
        const ds = <VirtualDataSource<any>>this.dataSource;
        if (this._idToSelectLater) {
            for (let i = startIndex; i < 20; i++) {
                const item = ds.getItemAt(i);
                if (item && item.Id === this._idToSelectLater) {
                    this.selectedItem = item;
                    this.selectedIndex = i;
                    this.onSelectionChanged(this.selectedIndex);

                    this._idToSelectLater = undefined;
                    this._indexToSelectLater = undefined;
                }
            }
        } else if (this._indexToSelectLater !== undefined && startIndex === 0) {
            const viewPort = this.getViewportComponent();
            if (viewPort) {
                viewPort.scrollToIndex(this._indexToSelectLater);
                const item = ds.getItemAt(this._indexToSelectLater);

                if (item) {
                    this.selectedItem = item;
                    this.selectedIndex = this._indexToSelectLater;
                    this.onSelectionChanged(this.selectedIndex);
                }

                this._idToSelectLater = undefined;
                this._indexToSelectLater = undefined;
            }
        }
    }

    selectedAllChanged() {
        this.dataSource.cachedData.forEach(item => {
            if (item) { item.isChecked = this.isSelectAll; }
        });
        this.checkedCount = this.isSelectAll ? this.dataSource.cachedData.length : 0;
        // this.excludeItems.splice(0, this.excludeItems.length);
    }

    stateChanged(event) {
        if (event.checked) {
            this.checkedCount++;
            if (this.checkedCount === this.dataSource.cachedData.length) {
                this.isSelectAll = true;
            }
        } else {
            this.checkedCount--;
            if (this.isSelectAll) {
                this.isSelectAll = false;
            }
        }
    }
    
    /**
     * This is to serve the gid which need display like a tree
     * The method return if the line is the fist line in its level
     * @param index : row index in list
     */
    isFirstItemInLevel(index: number): boolean {
        if (this.dataSource.cachedData && index > 0) {
            let item = this.dataSource.cachedData[index];
            let pre = this.dataSource.cachedData[index - 1];
            if (item && pre) {
                return pre['Level'] < item['Level'];
            }
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
        if (this.dataSource.cachedData) {
            let item = this.dataSource.cachedData[index];

            // in case the line not yet perofomr lazy load finish
            if (!_.has(item, 'Level')) {
                return [];
            }

            let result: boolean[] = new Array(item['Level'] > 0 ? item['Level'] - 1 : 0).fill(false);

            // console.log('item =', item.Name, ' level=', item.Level);
            let lastLevel = item['Level'];

            if (item['Level'] > 1) {
                for (let i = +index + 1; i < this.dataSource.cachedData.length; i++) {
                    if (this.dataSource.cachedData[i]['Level'] < lastLevel) {
                        if (this.dataSource.cachedData[i]['Level'] === 1) {
                            this._cacheMiddleLines[index] = result;
                            return result;
                        } else {
                            result[this.dataSource.cachedData[i]['Level'] - 2] = true;
                        }

                        lastLevel = this.dataSource.cachedData[i]['Level'];
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

    _loadData(startIndex: number, pageSize: number): Observable<IDataItems<T> | T[]> {
        return this.loadData(startIndex, pageSize);
    }

    loadData(startIndex: number, pageSize: number): Observable<IDataItems<T> | T[]> {
        throw new Error('not yet implemented loadData function');
    }

    getTotalItems(): number {
        if (this.dataSource.length) { return this.dataSource.length; }

        return -1;
    }

    getViewportComponent(): CdkVirtualScrollViewport | undefined {
        return undefined;
    }

    onSelectionChanged(index: number) {
    }
}
