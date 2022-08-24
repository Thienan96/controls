import {Component, EventEmitter, Input, Output, ViewChild, ChangeDetectorRef, TemplateRef, AfterViewInit} from '@angular/core';
import {DisplayItem, FilterDefinition, FilterOperator, IDataItems} from '../../shared/models/common.info';
import {MatCheckboxChange} from '@angular/material';
import {Observable, forkJoin} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ToolbarService} from '../shared/toolbar.service';
import {VirtualScrollBaseController} from '../../core/controllers/virtual-scroll-base-controller';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';

@Component({
    selector: 'ntk-toolbar-virtual-scroll',
    templateUrl: './toolbar-virtual-scroll.component.html',
    styleUrls: ['./toolbar-virtual-scroll.component.scss']
})
export class ToolbarVirtualScrollComponent extends VirtualScrollBaseController<any> implements AfterViewInit {
    @Input() public itemSize: number;
    @Input() public filterItem: FilterDefinition;
    @Input() public isExclude = false;
    @Input() private selected: DisplayItem[];
    @Input() private deselected: DisplayItem[];
    @Input() private loadDataCallback: any;
    @Input() template: TemplateRef<any>;

    @Output() public itemChanged = new EventEmitter();

    @ViewChild('scrollViewPort', {static: true}) scrollViewPort: CdkVirtualScrollViewport;
    @ViewChild('itemTemplate', {static: false}) itemTemplate: TemplateRef<any>;

    constructor(cd: ChangeDetectorRef, private toolbarService: ToolbarService) {
        super(cd);
    }

    ngAfterViewInit() {
        this.template = this.template || this.itemTemplate;
    }

    public get isMultiSelectionMode(): boolean {
        return this.filterItem && (!this.filterItem.FilterOperator || this.filterItem.FilterOperator === FilterOperator.In);
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
        this.toggleItem(item, item.IsSelected);
        this.raiseItemChange();

    }

    /**
     * Toggle item when click on item
     * @param {MatCheckboxChange} item
     */
    public onItemClicked(item: DisplayItem) {
        if (item.Disabled) {
            return;
        }

        // When in single selection mode, clear the selected item before set to the clicked item
        if (!this.isMultiSelectionMode) {
            this.selected.forEach(currentItem => {
                this.toggleItem(currentItem, true);
            });
        }

        this.toggleItem(item, this.isMultiSelectionMode ? item.IsSelected : false);
        this.raiseItemChange();
    }


    public loadData(startIndex: number, pageSize: number): Observable<IDataItems<DisplayItem>> {
        return this.loadDataCallback(startIndex, pageSize).pipe(tap((item: IDataItems<DisplayItem>) => {
            this.toggle(item.ListItems);
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
                page.ListItems.forEach((item) => {
                    items.push(item);
                });
            });
            return items;
        }));
    }

    private toggleItem(item: DisplayItem, checked: boolean) {
        this.toolbarService.toggleItem(item, checked, this.isExclude, this.selected, this.deselected);
    }

    getSelectedItemsTotal(total: number) {
        if (this.isExclude) {
            return total - this.deselected.length;
        } else {
            return this.selected.length;
        }
    }

    private toggle(items: DisplayItem[]) {
        items.forEach((item) => {
            if (!item.Value) {
                return;
            }
            if (this.isExclude) {
                item.IsSelected = this.deselected.findIndex((deselectedItem: DisplayItem) => {
                    return deselectedItem.Value === item.Value;
                }) === -1;
            } else {
                item.IsSelected = this.selected.findIndex((selectedItem: DisplayItem) => {
                    return selectedItem.Value === item.Value;
                }) !== -1;
            }
        });
    }

    private raiseItemChange() {
        this.itemChanged.emit();
    }

    refreshScroller() {
        this.scrollViewPort.checkViewportSize();
    }
}
