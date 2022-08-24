import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import {DisplayItem, IDataItems, TreeDisplayItem} from '../../shared/models/common.info';
import {forkJoin, Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ToolbarService} from '../shared/toolbar.service';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {VirtualScrollBaseController} from '../../core/controllers/virtual-scroll-base-controller';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import * as _ from 'underscore';

@Component({
    selector: 'ntk-toolbar-tree-virtual-scroll',
    templateUrl: './toolbar-tree-virtual-scroll.component.html',
    styleUrls: ['./toolbar-tree-virtual-scroll.component.scss']
})
export class ToolbarTreeVirtualScrollComponent extends VirtualScrollBaseController<any> implements AfterViewInit {
    @Input() public itemSize: number;
    @Input() public isExclude = false;
    @Input() private selected: TreeDisplayItem[];
    @Input() private deselected: TreeDisplayItem[];
    @Input() private loadDataCallback: any;
    @Input() template: TemplateRef<any>;

    @Output() public itemChanged = new EventEmitter();
    @Output() public itemCounted = new EventEmitter();

    @ViewChild('scrollViewPort', {static: true}) scrollViewPort: CdkVirtualScrollViewport;
    @ViewChild('itemTemplate', {static: false}) itemTemplate: TemplateRef<any>;

    private pageLoaded = new EventEmitter();
    private pages: any = {};

    constructor(cd: ChangeDetectorRef, private toolbarService: ToolbarService) {
        super(cd);

        this.pageLoaded.subscribe((page) => {
            if (this.pages[page]) {
                let funcs = this.pages[page];
                funcs.forEach((func) => {
                    func();
                });
                this.pages[page] = [];
            }

        });
    }

    ngAfterViewInit() {
        this.template = this.template || this.itemTemplate;
    }

    /**
     * Toggle item when select on item
     * @param {MatCheckboxChange} changed
     */
    public onItemChanged(changed: MatCheckboxChange) {
        let item = <any> changed.source.value;
        if (item.Disabled) {
            return;
        }

        this.toggleItem(item, item.IsSelected).subscribe(() => {
            this.raiseItemChange();
        });
    }

    /**
     * Toggle item when click on item
     * @param {MatCheckboxChange} item
     */
    public onItemClicked(item: TreeDisplayItem) {
        if (item.Disabled) {
            return;
        }

        this.toggleItem(item, item.IsSelected).subscribe(() => {
            this.raiseItemChange();
        });

    }

    public loadData(startIndex: number, pageSize: number) {
        console.log(this.itemSize)
        return this.loadDataCallback(startIndex, pageSize)
            .pipe(map((data: any) => {
                let items = data.ListItems.map((item) => {
                    if (item instanceof TreeDisplayItem) {
                        return item;
                    } else {
                        return new TreeDisplayItem({
                            Id: item.Id,
                            Value: item.Id,
                            DisplayValue: item.Name,
                            Level: item.Level,
                            OriginData: item
                        });
                    }
                });
                this.toggle(items);
                data.ListItems = items;
                return data;
            }));
    }

    public loadAllData() {
        let total: number = this.getTotalItems(),
            pageSize = 100,
            pageTotal = Math.ceil(total / pageSize),
            obs = [];
        for (let page = 0; page < pageTotal; page++) {
            let startIndex = page * pageSize;
            obs.push(this.loadDataCallback(startIndex, pageSize));
        }

        return forkJoin(obs).pipe(map((pages: IDataItems<DisplayItem>[]) => {
            let items: DisplayItem[] = [];
            pages.forEach((page: IDataItems<DisplayItem>) => {
                page.ListItems.forEach((item: any) => {
                    if (item instanceof TreeDisplayItem) {
                        items.push(item);
                    } else {
                        items.push(new TreeDisplayItem({
                            Id: item.Id,
                            Value: item.Id,
                            DisplayValue: item.Name,
                            Level: item.Level,
                            OriginData: item
                        }));
                    }
                });
            });
            return items;
        }));
    }

    public getSelectedItemsTotal(total: number) {
        if (this.isExclude) {
            return total - this.deselected.length;
        } else {
            return this.selected.length;
        }
    }

