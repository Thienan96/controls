import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Inject,
    Input,
    NgZone,
    OnChanges,
    OnInit,
    SimpleChanges
} from '@angular/core';
import {IEvent, IOptions, IPosition, NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {timer} from 'rxjs';

@Component({
    selector: 'ntk-details-calendar-day-event',
    templateUrl: './details-calendar-day-event.component.html',
    styleUrls: ['./details-calendar-day-event.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.left.px]': 'position.left',
        '[style.right.px]': 'position.right',
        '[style.top.px]': 'position.top',
        '[style.height.px]': 'position.height',
        '[style.z-index]': 'position.zIndex',
        '[class.selected]': 'event.isSelected',
        '[class.disables-selection]': 'event.DisablesSelection'
    }
})
export class DetailsCalendarDayEventComponent implements OnInit, OnChanges {
    @Input() event: IEvent;
    position: IPosition;


    constructor(public elementRef: ElementRef<HTMLElement>,
                private detailsCalendarService: DetailsCalendarService,
                private cd: ChangeDetectorRef,
                private zone: NgZone,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    @HostListener('click', ['$event'])
    handleClickEvent(ev: MouseEvent) {
        if (this.event.DisablesSelection) {
            return;
        }

        // Prevent fire to parent
        ev.stopImmediatePropagation();
        ev.preventDefault();

        // Highlight event when click on event
        let delaySelection = this.options.delaySelection;
        if (delaySelection) {
            $(this.elementRef.nativeElement).addClass('event-selected-delay');
            timer(delaySelection).subscribe(() => {
                $(this.elementRef.nativeElement).removeClass('event-selected-delay');
            });
        }

        // Fire click event
        this.detailsCalendarComponent.onItemClick(this.event);
    }

    ngOnInit() {
        this.updateLayout();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Refresh layout if update event, use for TrackBy
        if (changes.event) {
            this.updateLayout();
        }
    }

    updateLayout() {
        this.zone.run(() => {
            this.position = {...this.detailsCalendarService.getEventPosition(this.event, this.options, this.elementRef.nativeElement.parentElement)};
            this.cd.markForCheck();
        });
    }

}
