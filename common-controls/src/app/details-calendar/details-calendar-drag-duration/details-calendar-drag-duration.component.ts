import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    OnInit,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {NtkDrag} from '../../drag-drop/drag';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {
    IOptions,
    NTK_DETAILS_CALENDARDAY,
    NTK_DETAILS_CALENDARDAY_COLUMN
} from '../shared/models/details-calendar.model';
import {DetailsCalendarComponent} from '../details-calendar/details-calendar.component';
import {DetailsCalendarDayColumnComponent} from '../details-calendar-day-column/details-calendar-day-column.component';

/**
 * Drag item on column to create new event
 */
@Component({
    selector: 'ntk-details-calendar-drag-duration-component',
    templateUrl: './details-calendar-drag-duration.component.html',
    styleUrls: ['./details-calendar-drag-duration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsCalendarDragDurationComponent implements OnInit {
    @Output() change = new EventEmitter<number>();
    @ViewChild(NtkDrag, {static: true}) cdkDrag: NtkDrag;
    private pointStart: {
        clientY: number;
        top: number;
        scrollerTop: number;
    };
    private drag: {
        startTime: number;
        strDuration: string;
    };
    private dragging = false; // Check status is drag to cancel
    private isDragCancelled = false;
    private height: number;

    constructor(private render: Renderer2,
                private element: ElementRef<HTMLElement>,
                private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: DetailsCalendarComponent,
                @Inject(NTK_DETAILS_CALENDARDAY_COLUMN) private detailsCalendarDayColumnComponent: DetailsCalendarDayColumnComponent) {
        this.render.listen(this.detailsCalendarDayColumnComponent.elementRef.nativeElement, 'mousedown', this.onMouseDown.bind(this));
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    get scroller(): HTMLElement {
        return this.detailsCalendarComponent.scroller;
    }

    get timesheetArea() {
        return $(this.detailsCalendarDayColumnComponent.elementRef.nativeElement);
    }

    @HostListener('window:mousedown') handleWindowMouseUpEvent() {
        if (this.dragging) {
            this.isDragCancelled = true;
            this.detailsCalendarService.triggerMouseUp();
        }
    }

    @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        // If press Escape and drag
        if ((event.key === 'Escape' || event.key === 'Esc') && this.dragging) {
            this.isDragCancelled = true;
            this.detailsCalendarService.triggerMouseUp();
        }
    }

    ngOnInit() {
        if (!this.height) {
            this.height = this.detailsCalendarComponent.options.hourPerPixel;
        }
        $(this.cdkDrag.element.nativeElement).height(this.height);

        this.cdkDrag.dragRef.onMouseDown = this.onDragStart.bind(this);
        this.cdkDrag.dragRef.onMouseMove = this.onDragMove.bind(this);
        this.cdkDrag.dragRef.onMouseUp = this.onDragEnd.bind(this);


        this.cdkDrag.dragRef.started.asObservable().subscribe(() => {
            $(this.cdkDrag.element.nativeElement).css({
                visibility: 'visible'
            });
        });
    }


    /**
     * if use mousedown, show drag and trigger mousedown drag to can drag container
     * @param ev
     * @private
     */

    private onMouseDown(ev: MouseEvent) {
        // Do not drag if is resizing
        if (this.detailsCalendarComponent.isResizing) {
            return;
        }

        // Do not drag if event is not disable
        let eventContainer = $(ev.target).closest(`ntk-details-calendar-day-event`);
        if (eventContainer.hasClass(`cdk-drag-disabled`) && !eventContainer.hasClass(`disables-selection`)) {
            return;
        }

        let top = (ev.pageY - $(this.scroller).offset().top) + this.scroller.scrollTop;
        $(this.cdkDrag.element.nativeElement).css({
            top: top,
            visibility: 'hidden',
            display: 'block'
        });

        let handle = this.cdkDrag.element.nativeElement;

        let mouseDict = {
            button: 0,
            buttons: 0,
            clientX: ev.clientX,
            clientY: ev.clientY,
            movementX: 0,
            movementY: 0,
            relatedTarget: handle,
            screenX: ev.screenX,
            screenY: ev.screenY,
            bubbles: false,
            cancelable: false
        };
        let mouseMoveDict = mouseDict;
        setTimeout(() => {
            let mouseDownEvent = new MouseEvent('mousedown', mouseDict);
            handle.dispatchEvent(mouseDownEvent);
            setTimeout(() => {
                mouseMoveDict.clientY = ev.clientY + 5;
                mouseMoveDict.screenY = ev.screenY + 5;
                let mouseMoveEvent = new MouseEvent('mousemove', mouseMoveDict);
                handle.dispatchEvent(mouseMoveEvent);
                setTimeout(() => {
                    mouseMoveDict.clientY = ev.clientY;
                    mouseMoveDict.screenY = ev.screenY;
                    mouseMoveEvent = new MouseEvent('mousemove', mouseMoveDict);
                    handle.dispatchEvent(mouseMoveEvent);
                }, 10);
            }, 10);
        }, 10);


    }

    private getEvent(event): MouseEvent {
        if (event.originalEvent && event.originalEvent.touches) {
            return event.originalEvent.touches[0];
        } else {
            return event;
        }
    }

    /**
     * Trigger when drag start
     * @param ev
     * @private
     */
    private onDragStart(ev: MouseEvent) {
        this.dragging = true; // Dragging
        this.isDragCancelled = false; // Turn off cancel


        let $event = this.getEvent(ev),
            top: number = $event.clientY - this.timesheetArea.offset().top,
            duration = (top / this.options.hourPerPixel) + this.options.timeRange.startTime,
            start: number = this.detailsCalendarService.roundHour(duration);
        if (top <= 0) {
            start = this.options.timeRange.startTime;
            top = 0;
        }
        let maxTop = (this.options.timeRange.endTime - this.options.timeRange.startTime - 1) * this.height;
        if (top >= maxTop) {
            start = this.options.timeRange.endTime - 1;
            top = maxTop;
        }


        // Calc start point to display tooltip when move
        this.pointStart = {
            clientY: $event.clientY,
            top: top,
            scrollerTop: this.scroller.scrollTop
        };

        // Calc drag data
        this.drag = {
            startTime: start,
            strDuration: this.detailsCalendarService.hourToString(start, 'h')
        };

        // Update tooltip
        this.updateLayout();
    }

    /**
     * Trigger when move
     * Calc and display tooltip when move
     * @param ev
     * @private
     */
    private onDragMove(ev: MouseEvent) {
        let $event = this.getEvent(ev),
            clientY = $event.clientY,
            distance = clientY - this.pointStart.clientY + (this.scroller.scrollTop - this.pointStart.scrollerTop),
            duration = ((clientY - this.timesheetArea.offset().top) / this.options.hourPerPixel) + this.options.timeRange.startTime,
            top = this.pointStart.top + distance;
        this.updateTooltip(top, duration);
    }

    /**
     * Update text in tooltip and tooltip position
     * @param top
     * @param duration
     * @private
     */
    private updateTooltip(top: number, duration: number) {
        if (!this.cdkDrag.preview) {
            return;
        }

        // Hide drag item if item is out of range
        let overTop = ((this.options.timeRange.endTime - this.options.timeRange.startTime) * this.options.hourPerPixel);
        if (top > overTop || (top + this.cdkDrag.preview.clientHeight < 0)) {
            this.cdkDrag.preview.style.visibility = `hidden`;
            this.drag = null;
            return;
        }

        let start: number = this.detailsCalendarService.roundHour(duration);
        if (top <= 0) {
            start = this.options.timeRange.startTime;
            top = 0;
        }

        // Show prevent
        this.cdkDrag.preview.style.visibility = `visible`;

        // Set best position when drag a item
        let maxTop = ((this.options.timeRange.endTime - 1 - this.options.timeRange.startTime) * this.options.hourPerPixel);
        if (top > maxTop) {
            start = this.options.timeRange.endTime - 1; // startTime always less than this.options.timeRange.endTime
            top = maxTop;
        }
        if (maxTop - top <= this.options.hourPerPixel) {
            $('.tooltiptext', this.cdkDrag.preview).addClass('position-top');
        } else {
            $('.tooltiptext', this.cdkDrag.preview).removeClass('position-top');
        }


        this.drag = {
            startTime: start,
            strDuration: this.detailsCalendarService.hourToString(start, 'h')
        };


        this.updateLayout();
    }

    /**
     * Trigger when drag end
     * @private
     */
    private onDragEnd() {
        // Current item is not dragging
        this.dragging = false;


        // Hide drag
        $(this.cdkDrag.element.nativeElement).hide();
        $(this.cdkDrag.preview).hide();

        // Trigger change when item can drag
        if (!this.isDragCancelled && this.drag) {
            this.change.emit(this.drag.startTime);
        }
    }

    /**
     * Update text of tooltip
     * @private
     */
    private updateLayout() {
        if (this.drag && this.cdkDrag.preview) {
            $(this.cdkDrag.preview).find('.duration').html(this.drag.strDuration);
            $(this.cdkDrag.element.nativeElement).find('.duration').html(this.drag.strDuration);
        }
    }
}
