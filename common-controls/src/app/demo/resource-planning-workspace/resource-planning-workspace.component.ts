import * as _ from 'underscore';
import moment from 'moment-es6';
import {Observer} from 'rxjs/Observer';
import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {MatSelectChange, MatSlideToggleChange} from '@angular/material';
import {ResourcePlanningComponent} from '../../resource-planning/resource-planning/resource-planning.component';
import {
    ICalendarResourcePlanning,
    ResourcePlanningConfig,
    IResourcePlanningEvent,
    ResourcePlanningViewMode
} from '../../resource-planning/shared/resource-planning.model';
import {ResourcePlanningConfigService} from '../../resource-planning/shared/resource-planning-config.service';
import {ResourcePlanningService} from '../../resource-planning/shared/resource-planning.service';
import {StorageService} from '../../core/services/storage.service';

enum VIEW {
    ONEWEEK = 'ONEWEEK',
    TWOWEEKS = 'TWOWEEKS',
    SUMMARY = 'SUMMARY',
    CUSTOMIZE = 'CUSTOMIZE'
}


@Component({
    selector: 'ntk-resource-planning-workspace',
    templateUrl: './resource-planning-workspace.component.html',
    styleUrls: ['./resource-planning-workspace.component.scss']
})
export class ResourcePlanningWorkspaceComponent implements AfterViewInit, OnInit {
    @ViewChild('resourcePlanning', {static: true}) resourcePlanning: ResourcePlanningComponent;

    resources: ICalendarResourcePlanning[] = [];
    dates: string[] = [];
    selected = [];
    options = new ResourcePlanningConfig({
        isShowRightColumnOfResource: true,
        headerOnRight: 'Total'
    });
    resourcesCache: ICalendarResourcePlanning[] = [];
    eventsCache: IResourcePlanningEvent[] = [];
    events: IResourcePlanningEvent[] = [];
    draggableOptions = {};
    droppableOptions = {
        accept: '.resources-calendar-event-content',
    };
    shownTrash = false;
    droppableTrashOption = {
        accept: '.ntk-res-event',
        over: () => {
            this.resourcePlanningService.raiseDisabledDroppable(true);
        },
        out: () => {
            this.resourcePlanningService.raiseDisabledDroppable(false);
        }
    };

    currentDate: string;
    currentView: VIEW;
    daysOfWeek: number;
    showWeekend: boolean;
    showGroup: boolean;
    topIndex = -1;
    viewMode: ResourcePlanningViewMode;
    isCustomizeView = false;

    itemHeight: number;
    isSmallIcon: boolean;
    pageSize: number;

    constructor(private http: HttpClient,
                private cd: ChangeDetectorRef,
                private configService: ResourcePlanningConfigService,
                private resourcePlanningService: ResourcePlanningService,
                private storageService: StorageService) {
    }

    ngOnInit() {
        // Create events green on the left
        for (let i = 0; i < 10; i++) {
            let event: IResourcePlanningEvent = {
                Id: 'event-' + i,
                Title: 'Event-' + i,
                TaskId: 'Task-' + i,
                Color: 'green',
                Duration: 2,
                canMoveInside: true,
                canMoveOutside: true,
                canResize: true
            };
            this.events.push(event);
        }


        this.currentDate = '2017-03-12'; // localStorage.getItem('currentDate') || moment().format('YYYY-MM-DD');
        this.showWeekend = this.storageService.getUserValue('showWeekend') || false;
        this.showGroup = this.storageService.getUserValue('showGroup') || false;
        this.isCustomizeView = this.storageService.getUserValue('customizeView') || false;
        this.daysOfWeek = this.showWeekend ? 7 : 5;

        // Set ViewMode
        this.currentView = <VIEW>this.storageService.getUserValue('currentView') || VIEW.ONEWEEK;
        this.viewMode = this.getViewMode(this.currentView);


        this.updateDates();


        /**
         * Go next/Prev date by press navigation on keyboard
         */
        $(window).on('keydown', (ev) => {
            if (ev.keyCode === 37) {
                this.onDateGo('navigate_before');
            }
            if (ev.keyCode === 39) {
                this.onDateGo('navigate_next');
            }
        });

    }

