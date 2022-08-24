import {Component, Inject, Input, OnInit} from '@angular/core';
import {DetailsCalendarService} from '../../shared/details-calendar.service';
import {NTK_DETAILS_CALENDARDAY} from '../../shared/models/details-calendar.model';

@Component({
    selector: 'ntk-details-calendar-background-day',
    template: '<ng-content></ng-content>',
    styleUrls: ['./details-calendar-background-day.component.scss'],
    host: {
        '[style.paddingRight.px]': 'paddingRight'
    }
})
export class DetailsCalendarBackgroundDayComponent implements OnInit {
    paddingRight: number;
    @Input() index: number;

    constructor(private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    ngOnInit() {
        this.updateLayout();
    }

    private updateLayout() {
        let daysLength = this.detailsCalendarComponent.daysLength,
            isSplit = this.detailsCalendarComponent.isSplit;
        this.paddingRight = this.detailsCalendarService.getDaySpacing(daysLength, isSplit, this.index);
    }
}
