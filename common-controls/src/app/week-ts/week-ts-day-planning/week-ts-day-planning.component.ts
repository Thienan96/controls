import {AfterContentInit, Component, ContentChildren, ElementRef, Input, OnInit, QueryList} from '@angular/core';
import {IWeekTSDayPlanning, IWeekTSEvent, NTK_WEEK_TS_DAY_PLANNING} from '../shared/week-ts.model';
import {WeekTsEventComponent} from '../week-ts-event/week-ts-event.component';
import * as _ from 'underscore';

@Component({
    selector: 'ntk-week-timesheet-day-planning',
    templateUrl: './week-ts-day-planning.component.html',
    styleUrls: ['./week-ts-day-planning.component.scss'],
    providers: [
        {
            provide: NTK_WEEK_TS_DAY_PLANNING,
            useExisting: WeekTsDayPlanningComponent
        }
    ]
})
export class WeekTsDayPlanningComponent implements AfterContentInit, OnInit {
    @Input() private dayPlanning: IWeekTSDayPlanning;
    @ContentChildren(WeekTsEventComponent, {descendants: true}) private eventComponents: QueryList<WeekTsEventComponent>;
    private events: IWeekTSEvent[] = [];


    constructor(public elementRef: ElementRef) {
    }

    ngOnInit() {
        this.events = this.getEvents(this.dayPlanning.Events);
    }

    ngAfterContentInit() {
        this.eventComponents.changes
            .subscribe(() => {
                this.updateLayout();
            });
    }

    updateLayout() {
        this.events = this.getEvents(this.dayPlanning.Events);
        this.eventComponents.forEach((eventComponent) => {
            eventComponent.updateLayout();
        });
    }

    getEvent(event: IWeekTSEvent): IWeekTSEvent {
        return this.events.find((item) => {
            return item.Id === event.Id;
        });
    }

    private getEvents(items: IWeekTSEvent[]): IWeekTSEvent[] {
        let events: IWeekTSEvent[] = JSON.parse(JSON.stringify(items));
        events = _.sortBy(events, `StartTime`);
        // Reset column,relatives
        _.each(events, (event: IWeekTSEvent) => {
            event.column = 0;
            event.columnTotal = 1;
            event.hasNeighbour = false;
            event.checked = false;
            event.zIndex = 0;
        });
        // Format column
        _.each(events, (event: IWeekTSEvent) => {
            if (event.checked) {
                return;
            }
            let relatives = this.getRelativeItems(event, events);
            // Check all relatives
            _.each(relatives, (item: any) => {
                item.checked = true;
            });
            this.formatColumn(relatives);
        });

        // Add spacing if 2 events is neighbour
        _.each(events, (event: IWeekTSEvent) => {
            _.each(events, (item: IWeekTSEvent) => {
                if (item.Id !== event.Id) {
                    if (event.EndTime === item.StartTime) {
                        event.hasNeighbour = true;
                    }
                }
            });
        });

        return events;
    }

    private formatColumn(events: IWeekTSEvent[]) {
        if (events.length === 0) {
            return;
        }
        let columns: IWeekTSEvent[][] = [];
        columns.push([events[0]]);
        events[0].column = 0;
        for (let i = 1; i < events.length; i++) {
            let event = events[i];
            let columnIndex = this.findColumnIndex(columns, event);
            if (columnIndex !== -1) {
                event.column = columnIndex;
                columns[columnIndex].push(event);
            } else {
                columns.push([event]);
                event.column = columns.length - 1;
            }
        }
        for (let item of events) {
            item.columnTotal = columns.length;
            item.zIndex = 1 + item.column + 1;
        }

    }

    private getRelativeItems(event: IWeekTSEvent, events: IWeekTSEvent[]): IWeekTSEvent[] {
        let min: string = event.StartTime,
            max: string = event.EndTime;
        for (let item of events) {
            if (min <= item.StartTime && item.StartTime < max && item.EndTime > max) {
                max = item.EndTime;
            }
        }
        return this.findEventsRange(events, min, max);
    }

    private findColumnIndex(columns: IWeekTSEvent[][], event: IWeekTSEvent): number {
        return _.findIndex(columns, (column) => {
            return event.StartTime >= column[column.length - 1].EndTime;
        });
    }

    private findEventsRange(events: IWeekTSEvent[], min: string, max: string): IWeekTSEvent[] {
        return _.filter(events, (item) => {
            return min <= item.StartTime && item.StartTime < max;
        });
    }


}
