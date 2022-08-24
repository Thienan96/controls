import {Component, ContentChildren, HostListener, Input, QueryList} from '@angular/core';
import {IWeekTSEvent, IWeekTSOptions, NTK_WEEK_TS} from './shared/week-ts.model';
import {WeekTsDayPlanningComponent} from './week-ts-day-planning/week-ts-day-planning.component';
import * as _ from 'underscore';
import {WeekTsHeaderComponent} from './week-ts-header/week-ts-header.component';
import {WeekTsBgEventComponent} from './week-ts-bg-event/week-ts-bg-event.component';
import {WeekTsEventComponent} from './week-ts-event/week-ts-event.component';
import {BACKSPACE, DELETE} from '@angular/cdk/keycodes';

@Component({
    selector: 'ntk-week-timesheet',
    templateUrl: './week-ts.component.html',
    styleUrls: ['./week-ts.component.scss'],
    providers: [{
        provide: NTK_WEEK_TS,
        useExisting: WeekTsComponent
    }],
    host: {
        tabindex: '1'
    }
})
export class WeekTsComponent {
    @ContentChildren(WeekTsDayPlanningComponent, {descendants: true}) weekTsDayPlanningComponents: QueryList<WeekTsDayPlanningComponent>;
    @ContentChildren(WeekTsHeaderComponent, {descendants: true}) weekTsHeaderComponents: QueryList<WeekTsHeaderComponent>;
    @ContentChildren(WeekTsBgEventComponent, {descendants: true}) weekTsBgEventComponents: QueryList<WeekTsBgEventComponent>;
    @ContentChildren(WeekTsEventComponent, {descendants: true}) weekTsEventComponents: QueryList<WeekTsEventComponent>;
    @Input() selected: IWeekTSEvent;
    @Input() options: IWeekTSOptions = {
        startTime: 8,
        endTime: 20,
        overlapping: {
            topDistance: 5
        }
    };
    isDraggingToCreate = false; // Check control is dragging to create new event
    isResizing = false; // Check event is resizing

    @HostListener('keydown', ['$event']) onKeyDown(ev: KeyboardEvent) {
        let key = ev['key'],
            keyCode = ev[`keyCode`],
            isDelete = key === 'Delete' || key === 'Del' || keyCode === DELETE,
            isSpace = key === 'Backspace' || keyCode === BACKSPACE;
        if ((isDelete || isSpace) && this.selected) {
            let cell = this.getEventComponent(this.selected);
            cell.remove.emit({
                event: cell.event,
                dayPlanning: cell.getDayPlanningComponent().dayPlanning
            });
        }
    }

    @HostListener('click') onClick() {
        if (!this.isDraggingToCreate && !this.isResizing) {
            this.setSelected(null);
        }
    }


    /**
     * Set select event
     * @param selected
     */
    setSelected(selected: IWeekTSEvent) {
        this.selected = selected;
    }

    /**
     * Update render control
     */
    updateLayout() {
        // Update header layout
        this.weekTsHeaderComponents.forEach((weekTsHeaderComponent) => {
            weekTsHeaderComponent.updateLayout();
        });

        // Update dayPlanning
        this.weekTsDayPlanningComponents.forEach((dayPlanning) => {
            dayPlanning.updateLayout();
        });

        // Update background
        this.weekTsBgEventComponents.forEach((event) => {
            event.updateLayout();
        });
    }

    /**
     * Add new event to control
     * @param event
     * @param events
     */
    addEvent(event: IWeekTSEvent, events: IWeekTSEvent[]) {
        events.push(event);
        let sorted = _.sortBy(events, `StartTime`);
        events.splice(0, events.length);
        sorted.forEach((item) => {
            events.push(item);
        });
    }

    private getEventComponent(event: IWeekTSEvent): WeekTsEventComponent {
        return this.weekTsEventComponents.find((item) => {
            return item.event.Id === event.Id;
        });
    }
}
