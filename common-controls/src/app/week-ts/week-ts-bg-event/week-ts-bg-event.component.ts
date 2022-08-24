import {Component, Inject, Input, OnInit} from '@angular/core';
import {IWeekTSEvent, IWeekTsPosition, NTK_WEEK_TS, WeekTsComponentInterface} from '../shared/week-ts.model';
import {WeekTsService} from '../shared/week-ts-service';

@Component({
    selector: 'ntk-week-timesheet-bg-event',
    templateUrl: './week-ts-bg-event.component.html',
    styleUrls: ['./week-ts-bg-event.component.scss'],
    host: {
        '[style.left.%]': 'position.left',
        '[style.width.%]': 'position.width',
        '[style.top.px]': 'position.top',
        '[style.bottom.px]': 'position.bottom'
    }
})
export class WeekTsBgEventComponent implements OnInit {
    position: IWeekTsPosition;
    @Input() private event: IWeekTSEvent;

    constructor(@Inject(NTK_WEEK_TS) private weekTs: WeekTsComponentInterface,
                private weekTsService: WeekTsService) {
    }

    ngOnInit() {
        this.updateLayout();
    }

    updateLayout() {
        this.position = this.weekTsService.getPosition(this.event, this.weekTs.options);
    }
}
