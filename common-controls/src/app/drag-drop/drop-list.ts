import {CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {ChangeDetectorRef, ContentChildren, Directive, ElementRef, Input, Optional, QueryList} from '@angular/core';
import {NtkDrag} from './drag';
import {NtkDragDropItem, NtkDragDropParams} from './drag-drop.model';
import {Directionality} from '@angular/cdk/bidi';
import {NtkDragDrop} from './drag-drop.service';
import {NtkDropListRef} from './drop-list-ref';

@Directive({
    selector: '[ntkDropList], ntk-drop-list',
    exportAs: 'ntkDropList',
    host: {
        class: 'cdk-drop-list ntk-drop-list',
        '[id]': 'id',
        '[class.cdk-drop-list-disabled]': 'disabled',
        '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()', // current drop
        '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
        '[class.cdk-drop-list-disabled-drop]': '!canDrop',
        '[class.cdk-drop-list-disabled-sort]': '!canSort'
    }
})
export class NtkDropList extends CdkDropList {
    @Input('ntkCanDrop') canDrop = true;
    @Input('ntkCanSort') canSort = true;
    @Input() move: any;
    @ContentChildren(NtkDrag) _draggables: QueryList<NtkDrag<NtkDragDropItem>>; // overwrite _draggables


    constructor(public element: ElementRef,
                dragDrop: NtkDragDrop,
                changeDetectorRef: ChangeDetectorRef,
                @Optional() dir: Directionality,
                @Optional() group: CdkDropListGroup<any>) {
        super(element, dragDrop, changeDetectorRef, dir, group);
    }


    enterPredicate = (drag: NtkDrag<NtkDragDropItem>, drop: NtkDropList) => {
        return drop.canDrop;
    };

    moveItem(dragdrop: NtkDragDropParams) {
        if (this.move) {
            return this.move(dragdrop);
        } else {
            dragdrop.subscriber.next();
            dragdrop.subscriber.complete();
        }
    }

    get dropListRef(): NtkDropListRef {
        return <any>this[`_dropListRef`];
    }
}
