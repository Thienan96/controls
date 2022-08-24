import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {DisplayItem, FilterDefinition, FilterOperator} from '../../shared/models/common.info';
import {MatCheckboxChange} from '@angular/material';
import {ToolbarService} from '../shared/toolbar.service';
import * as _ from 'underscore';

@Component({
    selector: 'ntk-toolbar-list',
    templateUrl: './toolbar-list.component.html',
    styleUrls: ['./toolbar-list.component.scss']
})
export class ToolbarListComponent implements OnInit {
    @Input() public items: DisplayItem[];
    @Input() public filterItem: FilterDefinition;
    @Output() public itemChanged = new EventEmitter();
    @Input() isExclude = false;
    @Input() private selected: DisplayItem[];
    @Input() private deselected: DisplayItem[];
    @Input() template: TemplateRef<any>;

    @ViewChild('itemTemplate', {static: false}) itemTemplate: TemplateRef<any>;

    constructor(private toolbarService: ToolbarService) {
    }

    public get isMultiSelectionMode(): boolean {
        return this.filterItem && (!this.filterItem.FilterOperator || this.filterItem.FilterOperator === FilterOperator.In);
    }

    ngOnInit() {
        this.setSelected(this.items);
    }


    /**
     * Toggle item when click on item
     * @param {MatCheckboxChange} item
     */
    public onItemClicked(item: DisplayItem): void {
        if (item.Disabled) {
            return;
        }

        // When in single selection mode, clear the selected item before set to the clicked item
        if (!this.isMultiSelectionMode) {
            _.forEach(this.items, (currentItem) => {
                this.toggleItem(currentItem, true);
            });
        }
        this.toggleItem(item, this.isMultiSelectionMode ? item.IsSelected : false);
        this.raiseItemChange();
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
     * Search the list
     * @param {string} searchKeyword
     * @param {DisplayItem[]} items
     * @returns {any}
     */
    public search(searchKeyword: string, items: DisplayItem[]): DisplayItem[] {
        return items.filter((item: DisplayItem) => {
            return item.DisplayValue.toUpperCase().indexOf(searchKeyword.toUpperCase()) !== -1;
        });
    }


    /**
     * Toggle select item
     * @param {DisplayItem} item
     * @param {boolean} checked
     */
    private toggleItem(item: DisplayItem, checked: boolean): void {
        this.toolbarService.toggleItem(item, checked, this.isExclude, this.selected, this.deselected);
    }

    private setSelected(items): void {
        this.toolbarService.setSelected(items, this.isExclude, this.selected, this.deselected);
    }

    private raiseItemChange(): void {
        this.itemChanged.emit();
    }
}
