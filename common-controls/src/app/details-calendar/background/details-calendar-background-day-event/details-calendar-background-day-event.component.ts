import {Component, ElementRef, Inject, Input, OnInit} from '@angular/core';
import {IEvent, IOptions, IPosition, NTK_DETAILS_CALENDARDAY} from '../../shared/models/details-calendar.model';
import {DetailsCalendarService} from '../../shared/details-calendar.service';

@Component({
    selector: 'ntk-details-calendar-background-day-event',
    styleUrls: ['./details-calendar-background-day-event.component.scss'],
    template: '',
    host: {
        '[style.top.px]': 'position.top',
        '[style.height.px]': 'position.height'
    }
})
export class DetailsCalendarBackgroundDayEventComponent implements OnInit {
    @Input() event: IEvent;
    position: IPosition;

    constructor(private detailsCalendarService: DetailsCalendarService,
                private elementRef: ElementRef<HTMLElement>,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    ngOnInit() {
        this.position = this.detailsCalendarService.getEventPosition(this.event, this.options, this.elementRef.nativeElement.parentElement);
    }
}
