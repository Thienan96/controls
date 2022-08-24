import {ChangeDetectorRef, Component, ElementRef, Inject, Input} from '@angular/core';
import {ExpandableItemWrapper, CheckListItemWrapper, NTK_EXPANDABLE} from '../shared/expandable.model';
import {LinkListItem} from '../../core/tree/LinkListItem';

interface IBoundaryLinePosition {
    left: number;
    top: number;
    height: number;
    className: string;
}

@Component({
    selector: 'ntk-expandable-boundary-line',
    templateUrl: './expandable-boundary-line.component.html',
    styleUrls: ['./expandable-boundary-line.component.scss']
})
export class ExpandableBoundaryLineComponent<T extends ExpandableItemWrapper> {
    items: T[] = [];
    $element: JQuery;
    lines: IBoundaryLinePosition[] = [];
    @Input() private indent = 32;
    @Input() private itemHeight = 49;

    constructor(elementRef: ElementRef,
                @Inject(NTK_EXPANDABLE) protected expandableComponent: any,
                private cd: ChangeDetectorRef) {
        this.$element = $(elementRef.nativeElement);
    }

    update(root: LinkListItem<T>, items: T[]) {
        this.items = items.filter((item) => {
            return item.isVisible;
        });

        this.buildSubLineHeight(root);
        this.buildLines(this.items);

        this.cd.detectChanges();
    }

    private buildLines(items: T[]) {
        this.lines.splice(0, this.lines.length);
        let contentHeight = 0;
        items.forEach((item, index) => {
            if (item.contentHeight && item.contentHeight > 0) {
                contentHeight = item.contentHeight;
            }
            let subLineHeight = item.childrenHeight || 0,
                left = item.level * this.indent,
                top = index * this.itemHeight + this.itemHeight + contentHeight,
                className = `boundary-line`;
            /**
             * Hide line of isConditionalGroupItem
             * Hide line if lineHeight is 0
             * Line must visible on screen
             */
            if (subLineHeight <= 0 || item.isConditionalGroupItem || !item.isVisible) {
                return;
            }
            if (item.isSectionItem) {
                className = className + ' is-section-item';
            }
            if (item.isIncludeItem) {
                className = className + ' is-section-item';
            }
            if (item.isConditionalGroupItem) {
                className = className + ' is-conditional-group';
            }
            this.lines.push({
                left: left,
                top: top,
                height: subLineHeight,
                className: className
            });
        });
    }

    /**
     * NBSHD-3771: Build left border
     */
    private buildSubLineHeight(rootNode: LinkListItem<T>) {
        let childItems = rootNode.getDescendants();

        // Calculate contentHeight
        childItems.forEach((item) => {
            let itemData = item.getItemData();
            itemData.contentHeight = 0;
            if (itemData.isSelected) {
                itemData.contentHeight = this.getContentHeight(itemData);
            }
        });

        /**
         * Get height of child
         */
        childItems.forEach((item) => {
            let itemData = item.getItemData(),
                children = item.getChildren();
            if (children.length > 0) {
                itemData.childrenHeight = this.getHeightNode(item) - this.itemHeight;
                if (itemData.childrenHeight < 0) {
                    itemData.childrenHeight = 0;
                }
            } else {
                itemData.childrenHeight = 0;
            }
        });
    }

    /**
     * Get height of content
     * @param {CheckListItemWrapper} item
     * @private
     */
    private getContentHeight(item: T): number {
        let itemEl = this.expandableComponent.$element.find('#' + item.itemId);
        if (itemEl.length === 0) {
            return 0;
        }
        return itemEl.find('.content').show().height() || 0;
    }

    /**
     * Get height of node
     * @param {LinkListItem} node
     * @param {CheckListItemWrapper<CheckListItemWrapper>} selectedItem
     * @returns {number}
     */
    private getHeightNode(node: LinkListItem<T>, selectedItem?: T): number {
        let total = 0,
            itemData = node.getItemData(),
            children = node.getChildren();
        if (itemData.isVisible) {
            total = this.itemHeight;
            if (itemData.isSelected && selectedItem && itemData.Id !== selectedItem.Id) {
                total = total + itemData.contentHeight;
            }
        }
        if (children.length > 0) {
            children.forEach((item: LinkListItem) => {
                total = total + this.getHeightNode(item, itemData);
            });
        }
        return total;
    }
}
