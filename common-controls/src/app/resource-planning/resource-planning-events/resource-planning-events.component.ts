import {Component, ElementRef, Input, NgZone, OnInit} from '@angular/core';
import {
    ICalendarResourcePlanning,
    IResourcePlanningDroppableEventUIParam,
    ResourcePlanningConfig,
    IResourcePlanningDayPlanning,
    IResourcePlanningEvent,
    ResourcePlanningViewMode
} from '../shared/resource-planning.model';
import * as _ from 'underscore';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {ResourcePlanningService} from '../shared/resource-planning.service';


@Component({
    selector: 'ntk-resource-planning-events',
    templateUrl: './resource-planning-events.component.html',
    styleUrls: ['./resource-planning-events.component.scss']
})
export class ResourcePlanningEventsComponent implements OnInit {
    @Input() viewMode: ResourcePlanningViewMode;
    @Input() resource: ICalendarResourcePlanning;
    @Input() dayPlanning: IResourcePlanningDayPlanning;
    @Input() date: string;
    @Input() events: IResourcePlanningEvent[];
    @Input() options: ResourcePlanningConfig;
    @Input() selected: IResourcePlanningEvent[];
    @Input() getEventTooltip: any;
    @Input() getHeaderTooltip: any;
    @Input() updateEvent: any;
    @Input() moveEvent: any;
    @Input() buttonActionClick: any;
    @Input() eventClick: any;
    @Input() eventDblClick: any;
    @Input() dayPlanningClick: any;
    @Input() dayPlanningDblClick: any;
    @Input() eventDragStarted: any;
    @Input() eventDragStopped: any;

    droppableOptions = {
        items: '.resources-calendar-event-content',
        sortable: true,
        accept: this.canAccept.bind(this),
        drop: (ev: MouseEvent, ui: IResourcePlanningDroppableEventUIParam) => {
            return this.onDrop(ui);
        }
    };
    private readonly $element: JQuery;
    private droppableDisabled = false;

    constructor(private elementRef: ElementRef,
                private resourcePlanningService: ResourcePlanningService,
                private zone: NgZone) {
        this.$element = $(elementRef.nativeElement);
    }

    ngOnInit() {
        this.resourcePlanningService.getDisabledDroppable().subscribe((disabled: boolean) => {
            this.droppableDisabled = disabled;
        });
    }

    /**
     * DoubleClick on Day-Planning to add new event
     */
    onDoubleClicked() {
        this.zone.run(()=>{
            this.dayPlanningDblClick({
                Date: this.date,
                ResourceId: this.resource.Resource ? this.resource.Resource.Id : null
            });
        });

    }

    /**
     * Click on Day-Planning to add new event
     */
    onClicked() {
        this.dayPlanningClick({
            Date: this.date,
            ResourceId: this.resource.Resource ? this.resource.Resource.Id : null
        });
    }

    getDayPlanningTooltipCallback() {
        let tooltipContent = this.dayPlanning.HeaderTooltip;
        if (this.getHeaderTooltip) {
            tooltipContent = this.getHeaderTooltip({
                dayPlanning: {
                    Date: this.date,
                    ResourceId: this.resource.Resource.Id,
                    GroupId: this.resource.Resource.GroupId
                }
            });
        }
        return tooltipContent;
    }

    /**
     * Can drop event to day-planning
     * @param {JQuery} $el
     * @returns {boolean}
     */
    private canAccept($el: JQuery) {
        let accept = false;
        if ($el.hasClass('ntk-res-event')) {
            accept = true;
            let eventId = $el.attr('event-id'),
                events = this.$element.find('[event-id=' + eventId + ']');

            if (// don't allow move outside
                ($el.hasClass('unMoveOutside') && events.length === 0) ||
                // don't allow move inside
                ($el.hasClass('unMoveInside') && events.length > 0)) {

                accept = false;
            }
        }
        return accept;
    }

    /**
     * Move events
     * @param {IResourcePlanningDroppableEventUIParam} ui
     */
    private onDrop(ui: IResourcePlanningDroppableEventUIParam) {
        if (this.droppableDisabled) {
            return;
        }
        // Turn on flag to prevent revert
        ui.helper.data('dropped', true);

        // remove the lines
        this.removeDirectionLine();


        // Calc index
        let position = {
            top: ui.offset.top + ui.helper.height() / 2
        };
        let children = this.getChildren();
        let index = this.getIndexInEls(position, children);

        // Don't allow user drag into item unMoveInside
        if ($(children[index]).hasClass('unMoveInside')) {
            ui.helper.data('revert')();
            return;
        }


        // Get data
        let items = ui.helper.data('data');


        let observable = new Observable((observer) => {
            if (!this.droppableDisabled) {
                if (items.length === 1) {
                    this.drop(items, observer, ui, index);
                } else {
                    this.move(items, observer, ui, index);
                }
            }
        });
        observable.subscribe(() => {
            if (ui.helper.data('draggableOnStop')) {
                ui.helper.data('draggableOnStop')();
            }
        }, (error) => {
            console.warn(error);
            // Revert if error
            ui.helper.data('revert')();
        });
    }

    private drop(items: IResourcePlanningEvent[], observer: Observer<any>, ui: IResourcePlanningDroppableEventUIParam, index: number) {
        if (this.droppableDisabled) {
            return;
        }
        let sourceItems = _.clone(items);
        let destinationItems = _.clone(this.events);
        let result = this.resourcePlanningService.getDrop(sourceItems, destinationItems, index, ui, {
            Date: this.date,
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

    private move(events: IResourcePlanningEvent[], observer: Observer<any>, ui: IResourcePlanningDroppableEventUIParam, index: number) {
        let action = this.resourcePlanningService.getAction(ui),
            ctrlKey = this.resourcePlanningService.getCtrlKey(ui),
            altKey = this.resourcePlanningService.getAltKey(ui);
        let data = {
            events: events,
            ui: ui,
            index: index,
            observer: observer,
            options: {
                ResourceId: this.resource.Resource.Id,
                GroupId: this.resource.Resource.GroupId,
                ctrlKey: ctrlKey,
                altKey: altKey,
                changeType: action,
                sourceId: ui.helper.data('data').Id
            }
        };
        this.moveEvent(data);
    }

    /**
     * Remove active line
     */
    private removeDirectionLine() {
        this.getChildren().removeClass('ui-draggable-line-top ui-draggable-line-bottom');
    }

    private getChildren() {
        return this.$element.find(this.droppableOptions.items);
    }

    /**
     * Get position of line when dragging a event
     * @param offset
     * @param {JQuery} els
     * @returns {number}
     */
    private getIndexInEls(offset, els: JQuery) {
        let index = -1;
        els.each((i, _el) => {
            let el = $(_el),
                os = el.offset(),
                height = el.height(),
                mid = os.top + height / 2;
            if (offset.top >= os.top && offset.top <= os.top + height) {
                if (offset.top <= mid) {
                    index = i;
                } else {
                    index = i + 1;
                }
            }
        });
        if (index === -1) {
            if (els.length === 0) {
                index = 0;
            } else {
                let last = $(els[els.length - 1]),
                    first = $(els[0]);
                if (offset.top >= last.offset().top) {
                    index = els.length;
                }
                if (offset.top <= first.offset().top) {
                    index = 0;
                }
            }

        }
        return index;
    }
}
