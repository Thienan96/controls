import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnInit,
    QueryList,
    SimpleChanges
} from '@angular/core';
import {IDay, IEvent, IOptions, NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {DragDrop, DragDropRegistry} from '@angular/cdk/drag-drop';
import {DetailsCalendarDayComponent} from '../details-calendar-day/details-calendar-day.component';
import {DetailsCalendarDayHeaderComponent} from '../details-calendar-day-header/details-calendar-day-header.component';
import {NtkDragDropRegistry} from '../../drag-drop/drag-drop-registry';
import {NtkDragDrop} from '../../drag-drop/drag-drop.service';
import {NtkDragRef} from '../../drag-drop/drag-ref';
import {DetailsCalendarDayFooterComponent} from '../details-calendar-day-footer/details-calendar-day-footer.component';

@Component({
    selector: 'ntk-details-calendar',
    templateUrl: './details-calendar.component.html',
    styleUrls: ['./details-calendar.component.scss'],
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
            provide: NTK_DETAILS_CALENDARDAY,
            useExisting: DetailsCalendarComponent
        }
    ]
})
export class DetailsCalendarComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() isSplit = false; // Is support split for 2 weeks
    @Input() days: IDay[] = [];
    @Input() options: IOptions;
    @ContentChildren(DetailsCalendarDayHeaderComponent) detailsCalendarDayHeaderComponentList: QueryList<DetailsCalendarDayHeaderComponent>;
    @ContentChildren(DetailsCalendarDayComponent) detailsCalendarDayComponentList: QueryList<DetailsCalendarDayComponent>;
    @ContentChildren(DetailsCalendarDayFooterComponent) detailsCalendarDayFooterComponentList: QueryList<DetailsCalendarDayFooterComponent>;


    paddingRight = 0; // Scrollbar width
    ready = false; // Is component ready
    currentDragItem: NtkDragRef;
    selectedItem: IEvent; // event which is selected
    isResizing = false; // Check event is resizing

    // Set default for control
    private defaultOptions: IOptions = {
        hourPerPixel: 60,
        minHeight: 30,
        timeRange: {
            startTime: 5,
            endTime: 24
        },
        overlapping: {
            minWidth: 20,
            leftDistance: 25,
            rightDistance: 5,
            minLeftDistance: 10,
            minRightDistance: 0
        },
        delaySelection: 500,
        minHour: 0.25,
        allowInputTimeOutRange: true
    };

    controlId: string; // Control Id which is generate when create control

    constructor(private elementRef: ElementRef<HTMLElement>,
                private detailsCalendarService: DetailsCalendarService,
                private cd: ChangeDetectorRef) {
    }

    get daysLength() {
        return this.days.length;
    }

    get scroller(): HTMLElement {
        return $(this.elementRef.nativeElement).find('.scroll-viewport')[0];
    }

    @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.key === 'Escape' || event.key === 'Esc') && this.currentDragItem) {
            this.detailsCalendarService.triggerMouseUp();
        }
    }

    @HostListener('click')
    handleClickEvent() {
        if (!this.isResizing) {
            this.unSelectAll();
        }
    }

    ngOnInit() {
        // Merge options
        Object.assign(this.defaultOptions, this.options);
        Object.assign(this.options, this.defaultOptions);
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes.isSplit && !changes.isSplit.isFirstChange()) || (changes.days && !changes.days.isFirstChange())) {
            this.updateLayout();
        }
    }

    ngAfterViewInit() {
        // Fix scrollbar
        this.paddingRight = this.getScrollbarWidth(this.elementRef.nativeElement);

        this.checkBodyHeight();
    }

    onDragStart(item: NtkDragRef) {
        this.currentDragItem = item;
    }

    onDragEnd(item: NtkDragRef) {
        this.currentDragItem = null;
    }

    getElement(): Element {
        return this.elementRef.nativeElement;
    }

    onResize() {
        this.paddingRight = this.getScrollbarWidth(this.elementRef.nativeElement);
        this.checkBodyHeight();
    }

    onItemClick(item: IEvent) {
        if (!item.DisablesSelection) {
            this.selectItem(item);
        }
    }

    /**
     * Lock app to wait
     */
    lockApp() {
        $(this.elementRef.nativeElement).find('.blocked-content').show();
    }

    /**
     * Unlock app
     */
    unlockApp() {
        $(this.elementRef.nativeElement).find('.blocked-content').hide();
    }

    /**
     * Rerender layout for control
     */
    updateLayout() {
        this.detailsCalendarDayHeaderComponentList.forEach((detailsCalendarDayHeaderComponent) => {
            detailsCalendarDayHeaderComponent.updateLayout();
        });
        this.detailsCalendarDayFooterComponentList.forEach((detailsCalendarDayFooterComponent) => {
            detailsCalendarDayFooterComponent.updateLayout();
        });
        this.detailsCalendarDayComponentList.forEach((detailsCalendarDayComponent) => {
            detailsCalendarDayComponent.updateLayout();
        });
    }

    private getScrollbarWidth(el: Element) {
        let scroller = this.scroller,
            content = $(el).find('.scroller-content');
        return $(scroller).width() - content.width();
    }

    /**
     * Select item
     * @param item
     * @private
     */
    private selectItem(item: IEvent) {
        // Unselect event
        if (this.selectedItem) {
            this.selectedItem.isSelected = false;
        }

        // Select item
        item.isSelected = true;
        this.selectedItem = item;
    }

    /**
     * Remove all select
     * @private
     */
    private unSelectAll() {
        if (this.selectedItem) {
            this.selectedItem.isSelected = false;
            this.selectedItem = null;
        }
    }

    private checkBodyHeight() {
        let $element = $(this.elementRef.nativeElement);
        // Reset
        $element.removeClass('content-is-fit');


        let bodyHeight = this.options.hourPerPixel * (this.options.timeRange.endTime - this.options.timeRange.startTime);
        let bHeight = $element.find('.scroll-viewport').height();

        // Fit body if content is less than body's viewport
        if (bHeight && bodyHeight && bodyHeight < bHeight) {
            $element.addClass('content-is-fit');
        }
    }
}
