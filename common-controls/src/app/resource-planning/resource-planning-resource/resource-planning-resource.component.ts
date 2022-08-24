import {
    AfterViewInit, ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {
    ICalendarResourcePlanning,
    IResourcePlanningColumn,
    ResourcePlanningConfig,
    IResourcePlanningDayPlanning, IResourcePlanningDroppableEventUIParam,
    IResourcePlanningEvent,
    ResourcePlanningViewMode
} from '../shared/resource-planning.model';
import * as _ from 'underscore';
import {ResourcePlanningService} from '../shared/resource-planning.service';
import {Observer} from 'rxjs/Observer';

@Component({
    selector: 'ntk-resource-planning-resource',
    templateUrl: './resource-planning-resource.component.html',
    styleUrls: ['./resource-planning-resource.component.scss']
})
export class ResourcePlanningResourceComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @Input() resource: ICalendarResourcePlanning;
    @Input() dates: string[];
    @Input() options: ResourcePlanningConfig;
    @Input() selected: IResourcePlanningEvent[];
    @Input() getEventTooltip: any;
    @Input() updateEvent: any;
    @Input() moveEvent: any;
    @Input() buttonActionClick: any;

    // Event
    @Input() eventClick: any;
    @Input() eventDblClick: any;

    // DayPlanning
    @Input() dayPlanningClick: any;
    @Input() dayPlanningDblClick: any;

    @Input() prevButtonClicked: any;
    @Input() nextButtonClicked: any;
    @Input() resourceClicked: any;
    @Input() eventDragStarted: any;
    @Input() eventDragStopped: any;
    @Input() daysOfWeek: number;
    @Input() viewMode: ResourcePlanningViewMode;
    @Input() isCustomizeView: boolean;
    @Input() minHeight: number;
    @Input() isSmallIcon: string;
    @Output() rendered = new EventEmitter();


    columns: IResourcePlanningColumn[] = [];
    droppableOptions: any = {
        accept: '.ntk-res-event',
        placeholder: '.draggable-placeholder',
        drag: (event: MouseEvent, ui: IResourcePlanningDroppableEventUIParam) => {
            this.onDrag(ui);
        }
    };
    private $element: JQuery;
    private resourceChangeSubject: any;


    constructor(private elementRef: ElementRef,
                private resourcePlanningService: ResourcePlanningService,
                private cd: ChangeDetectorRef) {
        this.$element = $(elementRef.nativeElement);

        // Update resource
        this.resourceChangeSubject = this.resourcePlanningService.onResourceChange().subscribe((data: { resources, dates }) => {
            let resources: ICalendarResourcePlanning[] = data.resources,
                dates: string[] = data.dates,
                matched = resources.find((resource: ICalendarResourcePlanning) => {
                    return resource.Id === this.resource.Id;
                });
            if (matched) {
                this.updateColumns(this.resource.Availabilities, dates);
                this.cd.markForCheck();
            }
        });
    }

    get ViewMode() {
        return ResourcePlanningViewMode;
    }

    ngOnInit() {
        this.updateColumns(this.resource.Availabilities, this.dates);
    }

    ngAfterViewInit() {
        this.rendered.emit(this.resource);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.daysOfWeek && !changes.daysOfWeek.isFirstChange()) {
            this.updateColumns(this.resource.Availabilities, this.dates);
        }
    }

    ngOnDestroy() {
        this.resourceChangeSubject.unsubscribe();
    }

    onPrevButtonClicked() {
        this.prevButtonClicked(this.resource);
    }

    onNextButtonClicked() {
        this.nextButtonClicked(this.resource);
    }

    onResourceClicked() {
        this.resourceClicked(this.resource);
    }

    onEventClicked(ev: MouseEvent, event: IResourcePlanningEvent) {
        ev.stopImmediatePropagation();

        this.eventClick(event);
    }

    onEventDblClicked(ev: MouseEvent, event: IResourcePlanningEvent) {
        ev.stopImmediatePropagation();

        this.eventDblClick(event);
    }

    onDayPlanningClicked(column: IResourcePlanningColumn) {
        this.dayPlanningClick({
            Column: column,
            ResourceId: this.resource.Resource ? this.resource.Resource.Id : null,
            Date: column.availability.Date
        });
    }

    onDayPlanningDblClicked(column: IResourcePlanningColumn) {
        this.dayPlanningDblClick({
            Column: column,
            ResourceId: this.resource.Resource ? this.resource.Resource.Id : null
        });
    }

    /**
     * Drop a event to day-planning to add new event
     * @param data
     */
    onDrop(data: { data, ui: IResourcePlanningDroppableEventUIParam, observer: Observer<any> }) {
        let si = data.data,
            ui: IResourcePlanningDroppableEventUIParam = data.ui,
            observer: Observer<any> = data.observer;
        let $element = this.$element.find('.droppable');
        let position = {
            left: ((ui.offset.left + ui.helper.width() / 2) - $element.offset().left) / $element.width()
        };
        let positions = [];
        let days = this.dates.length;
        for (let i = 0; i < days; i++) {
            positions.push({
                left: i / days,
                width: days / 100
            });
        }
        let availabilityIndex = this.getIndexInPosition(position, positions);
        let availability = this.columns[availabilityIndex];
        if (!availability.availability.canDrop) {
            observer.error('reject');
            observer.complete();
        } else {
            let events = availability.availability.Events;
            let index = events.length;
            let date = availability.availability.Date;
            let result = this.resourcePlanningService.getDrop(si, events, index, ui, {
                Date: date,
                ResourceId: this.resource.Resource.Id,
                GroupId: this.resource.Resource.GroupId
            });

            if (result.newValues.length === 0 && result.oldValues.length === 0) {
                observer.error('data is empty');
                observer.complete();
            } else {
                result['observer'] = observer;
                this.updateEvent(result);
            }

        }

        // Hide holder
        this.$element.find('.draggable-placeholder').hide();
    }

    /**
     * Drap event to show place-holder
     * @param {IResourcePlanningDroppableEventUIParam} ui
     */
    private onDrag(ui: IResourcePlanningDroppableEventUIParam) {
        let $element = this.$element.find('.droppable');
        let placeholder = this.$element.find(this.droppableOptions.placeholder);
        let position = {
            left: 100 * ((ui.offset.left + ui.helper.width() / 2) - $element.offset().left) / $element.width()
        };
        let index = this.getIndexInPosition(position, this.columns);
        if (index === -1) {
            placeholder.hide();
        } else {
            let canDrop = this.columns[index].availability.canDrop;
            if (!canDrop) {
                placeholder.hide();
            } else {
                placeholder.css({
                    left: 100 * (index / this.columns.length) + '%'
                }).show();
            }
        }
    }

    /**
     * Update columns
     * @param {IResourcePlanningDayPlanning[]} daysPlanning
     * @param dates
     */
    private updateColumns(daysPlanning: IResourcePlanningDayPlanning[], dates) {
        if (!daysPlanning) {
            return;
        }
        let spacing = 0;
        let viewMode = this.viewMode,
            columns = [],
            daysOfWeek = this.daysOfWeek;
        // dates is change
        if (columns.length !== dates.length) {// if dates are changed
            let width = 100 / dates.length;
            if (viewMode === ResourcePlanningViewMode.Week) {
                width = ((100 - (dates.length / daysOfWeek) + 1) / dates.length);
            }

            for (let $index = 0; $index < dates.length; $index++) {
                if ((viewMode === ResourcePlanningViewMode.Week) &&
                    ($index + 1) % daysOfWeek === 0 &&
                    $index < dates.length - 1) {
                    spacing++;
                }

                if ($index < columns.length) {
                    columns[$index].left = spacing + width * $index;
                    columns[$index].width = width;
                } else {
                    columns.push({
                        id: _.uniqueId('availability-id-'),
                        left: spacing + $index * width,
                        width: width
                    });
                }
            }
            if (columns.length > dates.length) {
                columns.splice(dates.length, columns.length);
            }
        }

        dates.forEach((date, i) => {
            let matched = daysPlanning.find((resourcePlanningDayPlanning) => {
                return resourcePlanningDayPlanning.Date === date;
            });
            if (matched) {
                columns[i].availability = matched;
            } else {
                console.warn('Date don\'t match: ' + date);
            }
        });

        this.columns = columns;

    }

    /**
     * Get index of Droppable
     * @param offset
     * @param {IResourcePlanningColumn[]} positions
     * @returns {number}
     */
    private getIndexInPosition(offset, positions: IResourcePlanningColumn[]): number {
        let index = -1;
        _.map(positions, (position, i) => {
            if (offset.left >= position.left && (offset.left <= position.left + position.width)) {
                index = i;
                return false;
            }
        });
        return index;
    }
}