    ngAfterViewInit() {
        this.http.get('src/assets/data/resources.json').subscribe((data: ICalendarResourcePlanning[]) => {
            this.resourcesCache = _.map(data, (resource: ICalendarResourcePlanning) => {
                resource.Id = _.uniqueId('resource-id-');
                if (resource.Resource) {
                    resource.Resource.Id = resource.Id;
                }

                _.map(resource.Availabilities, (availability: any) => {
                    _.map(availability.Events, (event: any, index: number) => {
                        event.Id = _.uniqueId('event-id-');
                        event.ResourceId = resource.Resource.Id;
                        event.Date = availability.Date;
                        event.GroupId = resource.Resource.GroupId;
                        event.Index = index;
                        this.eventsCache.push(event);
                    });

                });
                return resource;
            });


            this.refresh();


        });


    }

    onDragStart(data) {
        data.ui.helper.css('width', $(data.event.target).width());
        this.showTrash();
    }

    onDragStop() {
        this.hideTrash();
    }

    onDrop(data) {
        let observer: Observer<any> = data.observer;

        if (this.canDrop()) {
            let events: any[] = data.data;
            events.forEach((event) => {
                this.events.push(event);
            });


            observer.next(events);
            observer.complete();
        } else {
            observer.error('Revert');
            observer.complete();
        }


        this.cd.detectChanges();
    }

    canDrop() {
        return true;
    }

    showTrash() {
        this.shownTrash = true;
        this.safeApply();
    }

    hideTrash() {
        this.shownTrash = false;
        this.safeApply();
    }

    safeApply() {
        this.cd.detectChanges();
    }

    onDataLoad(data: { observer: Observer<any>, pageSize: number, startIndex: number }) {
        console.log(data.startIndex, data.pageSize);
        let result = this.resources.slice(data.startIndex, data.startIndex + data.pageSize);

        data.observer.next({
            Count: this.resources.length,
            ListItems: result,
            Index: -1
        });
        data.observer.complete();
    }

    getEventTooltip(event) {
        return 'Tooltip - ' + event.Title;
    }

    getResources(resources, dates): ICalendarResourcePlanning[] {
        let resourcesFiltered: ICalendarResourcePlanning[] = [];
        let eventsCache = this.eventsCache;
        _.map(resources, (resource: any) => {
            let availabilities = [];
            _.each(dates, (date) => {
                let dayPlanning: any = {
                    Id: date,
                    Date: date,
                    Events: []
                };
                let availability = _.findWhere(resource.Availabilities, {Date: date}) || {};
                dayPlanning = _.extend(availability, dayPlanning);
                if (dayPlanning.canDrop === undefined) {
                    dayPlanning.canDrop = true;
                }

                availabilities.push(dayPlanning);

                let events = [];
                _.each(eventsCache, (event) => {
                    if (resource.Id === event.ResourceId && event.Date === date) {
                        events.push(event);
                    }
                });

                // Sort
                let newValuesCloned = _.clone(events);
                events.splice(0, events.length);
                let sorted = _.sortBy(newValuesCloned, this.configService.get('eventIndexProperty'));
                sorted.forEach((s) => {
                    events.push(s);
                });


                _.each(events, (event) => {
                    if (event.canMoveOutside === undefined) {
                        event.canMoveOutside = true;
                    }
                    if (event.canMoveInside === undefined) {
                        event.canMoveInside = true;
                    }
                    if (event.canResize === undefined) {
                        event.canResize = true;
                    }
                    dayPlanning.Events.push(event);
                });


            });
            resourcesFiltered.push(<ICalendarResourcePlanning>{
                Id: resource.Id,
                Resource: resource.Resource,
                Availabilities: availabilities,
                BgColor: resource.BgColor,
                ShowPreNavigate: resource.ShowPreNavigate,
                ShowNextNavigate: resource.ShowNextNavigate,
                Right: resource.Right,
                ClassName: resource.ClassName
            });
        }, this);
        return resourcesFiltered;
    }

