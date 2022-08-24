import {Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {finalize, tap} from 'rxjs/operators';

import {
    DataType,
    DisplayItem,
    FilterDefinition,
    FilterOperator,
    IDataItems,
    ToolbarFilterViewType,
    TreeDisplayItem
} from '../../../shared/models/common.info';
import {HelperService} from '../../../core/services/helper.service';
import {ToolbarVirtualScrollComponent} from '../../toolbar-virtual-scroll/toolbar-virtual-scroll.component';
import {ToolbarTreeComponent} from '../../toolbar-tree/toolbar-tree.component';
import {ToolbarListComponent} from '../../toolbar-list/toolbar-list.component';
import {ToolbarService} from '../../shared/toolbar.service';
import {ToolbarTreeVirtualScrollComponent} from '../../toolbar-tree-virtual-scroll/toolbar-tree-virtual-scroll.component';


@Component({
    selector: 'ntk-filters-dialog-multi-choose',
    templateUrl: './filters-dialog-multi-choose.component.html',
    styleUrls: ['./filters-dialog-multi-choose.component.scss'],
    host: {
        '[class.ntk-toolbar-layout-column]': 'isSmallScreen'
    }
})
export class FiltersDialogMultiChooseComponent implements OnInit {
    @ViewChild('virtualScrollComponent', {static: false}) private virtualScrollComponent: ToolbarVirtualScrollComponent;
    @ViewChild('treeComponent', {static: false}) private treeComponent: ToolbarTreeComponent;
    @ViewChild('listComponent', {static: false}) private listComponent: ToolbarListComponent;
    @ViewChild('treeVirtualScrollComponent', {static: false}) private treeVirtualScrollComponent: ToolbarTreeVirtualScrollComponent;

    public items: DisplayItem[] = [];
    public selected: DisplayItem[] = [];
    public deselected: DisplayItem[] = [];
    public filterItem: FilterDefinition;
    public searchKeyword = '';
    public lbItemsMatchTheFilters: string;
    public lbSelectAll: string;
    public loaded = false;
    public isEmptyList = false;
    public showLoading = false;
    public height: number;
    public isCheckAll: boolean;
    public loadData: any;
    public currentFilters: FilterDefinition[] = [];
    public template: TemplateRef<any>;
    private originItems: DisplayItem[] = [];
    private readonly getDisplayItems: any;
    private total = 0; // Total of the items
    private _isExclude = false;
    private maxHeight = 440;
    private $element: JQuery;
    private toolbarBottom: number;

    predefineFilters: DisplayItem[] = [];
    private getPredefineFilters: any;

    public isSingleSelectionMode = false;
    autoFocus: boolean;
    isSmallScreen: boolean;
    isShowSearch = false;

    constructor(private dialogRef: MatDialogRef<FiltersDialogMultiChooseComponent>,
                @Inject(MAT_DIALOG_DATA) data: any,
                private helperService: HelperService,
                private toolbarService: ToolbarService,
                element: ElementRef) {
        this.$element = $(element.nativeElement);
        this.loadData = this._loadData.bind(this);
        // Text when the list is empty
        this.lbItemsMatchTheFilters = this.helperService.TranslationService.getTranslation('lbItemsMatchTheFilters').replace('{0}', '0');
        this.filterItem = data.filterDefinition;
        this.getDisplayItems = data.getDisplayItems;
        this.currentFilters = data.currentFilters;
        this.toolbarBottom = data.toolbarBottom;
        this.getPredefineFilters = data.getPredefineFilters;
        this.template = data.template;
        this.autoFocus = data.autoFocus;
        this.isSmallScreen = data.isSmallScreen;
        this.isCheckAll = this.filterItem.IsCheckboxSelectedAll;
        this.isExclude = this.filterItem.IsExclude;
        this.buildTitle(this.filterItem.SelectedItemsTotal);

        this.isSingleSelectionMode = this.filterItem && this.filterItem.FilterOperator === FilterOperator.Equals;

        if (!this.isExclude) {
            this.selected = this.getSelectedItems();
        } else {
            this.deselected = this.getSelectedItems();
        }

    }

    get isExclude(): boolean {
        return this._isExclude;
    }

    set isExclude(value: boolean) {
        if (!this.canExclude()) {
            this._isExclude = false;
        } else {
            this._isExclude = value;
        }
        this.updateExclude(this._isExclude);
    }

    ngOnInit() {
        this.setDefaltHeight();

        // Load Predefine Filters
        this.getPredefineFilters({
            ColumnName: this.filterItem.ColumnName
        }).subscribe((items) => {
            this.predefineFilters.splice(0, this.predefineFilters.length, ...items);
            this.buildTitle(this.filterItem.SelectedItemsTotal);
            this.updateHeight();
        });


        if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad ||
            this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            this.loaded = true;
        } else {
            this.showLoading = true;
            this.geDataList().subscribe((items) => {
                if (items['ListItems']) { // Fix items
                    items = items['ListItems'];
                }

                items.forEach((item) => {
                    this.originItems.push(item);
                    this.items.push(item);
                });
                this.loaded = true;
                this.showLoading = false; // Hide loading
                this.isEmptyList = this.items.length === 0; // Check empty

                this.total = this.originItems.length;
                this.updateHeight();
            });
        }
    }

    /**
     * Get values after the dialog closed
     * @returns {any}
     */
    public getFilterValues() {
        let selected, values;

        if (this.isEnumBool()) {
            selected = this.selected.map((item: DisplayItem) => {
                if (item.toJson) {
                    return item.toJson();
                } else {
                    return item;
                }
            });
            values = selected.map((item) => {
                return item.Value;
            });

        } else {
            let itemSelected = this.isExclude ? this.deselected : this.selected;
            selected = itemSelected.map((item: DisplayItem) => {
                if (item.toJson) {
                    return item.toJson();
                } else {
                    return item;
                }
            });

            let effectedIds = selected.map((item) => {
                return item.Value;
            });
            values = {
                IsExclude: effectedIds.length === 0 ? false : this.isExclude,
                EffectedIds: effectedIds
            };
        }

        let isPredefined = this.isPredefined();
        // When in Predefined, we not consider checkall
        let checkedAll = !isPredefined && this.isCheckedAll();

        let selectedItemsTotal = this.getSelectedItemsTotal();
        let isCheckboxSelectedAll = this.isCheckAll;
        let isExclude = this.isExclude;
        let canUpdateCheckedAll = this.filterItem.CanUpdateCheckedAll;

        return {
            Value: values,
            SelectedItems: selected,
            SelectedItemsTotal: selectedItemsTotal,
            IsExclude: isExclude,
            IsCheckboxSelectedAll: isCheckboxSelectedAll,
            CheckedAll: checkedAll,
            IsPredefined: isPredefined,
            CanUpdateCheckedAll: canUpdateCheckedAll
        };

    }

    public onSubmit() {
        this.onOk();
    }

    public onOk() {
        this.dialogRef.close(this.getFilterValues());
    }

    public onCancel() {
        this.dialogRef.close();
    }

    /**
     * Bind event when user type text to search
     */
    public onSearchChanged() {
        this.filter();
    }

    public onSelectAllChange(changed: MatCheckboxChange) {
        // Update Exclude
        let isExclude = false;
        if (changed.checked) {
            isExclude = !this.searchKeyword;
        }
        this.isExclude = isExclude;

        this.toggleCheckAll(changed.checked);
        this.buildTitle(this.getSelectedItemsTotal());
    }

    public onItemChanged() {
        // Remove Predefined in selected, deselected
        this.predefineFilters.forEach((filter) => {
            let selectedPos = this.selected.findIndex((item) => {
                return item.Value === filter.Value;
            });
            if (selectedPos !== -1) {
                this.selected.splice(selectedPos, 1);
            }

            let deselectedPos = this.deselected.findIndex((item) => {
                return item.Value === filter.Value;
            });
            if (deselectedPos !== -1) {
                this.deselected.splice(deselectedPos, 1);
            }
        });

        this.updateCheckAll();
        this.buildTitle(this.getSelectedItemsTotal());

        if (this.isSingleSelectionMode) {
            this.onOk();
        }
    }

    private canExclude() {
        return !this.isEnumBool();
    }

    onItemCounted(total) {
        this.total = total;
    }

    /**
     * Get items from startIndex,pageSize
     * @param {number} startIndex
     * @param {number} pageSize
     * @returns {Observable<DisplayItem[]>}
     */
    private _loadData(startIndex: number, pageSize: number) {
        let options = {
            ColumnName: this.filterItem.ColumnName,
            Query: this.searchKeyword,
            FromIndex: startIndex,
            PageSize: pageSize
        };

        if (startIndex === 0) {
            this.showLoading = true;
        }

        return this.getDisplayItems(options)
            .pipe(tap((data: IDataItems<DisplayItem>) => {
                if (startIndex === 0) {
                    let count = data.Count;
                    this.isEmptyList = count === 0; // Check list empty
                    if (!this.searchKeyword) { // Update total if  searchKeyword is null
                        this.total = count;
                        this.updateHeight();
                    }
                }

            }))
            .pipe(finalize(() => {
                if (startIndex === 0) {
                    this.showLoading = false;
                }

            }));
    }

    /**
     * Get selected
     * @returns {DisplayItem[]}
     */
    private getSelectedItems(): DisplayItem[] {
        return this.filterItem.SelectedItems.map((item: DisplayItem) => {
            return new DisplayItem(item.Value, item.DisplayValue, item.IsSelected, item.TranslateKey, item.OriginData, item.Disabled, item.Template);
        });
    }

    /**
     * Get All data
     * @returns {Observable<DisplayItem[]>}
     */
    private geDataList(): Observable<DisplayItem[]> {
        let options = {
            ColumnName: this.filterItem.ColumnName,
        };
        return this.getDisplayItems(options);

    }

    /**
     * Filter the list by searchKeyword
     */
    private filter(): void {
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalList) {
            if (this.listComponent) {
                this.items = this.listComponent.search(this.searchKeyword, this.originItems);
                this.isEmptyList = this.items.length === 0;
            }
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
            if (this.virtualScrollComponent) {
                this.virtualScrollComponent.refresh();
            }
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalTree || this.filterItem.ViewType === ToolbarFilterViewType.TreeGroup) {
            if (this.treeComponent) {
                this.items = this.treeComponent.search(this.searchKeyword, <TreeDisplayItem[]> this.originItems);
                this.isEmptyList = this.items.length === 0;
            }
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            if (this.treeVirtualScrollComponent) {
                this.treeVirtualScrollComponent.refresh();
            }
        }
    }

    private setDefaltHeight() {
        if (this.filterItem.DataType === DataType.Boolean) {
            this.height = 101;
        } else {
            this.height = this.maxHeight;
        }
    }

    /**
     * Update height of dialog content
     */
    private updateHeight(): void {
        if (this.total > 0) {
            this.height = this.total * 48 + 5;
            this.height = this.height > this.maxHeight ? this.maxHeight : this.height;
        } else {
            this.height = this.maxHeight;
        }


        // Set max-height
        let offsetTop = this.toolbarBottom + (this.predefineFilters.length * 48) + 48;
        let dialogContent = this.$element.find('mat-dialog-content');

        let maxHeight = 'calc(95vh  - 52px   - ' + offsetTop + 'px';
        if (this.isSingleSelectionMode) {
            maxHeight = 'calc(95vh - ' + offsetTop + 'px' + ')';
        }

        dialogContent.css('max-height', maxHeight);

        setTimeout(() => {
            if (this.virtualScrollComponent) {
                this.virtualScrollComponent.refreshScroller();
            }
            if (this.treeVirtualScrollComponent) {
                this.treeVirtualScrollComponent.refreshScroller();
            }
        }, 100);
    }

    private getSelectedItemsTotal(): number {
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalList) {
            return this.toolbarService.getSelectedItemsTotal(this.originItems, this.isExclude, this.selected, this.deselected);
        }
        if (this.virtualScrollComponent && this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
            return this.virtualScrollComponent.getSelectedItemsTotal(this.total);
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalTree) {
            return this.toolbarService.getSelectedItemsTotal(this.originItems, this.isExclude, this.selected, this.deselected);
        }
        if (this.treeComponent && this.filterItem.ViewType === ToolbarFilterViewType.TreeGroup) {
            return this.treeComponent.getSelectedItemsTotal(<TreeDisplayItem[]> this.originItems);
        }
        if (this.treeVirtualScrollComponent && this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            return this.treeVirtualScrollComponent.getSelectedItemsTotal(this.total);
        }
    }

    private toggleCheckAll(checked: boolean): void {
        // Empty selected
        this.selected.splice(0, this.selected.length);
        this.deselected.splice(0, this.deselected.length);


        let items: DisplayItem[],
            currentItems: DisplayItem[];
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalList) {
            items = this.originItems;
            currentItems = this.items;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
            items = this.virtualScrollComponent.dataSource.cachedData;
            currentItems = this.virtualScrollComponent.dataSource.cachedData;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalTree) {
            items = this.originItems.concat(this.items);
            currentItems = this.items;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeGroup) {
            items = this.originItems.concat(this.items);
            currentItems = this.items.filter((node: TreeDisplayItem) => {
                return node.Type === this.filterItem.LeafType;
            });
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            items = this.treeVirtualScrollComponent.dataSource.cachedData;
            currentItems = this.treeVirtualScrollComponent.dataSource.cachedData;
        }

        // Unselect All
        items.forEach((item: DisplayItem) => {
            if (!item.Value) {
                return;
            }
            if (!item.Disabled) {
                item.IsSelected = false;
            }
        });

        // Select currentItems
        if (checked) {
            currentItems.forEach((item: DisplayItem) => {
                if (!item.Value) {
                    return;
                }
                if (!item.Disabled) {
                    item.IsSelected = checked;
                }
            });
        }

        if (checked && !this.isExclude) {
            currentItems.forEach((item: DisplayItem) => {
                this.selected.push(item);
            });
            if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
                this.virtualScrollComponent.loadAllData().subscribe((allItems: DisplayItem[]) => {
                    this.selected.splice(0, this.selected.length);
                    allItems.forEach((item: DisplayItem) => {
                        if (!item.Disabled) {
                            item.IsSelected = checked;
                            this.selected.push(item);
                        }
                    });

                });
            }
            if (this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
                this.treeVirtualScrollComponent.loadAllData().subscribe((allItems: TreeDisplayItem[]) => {
                    this.selected.splice(0, this.selected.length);
                    allItems.forEach((item: TreeDisplayItem) => {
                        if (!item.Disabled) {
                            item.IsSelected = checked;
                            this.selected.push(item);
                        }
                    });
                });
            }
        }

    }

    private buildTitle(selectedItemsTotal): void {
        if (this.isPredefined() || !this.filterItem.CanUpdateCheckedAll) {
            this.lbSelectAll = this.helperService.TranslationService.getTranslation('btSelectAll');
        } else {
            if (selectedItemsTotal) {
                this.lbSelectAll = selectedItemsTotal + ' ' + this.helperService.TranslationService.getTranslation('lbItemsSelected');
            } else {
                this.lbSelectAll = this.helperService.TranslationService.getTranslation('btSelectAll');
            }
        }
    }

    private isEnumBool(): boolean {
        return this.filterItem.DataType.split(':')[0] === DataType.Enum || this.filterItem.DataType === DataType.Boolean;
    }

    private updateCheckAll() {
        let selectedItemsTotal = this.getSelectedItemsTotal(),
            total = this.getListTotal(),
            reset = false;
        if (selectedItemsTotal === total && total > 0 && this.isCheckAll === false) { // switch uncheck to check
            this.isCheckAll = true;
            this.isExclude = true;
            reset = true;
        }

        if (selectedItemsTotal === 0 && this.isCheckAll === true) { // switch check to uncheck
            this.isCheckAll = false;
            this.isExclude = false;
            reset = true;
        }

        if (reset) {
            if (!this.isEnumBool()) {
                this.selected.splice(0, this.selected.length);
                this.deselected.splice(0, this.deselected.length);
            }
        }
    }

    private getListTotal(): number {
        let total = 0;
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalList ||
            this.filterItem.ViewType === ToolbarFilterViewType.NormalTree) {
            total = this.originItems.length;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
            total = this.total;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeGroup) {
            total = this.originItems.filter((item: TreeDisplayItem) => {
                return item.Type === this.filterItem.LeafType;
            }).length;
        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            total = this.total;
        }
        return total;
    }

    private isCheckedAll() {
        if (this.isEnumBool()) {
            return this.selected.length === this.originItems.length || this.selected.length === 0;
        } else {
            let selectedItemsTotal = this.getSelectedItemsTotal(),
                total = this.getListTotal();
            return selectedItemsTotal === total || selectedItemsTotal === 0;
        }
    }

    private updateExclude(isExclude: boolean) {
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalList) {
            if (this.listComponent) {
                this.listComponent.isExclude = isExclude;
            }

        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.VirtualLoad) {
            if (this.virtualScrollComponent) {
                this.virtualScrollComponent.isExclude = isExclude;
            }

        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.NormalTree || this.filterItem.ViewType === ToolbarFilterViewType.TreeGroup) {
            if (this.treeComponent) {
                this.treeComponent.isExclude = isExclude;
            }

        }
        if (this.filterItem.ViewType === ToolbarFilterViewType.TreeVirtualLoad) {
            if (this.treeVirtualScrollComponent) {
                this.treeVirtualScrollComponent.isExclude = isExclude;
            }
        }
    }

    private reset() {
        // Uncheck all
        this.toggleCheckAll(false);
        this.isCheckAll = false;

        // Default is include
        this.isExclude = false;

        this.selected.splice(0, this.selected.length);
        this.deselected.splice(0, this.deselected.length);
    }

    onPredefineFilterClicked(item: DisplayItem) {
        this.reset();
        this.selected.push(item);
        this.onOk();
    }

    isPredefined(): boolean {
        if (this.selected.length === 1) {
            let pos = this.predefineFilters.findIndex((filter) => {
                return filter.Value === this.selected[0].Value;
            });
            return pos !== -1;
        } else {
            return false;
        }
    }
}
