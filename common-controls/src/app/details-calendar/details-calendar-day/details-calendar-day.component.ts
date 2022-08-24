import {Component, ContentChildren, ElementRef, Inject, Input, OnInit, QueryList} from '@angular/core';
import {DetailsCalendarDayColumnComponent} from '../details-calendar-day-column/details-calendar-day-column.component';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';

@Component({
    selector: 'ntk-details-calendar-day',
    templateUrl: './details-calendar-day.component.html',
    styleUrls: ['./details-calendar-day.component.scss'],
    host: {
        '[style.paddingRight.px]': 'paddingRight'
    }
})
export class DetailsCalendarDayComponent implements OnInit {
    @Input() index: number;
    @ContentChildren(DetailsCalendarDayColumnComponent) detailsCalendarDayColumnComponents: QueryList<DetailsCalendarDayColumnComponent>;
    paddingRight = 0;

    constructor(public elementRef: ElementRef,
                private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    ngOnInit() {
        this.updateLayout();
    }


    updateLayout() {
        this.paddingRight = this.detailsCalendarService.getDaySpacing(this.detailsCalendarComponent.daysLength, this.detailsCalendarComponent.isSplit, this.index);
        if (this.detailsCalendarDayColumnComponents) {
            this.detailsCalendarDayColumnComponents.forEach((detailsCalendarDayColumnComponent) => {
                detailsCalendarDayColumnComponent.updateLayout();
            });
        }
    }

    onResize() {
        this.updateLayout();
    }
}