    onResourceClicked(data) {
        console.log('resource clicked:', data);
    }

    onEventUpdated(data: { observer: Observer<any>, options, newValues: IResourcePlanningEvent[], oldValues: IResourcePlanningEvent[] }) {
        let newValues = data.newValues,
            oldValues = data.oldValues,
            observer = data.observer,
            options = data.options;

        console.log('Update event:', JSON.parse(JSON.stringify(newValues)), JSON.parse(JSON.stringify(oldValues)), options);

        // Reject if item cannot modify
        let needItems = newValues.concat(oldValues);
        needItems.forEach((item) => {
            if (!item.canMoveInside && !item.canMoveOutside) {
                observer.error([]);
                observer.complete();
                return;
            }
        });


        // delete event if event don't exist in 2 array oldValues, newValues
        _.map(oldValues, (oldValue: any) => {
            let found = _.findWhere(newValues, {Id: oldValue.Id});
            if (!found) {
                for (let i = 0; i < this.eventsCache.length; i++) {
                    if (this.eventsCache[i].Id === oldValue.Id) {
                        this.eventsCache.splice(i, 1);
                    }
                }
            }
        });

        let modifies = [];
        _.map(newValues, (_event: any) => {
            let event;
            // add new
            if (!_event.Id) {
                event = _.clone(_event);
                event.Id = _.uniqueId('event-id-');
                modifies.push(event);

                this.eventsCache.push(event);
            } else {// update
                event = _.clone(_event);

                let found = _.findWhere(this.eventsCache, {
                    Id: event.Id
                });
                if (found) {
                    _.extend(found, event);
                }

                modifies.push(found);
            }
        });


        observer.next(modifies);
        observer.complete();


        this.updateResources();
    }

    onEventMoved(data: { events: IResourcePlanningEvent[], event: IResourcePlanningEvent, date: string, index: number, observer: Observer<any>, options }) {
        console.log('onEventMoved:', data);
        data.observer.error('loi');
    }

    onPrevButtonClicked(data) {
        console.log('Click on prev button :', data);
    }

    onNextButtonClicked(data) {
        console.log('Click on next button :', data);
    }

    onButtonActionClick(data) {
        console.log('Click on action button :', data);
    }

    onEventClicked(data) {
        console.log('Click on event:', data);
    }

    onEventDbClicked(data) {
        console.log('Double click on event:', data);
    }

    onDayPlanningClicked(data) {
        console.log('Click on day-planning:', data);
    }

    onDayPlanningDblClicked(data) {
        console.log('Double click on day-planning:', data);
    }

    onEventDragStarted(data) {
        console.log('onEventDragStarted :', data);
        this.showTrash();
    }

    onEventDragStopped(data) {
        console.log('onEventDragStopped :', data);
        setTimeout(() => {
            this.resourcePlanningService.raiseDisabledDroppable(false);
            this.hideTrash();
        }, 100);
    }

    onTrashDrop(data) {
        if (!data.ui.draggable.hasClass('event-on-right')) {
            this.removeEvents(data.data);
            this.selected = [];
        } else {
            let event = data.data[0];
            for (let i = 0; i < this.events.length; i++) {
                if (this.events[i].Id === event.Id) {
                    this.events.splice(i, 1);
                    i--;
                }
            }
        }

        data.observer.next(data.data);
        data.observer.complete();

        this.refresh();
    }


