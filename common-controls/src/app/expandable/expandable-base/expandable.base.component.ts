import {
    ChangeDetectorRef,
    Component,
    ContentChild,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    SimpleChanges
} from '@angular/core';
import {ExpandableItemWrapper, NTK_EXPANDABLE} from '../shared/expandable.model';
import {Observable, of} from 'rxjs';
import {LinkListItem} from '../../core/tree/LinkListItem';
import {ExpandableBoundaryLineComponent} from '../expandable-boundary-line/expandable-boundary-line.component';
import {VirtualScrollComponent} from '../../virtual-scroll/virtual-scroll.component';
import {HelperService} from '../../core/services/helper.service';
import {DragDrop, DragDropRegistry} from '@angular/cdk/drag-drop';
import {NtkDragDropRegistry} from '../../drag-drop/drag-drop-registry';
import {NtkDragDrop} from '../../drag-drop/drag-drop.service';

@Component({
    selector: 'ntk-expandable-base',
    templateUrl: './expandable.base.component.html',
    styleUrls: ['./expandable.base.component.scss'],
    host: {
        class: 'ntk-expandable'
    },
    providers: [
        {
            provide: DragDropRegistry,
            useExisting: NtkDragDropRegistry
        },
        {
            provide: DragDrop,
            useExisting: NtkDragDrop
        },
        {
            provide: NTK_EXPANDABLE,
            useExisting: ExpandableBaseComponent
        }
    ]
})
export class ExpandableBaseComponent<T extends ExpandableItemWrapper> extends VirtualScrollComponent implements OnChanges {
    @Input() lines: any[] = [];
    @Input() itemHeight = 49;
    @Input() indent = 32;
    @Input() getItemWrapperInstance;

    @ContentChild(ExpandableBoundaryLineComponent, {static: true}) expandableBoundaryLineComponent: ExpandableBoundaryLineComponent<any>;

    @Output() selected = new EventEmitter();
    itemsWrappers: T[] = []; // Contain all items (Hidden, not hidden)
    $element: JQuery;
    lastItemParent: T; // Custom item at the bottom

    canCollapseAll: boolean; // Check Collapse all item
    canExpandAll: boolean; // Check Expand all item
    isShowNewStatus: boolean;
    isDirty = false; // Is Control dirty
    currentDragItem: any;
    protected rootNode: LinkListItem<T>;
    protected deletedItemIds: string[] = []; // Contain items deleted
    protected helperService: HelperService;

