import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IWeekTSDayPlanning, IWeekTSEvent, IWeekTSOptions} from '../../week-ts/shared/week-ts.model';
import moment from 'moment-es6';
import {WeekTsComponent} from '../../week-ts/week-ts.component';
import * as _ from 'underscore';
import {UtilityService} from '../../core/services/utility.service';

@Component({
    selector: 'ntk-demo-week-ts',
    templateUrl: './weekts.component.html',
    styleUrls: ['./weekts.component.scss']
})
export class DemoWeektsComponent {
    @ViewChild(WeekTsComponent, {static: false}) weekTsComponent: WeekTsComponent;
    dayPlannings: IWeekTSDayPlanning[] = [];
    from = '2021-10-11';
    options: IWeekTSOptions = {
        startTime: 8,
        endTime: 20,
        overlapping: {
            topDistance: 5
        }
    };
    leftWidth = 116;
    rightWidth = 100;
    now = '2021-10-13';

    constructor(private httpClient: HttpClient,
                private cd: ChangeDetectorRef,
                private utilityService: UtilityService) {
        this.httpClient.get('src/assets/data/week-ts.json').subscribe((dayPlannings: IWeekTSDayPlanning[]) => {
            dayPlannings.forEach((day) => {
                day.Date = moment(day.Date).format('YYYY-MM-DD');
                day['allowDraging'] = true;
            });

            dayPlannings[dayPlannings.length - 1]['allowDraging'] = false;
            this.dayPlannings = dayPlannings;
        });
    }

    trackByDayPlanning(index, item: IWeekTSDayPlanning) {
        return item.Date;
    }

    onAddDurationChange(dayPlanning: IWeekTSDayPlanning, data) {
        let newEvent = {
            Id: _.uniqueId('new-event'),
            Comment: _.uniqueId('new event'),
            StartTime: this.utilityService.getHourFromTimestamp(data.startTime * 60 * 60 * 1000),
            EndTime: this.utilityService.getHourFromTimestamp(data.endTime * 60 * 60 * 1000),
            Color: 'blue',
            CanResize: true
        };
        this.weekTsComponent.addEvent(newEvent, dayPlanning.Events);
        this.weekTsComponent.setSelected(newEvent);
        this.cd.detectChanges();
    }

    onEventRemoved(data: {
        event: IWeekTSEvent,
        dayPlanning: IWeekTSDayPlanning
    }) {
        let index = data.dayPlanning.Events.indexOf(data.event);
        if (index !== -1) {
            data.dayPlanning.Events.splice(index, 1);
        }
    }

    onEventSelected(event: IWeekTSEvent) {
        console.log('select', event);
    }

    onEventResized(ev: { event: IWeekTSEvent, data: IWeekTSEvent }) {
        ev.event.StartTime = ev.data.StartTime;
        ev.event.EndTime = ev.data.EndTime;
        this.weekTsComponent.updateLayout();
    }

    gotoPrev() {
        let startTime = this.options.startTime;
        startTime = startTime - 4;
        if (startTime < 0) {
            startTime = 0;
        }
        this.options.startTime = startTime;
        this.options.endTime = startTime + 12;
        this.cd.detectChanges();
        this.weekTsComponent.updateLayout();
    }

    gotoNext() {
        let endTime = this.options.endTime;
        endTime = endTime + 4;
        if (endTime > 24) {
            endTime = 24;
        }
        this.options.endTime = endTime;
        this.options.startTime = endTime - 12;
        this.cd.detectChanges();
        this.weekTsComponent.updateLayout();
    }
}
