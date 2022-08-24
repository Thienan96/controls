import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EmbeddedViewRef,
    Input, NgZone,
    OnDestroy,
    OnInit,
    ViewContainerRef
} from '@angular/core';
import {
    ICalendarResourcePlanning,
    IResourcePlanningResizableData,
    IResourcePlanningAction,
    ResourcePlanningConfig,
    IResourcePlanningEvent,
    ResourcePlanningTemplate
} from '../shared/resource-planning.model';
import moment from 'moment-es6';
import * as _ from 'underscore';
import {Observable} from 'rxjs/Observable';
import {ResourcePlanningService} from '../shared/resource-planning.service';
import {ResourcePlanningConfigService} from '../shared/resource-planning-config.service';
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'ntk-resource-planning-event',
    templateUrl: './resource-planning-event.component.html',
    styleUrls: ['./resource-planning-event.component.scss']
})
export class ResourcePlanningEventComponent implements OnInit, OnDestroy {
    @Input() options: ResourcePlanningConfig;
    @Input('event') item: IResourcePlanningEvent;
    @Input() resource: ICalendarResourcePlanning;
    @Input() selected: IResourcePlanningEvent[];
    @Input() updateEvent: any;
    @Input() getEventTooltip: any;
    @Input() buttonActionClick: any;
    @Input() eventClicked: any;
    @Input() eventDbClicked: any;
    @Input() eventDragStarted: any;
    @Input() eventDragStopped: any;

    isSelected = false;
    tooltipOptions: any;
    draggableOptions: any;
    textColor: string;
    height: number;
    shortDuration: string;
    actions: IResourcePlanningAction[];
    private hourPerPixel: number;
    private minHour: number;
    private maxHour: number;
    private minHeight: number;
    private isHovered = false;
    private readonly $element: JQuery;
    private classes = {
        resourcePlanningDragging: 'resources-planning-dragging',
        eventDragging: 'resources-planning-event-dragging'
    };
    private selectedEventSubscription: any;

    constructor(private resourcePlanningService: ResourcePlanningService,
                elementRef: ElementRef,
                private viewContainerRef: ViewContainerRef,
                private configService: ResourcePlanningConfigService,
                private changeDetectorRef: ChangeDetectorRef,
                private zone: NgZone) {
        this.$element = $(elementRef.nativeElement);
        this.selectedEventSubscription = this.resourcePlanningService.getSelectedEvent().subscribe((selectedEvents: IResourcePlanningEvent[]) => {
            if (this.isSelected !== (_.findWhere(selectedEvents, {Id: this.item.Id}) !== undefined)) {
                this.isSelected = !this.isSelected;
                this.changeDetectorRef.detectChanges();
            }
        });
    }

    ngOnInit() {
        this.hourPerPixel = this.options.hourPerPixel; // 15px
        this.minHour = this.options.minHour; // 15m
        this.maxHour = this.options.maxHour; // 8h
        this.minHeight = this.options.minHeight;
        this.textColor = this.resourcePlanningService.getContrastColor(this.item.Color);
        this.height = this.getHeightFromDuration(this.item.Duration);
        this.shortDuration = this.resourcePlanningService.getShortDurationFromDuration(this.item.Duration);
        this.actions = this.getActions();

        // Active
        this.isSelected = this.isEventSelected();

        this.bindEvents();
    }

    ngOnDestroy() {
        this.selectedEventSubscription.unsubscribe();
    }

    onDragStart(data) {
        let events: IResourcePlanningEvent[] = data.ui.helper.data('data');
        let resourcePlanningEl = this.getResourcePlanningElement();
        events.forEach((event) => {
            resourcePlanningEl.find('.resources-calendar-event-content[event-id="' + event.Id + '"]').addClass(this.classes.eventDragging);
        });

        // Set class for control to css opacity for selected items
        resourcePlanningEl.addClass(this.classes.resourcePlanningDragging);

        this.eventDragStarted(this.item);
    }