    public loadPageFinish(startIndex: number) {
        super.loadPageFinish(startIndex);
        let pageSize: number = this.getPageSize();
        this.pageLoaded.emit(startIndex / pageSize);
    }

    private toggleItem(item: TreeDisplayItem, checked: boolean) {
        return new Observable((subscriber) => {
            this.toolbarService.toggleItem(item, checked, this.isExclude, this.selected, this.deselected);
            this.getChildren(item).subscribe((children: DisplayItem[]) => {
                children.forEach((node: TreeDisplayItem) => {
                    this.toolbarService.toggleItem(node, checked, this.isExclude, this.selected, this.deselected);
                });
                subscriber.next();
            });
        });
    }

    private toggle(items: TreeDisplayItem[]) {
        items.forEach((item: TreeDisplayItem) => {
            if (!item.Value) {
                return;
            }
            if (this.isExclude) {
                item.IsSelected = this.deselected.findIndex((deselectedItem: TreeDisplayItem) => {
                    return deselectedItem.Value === item.Value;
                }) === -1;
            } else {
                item.IsSelected = this.selected.findIndex((selectedItem: TreeDisplayItem) => {
                    return selectedItem.Value === item.Value;
                }) !== -1;
            }
        });
    }

    private raiseItemChange() {
        this.itemChanged.emit();
    }

    private getCachedData(): TreeDisplayItem[] {
        return <TreeDisplayItem[]> this.getDataSource().cachedData;
    }

    private getDataSource() {
        return this.dataSource;
    }

    private getPageSize(): number {
        return this.getDataSource().pageSize;
    }

    private getChildren(node: TreeDisplayItem): Observable<TreeDisplayItem[]> {
        return new Observable((subscriber) => {
            let cachedData = this.getCachedData();
            let pos = 1 + cachedData.findIndex((i) => {
                return node.Value === i.Value;
            });
            if (pos === cachedData.length) {
                subscriber.next([]);
                return;
            }
            for (let i = pos; i < cachedData.length; i++) {
                let item: TreeDisplayItem = cachedData[i];
                if (item.Level < node.Level) {
                    subscriber.next(cachedData.slice(pos, i));
                    break;
                }
                if (!item.Value) {
                    let page = Math.floor(i / this.getPageSize());
                    this.fetchPage(page).subscribe(() => {
                        this.getChildren(node).subscribe(subscriber);
                    });
                    break;
                }
                if (item.Level === node.Level) {
                    subscriber.next(cachedData.slice(pos, i));
                    break;
                }
                if (i === cachedData.length - 1) {
                    subscriber.next(cachedData.slice(pos, i + 1));
                    break;
                }
            }

        });
    }

    private onPageLoaded(page: number, func: any) {
        if (!this.pages[page]) {
            this.pages[page] = [];
        }
        this.pages[page].push(func);
    }

    private fetchPage(page: number): Observable<TreeDisplayItem[]> {
        return new Observable((subscriber) => {
            let dataSource = this.getDataSource(),
                pageSize = this.getPageSize(),
                startIndex = page * pageSize,
                cachedData = this.getCachedData();
            if (dataSource.fetchedPages.has(page)) {
                let firstItem: TreeDisplayItem = cachedData[startIndex];
                if (firstItem.Id === -1) { // Page is loading
                    this.onPageLoaded(page, () => {
                        subscriber.next(cachedData.slice(startIndex, startIndex + pageSize));
                    });
                } else { // Page is loaded completely
                    return subscriber.next(cachedData.slice(startIndex, startIndex + pageSize));
                }
            } else {
                this.getDataSource().fetchedPages.add(page);

                this.loadData(startIndex, pageSize).pipe(tap((data: any) => {
                    let items = data.ListItems;
                    for (let i = 0; i < items.length; i++) {
                        Object.assign(cachedData[i + startIndex], items[i]);
                    }
                })).subscribe(subscriber);
            }
        });

    }

    refreshScroller() {
        this.scrollViewPort.checkViewportSize();
    }

}
