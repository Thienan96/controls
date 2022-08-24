import {Directive, ElementRef, Inject} from '@angular/core';

import {IEvent, NTK_DETAILS_CALENDARDAY, UpdateType} from './models/details-calendar.model';
import {DetailsCalendarComponent} from '../details-calendar/details-calendar.component';
import {DetailsCalendarService} from './details-calendar.service';
import {DetailsCalendarDayEventComponent} from '../details-calendar-day-event/details-calendar-day-event.component';
import {NtkDragRef} from '../../drag-drop/drag-ref';
import {NtkDragDropParams} from '../../drag-drop/drag-drop.model';
import {NtkDrag} from '../../drag-drop/drag';
import {DetailsCalendarDropList} from './drop-list';

@Directive({
    selector: '[detailsCalendarDrag]'
})
export class DetailsCalendarDragDirective {

    originEvent: IEvent;

    get options() {
        return this.detailsCalendarComponent.options;
    }

    constructor(@Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: DetailsCalendarComponent,
                private detailsCalendarService: DetailsCalendarService,
                private elementRef: ElementRef,
                private detailsCalendarDayEventComponent: DetailsCalendarDayEventComponent,
                private ntkDrag: NtkDrag<IEvent>) {
        this.ntkDrag.dragRef.onMouseDown = this.onMouseDown.bind(this);
        this.ntkDrag.dragRef.onMouseMove = this.onMouseMove.bind(this);
        this.ntkDrag.dragRef.onMouseUp = this.onMouseUp.bind(this);
        this.ntkDrag.dragRef.onBeforeDragDrop = this.onBeforeDragDrop.bind(this);
        this.ntkDrag.dragRef.onAfterDragDrop = this.onAfterDragDrop.bind(this);
        this.ntkDrag.dragRef.unlockApp = this.detailsCalendarComponent.unlockApp.bind(this.detailsCalendarComponent);
        this.ntkDrag.dragRef.lockApp = this.detailsCalendarComponent.lockApp.bind(this.detailsCalendarComponent);

    }


    /**
     * Trigger
     * @param ev
     * @param ntkDragRef
     */
    onMouseDown(ev: MouseEvent, ntkDragRef: NtkDragRef) {
        this.originEvent = JSON.parse(JSON.stringify(ntkDragRef.data.data));


        this.detailsCalendarComponent.onDragStart(ntkDragRef);
    }

    /**
     * Move placeholder follow dragging
     * @param ev
     * @param ntkDragRef
     */
    onMouseMove(ev: MouseEvent, ntkDragRef: NtkDragRef) {
        if (!ntkDragRef.preview) {
            return;
        }
        // avoid overlap dialog
        $(ntkDragRef.preview).css({
            'z-index': '999'
        });
        let placeHolder = $(ntkDragRef.getPlaceholderElement());
        let pointerPosition = ntkDragRef.getPointerPositionOnPage(ev);
        let isPointerOverContainer = ntkDragRef.dropContainer.isOverContainer(pointerPosition.x, pointerPosition.y);
        if (!isPointerOverContainer) {
            placeHolder.hide();
            return;
        } else {
            placeHolder.show();
        }

        if (!ntkDragRef.dropContainer.data.canSort && ntkDragRef.dropContainer === ntkDragRef.initialContainer) {
            // Don't move event by restore to origin position
            let position = this.detailsCalendarDayEventComponent.position;
            placeHolder.css({
                left: position.left,
                top: position.top
            });
        } else { // Move event
            let top = this.getTopFromDragRef(ntkDragRef);
            placeHolder.css({
                left: 0,
                top: top
            });
        }
    }

    /**
     * Trigger mouseup
     * @param ev
     * @param ntkDragRef
     */
    onMouseUp(ev: MouseEvent, ntkDragRef: NtkDragRef) {
        this.detailsCalendarComponent.onDragEnd(ntkDragRef);
    }

    /**
     * Trigger before drag complete
     * Update placeholder from current position
     * @param result
     */
    onBeforeDragDrop(result: NtkDragDropParams) {
        let events: IEvent[] = result.container.data;
        this.detailsCalendarService.formatEvents(events, this.options);
        let event: IEvent = events.find((item) => {
            return item.Id === result.item.data.Id;
        });
        if (event) {
            // Update position for placeholder
            let position = this.detailsCalendarService.getEventPosition(event, this.options, result.container.dropListRef.getElement());
            let placeHolder = result.item.getPlaceholderElement();
            $(placeHolder).css({
                left: position.left,
                right: position.right
            });
        }
    }

    /**
     * Process data , update control after drag complered
     * @param result
     * @param updateType
     */
    onAfterDragDrop(result: NtkDragDropParams, updateType = UpdateType.UpdateColumn) {


        // Update data
        result.container.dropListRef.data.data.splice(0, result.container.dropListRef.data.data.length);
        result.container.data.forEach((event) => {
            result.container.dropListRef.data.data.push(event);
        });


        result.previousContainer.dropListRef.data.data.splice(0, result.previousContainer.dropListRef.data.data.length);
        result.previousContainer.data.forEach((event) => {
            result.previousContainer.dropListRef.data.data.push(event);
        });


        // Update selected
        this.updateSelected(result.container.dropListRef.data.data);


        // Force render
        if (updateType === UpdateType.UpdateColumn) {
            let previousContainerDropList: DetailsCalendarDropList = <DetailsCalendarDropList>result.previousContainer.dropListRef.data,
                containerDropList: DetailsCalendarDropList = <DetailsCalendarDropList>result.container.dropListRef.data;
            previousContainerDropList.detailsCalendarDayColumnComponent.updateLayout();
            containerDropList.detailsCalendarDayColumnComponent.updateLayout();
        }
        if (updateType === UpdateType.UpdateControl) {
            this.detailsCalendarComponent.updateLayout();
        }

        setTimeout(() => {
            // Force render
            if (updateType === UpdateType.UpdateColumn) {
                let previousContainerDropList: DetailsCalendarDropList = <DetailsCalendarDropList>result.previousContainer.dropListRef.data,
                    containerDropList: DetailsCalendarDropList = <DetailsCalendarDropList>result.container.dropListRef.data;
                previousContainerDropList.detailsCalendarDayColumnComponent.updateLayout();
                containerDropList.detailsCalendarDayColumnComponent.updateLayout();
            }
            if (updateType === UpdateType.UpdateControl) {
                this.detailsCalendarComponent.updateLayout();
            }
        }, 10);
    }

    /**
     * Get top from DragRef
     * @param ntkDragRef
     * @private
     */
    private getTopFromDragRef(ntkDragRef: NtkDragRef): number {
        let evOffset = $(ntkDragRef.preview).offset(),
            offset = ntkDragRef.scroller.offset(),
            y = evOffset.top - offset.top + ntkDragRef.scroller.scrollTop(),
            startHour = this.detailsCalendarService.roundHour((y / this.options.hourPerPixel));
        if (y < 0) {
            startHour = -Math.abs(startHour);
        }
        return startHour * this.options.hourPerPixel;
    }

    /**
     * Update selected item
     * @param events
     * @private
     */
    private updateSelected(events: IEvent[]) {
        if (this.detailsCalendarComponent.selectedItem) {
            let selectedItemId = this.detailsCalendarComponent.selectedItem.Id;
            let selectedItem = events.find((item) => {
                return item.Id === selectedItemId;
            });
            if (selectedItem) {
                selectedItem.isSelected = true;
                this.detailsCalendarComponent.selectedItem = selectedItem;
            }
        }
    }

}