    onDragStop(data) {
        let events = data.helper.data('data');
        let resourcePlanningEl = this.getResourcePlanningElement();
        events.forEach((event) => {
            resourcePlanningEl.find('.resources-calendar-event-content[event-id="' + event.Id + '"]').removeClass(this.classes.eventDragging);
        });

        // Restore state for resource-planning
        resourcePlanningEl.removeClass(this.classes.resourcePlanningDragging);

        this.eventDragStopped(this.item);
    }

    /**
     * Click on event
     * @param {MouseEvent} ev
     */
    onClicked(ev: MouseEvent) {
        // Stop event
        ev.stopImmediatePropagation();

        // Only fire to parent if user disable selected
        if (this.options.disableSelected) {
            this.eventClicked(this.item);
            return;
        }

        // Don't select holiday
        if (this.item.Type !== 'Holiday') {
            // Press command or control to can multi selection
            if (ev.ctrlKey || ev.altKey || ev.metaKey) {

                // UnSelect item if item is selected
                if (_.findWhere(this.selected, {Id: this.item.Id})) {
                    let pos = _.findIndex(this.selected, (item: IResourcePlanningEvent) => {
                        if (item) {
                            if (item.Id === this.item.Id) {
                                return true;
                            }
                        }
                    }, this);
                    this.selected.splice(pos, 1);
                } else {
                    this.setHighlight();
                    this.selected.push(this.item);
                }
            } else {
                this.setHighlight();

                // Remove all selected and select this.item
                this.selected.splice(0, this.selected.length);
                this.selected.push(this.item);

            }
            this.resourcePlanningService.selectEvents(this.selected);
        }

        // Broadcast to parent
        this.zone.runGuarded(() => {
            this.eventClicked(this.item);
        });


    }

    onDbClicked(ev: MouseEvent) {
        // Prevent fire to parent
        ev.stopImmediatePropagation();

        // Hide tooltip
        this.hideTooltip();

        this.zone.runGuarded(() => {
            this.eventDbClicked(this.item);
        });
    }

    onButtonActionClicked(action: IResourcePlanningAction, ev: MouseEvent) {
        // Prevent
        ev.stopImmediatePropagation();

        // Hide tooltip
        this.hideTooltip();

        this.zone.runGuarded(() => {
            this.buttonActionClick({
                action: action,
                event: this.item
            });
        });
    }

    getEventTooltipCallback() {
        let tooltipContent: string = this.item[this.options.tooltip.eventProperty];
        if (this.getEventTooltip) {
            tooltipContent = this.getEventTooltip(this.item);
        }
        return tooltipContent;
    }

    onResizableClicked(ev: MouseEvent) {
        ev.stopImmediatePropagation();
    }

    private bindEvents() {
        let namespaceMouseEnter = 'mouseenter.resource-planning-event';
        this.$element.on(namespaceMouseEnter, () => {
            if (!this.options.resizing) { // don't enter when event is resizing
                this.$element.off(namespaceMouseEnter);

                // Event is resizing
                this.isHovered = true;

                this.appendControl();
            }
        });
    }

    /**
     * Get selecte element
     * @param ui
     * @param {IResourcePlanningResizableData} data
     * @returns {any[]}
     */
    private getSelectedElements(ui, data: IResourcePlanningResizableData) {
        let left: number = data.handle.offset.left,
            right: number = left + ui.size.width,
            selected = [];
        data.events.forEach((elPosition) => {
            let leftResource: number = elPosition.offset.left;
            if (right > (leftResource + 10) && left < leftResource && elPosition.droppable) {
                selected.push(elPosition.$el);
            }
        });
        return selected;
    }

    /**
     * Get selected dates
     * @param ui
     * @param {IResourcePlanningResizableData} resizeData
     * @returns {any[]}
     */
    private getSelectedDates(ui, resizeData: IResourcePlanningResizableData) {
        let selected = [];
        let els = this.getSelectedElements(ui, resizeData);
        els.forEach(($el) => {
            let date = $el.attr('attr-date'),
                matched = _.findWhere(this.resource.Availabilities, {
                    Date: date
                });
            if (matched) {
                selected.push(matched);
            }
        });
        return selected;
    }