    onDateGo(value) {
        let date = this.currentDate;
        switch (value) {
            case 'navigate_before':
                date = moment(this.currentDate).subtract(this.getAllDaysInWeek(), 'days').format('YYYY-MM-DD');
                break;
            case 'navigate_current':
                date = moment().format('YYYY-MM-DD');
                break;
            case 'navigate_next':
                date = moment(this.currentDate).add(this.getAllDaysInWeek(), 'days').format('YYYY-MM-DD');
                break;
        }
        this.currentDate = date;
        this.updateDates();
        this.updateResources();
    }


    onWeekendsButtonChange(change: MatSlideToggleChange) {
        this.showWeekend = change.checked;
        this.storageService.setLocalUserValue('showWeekend', this.showWeekend);

        this.daysOfWeek = this.showWeekend ? 7 : 5;

        this.updateDates();

        this.updateResources();
    }

    onGroupButtonChange(change: MatSlideToggleChange) {
        this.showGroup = change.checked;
        this.storageService.setLocalUserValue('showGroup', this.showGroup);
    }

    onCustomizeViewChange(change: MatSlideToggleChange) {
        this.isCustomizeView = change.checked;
        this.storageService.setLocalUserValue('customizeView', this.isCustomizeView);

        this.refresh();
    }

    onViewModeChange(change: MatSelectChange) {
        this.currentView = change.value;
        this.storageService.setLocalUserValue('currentView', this.currentView);

        this.updateDates();

        this.viewMode = this.getViewMode(this.currentView);

        this.refresh();
    }


    private refresh() {
        this.cd.detectChanges();


        this.resources = this.getResources(this.resourcesCache, this.dates);
        this.resourcePlanning.refresh();
    }

    private updateDates() {
        let days = this.getDays(),
            dates = [];
        if (this.currentView === VIEW.SUMMARY) {
            let month = moment(this.currentDate).month() + 1,
                year = moment(this.currentDate).year(),
                date: string = year + '-' + month + '-01';
            for (let i = 0; i < days; i++) {
                dates.push(moment(date, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD'));
            }
        } else {
            let firstWeek = moment(this.currentDate).isoWeekday(1);
            for (let i = 0; i < days; i++) {
                dates.push(firstWeek.clone().add(i, 'days').format('YYYY-MM-DD'));
            }
        }
        this.dates = dates;
    }

    private removeEvents(items) {
        _.map(items, (item: any) => {
            for (let i = 0; i < this.eventsCache.length; i++) {
                if (this.eventsCache[i].Id === item.Id) {
                    this.eventsCache.splice(i, 1);
                }
            }
        });

    }

    private updateResources() {
        this.resources = this.getResources(this.resourcesCache, this.dates);
        this.resourcePlanning.updateResourcePlanning(this.resources, this.dates);
        this.safeApply();
    }

    private getDays() {
        let days = 0,
            daysOfWeek = this.daysOfWeek,
            viewMode = this.currentView;
        switch (viewMode) {
            case VIEW.ONEWEEK:
                days = daysOfWeek;
                break;
            case VIEW.TWOWEEKS:
            case VIEW.CUSTOMIZE:
                days = daysOfWeek * 2;
                break;
            case VIEW.SUMMARY:
                days = daysOfWeek * 3;
                break;
        }
        return days;
    }

    private getAllDaysInWeek() {
        let days = 0,
            viewMode = this.currentView;
        switch (viewMode) {
            case VIEW.ONEWEEK:

                days = 7;
                break;
            case VIEW.TWOWEEKS:
            case VIEW.CUSTOMIZE:
                days = 7 * 2;
                break;
            case VIEW.SUMMARY:
                days = 7 * 3;
                break;
        }
        return days;
    }

    getViewMode(viewMode): ResourcePlanningViewMode {
        // ViewMode
        switch (viewMode) {
            case VIEW.ONEWEEK:
            case VIEW.TWOWEEKS:
            case VIEW.CUSTOMIZE:
                return ResourcePlanningViewMode.Week;
            case VIEW.SUMMARY:
                return ResourcePlanningViewMode.Month;
        }
    }


}
