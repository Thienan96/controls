import {Component, Inject, Input, OnInit} from '@angular/core';
import {WeekTsService} from '../shared/week-ts-service';
import {IWeekTsHour, NTK_WEEK_TS, WeekTsComponentInterface} from '../shared/week-ts.model';

@Component({
    selector: 'ntk-week-timesheet-header',
    templateUrl: './week-ts-header.component.html',
    styleUrls: ['./week-ts-header.component.scss']
})
export class WeekTsHeaderComponent implements OnInit {
    @Input() startTime: number;
    @Input() endTime: number;
    hours: IWeekTsHour[] = [];

    constructor(@Inject(NTK_WEEK_TS) private weekTs: WeekTsComponentInterface,
                private weekTsService: WeekTsService) {
    }

    ngOnInit() {
        this.updateLayout();
    }

    trackBy(index: number, hour: IWeekTsHour) {
        return hour.duration;
    }

    updateLayout() {
        this.hours = this.weekTsService.getHours(this.startTime, this.endTime);
    }
}