    /**
     * Get heigt of duration
     * @param {number} duration
     * @returns {number}
     */
    private getHeightFromDuration(duration: number): number {
        let height = duration * this.hourPerPixel;
        if (height < this.minHeight) {
            height = this.minHeight;
        }
        if (this.item.Type === 'Holiday' && height < this.minHeight * 2) {
            height = this.minHeight * 2;
        }
        return height;
    }

    /**
     * Get duration from height
     * @param {number} height
     * @returns {number}
     */
    private getDurationFromHeight(height: number): number {
        let hours = height / this.hourPerPixel,
            duration = moment.duration(hours, 'hours'),
            date = this.resourcePlanningService.getRoundTimeQuarterHour(moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate());
        return date.getHours() + date.getMinutes() / 60;
    }

    /**
     * Update duration
     * @param {number} duration
     */
    private updateDuration(duration: number) {
        // Update height of event
        this.height = this.getHeightFromDuration(duration);
        this.$element.find('.ntk-res-event').height(this.height);

        // Update duration on right top
        this.shortDuration = this.resourcePlanningService.getShortDurationFromDuration(duration);
    }

    private fireChange(newValues, oldEvents, options?) {
        return new Observable((observer) => {
            this.updateEvent({
                newValues: newValues,
                oldValues: oldEvents,
                options: options,
                observer: observer
            });
        });
    }

    /**
     * Get select events
     * @returns {IResourcePlanningEvent[]}
     */
    private getSelectedItems(): IResourcePlanningEvent[] {
        // Get selected events
        let counter = 0,
            matched = false,
            items: IResourcePlanningEvent[],
            selected: IResourcePlanningEvent[] = _.filter(this.selected, (item: IResourcePlanningEvent) => {
                return item.canMoveOutside || item.canMoveInside;
            });
        selected.forEach((item: IResourcePlanningEvent) => {
            if (item) {
                counter++;
                if (item.Id === this.item.Id) {
                    matched = true;
                }
            }
        });
        if (matched && counter >= 2) {
            items = _.clone(selected);
        } else {
            items = [this.item];
        }
        return items;
    }

    /**
     * Create helper from events
     * @param {IResourcePlanningEvent[]} events
     * @returns {JQuery<HTMLElement>}
     */
    private getHelper(events: IResourcePlanningEvent[]) {
        let className: string,
            height: number;
        if (events.length === 1) {
            className = 'one-item';
            height = this.$element.height();
        } else {
            className = 'multi-items';
            height = (events.length - 1) * this.options.overlappingDistance + this.options.eventDraggingHeight;
        }
        let viewRef: EmbeddedViewRef<any> = this.viewContainerRef.createEmbeddedView(this.configService.getTemplate(ResourcePlanningTemplate.EventHelperTemplate), {
            $implicit: {
                options: this.options,
                resource: this.resource,
                selected: [],
                events: events,
                className: className,
                height: height,
                width: this.$element.width()
            }
        });
        viewRef.detectChanges();
        let helper = $(viewRef.rootNodes[0]);
        helper.remove();
        helper.data('data', events);
        return helper;
    }

    /**
     * Highlight event
     */
    private setHighlight() {
        this.$element.addClass('highlight');
        // for hover
        setTimeout(() => {
            this.$element.removeClass('highlight');
        }, this.options.delaySelection);
    }

    private hideTooltip() {
        this.$element.find('.tooltip-run-start').triggerHandler('hidetooltip');
    }

