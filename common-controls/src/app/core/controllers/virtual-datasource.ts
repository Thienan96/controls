import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, Subscription, of, Subject, BehaviorSubject, timer } from 'rxjs';
import { EventEmitter, ChangeDetectorRef } from '@angular/core';
import * as _ from 'underscore';
import { IDataItems } from '../../shared/models/common.info';
import { debounce, map } from 'rxjs/operators';

export class VirtualDataSource<T> extends DataSource<any | undefined> {
    private length = -1;
    private pageSize = 50;
    private cachedData = [];
    private ds = new BehaviorSubject<any>([]);
    private fetchedPages = new Set<number>();
    private subscription;
    public indexLastSelected = -1;
    private _dataFirstPage: any[];

    onCountFinish = new EventEmitter<number>();
    onGetPageFinish = new EventEmitter<number>();

    constructor(private cd: ChangeDetectorRef, private _loadData: (startIndex: number, pageSize: number) => Observable<any>, pagesize?: number) {
        super();
        if (pagesize) {
            this.pageSize = pagesize;
        }
    }

    connect(collectionViewer: CollectionViewer): Observable<T[]> {
        this._dataFirstPage = [];
        this.subscription = new Subscription();
        this.subscription.add(collectionViewer.viewChange.pipe(
            debounce(() => {
                return timer(300);
            })
        ).subscribe(range => {
            const startPage = this.getPageForIndex(range.start);
            const endPage = this.getPageForIndex(range.end - 1);

            for (let i = startPage; i <= endPage; i++) {
                this.fetchPage(i).subscribe();
            }
        }));

        const ob = new Observable<T[]>((observer) => {
            this.internalCount().subscribe((result) => {
                // console.log('count finish with:', result);
                this.indexLastSelected = result.Index;
                this.length = result.Count;
                if (result.ListItems) {
                     this._dataFirstPage = result.ListItems;
                }

                this.cachedData = Array.from<T>({ length: result.Count })
                    .map((_, i) => ({ Id: -1 }));

                if (this.length > 0) {
                    // console.log('fetch first page:');

                    if (this._dataFirstPage) {
                        for (let i = 0; i < this._dataFirstPage.length; i++) {
                            if (this.cachedData[i]) {
                                Object.assign(this.cachedData[i], this._dataFirstPage[i]);
                            }
                        }

                        this.fetchedPages.add(0);
                        observer.next(this.cachedData);
                        this.ds.next(this.cachedData);
                        observer.complete();
                        this.onGetPageFinish.emit(0);
                    } else {
                        this.fetchPage(0).subscribe((x) => {
                            // this.onPageFinish(x, 0);

                            this.indexLastSelected = result.Index;

                            observer.next(this.cachedData);
                            this.ds.next(this.cachedData);
                            observer.complete();
                        });
                    }
                } else {
                    this.indexLastSelected = result.Index;

                    this.onGetPageFinish.emit(0);
                    observer.next(this.cachedData);
                    this.ds.next(this.cachedData);
                    observer.complete();
                }
                this.indexLastSelected = result.Index;

                this.onCountFinish.emit(result.Count);
            });
        });

        return ob;
    }

    getItemAt(index: number): any {
        if (this.cachedData.length > index) {
            return this.cachedData[index];
        }

        return undefined;
    }

    getIndexOf(item: any): number {
        return _.findIndex(this.cachedData, (i) => item.Id === i.Id);
    }

    getItemsCount() {
        return this.cachedData.length;
    }

    private internalCount(): Observable<any> {
        if (this.length === -1) {
            return this.loadData(0, this.pageSize);
        } else {
            return of({ Count: this.length });
        }
    }

    disconnect(): void {
        this.subscription.unsubscribe();
    }

    trackByFn(index, item) {
        // console.log('track by:', index, item);
        return item.Id;
    }

    reset() {
        this.fetchedPages.clear();
        this.length = -1;
        this.cachedData = [];
    }

    private getPageForIndex(index: number): number {
        return Math.floor(index / this.pageSize);
    }


    private safeApply() {
        try {
            this.cd.markForCheck();
            //    this.cd.detectChanges(); // call this will make the source disconected many time
        } catch (e) {
        }
    }
    private fetchPage(page: number): Observable<any> {
        const startIndex = page * this.pageSize;
        if (this.fetchedPages.has(page)) {
            this.onGetPageFinish.emit(startIndex);
            return of(null);
        }

        this.fetchedPages.add(page);

        // return this.loadData(startIndex, this.pageSize);
        return this.loadData(startIndex, this.pageSize).pipe(
            map((data) => {
                if (data && data.ListItems) {
                    for (let i = 0; i < data.ListItems.length; i++) {
                        if (this.cachedData[i + startIndex]) {
                            Object.assign(this.cachedData[i + startIndex], data.ListItems[i]);
                        }

                    }

                    this.safeApply();
                }

                this.onGetPageFinish.emit(startIndex);
            }));
    }
    private loadData(startIndex: number, pageSize: number): Observable<IDataItems<T>> {
        return this._loadData(startIndex, pageSize);
    }
}
