import {Component, Inject, Input, OnInit} from '@angular/core';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';

@Component({
    selector: 'ntk-details-calendar-day-footer',
    templateUrl: './details-calendar-day-footer.component.html',
    styleUrls: ['./details-calendar-day-footer.component.scss'],
    host: {
        '[style.paddingRight.px]': 'paddingRight'
    }
})
export class DetailsCalendarDayFooterComponent implements OnInit {
    @Input() index: number;
    paddingRight: number;


    constructor(private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    ngOnInit() {
        this.updateLayout();
    }

    onResize() {
        this.updateLayout();
    }

    updateLayout() {
        this.paddingRight = this.detailsCalendarService.getDaySpacing(this.detailsCalendarComponent.daysLength, this.detailsCalendarComponent.isSplit, this.index);
    }
}