    /**
     * Make event can resizable
     */
    private makeResizable() {
        let resizableEl: JQuery = this.$element.find('.resources-calendar-event-content'),
            resourceEl: JQuery = resizableEl.closest('ntk-resource-planning-resource'),
            hourEl: JQuery = $('.text-full-hour', this.$element),
            eventsEls: JQuery = $('ntk-resource-planning-events', resourceEl),
            selected: JQuery[] = [],
            resizableData: IResourcePlanningResizableData = {
                handle: {
                    offset: resizableEl.offset()
                },
                events: []
            };
        resizableEl['resizable']({
            minHeight: this.hourPerPixel * this.minHour,
            maxHeight: this.hourPerPixel * 24,
            handles: {
                se: this.$element.find('.ui-resizable-se')[0]
            },
            disabled: !this.item.canResize,
            start: () => {
                // Notify to all events that user is resizing to disable create control when user hover on event
                this.options.resizing = true;

                // Prepare data for resize
                resizableData = {
                    handle: {
                        offset: resizableEl.offset()
                    },
                    events: []
                };
                eventsEls.each((index: number, el) => {
                    let $el = $(el),
                        offset = $el.offset();
                    resizableData.events.push({
                        $el: $el,
                        offset: offset,
                        droppable: !$el.hasClass('unDroppable')
                    });
                });

                // Set index to top
                resizableEl.css('z-index', 10000);

                // Fix width
                let width = this.$element.width();
                resizableEl['resizable']('option', 'minWidth', width);
                resizableEl.css('width', width);

                // Add class
                this.$element.addClass('event-resizing');
                this.$element.closest('ntk-resource-planning').addClass('event-resizing');


                // Cancel resize if when press Esc key
                $(window).off('keydown.ntkEventResizable').on('keydown.ntkEventResizable', (event) => {
                    if (event['keyCode'] === 27) {
                        resizableEl.data('canceled', 1);
                        resizableEl.trigger('mouseup');
                    }
                });

            },
            stop: (ev, ui) => {
                selected = [];

                // Cancel resize if canceled flag is turning on
                if (resizableEl.data('canceled') === 1) {
                    resizableEl.data('canceled', 0);
                    this.updateDuration(this.item.Duration);
                    this.onAfterResize();
                    return;
                }

                let height = ui.size.height,
                    newDuration = this.getDurationFromHeight(height),
                    eventsSelected = this.getSelectedDates(ui, resizableData),
                    newEvent;

                if (newDuration === 0 && height > this.hourPerPixel) {
                    newDuration = 24;
                }
                if (newDuration < this.minHour) {
                    newDuration = this.minHour;
                }


                // Change duration
                if (eventsSelected.length === 0) {
                    // Only change duration
                    if (this.item.Duration !== newDuration) {
                        let oldValue = this.item;
                        newEvent = _.clone(this.item);
                        newEvent.Duration = newDuration;
                        this.fireChange([newEvent], [oldValue]).pipe(finalize(() => {
                            this.onAfterResize();
                        })).subscribe(() => {
                            this.updateDuration(this.item.Duration);
                        }, () => {
                            // reset duration
                            this.updateDuration(oldValue.Duration);
                        });
                    } else {
                        // refresh duration
                        this.updateDuration(this.item.Duration);
                        this.onAfterResize();
                    }
                } else {// Change duration and clone event
                    let eventParentIdProperty = this.options.eventParentIdProperty;
                    let eventIndexProperty = this.options['eventIndexProperty'];
                    let oldEvents = [];
                    let newEvents = [];


                    // update event if event is change
                    if (this.item.Duration !== newDuration) {
                        newEvent = _.clone(this.item);
                        newEvent.Duration = newDuration;
                        newEvents.push(newEvent);
                        oldEvents.push(this.item);
                    }


                    eventsSelected.forEach((timesheetInDay) => {
                        let sameEvents = _.filter(timesheetInDay.Events, (event) => {
                            return (event[eventParentIdProperty] === this.item[eventParentIdProperty] && this.item[eventParentIdProperty]);
                        });

                        // find index
                        let index = 0;
                        if (!_.isEmpty(timesheetInDay.Events)) {
                            let maxEvent = _.max(timesheetInDay.Events, (item) => {
                                return item[eventIndexProperty];
                            });
                            if (maxEvent) {
                                index = maxEvent[eventIndexProperty] + 1;
                            }
                        }
                        if (index < timesheetInDay.Events.length) {
                            index = timesheetInDay.Events.length;
                        }


                        if (sameEvents.length === 0) {
                            let eventCloned = _.clone(this.item);
                            delete eventCloned.Id;
                            eventCloned.Date = timesheetInDay.Date;
                            eventCloned.Duration = newDuration;
                            eventCloned[eventIndexProperty] = index;
                            newEvents.push(eventCloned);
                        } else {
                            sameEvents.forEach((eItem) => {
                                oldEvents.push(eItem);
                            });
                            let durationTotal = newDuration;
                            sameEvents.forEach((event: IResourcePlanningEvent) => {
                                durationTotal = durationTotal + event.Duration;
                            });
                            let newEventCloned: any = _.clone(sameEvents[0]);
                            newEventCloned.Duration = durationTotal;
                            newEventCloned[eventIndexProperty] = index;
                            newEvents.push(newEventCloned);
                        }
                    });

                    this.updateDuration(this.item.Duration);
                    this.onAfterResize();


                    this.fireChange(newEvents, oldEvents).subscribe(() => {
                    }, () => {
                    }, () => {
                        this.updateDuration(this.item.Duration);
                        this.onAfterResize();
                    });
                }
            },
            resize: (event, ui) => {
                let duration = this.getDurationFromHeight(ui.size.height),
                    newSelected = this.getSelectedElements(ui, resizableData);

                if (duration === 0 && ui.size.height > this.hourPerPixel) {
                    duration = 24;
                }


                // change duration title
                let strDuration = this.resourcePlanningService.getShortDurationFromDuration(duration);
                if (newSelected.length > 0) {
                    strDuration = (newSelected.length + 1) + ' x ' + this.resourcePlanningService.getShortDurationFromDurationWithSpacing(duration) + ' = ' + this.resourcePlanningService.getShortDurationFromDurationWithSpacing((newSelected.length + 1) * duration);
                }
                hourEl.text(strDuration);


                // Remove class of dayPlanning on oldSelected but don't on newSelected
                selected.forEach((el) => {
                    if (newSelected.length === 0) {
                        el.removeClass('selected');
                    } else {
                        if (_.find(newSelected, (el2) => {
                            return el !== el2;
                        })) {
                            el.removeClass('selected');
                        }
                    }
                });

                // Add class of dayPlanning on newSelected nut don't on oldSelected
                newSelected.forEach((el) => {
                    if (selected.length === 0) {
                        el.addClass('selected');
                    } else {
                        if (_.find(selected, (el2) => {
                            return el !== el2;
                        })) {
                            el.addClass('selected');
                        }
                    }
                });


                selected = newSelected;

            }
        }).on('resize', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Process after resize event:
     *  - Turn off resizing
     *  - Restore z-index
     *  - Restore width of event
     *  - Restore class
     *  - Remove red border
     *  - Remove keyboard event
     */
    private onAfterResize() {
        let resizableEl: JQuery = $('.item', this.$element),
            resourceEl: JQuery = resizableEl.closest('ntk-resource-planning-resource');


        // Turn off resize flag
        this.options.resizing = false;

        // Restore z-index
        resizableEl.css('z-index', 'auto');

        // Restore width
        resizableEl.css('width', '100%');

        // Remove class
        this.$element.removeClass('event-resizing');
        this.getResourcePlanningElement().removeClass('event-resizing');


        // Remove border
        $('ntk-resource-planning-events', resourceEl).removeClass('selected');


        // unBind esc key
        $(window).off('keydown.ntkEventResizable');
    }

    /**
     * Create Tooltip option
     */
    private setTooltipOption() {
        this.tooltipOptions = {
            $element: this.$element.find('.event-content'),
            autoRun: true
        };
        Object.assign(this.tooltipOptions, this.options.tooltip);
    }

    /**
     * Create Draggable option
     */
    private setDraggableOption() {
        this.draggableOptions = {
            handle: this.$element.find('.draggable-handle'),
            $element: this.$element.find('.ntk-res-event'),
            disabled: !this.item.canMoveOutside && !this.item.canMoveInside,
            scrollParent: 'ntk-resource-planning virtual-scroller',
            revertDuration: 500,
            appendTo: 'body',
            helper: () => {
                if (this.isEventSelected()) {
                    let selectedItems = this.getSelectedItems();
                    this.selected.splice(0, this.selected.length);
                    _.each(selectedItems, (item: IResourcePlanningEvent) => {
                        this.selected.push(item);
                    }, this);
                    return this.getHelper(this.selected);
                } else {
                    return this.getHelper([this.item]);
                }

            },
            revertOnStart: (ev, ui) => {
                if (ui.helper.hasClass('ntk-resources-events-dragging-wrapper')) {
                    // Set class if item is reverting


                    let els = ui.helper.find('ntk-resource-planning-event');
                    let counter = 0;

                    let complete = () => {
                        counter++;
                        if (counter === els.length) {
                            ui.helper.remove();
                        }
                    };

                    if (els.length === 0) {
                        counter--;
                        complete();
                    } else {
                        _.each(els, (_el) => {
                            let el = $(_el);
                            let eventEl = el.find('.ntk-res-event');
                            let id = eventEl.attr('event-id');
                            let groupId = eventEl.attr('group-id');
                            let to = $('ntk-resource-planning .ntk-res-event[event-id=\'' + id + '\'][group-id=\'' + groupId + '\']');
                            if (to.length > 0) {
                                el.css({
                                    left: el.offset().left,
                                    top: el.offset().top,
                                    width: el.width(),
                                    height: el.height(),
                                    position: 'absolute',
                                    'min-width': 'auto',
                                    'z-index': 100
                                });
                                el.appendTo('body').animate({
                                    left: to.offset().left,
                                    top: to.offset().top,
                                    width: to.width(),
                                    height: to.height()
                                }, this.draggableOptions.revertDuration, () => {
                                    el.remove();
                                    complete();
                                });
                            } else {
                                el.fadeOut(this.draggableOptions.revertDuration, () => {
                                    el.remove();
                                    complete();
                                });
                            }
                        });
                    }
                    return false;
                }

            }
        };
    }

    /**
     * Add control,html when hover on event
     */
    private appendControl() {

        // Config for tooltip
        this.setTooltipOption();

        // Config for draggable
        this.setDraggableOption();


        // Extra  html
        let viewRef: EmbeddedViewRef<any> = this.viewContainerRef.createEmbeddedView(this.configService.getTemplate(ResourcePlanningTemplate.EventHoverTemplate), {
            $implicit: this
        });
        viewRef.detectChanges();

        viewRef.rootNodes.forEach((el: Element) => {
            this.$element.find('.resources-calendar-event-content').append(el);
        });


        this.$element.append($('<div class="text-full-hour"></div>'));


        this.makeResizable();
    }


    /**
     * Get action-buttons from event
     * @returns {IResourcePlanningAction[]}
     */
    private getActions(): IResourcePlanningAction[] {
        // Filter actions
        let rActions = this.item.actions ? this.item.actions.reverse() : [],
            actions: IResourcePlanningAction[] = [];
        _.each(rActions, (action) => {
            // EJ4-743, push action to list
            actions.push(action);
        });
        return actions;
    }

    /**
     * Get selector of resource-planning
     * @returns {JQuery}
     */
    private getResourcePlanningElement(): JQuery {
        return $('ntk-resource-planning');
    }

    /**
     * Is event selected
     * @returns {boolean}
     */
    private isEventSelected() {
        return _.findWhere(this.selected, {
            Id: this.item.Id
        }) !== undefined;
    }

}
