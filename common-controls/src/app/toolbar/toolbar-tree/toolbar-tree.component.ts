import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FilterDefinition, ToolbarFilterViewType, TreeDisplayItem} from '../../shared/models/common.info';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {Observable, of as observableOf} from 'rxjs';
import {HelperService} from '../../core/services/helper.service';
import {ToolbarService} from '../shared/toolbar.service';


/** Flat node with expandable and level information */

@Component({
    selector: 'ntk-toolbar-tree',
    templateUrl: './toolbar-tree.component.html',
    styleUrls: ['./toolbar-tree.component.scss']
})
export class ToolbarTreeComponent implements OnInit, OnChanges {
    @Input() selected: TreeDisplayItem[];
    @Input() deselected: TreeDisplayItem[];
    @Input() items: TreeDisplayItem[] = [];
    @Input() viewType: ToolbarFilterViewType;
    @Input() isExclude = false;
    @Output() public itemChanged = new EventEmitter();
    @Input() public filterItem: FilterDefinition;

    treeControl: FlatTreeControl<TreeDisplayItem>;
    treeFlattener: MatTreeFlattener<TreeDisplayItem, TreeDisplayItem>;
    public dataSource: MatTreeFlatDataSource<TreeDisplayItem, TreeDisplayItem>;
    public lbItemsMatchTheFilters: string;
    public hasChild = (index: number, node: TreeDisplayItem) => node.hasChildren();


    constructor(private helperService: HelperService,
                private toolbarService: ToolbarService) {

        let _getChildren = (node: TreeDisplayItem): Observable<TreeDisplayItem[]> => {
                return observableOf(node.Children);
            },
            _isExpandable = (node: TreeDisplayItem) => {
                return node.hasChildren();
            },
            _getLevel = (node: TreeDisplayItem) => node.Level,
            _transformer = (node: TreeDisplayItem) => {
                return node;
            };

        this.lbItemsMatchTheFilters = this.helperService.TranslationService.getTranslation('lbItemsMatchTheFilters').replace('{0}', '0');
        this.treeFlattener = new MatTreeFlattener(_transformer, _getLevel, _isExpandable, _getChildren);
        this.treeControl = new FlatTreeControl<TreeDisplayItem>(_getLevel, _isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    }

    ngOnInit() {
        let nodes = this.buildTreeData(this.items),
            root = this.createRoot(nodes);
        this.dataSource.data = root.Children;
        this.setSelected(this.items);
        this.treeControl.expandAll();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.items && !changes.items.isFirstChange()) {
            let nodes = this.buildTreeData(this.items),
                root = this.createRoot(nodes);
            this.dataSource.data = root.Children;
            this.setSelected(this.items);
            this.treeControl.expandAll();
        }
    }

    /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
    public onLeafClicked(node: TreeDisplayItem): void {
        this.toggleItem(node, node.IsSelected);
        this.raiseItemChange();
    }

    /** Toggle the to-do item selection. Select/deselect all the descendants node */
    public onNodeClicked(node: TreeDisplayItem): void {
        let checked: boolean = node.IsSelected;
        this.toggleItem(node, checked);
        let descendants = this.treeControl.getDescendants(node);
        descendants.forEach((item) => {
            this.toggleItem(item, checked);
        });
        this.raiseItemChange();
    }


    public search(searchKeyword: string, items: TreeDisplayItem[]): TreeDisplayItem[] {
        let resultList: TreeDisplayItem[] = [];

        // Clone data, create tree to search
        let itemsCloned = items.map((item) => {
            return item.clone();
        });

        let nodes = this.buildTreeData(itemsCloned);
        let root = this.createRoot(nodes);


        // Remove node don't match keySearch
        this.removeNodeByKeySearch(searchKeyword, root);

        // Search tree if level is 0
        root.Children
            .forEach((item) => {
                resultList = resultList.concat(this._search(searchKeyword, item));
            });

        return this.convertTreeToList(...resultList);

    }

    private toggleItem(node, checked) {
        this.toolbarService.toggleItem(node, checked, this.isExclude, this.selected, this.deselected);
    }

