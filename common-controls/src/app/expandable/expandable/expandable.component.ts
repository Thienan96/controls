import {ChangeDetectorRef, Component, HostListener, Injector, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
    CheckListItemWrapper,
    ExpandableItemWrapper,
    IDocumentUpload,
    IExpandableDropPosition,
    ILineEntityItem,
    NTK_EXPANDABLE
} from '../shared/expandable.model';
import {Observable, of} from 'rxjs';
import {LinkListItem} from '../../core/tree/LinkListItem';
import {ExpandableBaseComponent} from '../expandable-base/expandable.base.component';

@Component({
    selector: 'ntk-expandable',
    templateUrl: '../expandable-base/expandable.base.component.html',
    styleUrls: ['../expandable-base/expandable.base.component.scss'],
    host: {
        class: 'ntk-expandable'
    },
    providers: [
        {
            provide: NTK_EXPANDABLE,
            useExisting: ExpandableComponent
        }
    ]
})
export class ExpandableComponent extends ExpandableBaseComponent<CheckListItemWrapper> implements OnChanges {
    @Input() parentCheckListBase: ILineEntityItem;
    @Input() displayMode = `Details`; // Details, Edit

    constructor(injector: Injector, protected cd: ChangeDetectorRef) {
        super(injector, cd);
    }

