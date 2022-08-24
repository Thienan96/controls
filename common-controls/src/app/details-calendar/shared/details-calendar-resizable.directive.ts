import {ResizableDirective, ResizeEvent} from 'angular-resizable-element';
import {Directive, ElementRef, Inject, Input, NgZone, OnInit, PLATFORM_ID, Renderer2} from '@angular/core';
import {DetailsCalendarService} from './details-calendar.service';
import {
    IEvent,
    IOptions,
    IResizeParam,
    IResizeResult,
    NTK_DETAILS_CALENDARDAY,
    NTK_DETAILS_CALENDARDAY_COLUMN,
    UpdateType
} from './models/details-calendar.model';
import {DetailsCalendarDayEventComponent} from '../details-calendar-day-event/details-calendar-day-event.component';
import {DetailsCalendarDayColumnComponent} from '../details-calendar-day-column/details-calendar-day-column.component';
import {finalize} from 'rxjs/operators';
import {DetailsCalendarComponent} from '../details-calendar/details-calendar.component';
import {of} from 'rxjs';

@Directive({
    selector: '[detailsCalendarResizable]',
    host: {
        '[class.details-calendar-resizable]': 'canResize',
        '[class.details-calendar-resizable-disabled]': '!canResize',
        '[class.resizing]': 'isResizing'
    }
})
export class DetailsCalendarResizableDirective extends ResizableDirective implements OnInit {
    @Input('ntkCanResize') canResize = true;
    @Input() resize: any;
    ghostElementPositioning: any = 'absolute';
    enableGhostResize = true; // Clone item when resize
    isResizing = false; // Is item resizing

    constructor(@Inject(PLATFORM_ID) platformId: any,
                renderer: Renderer2,
                elm: ElementRef,
                zone: NgZone,
                private detailsCalendarService: DetailsCalendarService,
                private detailsCalendarDayEventComponent: DetailsCalendarDayEventComponent,
                @Inject(NTK_DETAILS_CALENDARDAY_COLUMN) private detailsCalendarDayColumnComponent: DetailsCalendarDayColumnComponent,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: DetailsCalendarComponent) {
        super(platformId, renderer, elm, zone);
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    ngOnInit() {
        super.ngOnInit();

        this.resizeStart.subscribe(this.onResizeStart.bind(this));
        this.resizing.subscribe(this.onResizing.bind(this));
        this.resizeEnd.subscribe(this.onResizeEnd.bind(this));
    }


    /**
     * Get element which is resize
     * @private
     */
    private getGhostElement(): HTMLElement {
        return $(this.elm.nativeElement).parent().find('.resize-ghost-element')[0];
    }

    /**
     * Trigger when reisze start
     * @param ev
     * @private
     */
    private onResizeStart(ev: ResizeEvent) {
        this.updateDuration(ev.rectangle.height);
        this.isResizing = true;
        this.detailsCalendarComponent.isResizing = true;
        this.detailsCalendarComponent.lockApp(); // Lock app to prevent conflict event
    }

    /**
     * Trigger when resize event
     * @param ev
     * @private
     */
    private onResizing(ev: ResizeEvent) {
        // Update duration when is resizing
        this.updateDuration(ev.rectangle.height);
    }

    /**
     * Trigger when item resize end
     * @param ev
     * @private
     */
    private onResizeEnd(ev: ResizeEvent) {
        let height = ev.rectangle.height,
            event = this.detailsCalendarDayEventComponent.event;


        // Update height
        this.detailsCalendarDayEventComponent.position.height = ev.rectangle.height;


        // New Event
        let newEvent = JSON.parse(JSON.stringify(event)),
            hours = this.getDurationFromHeight(height);
        if (hours < this.options.minHour) {
            hours = this.options.minHour;
        }
        let end = this.detailsCalendarService.hourToNumber(newEvent.Start) + hours;
        newEvent.End = this.detailsCalendarService.hourToString(end);

        let params: IResizeParam = {
            oldEvent: this.detailsCalendarDayEventComponent.event,
            newEvent: newEvent,
            events: this.detailsCalendarDayColumnComponent.events
        };
        setTimeout(() => {
            this.checkResize(params)
                .pipe(finalize(() => {
                    this.isResizing = false;
                    this.detailsCalendarComponent.isResizing = false;
                    this.detailsCalendarComponent.unlockApp();
                }))
                .subscribe((result: IResizeResult) => {
                    if (!result.updateResizeType) {
                        result.updateResizeType = UpdateType.UpdateColumn;
                    }
                    if (result.event) {
                        this.detailsCalendarService.setEvent(this.detailsCalendarDayColumnComponent.events, result.event);
                    }

                    // // Update selected
                    this.updateSelected(this.detailsCalendarDayColumnComponent.events);


                    // Update column for any changes from user
                    if (result.updateResizeType === UpdateType.UpdateColumn) {
                        this.detailsCalendarDayColumnComponent.updateLayout();
                    }

                    // Refresh control
                    if (result.updateResizeType === UpdateType.UpdateControl) {
                        this.detailsCalendarComponent.updateLayout();
                    }

                }, () => {// revert
                    this.detailsCalendarDayEventComponent.updateLayout();
                });
        });

    }


    /**
     * Check item can resize
     * Always allow resize if developer don`t set resize function
     * @param params
     * @private
     */
    private checkResize(params: IResizeParam) {
        if (this.resize) {
            return this.resize(params);
        } else {
            return of({
                event: params.newEvent,
                updateResizeType: UpdateType.UpdateColumn
            });
        }
    }

    /**
     * Update duration on right-top when resize
     * @param height
     * @private
     */
    private updateDuration(height: number) {
        let duration = this.getDurationFromHeight(height);
        if (duration < this.options.minHour) {
            duration = this.options.minHour;
        }
        let strDuration = this.detailsCalendarService.hourToString(duration, 'h');
        $(this.getGhostElement()).find('.duration-dragging').html(strDuration);
    }

    /**
     * Get duration from height
     * @param height
     * @private
     */
    private getDurationFromHeight(height: number): number {
        let hours = height / this.options.hourPerPixel;
        return this.detailsCalendarService.roundHour(hours);
    }

    /**
     * Update selected after resize event
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