    private searchTree(node: TreeDisplayItem, searchKeyword: string) {
        if (node.DisplayValue.toUpperCase().indexOf(searchKeyword.toUpperCase()) !== -1) {
            return node;
        } else {
            let i, result = null;
            for (i = 0; result === null && i < node.Children.length; i++) {
                result = this.searchTree(node.Children[i], searchKeyword);
            }
            return result;
        }

    }

    private searchNode(node: TreeDisplayItem, searchKeyword: string) {
        if (node.DisplayValue.toUpperCase().indexOf(searchKeyword.toUpperCase()) !== -1) {
            return node;
        } else {
            return null;
        }
    }

    private removeNodeByKeySearch(searchKeyword: string, node: TreeDisplayItem) {
        for (let i = 0; i < node.Children.length; i++) {
            if (!this.searchTree(node.Children[i], searchKeyword)) {
                node.Children.splice(i, 1);
                i--;
            } else {
                this.removeNodeByKeySearch(searchKeyword, node.Children[i]);
            }
        }

    }

    private _search(searchKeyword: string, node: TreeDisplayItem) {
        let resultList: TreeDisplayItem[] = [];
        if (this.viewType === ToolbarFilterViewType.NormalTree) {
            if (this.searchNode(node, searchKeyword)) {
                let level = node.Level;
                this.travel(node, (item: TreeDisplayItem) => {
                    item.Level = item.Level - level;
                });
                resultList.push(node);
            } else {
                node.Children
                    .forEach((item) => {
                        resultList = resultList.concat(this._search(searchKeyword, item));
                    });
            }
        }
        if (this.viewType === ToolbarFilterViewType.TreeGroup) {
            if (this.searchTree(node, searchKeyword)) {
                let level = node.Level;
                this.travel(node, (item: TreeDisplayItem) => {
                    item.Level = item.Level - level;
                });
                resultList.push(node);
            } else {
                node.Children
                    .forEach((item) => {
                        resultList = resultList.concat(this._search(searchKeyword, item));
                    });
            }
        }

        return resultList;
    }

    private getChildren(node: TreeDisplayItem, items: TreeDisplayItem[]): TreeDisplayItem[] {
        let i = items.findIndex((item) => {
            return item.Value === node.Value;
        });
        if (i + 1 === items.length) {
            return [];
        }
        let children = [];
        for (let j = i + 1; j < items.length; j++) {
            if (items[i].Level === items[j].Level - 1) {
                children.push(items[j]);
            }
            if (items[i].Level > items[j].Level - 1) {
                break;
            }
        }
        return children;
    }

    private buildTreeData(items: TreeDisplayItem[]): TreeDisplayItem[] {
        items.forEach((item) => {
            item.Children = this.getChildren(item, items);
        });
        return items.filter((item) => {
            return item.Level === 0;
        });
    }

    private travel(root: TreeDisplayItem, callback: any) {
        callback(root);
        root.Children.forEach((item) => {
            this.travel(item, callback);
        });
    }

    private convertTreeToList(...nodes: TreeDisplayItem[]): TreeDisplayItem[] {
        let list = [];
        nodes.forEach((node: TreeDisplayItem) => {
            list.push(node);
            list = list.concat(this.convertTreeToList(...node.Children));
        });
        return list;
    }

    private createRoot(items: TreeDisplayItem[]) {
        return new TreeDisplayItem({
            Level: -1,
            Children: items
        });
    }


    private setSelected(items: TreeDisplayItem[]) {
        this.toolbarService.setSelected(items, this.isExclude, this.selected, this.deselected);
    }

    private raiseItemChange() {
        this.itemChanged.emit();
    }

    getSelectedItemsTotal(items: TreeDisplayItem[]): number {
        if (this.isExclude) {
            if (this.filterItem.LeafType) {
                return items.filter((item: TreeDisplayItem) => {
                    return item.Type === this.filterItem.LeafType;
                }).length - this.deselected.length;
            } else {
                return items.length - this.deselected.length;
            }

        } else {
            return this.selected.length;
        }
    }
}