    constructor(injector: Injector, protected cd: ChangeDetectorRef) {
        super(injector, cd);
        this.helperService = injector.get(HelperService);
        this.$element = $(injector.get(ElementRef).nativeElement);
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.lines) {
            this.rootNode = this.buildTreeStructure(this.lines);

            this.buildCollection();
        }
    }


    /**
     * Get data for list
     * @param startIndex
     * @param pageSize
     */
    loadData(startIndex: number, pageSize: number): Observable<any> {
        let items = this.itemsWrappers
            .filter((itemsWrapper) => {
                return itemsWrapper.isVisible;
            })
            .map((itemsWrapper) => {
                return {
                    item: itemsWrapper.data,
                    itemWrapper: itemsWrapper
                };
            });
        let listItems = items.slice(startIndex, startIndex + pageSize);
        return of({
            Count: items.length,
            ListItems: listItems
        });
    }

    /**
     * Refresh list
     */
    refreshList() {
        super.refreshList();

        setTimeout(() => {
            this.updateBoundaryLines();
        }, 10);
    }

    /**
     * Track by list
     * @param index
     * @param item
     */
    trackByFunction(index: number, item: any) {
        return item.item ? item.item.Id : item.UniqueKey;
    }

    /**
     * Select|Unselect a line
     * @param item
     * @param isSelected
     */
    toggleSelectLine(item: T, isSelected: boolean) {
        // Unselect all item
        this.rootNode.travel((node) => {
            node.itemData.isSelected = false;
        });

        // Select item
        item.isSelected = isSelected;


        // Render line
        this.updateBoundaryLines();
    }

    protected getItemInstance(item: T): T {
        if (this.getItemWrapperInstance) {
            return this.getItemWrapperInstance(item);
        }
        return <T>new ExpandableItemWrapper(item);
    }

    /**
     * Update collection and force render list
     * @private
     */
    protected buildCollection() {
        this.itemsWrappers = this.getItemWrapperCollection(this.rootNode);
        this.refreshList();
    }

    protected getItemWrapperCollection(rootNode: LinkListItem<T>): T[] {
        let itemWrappers: T[] = [];
        rootNode.travel((currentItem) => {
            let itemWrapper = currentItem.getItemData();

            // Set hasChildren for Section/Include
            itemWrapper.hasChildren = !!currentItem._childHeadItem_;

            // Set level
            itemWrapper.level = this.getLevel(currentItem);

            itemWrappers.push(itemWrapper);
        });
        return itemWrappers;
    }

    /**
     * Get level of a node
     * @param node
     * @private
     */
    protected getLevel(node: LinkListItem<T>): number {
        let level = -1;
        while (node) {
            if (node._parentItem_) {
                level++;
            }
            node = node._parentItem_;
        }
        return level;
    }

    /**
     * Expand children of node(Only show Section, Include)
     * @param node
     * @private
     */
    protected expandNode(node: LinkListItem<T>) {
        if (node.itemData) {
            node.itemData.isCollapsed = false;
        }
        node.travel((currentItem) => {
            let itemData = currentItem.itemData;
            itemData.isCollapsed = false;
            itemData.isVisible = true;
        });
    }

    /**
     * Collapse children of node(Only show Section, Include)
     * @param node
     * @private
     */
    protected collapseNode(node: LinkListItem<T>) {
        if (node.itemData) {
            node.itemData.isCollapsed = true;
        }
        node.travel((currentItem) => {
            let itemData = currentItem.getItemData();
            itemData.isCollapsed = true;
            if (!(itemData.isSectionItem || itemData.isIncludeItem)) {
                itemData.isVisible = false;
            }
        });
    }


    /**
     * Expand|Collapse children of item by click toggle button
     * @param item
     */
    toggle(item: T) {
        let foundItem = this.getNode(item);
        if (item.isCollapsed) {
            this.expandNode(foundItem);
        } else {
            this.collapseNode(foundItem);
        }
        this.buildCollection();
    }

    /**
     * @param items
     * @param rootItem
     * @private
     */
    protected buildTreeStructure(items: any[], rootItem: any = null): LinkListItem<T> {
        // calculate the range of items effected.
        let processItems: any[] = [];
        let rootNode: LinkListItem;
        if (!rootItem) { // Is Root
            rootNode = new LinkListItem(null);
            items.forEach((item) => {
                processItems.push(item);
            });
        } else {
            rootNode = new LinkListItem(this.getItemInstance(rootItem));
            processItems = this.getItemsInBranch(items, rootItem, true);
        }

        while (processItems.length > 0) {
            // pop first item to create node
            let currentItem = processItems[0];

            // remove all item relative to this current items
            let branchItems = this.getItemsInBranch(processItems, currentItem, false);

            // remove all items in current branch
            for (let i = processItems.length - 1; i >= 0; i--) {
                if (branchItems.indexOf(processItems[i]) >= 0) {
                    processItems.splice(i, 1);
                }
            }
            // build the current node based on current visit item and append it to the rootNode
            let newNode: LinkListItem<T>;
            if (branchItems.length > 1) {
                newNode = this.buildTreeStructure(branchItems, currentItem);
            } else {
                newNode = new LinkListItem(this.getItemInstance(currentItem));
            }
            newNode.appendChild(rootNode);
        }

        return rootNode;
    }

    /**
     * Render boundary lines
     * @private
     */
    protected updateBoundaryLines() {
        if (this.expandableBoundaryLineComponent) {
            this.cd.detectChanges();
            this.expandableBoundaryLineComponent.update(this.rootNode, this.itemsWrappers);
        }
    }


    /**
     * Find node from T
     * @param item
     * @private
     */
    protected getNode(item: T): LinkListItem<T> {
        return this.rootNode.find((itm) => {
            return itm === item;
        });
    }


    /**
     * Is item out viewport ?
     * @param item
     * @private
     */
    protected isItemOutViewPort(item: T): boolean {
        let itemIndex: number = this.itemsWrappers
            .filter((itemsWrapper) => {
                return itemsWrapper.isVisible;
            })
            .findIndex((itemData) => {
                return itemData.Id === item.Id;
            });
        if (itemIndex < 0) {
            return false;
        }
        let scroller = this.$element.find('.scrollbar').first();
        let h = itemIndex * this.itemHeight - scroller.scrollTop();
        return !(h > 0 && h < scroller.height());
    }

    /**
     * Select item, scroll to item if it outside viewport
     * @param item
     * @private
     */
    protected setSelected(item: T) {
        this._selectedItem = item;
        this.rootNode.travel((node) => {
            node.itemData.isSelected = false;
        });
        item.isSelected = true;

        this.makeItemInViewPort(item);
    }

    /**
     * Make sure item in viewport, if item outside viewport, scroll to item
     * @param newNode
     * @private
     */
    protected makeItemInViewPort(newNode: T) {
        setTimeout(() => {
            // NBSHD-3771: Scroll to new element when element is out view
            if (this.isItemOutViewPort(newNode)) {
                this.scrollToItem(newNode, true);
            }
        }, 100);
    }

    /**
     *
     * @param items
     * @param rootBranchItem
     * @param isExcludeRootBranchItem
     * @private
     */
    protected getItemsInBranch(items: any[], rootBranchItem: any, isExcludeRootBranchItem: boolean): any[] {
        // all the visit items are already well sorted
        // that mean the parent item is always have lower index than the child item
        let startIndex: number = items.indexOf(rootBranchItem);

        if (startIndex < 0) {
            return [];
        }

        let itemsInBranch: any[] = [];
        itemsInBranch.push(rootBranchItem);

        let idsInBranch: Array<string> = [];
        idsInBranch.push(rootBranchItem.Id);

        for (let i = startIndex + 1; i < items.length; i++) {
            let parentItemId: string | undefined = items[i][`ParentCheckListItemId`];

            // branch item must belong the current branch
            if (!parentItemId || idsInBranch.indexOf(parentItemId) < 0) {
                break;
            }

            idsInBranch.push(items[i].Id);
            itemsInBranch.push(items[i]);
        }

        // delete the first one
        if (isExcludeRootBranchItem) {
            idsInBranch.splice(0, 1);
            itemsInBranch.splice(0, 1);
        }

        return itemsInBranch;
    }

    /**
     * Scroll to
     * @param item
     * @param animation
     * @private
     */
    private scrollToItem(item: T, animation = false) {
        // NBSHD-3932: Remove animation, Update topIndex to scroll to item

        let itemIndex: number = this.itemsWrappers
            .filter((itemsWrapper) => {
                return itemsWrapper.isVisible;
            })
            .findIndex((itemData) => {
                return item.Id === itemData.Id;
            });
        if (itemIndex < 0) {
            return;
        }

        let scrollbar = this.$element.find('.scrollbar');
        if (animation) {
            scrollbar.animate({
                scrollTop: itemIndex * this.itemHeight
            }, 600);
        } else {
            scrollbar.scrollTop(itemIndex * this.itemHeight);
        }
    }


}
