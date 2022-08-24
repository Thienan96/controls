import {Component, Input, OnInit} from '@angular/core';
import {WeekTsService} from '../shared/week-ts-service';
import {IWeekTsHour} from '../shared/week-ts.model';

@Component({
    selector: 'ntk-week-timesheet-lines',
    templateUrl: './week-ts-lines.component.html',
    styleUrls: ['./week-ts-lines.component.scss']
})
export class WeekTsLinesComponent implements OnInit {
    @Input() startTime: number;
    @Input() endTime: number;
    hours: IWeekTsHour[] = [];

    @Input() hideQuaterLines = false;

    constructor(private weekTsService: WeekTsService) {
    }

    ngOnInit() {
        this.hours = this.weekTsService.getHours(this.startTime, this.endTime, this.hideQuaterLines);
    }
}
