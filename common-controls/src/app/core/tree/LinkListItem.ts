export class LinkListItem<T = any> {
    [propName: string]: any;
    static generatedUId = 0;
    _uId_: any;
    _parentItem_: LinkListItem<T> | undefined;
    _nextItem_: LinkListItem<T> | undefined;
    _prevItem_: LinkListItem<T> | undefined;
    _childHeadItem_: LinkListItem<T> | undefined;
    _childTailItem_: LinkListItem<T> | undefined;

    constructor(public itemData: T) {

        this._uId_ = LinkListItem.nextId();
        this._parentItem_ = undefined;
        this._nextItem_ = undefined;
        this._prevItem_ = undefined;
        this._childHeadItem_ = undefined;
        this._childTailItem_ = undefined;
    }

    static nextId(): number {
        return LinkListItem.generatedUId = (LinkListItem.generatedUId || 0) + 1;
    }

    // append new node as a child of a specific node
    static newItem(parentItem: LinkListItem, itemData: any): LinkListItem {
        if (!parentItem) {
            throw new Error('parentItem is mandatory.');
        }

        let nItem: LinkListItem = new LinkListItem(itemData);
        nItem.appendChild(parentItem);

        return nItem;
    }

    // insert a new node after a specific node
    static insertAfter(afterItem: LinkListItem, itemData: any): LinkListItem {
        let parentItem: LinkListItem | undefined = afterItem._parentItem_;
        if (!parentItem) {
            throw new Error('not found parent item.');
        }

        let swapItem: LinkListItem | undefined = afterItem._nextItem_;
        let insertItem: LinkListItem = new LinkListItem(itemData);

        // correct the link for after item
        afterItem._nextItem_ = insertItem;

        // correct the link for new inserted item
        insertItem._prevItem_ = afterItem;
        insertItem._parentItem_ = parentItem;
        insertItem._nextItem_ = swapItem;

        // correct the link for swapItem
        if (swapItem) {
            swapItem._prevItem_ = insertItem;
        }

        // correct the link for the parent item
        if (parentItem._childTailItem_ === afterItem) {
            parentItem._childTailItem_ = insertItem;
        }

        return insertItem;
    }

    // insert a new nodre before a specific node
    static insertBefore(beforeItem: LinkListItem, itemData: any): LinkListItem {
        let parentItem: LinkListItem | undefined = beforeItem._parentItem_;
        if (!parentItem) {
            throw new Error('not found parent item.');
        }

        let swapItem: LinkListItem | undefined = beforeItem._prevItem_;
        let insertItem: LinkListItem = new LinkListItem(itemData);

        // correct the link for before item
        beforeItem._prevItem_ = insertItem;

        // correct the link for new inserted item
        insertItem._nextItem_ = beforeItem;
        insertItem._parentItem_ = parentItem;
        insertItem._prevItem_ = swapItem;

        // correct the link for swapItem
        if (swapItem) {
            swapItem._nextItem_ = insertItem;
        }

        // correct the link for the parent item
        if (parentItem._childHeadItem_ === beforeItem) {
            parentItem._childHeadItem_ = insertItem;
        }

        return insertItem;
    }


    // Move the item to before the destination item on the same parent
    static moveItemToBefore(moveItem: LinkListItem, destinationItem: LinkListItem): boolean {
        if (moveItem._nextItem_ === destinationItem) {
            return true;
        } // already the case

        let parentItem: LinkListItem | undefined = destinationItem._parentItem_;
        if (!parentItem) {
            throw new Error('not found parent item.');
        }

        let oldPreItem: LinkListItem | undefined = moveItem._prevItem_;
        let oldNextItem: LinkListItem | undefined = moveItem._nextItem_;

        let oldDestinationPreItem: LinkListItem | undefined = destinationItem._prevItem_;

        // correct the link for the parent item
        if (parentItem._childHeadItem_ === destinationItem) {
            parentItem._childHeadItem_ = moveItem;
        } else if (parentItem._childHeadItem_ === moveItem) {
            parentItem._childHeadItem_ = oldNextItem;
        }
        if (parentItem._childTailItem_ === moveItem) {
            parentItem._childTailItem_ = oldPreItem;
        }

        moveItem._nextItem_ = destinationItem;
        moveItem._prevItem_ = oldDestinationPreItem;
        if (oldDestinationPreItem) {
            oldDestinationPreItem._nextItem_ = moveItem;
        }
        destinationItem._prevItem_ = moveItem;

        if (oldPreItem) {
            oldPreItem._nextItem_ = oldNextItem;
        }
        if (oldNextItem) {
            oldNextItem._prevItem_ = oldPreItem;
        }

        return true;
    }

    // Move the item to after the destination item on the same parent
    static moveItemToAfter(moveItem: LinkListItem, destinationItem: LinkListItem): boolean {
        if (moveItem._prevItem_ === destinationItem) {
            return true;
        } // already the case

        let parentItem: LinkListItem | undefined = destinationItem._parentItem_;
        if (!parentItem) {
            throw new Error('not found parent item.');
        }

        let oldPreItem: LinkListItem | undefined = moveItem._prevItem_;
        let oldNextItem: LinkListItem | undefined = moveItem._nextItem_;


        let oldDestinationNextItem: LinkListItem | undefined = destinationItem._nextItem_;

        if (parentItem._childTailItem_ === destinationItem) {
            parentItem._childTailItem_ = moveItem;
        } else if (parentItem._childTailItem_ === moveItem) {
            parentItem._childTailItem_ = oldPreItem;
        }
        if (parentItem._childHeadItem_ === moveItem) {
            parentItem._childHeadItem_ = oldNextItem;
        }

        moveItem._prevItem_ = destinationItem;
        moveItem._nextItem_ = oldDestinationNextItem;
        if (oldDestinationNextItem) {
            oldDestinationNextItem._prevItem_ = moveItem;
        }
        destinationItem._nextItem_ = moveItem;

        if (oldPreItem) {
            oldPreItem._nextItem_ = oldNextItem;
        }
        if (oldNextItem) {
            oldNextItem._prevItem_ = oldPreItem;
        }

        return true;
    }

    /**
     * append the childItem as the last child of the parentItem
     * @param parentItem
     */
    appendChild(parentItem: LinkListItem): boolean {
        if (!parentItem || !this) {
            return false;
        }

        let parentChildHeadItem: LinkListItem | undefined = parentItem._childHeadItem_;
        let parentChildTailItem: LinkListItem | undefined = parentItem._childTailItem_;

        this._parentItem_ = parentItem;
        this._prevItem_ = parentItem._childTailItem_;

        if (parentChildHeadItem) {
            // correct the childtail
            if (parentChildTailItem) {
                parentChildTailItem._nextItem_ = this;
            }
            parentItem._childTailItem_ = this;
        } else {
            parentItem._childHeadItem_ = this;
            parentItem._childTailItem_ = this;
        }

        return true;
    }

    iterateDescendants(callback?: (currentItem: LinkListItem<T>) => void, stopTraverseBranchIf?: (currentItem: LinkListItem<T>) => boolean) {
        if (!this) {
            return undefined;
        }
        let startNode = this;
        let currentNode: LinkListItem<T> | undefined = startNode;
        let nextNode: LinkListItem<T> | undefined = startNode;

        // tslint:disable-next-line:no-conditional-assignment
        while ((currentNode = nextNode)) {
            let shouldStopTraverseBranch = false;
            if (currentNode !== startNode) {
                if (callback) {
                    callback(currentNode);
                }

                if (stopTraverseBranchIf && stopTraverseBranchIf(currentNode) === true) {
                    shouldStopTraverseBranch = true;
                }
            }

            // assume we will escape in next check
            nextNode = undefined;

            // if current node has children, next item is the first children
            if (currentNode._childHeadItem_ && !shouldStopTraverseBranch) {
                nextNode = currentNode._childHeadItem_;
            } else {
                // if current item has no children, next item is next sib items
                if (currentNode !== startNode && // dont check sibs on root level
                    currentNode._nextItem_) {
                    nextNode = currentNode._nextItem_;
                }
            }

            if (!nextNode) {
                // try to set nextNode to the next sib of the parent or grandparent
                // tslint:disable-next-line:no-conditional-assignment
                while (!!currentNode && currentNode !== startNode && !(nextNode = currentNode._nextItem_)) {
                    currentNode = currentNode._parentItem_;
                }
            }
        }
    }


    find(condition: (item: T) => boolean): LinkListItem<T> {
        if (!this) {
            return undefined;
        }

        let startNode: LinkListItem<T> = this;
        let currentNode: LinkListItem<T> | undefined = startNode;
        let nextNode: LinkListItem<T> | undefined = startNode;
        let foundNode: LinkListItem<T> | undefined;

        // tslint:disable-next-line:no-conditional-assignment
        while ((currentNode = nextNode) && !foundNode) {
            // tslint:disable-next-line:triple-equals
            if (currentNode != startNode) {
                if (condition(currentNode.itemData)) {
                    foundNode = currentNode;
                    break;
                }
            }

            // assume we will escape in next check
            nextNode = undefined;

            // if current node has children, next item is the first children
            if (currentNode._childHeadItem_) {
                nextNode = currentNode._childHeadItem_;
            } else {
                // if current item has no children, next item is next sib items
                if (currentNode !== startNode && // dont check sibs on root level
                    currentNode._nextItem_) {
                    nextNode = currentNode._nextItem_;
                }
            }

            if (!nextNode) {
                // try to set nextNode to the next sib of the parent or grandparent
                // tslint:disable-next-line:no-conditional-assignment
                while (!!currentNode && currentNode !== startNode && !(nextNode = currentNode._nextItem_)) {
                    currentNode = currentNode._parentItem_;
                }
            }
        }

        return foundNode;
    }


    /**
     * move item to the parentItem
     * the movedItem will be append as the last child of the parentItem
     * @param parentItem
     */
    moveInto(parentItem: LinkListItem): boolean {
        if (!this || !parentItem) {
            return false;
        }

        // remove the item from the tree
        this.removeItem();

        // append to parent item
        this.appendChild(parentItem);

        return true;
    }

    /**
     * Remove item out tree
     */
    removeItem(): boolean {
        let parentItem: LinkListItem | undefined = this._parentItem_;
        if (!parentItem) {
            return false;
        }

        let nextSibItem: LinkListItem | undefined = this._nextItem_;
        let prevSibItem: LinkListItem | undefined = this._prevItem_;

        // correct parent item
        if (parentItem._childHeadItem_ === this) {
            parentItem._childHeadItem_ = nextSibItem;
        }
        if (parentItem._childTailItem_ === this) {
            parentItem._childTailItem_ = prevSibItem;
        }

        // correct prevSibItem
        if (prevSibItem) {
            prevSibItem._nextItem_ = nextSibItem;
        }

        // correct nextSibItem
        if (nextSibItem) {
            nextSibItem._prevItem_ = prevSibItem;
        }

        // correct removeItem
        this._parentItem_ = undefined;
        this._nextItem_ = undefined;
        this._prevItem_ = undefined;


        return true;
    }

    getItemData(): T {
        return this.itemData;
    }

    travel(callback: (currentItem: LinkListItem<T>) => void, stopTraverseBranchIf?: (currentItem: LinkListItem<T>) => boolean) {
        this.iterateDescendants((item: LinkListItem<T>) => {
            callback(item);
        }, stopTraverseBranchIf);
    }

    getDescendants(): LinkListItem<T>[] {
        let cItems = [];
        this.iterateDescendants((currentItem: LinkListItem) => {
            cItems.push(currentItem);
        });
        return cItems;
    }

    getChildren(): LinkListItem<T>[] {
        let cItems = [];
        let currentItem: LinkListItem | undefined = this._childHeadItem_;
        while (!!currentItem) {
            cItems.push(currentItem);

            currentItem = currentItem._nextItem_;
        }
        return cItems;
    }

}
