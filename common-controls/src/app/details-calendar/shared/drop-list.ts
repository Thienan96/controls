import {ChangeDetectorRef, Directive, ElementRef, Inject, Optional} from '@angular/core';
import {CdkDropListGroup, transferArrayItem} from '@angular/cdk/drag-drop';
import {DetailsCalendarService} from './details-calendar.service';
import {Directionality} from '@angular/cdk/bidi';
import {IOptions, NTK_DETAILS_CALENDARDAY, NTK_DETAILS_CALENDARDAY_COLUMN} from './models/details-calendar.model';
import {DetailsCalendarComponent} from '../details-calendar/details-calendar.component';
import {NtkDragDropParams} from '../../drag-drop/drag-drop.model';
import {NtkDropList} from '../../drag-drop/drop-list';
import {NtkDragDrop} from '../../drag-drop/drag-drop.service';
import {DetailsCalendarDayColumnComponent} from '../details-calendar-day-column/details-calendar-day-column.component';
import {coerceElement} from '@angular/cdk/coercion';
import {NtkDragRef} from '../../drag-drop/drag-ref';
import {NtkDrag} from '../../drag-drop/drag';


@Directive({
    selector: '[detailsCalendarDropList], details-calendar-drop-list',
    exportAs: 'detailsCalendarDropList',
    host: {
        class: 'cdk-drop-list details-calendar-drop-list',
        '[id]': 'id',
        '[class.cdk-drop-list-disabled]': 'disabled',
        '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()', // current drop
        '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
        '[class.cdk-drop-list-disabled-drop]': '!canDrop',
        '[class.cdk-drop-list-disabled-sort]': '!canSort'
    }
})
export class DetailsCalendarDropList extends NtkDropList {

    constructor(public element: ElementRef<HTMLElement>,
                dragDrop: NtkDragDrop,
                private changeDetectorRef: ChangeDetectorRef,
                @Optional() dir: Directionality,
                @Optional() group: CdkDropListGroup<any>,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: DetailsCalendarComponent,
                @Inject(NTK_DETAILS_CALENDARDAY_COLUMN) public  detailsCalendarDayColumnComponent: DetailsCalendarDayColumnComponent,
                private detailsCalendarService: DetailsCalendarService) {
        super(element, dragDrop, changeDetectorRef, dir, group);


        this.dropListRef.isOverContainer = this.isOverContainer.bind(this);
        this.dropListRef._canReceive = this.canReceive.bind(this);

    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    moveItem(dragdrop: NtkDragDropParams) {
        // Check drag item to drop (drag controller)
        if (!this.isDropValid(dragdrop)) {
            dragdrop.subscriber.error();
            dragdrop.subscriber.complete();
        }
        if (this.move) {
            this.move(dragdrop);
        } else {
            // Check default
            this._move(dragdrop);
        }
    }

    /**
     * Only accept drag in time-range
     * @param dragdrop
     * @private
     */
    private isDropValid(dragdrop: NtkDragDropParams): boolean {
        let range = this.detailsCalendarService.getRangeTimeFromPosition(dragdrop.item.data, dragdrop.position, this.options);
        return !(range.end <= this.options.timeRange.startTime || range.start >= this.options.timeRange.endTime);
    }

    /**
     * Check current point in rect
     * @param clientRect
     * @param x
     * @param y
     * @private
     */
    private isInsideClientRect(clientRect: DOMRect, x: number, y: number) {
        let top = clientRect.top, bottom = clientRect.bottom, left = clientRect.left, right = clientRect.right;
        return y >= top && y <= bottom && x >= left && x <= right;
    }

    /**
     * Checks whether the drop list can receive the passed-in item.
     * @param item
     * @param x
     * @param y
     * @private
     */
    private canReceive(item: NtkDrag, x: number, y: number) {
        let ref = this.dropListRef.dragDropRegistry.getActiveDragInstance();
        if (!ref) {
            return false;
        }
        let top = this.getTop(ref);

        if (!this.enterPredicate(item, this) || !this.isInsideClientRect(this.dropListRef.clientRect, x, top)) {
            return false;
        }
        let elementFromPoint = ((this.dropListRef.shadowRoot.elementFromPoint(x, top)));
        // If there's no element at the pointer position, then
        // the client rect is probably scrolled out of the view.
        if (!elementFromPoint) {
            return false;
        }
        let nativeElement = coerceElement(this.element);
        return elementFromPoint === nativeElement || nativeElement.contains(elementFromPoint);
    }

    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param {number} x Pointer position along the X axis.
     */
    private isOverContainer(x: number): boolean {
        let ref = this.dropListRef.dragDropRegistry.getActiveDragInstance();
        if (!ref) {
            return false;
        }
        let top = this.getTop(ref);
        return this.isInsideClientRect(this.dropListRef.clientRect, x, top);
    }

    /**
     * Calc top by range time
     * @param {NtkDragRef} ref
     * @private
     */
    private getTop(ref: NtkDragRef): number {
        let preview = $(ref.preview),
            position = preview.offset(),
            top: number,
            bottom = position.top + preview.height();
        if (this.options.allowInputTimeOutRange) {
            top = bottom;
            if (bottom >= this.dropListRef.clientRect.bottom) {
                top = position.top;
            }
        } else {
            top = position.top;
            if (this.dropListRef.clientRect.bottom <= bottom) {
                top = bottom;
            }
        }
        return top;
    }


    /**
     * Move item , Sort item
     * @param dragdrop
     * @private
     */
    private _move(dragdrop: NtkDragDropParams) {
        // Move event
        if (dragdrop.previousContainer.id === dragdrop.container.id) { // Move item in same column
            dragdrop.container.data.forEach((item) => {
                if (item.Id === dragdrop.item.data.Id) {
                    this.detailsCalendarService.updateEventFromPosition(item, dragdrop.position, this.options);
                }
            });
        } else { // move item from Column A to Column B
            dragdrop.previousContainer.data.forEach((item) => {
                if (item.Id === dragdrop.item.data.Id) {
                    this.detailsCalendarService.updateEventFromPosition(item, dragdrop.position, this.options);
                }
            });
            transferArrayItem(dragdrop.previousContainer.data, dragdrop.container.data, dragdrop.previousIndex, dragdrop.currentIndex);
        }
        dragdrop.subscriber.next();
        dragdrop.subscriber.complete();
    }

}