    @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.key === 'Escape' || event.key === 'Esc') && this.currentDragItem) {
            this.currentDragItem.data('canceled', 1);

            // Hide on indicate lines
            this.$element.find('.indicate-line').hide();

            this.currentDragItem.trigger('mouseup');
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.lines) {
            this.rootNode = this.buildTreeStructure(this.lines);
            this.rootNode.travel((item) => {
                let itemWrapperData = item.itemData.data;
                // we consider the ConditionalGroupItem return directly from server has the EntityVersion = 1
                // that use the separate the the ConditionalItem create new on client side
                if (itemWrapperData.EntityDiscriminator === 'ConditionalGroupItem') {
                    itemWrapperData.EntityVersion = 1;
                }
            });
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
    toggleSelectLine(item: CheckListItemWrapper, isSelected: boolean) {
        // Unselect all item
        this.rootNode.travel((node) => {
            node.itemData.isSelected = false;
        });

        // Select item
        item.isSelected = isSelected;


        // Render line
        this.updateBoundaryLines();
    }

    /**
     * Expand all list
     */
    expandAll() {
        this.expandNode(this.rootNode);

        this.buildCollection();
    }

    /**
     * Collapse all child of rootNode ( Only show section, include)
     */
    collapseAll() {
        this.collapseNode(this.rootNode);

        this.buildCollection();
    }

    /**
     * Delete item, trigger when agree delete item
     * @param item
     */
    onDeleteItem(item: CheckListItemWrapper) {
        this.deleteItem(item);
        this.buildCollection();
    }

    /**
     * Copy item and insert after item
     * @param item
     */
    onCopyItem(item: CheckListItemWrapper) {
        let newItem = this.getCopyItem(item);
        this.updateAfterUpdateItem(newItem);
    }

    /**
     * Add new line
     * @param item
     * @param isForceAddAsSib
     */
    addLine(item: CheckListItemWrapper, isForceAddAsSib: boolean) {
        let newItem = this.addItem(item, this.parentCheckListBase.EntityType === 'CheckList' ? 'CheckListLine' : 'CheckListTemplateLine', isForceAddAsSib);
        this.updateAfterUpdateItem(newItem);
    }

    /**
     * Add new section
     * @param item
     * @param isForceAddAsSib
     */
    addSection(item: CheckListItemWrapper, isForceAddAsSib: boolean) {
        let newItem = this.addItem(item, this.parentCheckListBase.EntityType === 'CheckList' ? 'CheckListSection' : `CheckListTemplateSection`, isForceAddAsSib);
        this.updateAfterUpdateItem(newItem);
    }

    /**
     * NBSHD-3771: Copy all lines to selected line if selected line is section and empty . Else, create a section contains lines
     * @param item
     * @param isForceAddAsSib
     * @param header
     * @param items
     */
    addChecklist(item: CheckListItemWrapper, isForceAddAsSib, header: any, items: any[]) {
        let currentNode = this.getNode(item),
            currentItemWrapper = currentNode.getItemData(),
            entityType = this.parentCheckListBase.EntityType === 'CheckList' ? 'CheckListSection' : 'CheckListTemplateSection',
            newItem: CheckListItemWrapper;

        if (currentItemWrapper && currentItemWrapper.isSectionItem && !currentItemWrapper.hasChildren) { // Copy all lines to selected line if selected line is section and empty
            currentItemWrapper.isCollapsed = false; // Fix expand button
            this.adaptItemsFromChecklist(header.Id, currentItemWrapper, true, header, items); // Section don't have any children
            newItem = currentNode.itemData;
        } else { // create a section contains lines
            newItem = this.addItem(item, entityType, isForceAddAsSib);
            newItem.data.Name = header.Name;
            newItem.isCollapsed = false; // Fix expand button
            this.adaptItemsFromChecklist(header.Id, newItem, true, header, items);
        }

        this.updateAfterUpdateItem(newItem);
    }

    /**
     * NBSHD-3771: If section is empty , the lines link  direct current link. If section don't empty,  the lines link  direct new node
     * @param item
     * @param isForceAddAsSib
     * @param header
     * @param items
     */
    addLinkChecklist(item: CheckListItemWrapper, isForceAddAsSib, header: any, items: any[]) {

        let currentNode = this.getNode(item),
            currentItemWrapper = currentNode && currentNode.getItemData(),
            entityType = this.parentCheckListBase.EntityType === 'CheckList' ? 'CheckListInclude' : 'CheckListTemplateInclude',
            newIncludeItem: CheckListItemWrapper;
        if (currentItemWrapper && currentItemWrapper.isSectionItem && !currentItemWrapper.hasChildren) { // Section don't have any children
            // because api don't support change EntityDiscriminator, we have to remove old item and  add new item
            // Remove old line and add new line , Newline' data is cloned from OldLine
            newIncludeItem = this.doCopyItem(currentItemWrapper).itemData;
            newIncludeItem.data.EntityDiscriminator = entityType;
            newIncludeItem.data.CheckListBase = header;
            newIncludeItem.data.Name = header.Name;
            newIncludeItem.isCollapsed = false; // Fix expand button
            // Delete old node
            this.deleteItem(currentItemWrapper);
        } else {
            newIncludeItem = this.addItem(item, entityType, isForceAddAsSib);
            newIncludeItem.data.CheckListBase = header;
            newIncludeItem.data.Name = header.Name;
            newIncludeItem.isCollapsed = false; // Fix expand button
        }
        this.adaptItemsFromChecklist(header.Id, newIncludeItem, false, header, items);


        this.updateAfterUpdateItem(newIncludeItem);
    }

    /**
     * Add new Conditional Group
     * @param item
     */
    addConditional(item: CheckListItemWrapper) {
        let newItem = this.addItem(item, 'ConditionalGroupItem', false);
        this.updateAfterUpdateItem(newItem);
    }

    /**
     * Decrease level of item
     * @param item
     */
    onDecreaseLevel(item: CheckListItemWrapper) {
        this.decreaseLevel(item);

        this.updateAfterUpdateItem(item);
    }

    /**
     * Increase level of item
     * @param item
     */
    onIncreaseLevel(item: CheckListItemWrapper) {
        this.increaseLevel(item);

        this.updateAfterUpdateItem(item);
    }

    /**
     * Move currentDragging to target
     * @param currentDragging: Item is dragging
     * @param target
     * @param position
     */
    moveItem(currentDragging: CheckListItemWrapper, target: CheckListItemWrapper, position: IExpandableDropPosition) {

        // Get selected node
        let currentNode = this.getNode(currentDragging);
        if (!currentNode) {
            return;
        }
        // Get parent node
        let toNode: LinkListItem | undefined = this.getNode(target);
        if (!toNode) {
            return;
        }
        if (currentNode === toNode) {
            return;
        }
        if (position === IExpandableDropPosition.Middle) {
            this.moveItemInto(currentNode, toNode);
        } else {
            let sameParent = currentDragging.parentId === target.parentId;
            if (!sameParent) {
                let parentNode = toNode._parentItem_;
                this.moveItemInto(currentNode, parentNode);
            }
            this.moveOnSameParent(currentNode, toNode, position);
        }

        this.updateAfterUpdateItem(currentDragging);

    }


    /**
     * Submit changes
     */
    getChanges() {
        this.rootNode.travel((currentItem) => {
            let currentItemWrapper = currentItem.getItemData();
            // enable this flag to show the error on the detail panel
            if (currentItemWrapper.data.ParentCheckListBaseId === this.parentCheckListBase.Id) {
                currentItemWrapper.isValidateAlready = true;
            }
        });

        let firstItemInValidate = this.rootNode.find((currentItemWrapper) => {
            // enable this flag to show the error on the detail panel
            if (currentItemWrapper.data.ParentCheckListBaseId === this.parentCheckListBase.Id) {
                currentItemWrapper.isValidateAlready = true;
                if (currentItemWrapper.isValidateFail) {
                    return true;
                }
            }
        });

        // if found one item  invalidated, scroll to that item
        if (firstItemInValidate) {
            this.setSelected(firstItemInValidate.getItemData());
            return null;
        }

        if (!this.isDirty) {
            return null;
        }

        let newOrUpdatedItems: any[] = [];
        this.rootNode.iterateDescendants((currentItem) => {
                let currentItemWrapper = currentItem.getItemData();
                let parentItemWrapper: CheckListItemWrapper;
                if (currentItem._parentItem_ && currentItem._parentItem_ !== this.rootNode) {
                    parentItemWrapper = currentItem._parentItem_.getItemData();
                }
                /**
                 * Exclude: isConditionalGroupItem
                 * Not include
                 * Dirty
                 */
                if (!currentItemWrapper.isConditionalGroupItem
                    && currentItemWrapper.data.ParentCheckListBaseId === this.parentCheckListBase.Id
                    && currentItemWrapper.isDirty()) {
                    let cloneItem = this.clone(currentItemWrapper.data);

                    // if the current item is directly child of the ConditionalGroupItem
                    // the actually parent item of the current item is the parent item of the ConditionalGroupItem
                    if (parentItemWrapper && parentItemWrapper.isConditionalGroupItem) {
                        cloneItem.ParentCheckListItemId = parentItemWrapper.data.ParentCheckListItemId;
                    }

                    // correct the Attachments
                    if (cloneItem.Attachments && cloneItem.Attachments.length > 0) {
                        cloneItem.Attachments.forEach((attachment) => {
                            attachment.DocumentUpload = <IDocumentUpload>{
                                Id: attachment.Document.Id,
                                Name: attachment.Document.Name,
                                EntityVersion: attachment.Document.EntityVersion
                            };
                            attachment.Document = undefined;
                        });
                    }
                    newOrUpdatedItems.push(cloneItem);
                }
            },
            (verifyItem) => {
                // if the current item is IncludeItems
                // don't continue check on the descendent of this item
                return verifyItem.getItemData().isIncludeItem;
            }
        );
        return {
            DeletedItemIds: this.deletedItemIds,
            NewOrUpdatedItems: newOrUpdatedItems
        };
    }

    checkCanDropTo(currentDragging: ExpandableItemWrapper, target: ExpandableItemWrapper): string[] {
        let result: string[] = [];
        if (currentDragging.isDescendentOfIncludeItem) {
            return result;
        }


        /**
         * NBSHD-3771:
         * Don't allow isConditionalGroupItem to other isConditionalGroupItem that it is not same parent
         * Only for drag top, bottom
         */
        if (currentDragging.isConditionalGroupItem && target.isConditionalGroupItem) {
            if (currentDragging.parentId === target.parentId) {
                result.push('Top');
                result.push('Bottom');
            }
            return result;
        }


        let isParentCondition = false;
        let currentId = currentDragging.Id;
        let targetParentId = target.parentId;
        while (targetParentId !== null) {
            if (targetParentId === currentId) {
                isParentCondition = true;
                targetParentId = null;
            } else {
                let parent = this.itemsWrappers.filter((item) => {
                    return item.Id === targetParentId;
                });
                if (parent && parent.length > 0) {
                    targetParentId = parent[0].parentId;
                } else {
                    targetParentId = null;
                }
            }
        }

        if (isParentCondition) {
            return result;
        }


        let currentParentId = currentDragging.parentId;
        targetParentId = target.parentId;


        // For condition group item, cannot move out of the current parent
        if (currentDragging.isConditionalGroupItem) {
            if (currentParentId === targetParentId) {
                result.push('Top');
                result.push('Bottom');
            }
        } else {
            // Moving on the same parent
            if (currentParentId === targetParentId) {
                // Always can move to top or bottom when same parent
                result.push('Top');
                result.push('Bottom');
                if (target.isConditionalGroupItem || target.isSectionItem) {
                    result.push('Middle');
                }

            } else {
                // First check that the parent of the target can contains the item to add Top, Bottom
                if (!targetParentId) { // move to root
                    result.push('Top');
                    result.push('Bottom');
                } else {
                    let targetParent = this.itemsWrappers.filter((item) => {
                        return item.Id === targetParentId;
                    });
                    if (targetParent && targetParent.length > 0 && targetParent[0].isConditionalGroupItem || targetParent[0].isSectionItem) {
                        result.push('Top');
                        result.push('Bottom');
                    }
                }

                // Second, check that the target can contains the item to add Middle
                if (target.isConditionalGroupItem || target.isSectionItem) {
                    result.push('Middle');
                }
            }

        }

        return result;
    }

    /**
     * @param items
     * @param rootItem
     * @private
     */
    protected buildTreeStructure(items: any[], rootItem: any = null): LinkListItem<CheckListItemWrapper> {
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
            let newNode: LinkListItem<CheckListItemWrapper>;
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
     * Update collection and force render list
     * @private
     */
    protected buildCollection() {
        this.itemsWrappers = this.getItemWrapperCollection(this.rootNode);
        this.lastItemParent = this.getLastItemParent(this.rootNode);
        this.buildItemNumbers(this.rootNode);
        this.checkExpandCollapseState(this.rootNode);


        // Update displayOrder to check dirty when move item
        this.resetDisplayOrder();

        // NBSHD-3771: Checking display new button
        this.isShowNewStatus = this.checkShowNewStatus(this.rootNode);

        this.isDirty = this.checkDirty(this.rootNode);

        this.refreshList();
    }

    protected getItemWrapperCollection(rootNode: LinkListItem<CheckListItemWrapper>): CheckListItemWrapper[] {
        let descendentOfConditionalGroupItem: { [index: string]: boolean } = {};
        let itemWrappers: CheckListItemWrapper[] = [];
        let descendentOfIncludeItem = {};
        rootNode.travel((currentItem) => {
            let itemWrapper: CheckListItemWrapper = currentItem.getItemData();
            let parentItemWrapper: CheckListItemWrapper = (currentItem._parentItem_ && currentItem._parentItem_ !== rootNode) ? currentItem._parentItem_.getItemData() : null;

            // Set hasChildren for Section/Include
            itemWrapper.hasChildren = !!currentItem._childHeadItem_;

            // Set level
            itemWrapper.level = this.getLevel(currentItem);


            // NBSHD-3771: Item is conditional line, parent of enter sign
            itemWrapper.isConditionalLineItem = (itemWrapper.isLineItem && currentItem._childHeadItem_ && currentItem._childHeadItem_.itemData.isConditionalGroupItem) || false;

            // NBSHD-3771: Mark Descendent of ConditionalGroup
            if (itemWrapper.isConditionalGroupItem) {
                descendentOfConditionalGroupItem[itemWrapper.Id] = true;
            }
            itemWrapper.isDescendentOfConditionalGroupItem = false;
            if (parentItemWrapper && descendentOfConditionalGroupItem[parentItemWrapper.Id]) {
                descendentOfConditionalGroupItem[itemWrapper.Id] = true;
                itemWrapper.isDescendentOfConditionalGroupItem = true;
            }


            // Mark descendent Of IncludeItem
            if (itemWrapper.isIncludeItem) {
                descendentOfIncludeItem[itemWrapper.Id] = true;
            }
            if (parentItemWrapper && descendentOfIncludeItem[parentItemWrapper.Id]) {
                descendentOfIncludeItem[itemWrapper.Id] = true;
                itemWrapper.isDescendentOfIncludeItem = true;
            }


            // Item is FirstLineOfParent
            itemWrapper.isFirstLineOfParent = parentItemWrapper && (parentItemWrapper.isSectionItem || parentItemWrapper.isLineItem || parentItemWrapper.isConditionalGroupItem) && currentItem._parentItem_._childHeadItem_.itemData.Id === itemWrapper.Id;


            // Check item can modify (Add, delete, copy)
            itemWrapper.canModify = !itemWrapper.isDescendentOfIncludeItem;


            // Increase, Decrease
            itemWrapper.canDecreaseLevel = this.canDecreaseLevel(itemWrapper);
            itemWrapper.canIncreaseLevel = this.canIncreaseLevel(itemWrapper);


            itemWrapper.isNew = !itemWrapper.isDescendentOfIncludeItem && itemWrapper.data.EntityVersion === 0;


            itemWrappers.push(itemWrapper);
        });
        return itemWrappers;
    }

    /**
     * Get level of a node
     * @param node
     * @private
     */
    protected getLevel(node: LinkListItem<CheckListItemWrapper>): number {
        let level = -1;
        while (node) {
            if (node._parentItem_) {
                if (!node.itemData.isConditionalGroupItem) {
                    level++;
                }
            }
            node = node._parentItem_;
        }
        return level;
    }

    protected getItemInstance(item: any): CheckListItemWrapper {
        return <CheckListItemWrapper>new CheckListItemWrapper(item);
    }

    /**
     * Increase level of item ( Only for section, Include)
     * @param item
     * @private
     */
    private increaseLevel(item: CheckListItemWrapper) {
        let node = this.getNode(item),
            parentOfCurrentNode = node._parentItem_,
            siblingsSection = this.getChildrenOfSectionAndConditionalLine(parentOfCurrentNode),
            position = siblingsSection.findIndex((n: LinkListItem) => {
                return n.getItemData().Id === item.Id;
            });
        if (position - 1 < 0) {
            return;
        }
        let target = siblingsSection[position - 1],
            targetData = target.getItemData();
        if (targetData.isConditionalLineItem) {
            target = target._childTailItem_;
        }
        this.moveItem(item, target.getItemData(), IExpandableDropPosition.Middle);
    }

    /**
     * Decrease level of item ( Only for section, Include)
     * @param item
     * @private
     */
    private decreaseLevel(item: CheckListItemWrapper) {
        let node = this.getNode(item), // Section 3
            target = !item.isDescendentOfConditionalGroupItem ? node._parentItem_ : node._parentItem_._parentItem_;
        this.moveItem(item, target.getItemData(), IExpandableDropPosition.Bottom);
    }

    /**
     * Check item can decrease level
     * @param item
     * @private
     */
    private canDecreaseLevel(item: CheckListItemWrapper) {
        let node = this.getNode(item);
        if (!node || item.level === 0 || !node._parentItem_) {
            return false;
        }
        return node._parentItem_.itemData.isSectionItem || (item.isDescendentOfConditionalGroupItem && (item.isSectionItem || item.isIncludeItem));
    }

    /**
     * Check item can increase level
     * @param item
     * @private
     */
    private canIncreaseLevel(item: CheckListItemWrapper) {
        let node = this.getNode(item);
        if (!node) {
            return false;
        }
        let parentNode = node._parentItem_,
            siblings = this.getChildrenOfSectionAndConditionalLine(parentNode);
        let position = siblings.findIndex((n) => {
            return n.getItemData().Id === item.Id;
        });
        if (position - 1 >= 0) {
            let nodeData = siblings[position - 1].getItemData();
            // Accept all(Section, ConditionalLine) , except IncludeItem
            return !nodeData.isIncludeItem;
        }
        return false;
    }

    /**
     * Move currentNode into parentNode
     * @param currentNode
     * @param parentNode
     * @private
     */
    private moveItemInto(currentNode: LinkListItem<CheckListItemWrapper>, parentNode: LinkListItem<CheckListItemWrapper>) {

        if (currentNode._parentItem_ === parentNode && parentNode._childTailItem_ === currentNode) {
            return;
        }


        if (currentNode.moveInto(parentNode)) {
            let sectionItemWrapper = parentNode.getItemData();


            // Update Parent Id
            currentNode.itemData.parentId = sectionItemWrapper ? sectionItemWrapper.Id : null;


            if (sectionItemWrapper) {
                this.assignParentChildRelativeInfo(sectionItemWrapper, currentNode.getItemData());

                // expand the section item
                if (sectionItemWrapper.isCollapsed) {
                    this.revertExpandOrCollapseStatus(sectionItemWrapper);
                }
            } else {
                // Fix issue sectionItemWrapper is null
                currentNode.itemData.data.Visibility = 'Always';
                currentNode.itemData.data.ConditionalVisibilityValueRange = undefined;
            }

        }

    }

    private revertExpandOrCollapseStatus(item: CheckListItemWrapper) {

        if (!this.rootNode) {
            return;
        }

        let foundItem: LinkListItem | undefined = this.rootNode.find((itm) => {
            return (itm === item);
        });

        // revert collapse state
        item.isCollapsed = !item.isCollapsed;

        let hasDirtyItem = false;
        let descendantItems = foundItem.getDescendants();
        // tslint:disable-next-line:prefer-for-of
        for (let _i = 0; _i < descendantItems.length; _i++) {
            let currentItem = descendantItems[_i].getItemData();
            // all the sections (even child sections) are always visible when collapse a section or all sections
            if (currentItem.isSectionItem || currentItem.isIncludeItem) {
                currentItem.isCollapsed = item.isCollapsed;
                currentItem.isVisible = true;
            } else {
                currentItem.isCollapsed = !item.isCollapsed;
                currentItem.isVisible = !item.isCollapsed;
            }

            if (!hasDirtyItem && (this.displayMode === 'Edit' || this.displayMode === 'New') && (currentItem.isDetailValueChanged || currentItem.isNew)) {
                hasDirtyItem = true;
            }
        }

        if (item.isCollapsed && (this.displayMode === 'Edit' || this.displayMode === 'New')) {
            item.hasDirtyDescendant = hasDirtyItem;
        } else {
            item.hasDirtyDescendant = false;
        }
    }

    private assignParentChildRelativeInfo(parentItemWrapper: CheckListItemWrapper, childItemWrapper: CheckListItemWrapper) {
        childItemWrapper.data.ParentCheckListItemId = parentItemWrapper.Id;

        // if new item is a ConditionalGroupItem. Copy also the ValueType and the Name from the parent item
        if (childItemWrapper.isConditionalGroupItem) {
            childItemWrapper.data.ValueType = parentItemWrapper.data.ValueType;
            childItemWrapper.data.Name = parentItemWrapper.data.Name;
            if (childItemWrapper.data.ValueType === 'Custom') {
                childItemWrapper.data.CustomValueType = parentItemWrapper.data.CustomValueType;
            }
        }

        // if current item is a ConditionalGroupItem.
        // set the visibility condition for the new child item
        if (parentItemWrapper.isConditionalGroupItem) {
            childItemWrapper.data.Visibility = 'Conditional';
            childItemWrapper.data.ConditionalVisibilityValueRange = parentItemWrapper.data.ConditionalVisibilityValueRange;
        } else {
            childItemWrapper.data.Visibility = 'Always';
            childItemWrapper.data.ConditionalVisibilityValueRange = undefined;
        }
    }

    /**
     * Sort item
     * @param currentNode
     * @param toNode
     * @param position
     * @private
     */
    private moveOnSameParent(currentNode: LinkListItem, toNode: LinkListItem, position: IExpandableDropPosition) {
        if (position === IExpandableDropPosition.Top) {
            LinkListItem.moveItemToBefore(currentNode, toNode);
        }
        if (position === IExpandableDropPosition.Bottom) {
            LinkListItem.moveItemToAfter(currentNode, toNode);
        }
    }

    /**
     * NBSHD-3932: check items can expand all, or can collapse all
     *
     * canExpandAll: have a line was collapsed and lines >0
     * canCollapseAll: have a line is line, conditional
     */
    private checkExpandCollapseState(rootNode: LinkListItem<CheckListItemWrapper>) {
        let isFoundCanCollapseItems = false;
        let isFoundCanExpandItems = false;
        rootNode.travel((currentItem) => {
            let currentItemWrapper = currentItem.getItemData();
            if ((currentItemWrapper.isSectionItem || currentItemWrapper.isIncludeItem) && currentItemWrapper.hasChildren) {
                if (currentItemWrapper.isCollapsed) {
                    isFoundCanExpandItems = true;
                } else {
                    isFoundCanCollapseItems = true;
                }
            }
        });
        this.canCollapseAll = isFoundCanCollapseItems;
        this.canExpandAll = isFoundCanExpandItems;
    }

    /**
     * Get last item to
     * @param rootNode
     * @private
     */
    private getLastItemParent(rootNode: LinkListItem<CheckListItemWrapper>) {
        let childItems = rootNode.getDescendants();
        if (childItems.length === 0) {
            return null;
        }
        let lastItem = childItems[childItems.length - 1],
            lastItemData = lastItem.getItemData();

        if (lastItemData.isConditionalGroupItem) {
            return lastItem._parentItem_._parentItem_.getItemData();
        } else {
            for (let i = childItems.length - 1; i >= 0; i--) {
                let itemData = childItems[i].getItemData();
                if (itemData.level < lastItemData.level && !itemData.isDescendentOfIncludeItem) {
                    return itemData;
                }
            }
        }

    }

    /**
     * Delete item
     * @param currentItemWrapper
     */
    private deleteItem(currentItemWrapper: CheckListItemWrapper) {
        let currentNode = this.getNode(currentItemWrapper);
        if (!currentNode) {
            return;
        }
        let currentItem = currentNode.getItemData();
        if (currentItem.data.EntityVersion !== 0) {
            this.deletedItemIds.push(currentItem.Id);
        }


        if (!currentItem.isIncludeItem) { // don`t remove children if item id include
            let children: LinkListItem[] = currentNode.getChildren();
            children.forEach((item) => {
                this.deleteItem(item.itemData);
            });
        }
        currentNode.removeItem();
    }

    /**
     * Clone data by JSON
     * @param data
     * @private
     */
    private clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * Get copy of item
     * @param currentItemWrapper
     * @private
     */
    private getCopyItem(currentItemWrapper: CheckListItemWrapper): CheckListItemWrapper {
        let currentNode = this.getNode(currentItemWrapper);
        if (!currentNode) {
            return;
        }
        // clone current item
        let cloneModel: any = this.clone(currentItemWrapper.data);
        cloneModel.Id = this.helperService.UtilityService.createGuid();
        cloneModel.EntityVersion = 0;

        // replace all Attachment if exists
        if (cloneModel.Attachments && cloneModel.Attachments.length > 0) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < cloneModel.Attachments.length; i++) {
                cloneModel.Attachments[i].Id = this.helperService.UtilityService.createGuid();
                cloneModel.Attachments[i].EntityVersion = 0;

                // dont copy the drawing
                cloneModel.Attachments[i].DrawingShapes = '';
                cloneModel.Attachments[i].DrawingPageIndex = 0;
            }
        }

        // Insert the newNode after current node
        let cloneNode = LinkListItem.insertAfter(currentNode, this.getItemInstance(cloneModel));


        // get the new insert item
        let cloneItemWrapper = cloneNode.getItemData();

        // Find all children
        let items: any[] = [];
        currentNode.travel((currentItem) => {
            let currentItemData = currentItem.getItemData();
            if (!currentItemData.isIncludeItem) {
                let cloneItem = this.clone(currentItemData.data);
                if (currentItem._parentItem_ === currentNode) {
                    cloneItem.ParentCheckListItemId = null;
                }
                items.push(cloneItem);
            }
        });


        if (items.length > 0) {
            let rootCloneNode = this.buildTreeStructure(items);

            // Redirect to the current node
            let childItems = rootCloneNode.getChildren();
            while (childItems.length > 0) {
                let childItem = childItems.pop();
                if (childItem) {
                    childItem._parentItem_ = cloneNode;

                    let childItemWrapper = childItem.getItemData();
                    childItemWrapper.data.ParentCheckListBaseId = cloneModel.ParentCheckListBaseId;
                    childItemWrapper.data.ParentCheckListItemId = cloneModel.Id;
                }
            }

            cloneNode._childHeadItem_ = rootCloneNode._childHeadItem_;
            cloneNode._childTailItem_ = rootCloneNode._childTailItem_;

            // replace all items linked to the current checklist
            let idRefs: { [index: string]: any } = {};
            idRefs[cloneItemWrapper.Id] = cloneItemWrapper.Id;


            cloneNode.travel((currentItem) => {
                    let currentItemData = currentItem.getItemData();
                    currentItemData.data.EntityVersion = 0;

                    // replace the value of Id and ParentItemId but keep the reference
                    let currentId: string = currentItemData.data.Id;
                    let newId: string = this.helperService.UtilityService.createGuid();
                    currentItemData.data.Id = newId;
                    idRefs[currentId] = newId;

                    if (currentItemData.data.ParentCheckListItemId) {
                        currentItemData.data.ParentCheckListItemId = idRefs[currentItemData.data.ParentCheckListItemId];
                    }
                }
            );
        }

        return cloneItemWrapper;
    }

    private getNewItemModel(parentItemId: string | undefined, entityDiscriminator: string) {
        return {
            Id: this.helperService.UtilityService.createGuid(),
            EntityVersion: 0,
            EntityDiscriminator: entityDiscriminator,
            Name: '',
            Coefficient: 1,
            PrintingType: 'Always',
            IsMandatory: false,
            DisplayOrder: 0,
            Visibility: (entityDiscriminator === 'ConditionalGroupItem' ? 'Conditional' : 'Always'),
            ValueType: 'Boolean',
            ParentCheckListItemId: parentItemId,
            ParentCheckListBaseId: this.parentCheckListBase.Id
        };


    }

    private addItem(item: CheckListItemWrapper, itemType: string, isForceAddAsSibling: boolean): CheckListItemWrapper {
        let newChecklistItem = this.getItemInstance(this.getNewItemModel(undefined, itemType));
        let currentNode = this.getNode(item);
        let newNode: LinkListItem;
        if (!currentNode) {
            if (!newChecklistItem.isConditionalGroupItem) {
                // if no item selected, add the new item as child of the root item
                newChecklistItem.data.ParentCheckListItemId = undefined;
                newNode = LinkListItem.newItem(this.rootNode, newChecklistItem);
            } else {
                throw new Error('Unable add this kind of item without parent');
            }
        } else {
            let currentItemWrapper = currentNode.getItemData();
            let parentItemWrapper: CheckListItemWrapper;
            if (currentNode._parentItem_ && currentNode._parentItem_ !== this.rootNode) {
                parentItemWrapper = currentNode._parentItem_.getItemData();
            }

            if (currentItemWrapper.isDescendentOfIncludeItem) {
                throw new Error('Unable add a new item from the linked item');
            }

            let isInsertAsChildOfCurrentItem = false;
            if (currentItemWrapper.isLineItem) {
                // if current selected item is a LineItem. We can:
                // + Add ConditionalGroupItem as CHILD item
                // + Add Line/Section/CheckList/CheckListInclude as NEXT item
                isInsertAsChildOfCurrentItem = newChecklistItem.isConditionalGroupItem;
            } else if (currentItemWrapper.isIncludeItem) {
                // if current selected item is a IncludeItem. We can:
                // + Add Line/Section/CheckList/CheckListInclude as NEXT item
                isInsertAsChildOfCurrentItem = false;
            } else if (currentItemWrapper.isSectionItem) {
                // if current selected item is a SectionItem. We can:
                // + Add Line/Section/CheckList/CheckListInclude as CHILD item

                isInsertAsChildOfCurrentItem = !isForceAddAsSibling;
                // isInsertAsChildOfCurrentItem = true && !isForceAddAsSibling;
            } else if (currentItemWrapper.isConditionalGroupItem) {
                // if current selected item is a ConditionalGroupItem. We can:
                // + Add ConditionalGroupItem as NEXT item
                // + Add Line/Section/CheckList/CheckListInclude as CHILD item
                isInsertAsChildOfCurrentItem = !newChecklistItem.isConditionalGroupItem;
            }

            if (isInsertAsChildOfCurrentItem) {
                this.assignParentChildRelativeInfo(currentItemWrapper, newChecklistItem);

                newNode = LinkListItem.newItem(currentNode, newChecklistItem);

                // if the current section is collapsed. expand it before adding
                if (currentItemWrapper.isSectionItem && currentItemWrapper.isCollapsed) {
                    this.revertExpandOrCollapseStatus(currentItemWrapper);
                }

            } else {
                newChecklistItem.data.ParentCheckListItemId = parentItemWrapper ? parentItemWrapper.Id : undefined;

                // copy visibility condition if the current item is a conditional item
                newChecklistItem.data.Visibility = currentItemWrapper.data.Visibility;

                if (newChecklistItem.isConditionalGroupItem) {
                    if (parentItemWrapper && parentItemWrapper.isLineItem) {
                        this.assignParentChildRelativeInfo(parentItemWrapper, newChecklistItem);
                    }
                } else {
                    newChecklistItem.data.ConditionalVisibilityValueRange = currentItemWrapper.data.ConditionalVisibilityValueRange;
                }

                newNode = LinkListItem.insertAfter(currentNode, newChecklistItem);
            }
        }


        return newNode.itemData;
    }

    /**
     * Adapt items from o the checklists
     * @param fromCheckListBaseId
     * @param parentItem
     * @param isReplaceParentCheckListBaseId - should we replace the linked CheckListBase for all items of the new checklist
     * @param header
     * @param items
     */
    private adaptItemsFromChecklist(fromCheckListBaseId: string, parentItem: CheckListItemWrapper, isReplaceParentCheckListBaseId: boolean, header: ILineEntityItem, items: ILineEntityItem[]) {
        let parentNode = this.getNode(parentItem);


        if (!!header.Attachments && header.Attachments.length > 0) {
            parentItem.data.Attachments = [];
            header.Attachments.forEach((attachment) => {
                // NBSHD-4031: Clone attachments if CurrentCheckList is addCheckList
                if (isReplaceParentCheckListBaseId) {
                    attachment.Id = this.helperService.UtilityService.createGuid();
                    attachment.EntityVersion = 0;
                    attachment.CheckListItemBaseId = parentItem.data.Id;
                    attachment.CheckListBaseId = this.parentCheckListBase.Id;
                }
                parentItem.data.Attachments.push(attachment);
            });
        }

        // NBSHD-4031: Copy description if CurrentCheckList is LinkCheckList
        if (!isReplaceParentCheckListBaseId) {
            parentItem.data.Description = header.Description;
        }


        if (!items || items.length === 0 || !parentNode) {
            return;
        }

        // Replace ParentCheckListBaseId for children
        if (isReplaceParentCheckListBaseId) {
            items.forEach((item: any) => {
                item.ParentCheckListBaseId = this.parentCheckListBase.Id;
            });
        }


        let rootBranchNode = this.buildTreeStructure(items);

        // redirect to the current node
        let branchChildrenItems = rootBranchNode.getChildren() || [];
        while (branchChildrenItems.length > 0) {
            let childItem = branchChildrenItems.pop();
            if (childItem) {
                childItem._parentItem_ = parentNode;
                let childItemWrapper = childItem.getItemData();
                childItemWrapper.data.ParentCheckListItemId = parentItem.data.Id;
            }
        }

        parentNode._childHeadItem_ = rootBranchNode._childHeadItem_;
        parentNode._childTailItem_ = rootBranchNode._childTailItem_;
    }

    private doCopyItem(item: CheckListItemWrapper): LinkListItem<CheckListItemWrapper> {
        let currentNode = this.getNode(item);
        if (!currentNode) {
            return;
        }
        // clone current item
        let cloneModel: any = this.clone(currentNode.itemData.data);
        cloneModel.Id = this.helperService.UtilityService.createGuid();
        cloneModel.EntityVersion = 0;
        // replace all Attachment if exists
        if (cloneModel.Attachments && cloneModel.Attachments.length > 0) {
            cloneModel.Attachments.forEach((attachment) => {
                attachment.Id = this.helperService.UtilityService.createGuid();
                attachment.EntityVersion = 0;

                // dont copy the drawing
                attachment.DrawingShapes = '';
                attachment.DrawingPageIndex = 0;
            });
        }

        // Insert the newNode after current node

        let cloneNode: LinkListItem<CheckListItemWrapper> = LinkListItem.insertAfter(currentNode, this.getItemInstance(cloneModel));

        // get the new insert item
        let cloneItemWrapper = cloneNode.getItemData();

        // find all children
        let items: any[] = [];
        currentNode.travel((currentItem) => {
            let currentItemWrapper = currentItem.itemData;
            if (!currentItemWrapper.isIncludeItem) {
                let cloneItem = this.clone(currentItemWrapper.data);

                if (currentItem._parentItem_ === currentNode) {
                    cloneItem.ParentCheckListItemId = undefined;
                }

                items.push(cloneItem);
            }
        });


        if (items.length > 0) {
            let rootCloneNode = this.buildTreeStructure(items, null);

            // redirect to the current node
            let childItems = rootCloneNode.getChildren();
            while (childItems.length > 0) {
                let childItem = childItems.pop();
                if (childItem) {
                    childItem._parentItem_ = cloneNode;
                    let childItemWrapper = childItem.getItemData();
                    childItemWrapper.data.ParentCheckListBaseId = cloneModel.ParentCheckListBaseId;
                    childItemWrapper.data.ParentCheckListItemId = cloneModel.Id;
                }
            }

            cloneNode._childHeadItem_ = rootCloneNode._childHeadItem_;
            cloneNode._childTailItem_ = rootCloneNode._childTailItem_;

            // replace all items linked to the current checklist
            let idRefs: { [index: string]: any } = {};
            idRefs[cloneItemWrapper.data.Id] = cloneItemWrapper.data.Id;

            cloneNode.travel((currentItem) => {
                let currentItemWrapper = currentItem.getItemData();
                currentItemWrapper.data.EntityVersion = 0;

                // replace the value of Id and ParentItemId but keep the reference
                let currentId: string = currentItemWrapper.data.Id;
                let newId: string = this.helperService.UtilityService.createGuid();
                currentItemWrapper.data.Id = newId;
                idRefs[currentId] = newId;

                if (currentItemWrapper.data.ParentCheckListItemId) {
                    currentItemWrapper.data.ParentCheckListItemId = idRefs[currentItemWrapper.data.ParentCheckListItemId];
                }
            });
        }


        return cloneNode;
    }

    /**
     * Update list after item was updated
     * @param newNode
     * @private
     */
    private updateAfterUpdateItem(newNode: CheckListItemWrapper) {
        this.buildCollection();

        this.setSelected(newNode);
    }

    private getChildrenOfSectionAndConditionalLine(fromItem: LinkListItem<CheckListItemWrapper>): LinkListItem<CheckListItemWrapper>[] {
        let cItems: LinkListItem<CheckListItemWrapper>[] = [];
        let currentItem = fromItem._childHeadItem_;
        while (!!currentItem) {
            let nodeData = currentItem.getItemData();
            if (nodeData.isSectionItem || nodeData.isIncludeItem || nodeData.isConditionalLineItem) {
                cItems.push(currentItem);
            }
            currentItem = currentItem._nextItem_;
        }
        return cItems;

    }

    /**
     * Build ItemNumber for only line
     * @param treeNode
     * @private
     */
    private buildItemNumbers(treeNode: LinkListItem<CheckListItemWrapper>) {
        let independentItemDeliveryNumber = 0;
        let dicDependantItemDeliveryNumber: { [index: string]: number } = {};
        let includeNodes: LinkListItem[] = [];
        treeNode.travel((currentItem) => {
            let itemWrapper: CheckListItemWrapper = currentItem.itemData;
            if (itemWrapper.isLineItem) {
                // NBSHD-3771: Fix numbering with conditional items
                if (itemWrapper.isDescendentOfConditionalGroupItem) {
                    // find the nearest Line display item
                    // conditional item is always have a parent is a Line item
                    let foundParentLineNode = currentItem._parentItem_;
                    while (foundParentLineNode) {
                        if (foundParentLineNode !== treeNode) {
                            let foundParentItemWrapper = foundParentLineNode.itemData;
                            if (foundParentItemWrapper.isLineItem) {
                                itemWrapper.itemNumber = foundParentItemWrapper.itemNumber + (dicDependantItemDeliveryNumber[foundParentItemWrapper.Id] = (dicDependantItemDeliveryNumber[foundParentItemWrapper.Id] || 0) + 1) + '.';
                                break;
                            }
                        }
                        foundParentLineNode = foundParentLineNode._parentItem_;
                    }
                } else {
                    independentItemDeliveryNumber = independentItemDeliveryNumber + 1;
                    itemWrapper.itemNumber = independentItemDeliveryNumber.toString() + '.';
                }
            }
        }, (checkNode) => {
            // if the current node is an include item, we not go deeply on this branch
            if (checkNode.getItemData().isIncludeItem) {
                includeNodes.push(checkNode);
                return true;
            }
            return false;
        });
        if (includeNodes.length > 0) {
            includeNodes.forEach((node) => {
                this.buildItemNumbers(node);
            });
        }
    }

    /**
     * NBSHD-3771: Checking display new button
     */
    private checkShowNewStatus(rootNode: LinkListItem<CheckListItemWrapper>) {
        let nodes = rootNode.getDescendants();
        for (let node of nodes) {
            let itemWrapper = node.getItemData();
            if (itemWrapper.isDescendentOfIncludeItem) {
                continue;
            }
            if (itemWrapper.isNew) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update DisplayOrder
     */
    private resetDisplayOrder() {
        let displayOrder = 0;
        this.rootNode.iterateDescendants((currentItem) => {
                let currentItemWrapper = currentItem.getItemData();
                if (currentItemWrapper.data.ParentCheckListBaseId === this.parentCheckListBase.Id) {
                    // if item is isConditionalGroupItem, DisplayOrder of it is isConditionalLine + 1
                    if (!currentItemWrapper.isConditionalGroupItem) { // isConditionalGroupItem
                        currentItemWrapper.data.DisplayOrder = displayOrder;
                        displayOrder++;
                    } else {
                        currentItemWrapper.data.DisplayOrder = displayOrder;
                    }
                }
            },
            (verifyItem) => {
                // if the current item is IncludeItems
                // don't continue check on the descendent of this item
                return verifyItem.getItemData().isIncludeItem;
            });
    }

    private checkDirty(root: LinkListItem<CheckListItemWrapper>): boolean {
        let isDirty = false;
        root.travel((node) => {
            let dirty = node.itemData.isDirty();
            if (dirty) {
                node.itemData.isDirty();
                isDirty = dirty;
            }
        });
        if (this.deletedItemIds.length > 0) {
            isDirty = true;
        }
        return isDirty;
    }
}
