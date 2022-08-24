import {ChangeDetectorRef, Component, NgZone, ViewChild} from '@angular/core';
import moment from 'moment-es6';
import {ApiService} from '../../core/services/Api.service';
import {DragDrop, DragDropRegistry, transferArrayItem} from '@angular/cdk/drag-drop';
import {Observable} from 'rxjs';
import {NtkDragDrop} from '../../drag-drop/drag-drop.service';
import {NtkDragDropRegistry} from '../../drag-drop/drag-drop-registry';
import {DetailsCalendarComponent} from '../../details-calendar/details-calendar/details-calendar.component';
import {
    IColumn,
    IDay,
    IEvent,
    IOptions,
    IResizeParam,
    IResizeResult,
    UpdateType
} from '../../details-calendar/shared/models/details-calendar.model';
import {DetailsCalendarService} from '../../details-calendar/shared/details-calendar.service';
import {NtkDragDropParams} from '../../drag-drop/drag-drop.model';
import {map} from 'rxjs/operators';

interface ViewMode {
    Name: string;
    Value: string;
    dateLimit: number;
}

@Component({
    selector: 'ntk-demo-details-calendar',
    templateUrl: './details-calendar.component.html',
    styleUrls: ['./details-calendar.component.scss'],
    providers: [
        {
            provide: DragDropRegistry,
            useExisting: NtkDragDropRegistry
        },
        {
            provide: DragDrop,
            useExisting: NtkDragDrop
        }
    ]
})
export class DemoDetailsCalendarComponent {
    @ViewChild(DetailsCalendarComponent, {static: true}) detailsCalendarComponent: DetailsCalendarComponent;
    days: IDay[] = [];
    w1 = 40;
    w2 = 60;
    now = '2017-04-17';
    options: IOptions = {
        hourPerPixel: 60,
        minHeight: 30,
        timeRange: {
            startTime: 5,
            endTime: 23
        },
        overlapping: {
            minWidth: 20,
            leftDistance: 25,
            rightDistance: 5,
            minLeftDistance: 10,
            minRightDistance: 0
        },
        delaySelection: 500,
        minHour: 0.25
    };

    startDate = moment(`2017-04-17`);
    dateLimit: number;
    viewMode: ViewMode;
    isSplit: boolean;
    viewModes: ViewMode[] = [{
        Name: `1 day`,
        Value: `1day`,
        dateLimit: 1
    }, {
        Name: `2 days`,
        Value: `2days`,
        dateLimit: 2
    }, {
        Name: `1 week`,
        Value: `1week`,
        dateLimit: 7
    }, {
        Name: `2 weeks`,
        Value: `2weeks`,
        dateLimit: 14
    }];


    constructor(private apiService: ApiService,
                private detailsCalendarService: DetailsCalendarService,
                private zone: NgZone,
                private cd: ChangeDetectorRef) {

        this.changeViewMode(this.viewModes[2]);
    }

    getTimesheets() {
        return this.apiService.get('src/assets/data/timesheet.json').pipe(map((items: IDay[]) => {
            return this.getDays().map((day) => {
                let result = items.find((item) => {
                    return item.Date === day.Date;
                });
                if (result) {
                    return result;
                } else {
                    return day;
                }
            });
        }));
    }

    getDays() {
        let day = [];
        for (let i = 0; i < this.dateLimit; i++) {
            day.push({
                Date: this.startDate.clone().add(i, `days`).format(`YYYY-MM-DD`),
                Planning: {},
                Timesheet: {}
            });
        }
        return day;

    }


    trackByEvent(index, item: IEvent) {
        return item.Id;
    }

    trackByDay(index, item: IDay) {
        return item.Date;
    }

    onResize(resizeParam: IResizeParam): Observable<IResizeResult> {
        return new Observable((subscriber) => {
            subscriber.next({
                event: resizeParam.newEvent,
                updateResizeType: UpdateType.UpdateColumn
            });
            subscriber.complete();
        });
    }

    onMove(dragdrop: NtkDragDropParams) {
        // Move event
        if (dragdrop.previousContainer.id === dragdrop.container.id) { // Move item in same column
            dragdrop.container.data.forEach((item) => {
                if (item.Id === dragdrop.item.data.Id) {
                    this.detailsCalendarService.updateEventFromPosition(item, dragdrop.position, this.options);
                }
            });
        } else { // move item from Column A to Column B
            dragdrop.previousContainer.data.forEach((item) => {
                if (item.Id === dragdrop.item.data.Id) {
                    this.detailsCalendarService.updateEventFromPosition(item, dragdrop.position, this.options);
                }
            });
            transferArrayItem(dragdrop.previousContainer.data, dragdrop.container.data, dragdrop.previousIndex, dragdrop.currentIndex);
        }
        dragdrop.subscriber.next();
        dragdrop.subscriber.complete();
    }

    onCreateTimesheet(startTime: number, events: IColumn) {
        console.log('startTime', startTime, events);
    }


    private refresh() {
        this.getTimesheets().subscribe((days: IDay[]) => {


            // Update date
            this.days = days;

            this.cd.detectChanges();
            this.detailsCalendarComponent.updateLayout();
        });

    }

    gotoPrev() {
        this.startDate = this.startDate.add(-this.dateLimit, `days`);
        this.refresh();
    }

    gotoNext() {
        this.startDate = this.startDate.add(this.dateLimit, `days`);
        this.refresh();
    }


    gotoCurrent() {
        this.startDate = moment(`2017-04-17`);
        this.refresh();
    }

    onViewModeChanged(ev) {
        this.changeViewMode(ev.value);
    }

    private changeViewMode(viewMode: ViewMode) {
        this.viewMode = viewMode;
        this.dateLimit = viewMode.dateLimit;

        this.getTimesheets().subscribe((days: IDay[]) => {

            // Update isSplit
            this.isSplit = false;
            if (viewMode.Value === `2weeks`) {
                this.isSplit = true;
            }

            // Update date
            this.days = days;

            this.cd.detectChanges();
            this.detailsCalendarComponent.updateLayout();
        });
    }
}
