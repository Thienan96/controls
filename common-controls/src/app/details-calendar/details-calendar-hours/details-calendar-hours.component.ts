import {Component, ElementRef, Inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {IHour, IOptions, NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import moment from 'moment-es6';
import {DetailsCalendarComponent} from '../details-calendar/details-calendar.component';


@Component({
    selector: 'ntk-details-calendar-hours',
    templateUrl: './details-calendar-hours.component.html',
    styleUrls: ['./details-calendar-hours.component.scss']
})
export class DetailsCalendarHoursComponent implements OnChanges {
    @Input() hours: IHour[];
    @Input() startTime: number;
    @Input() endTime: number;

    hourPerPixel: number;

    constructor(private elementRef: ElementRef<HTMLElement>,
                private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: DetailsCalendarComponent) {
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    ngOnChanges(change: SimpleChanges) {
        // update UI when changing startTime/endTime
        if (change.startTime || change.endTime) {
            // Number.isInteger: startime/endtime only interger and include 0
            if (Number.isInteger(this.startTime) && Number.isInteger(this.endTime)) {
                this.hours = this.getHours(this.startTime, this.endTime);
            }
        }

    }

    /**
     * Get Hours from RangeTime
     * @param startTime
     * @param endTime
     * @private
     */
    private getHours(startTime: number, endTime: number): IHour[] {
        let hours: IHour[] = [];
        for (let i = startTime; i <= endTime; i++) {
            if (i === 24) {
                let ampm = moment.utc(moment.duration(12, 'hours').asMilliseconds()).format('H a').split(' ')[1];
                hours.push({
                    hour: i,
                    displayValue: i + ' ' + ampm
                });
            } else {
                hours.push({
                    hour: i,
                    displayValue: moment.utc(moment.duration(i, 'hours').asMilliseconds()).format('H a')
                });
            }
        }
        return hours;
    }

}
