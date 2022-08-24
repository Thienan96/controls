import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {
    ICalendarResourcePlanning,
    ResourcePlanningConfig,
    IResourcePlanningEvent,
    ResourcePlanningTemplate,
    ResourcePlanningViewMode
} from '../shared/resource-planning.model';

import {Observable} from 'rxjs';
import {VirtualScrollerComponent} from 'ngx-virtual-scroller';
import {ResourcePlanningConfigService} from '../shared/resource-planning-config.service';
import {ResourcePlanningService} from '../shared/resource-planning.service';
import {IDataItems, ILazyItem} from '../../shared/models/common.info';
import {LazyDataController} from '../../core/controllers/lazy-data-controller';


@Component({
    selector: 'ntk-resource-planning',
    templateUrl: './resource-planning.component.html',
    styleUrls: ['./resource-planning.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        // View Mode
        '[class.view-mode-week]': 'this.viewMode === ViewMode.Week',
        '[class.view-mode-month]': 'this.viewMode === ViewMode.Month',

        '[class.undroppable]': 'droppableDisabled',
        '[class.has-group]': 'showGroup',
        '[class.is-small-icon]': 'isSmallIcon'
    }
})
export class ResourcePlanningComponent extends LazyDataController<ICalendarResourcePlanning> implements AfterViewInit, OnInit, OnChanges {
    @Input() dates: string[];
    @Input() options: ResourcePlanningConfig;
    @Input() selected: IResourcePlanningEvent[] = [];
    @Input() viewMode: ResourcePlanningViewMode;
    @Input() daysOfWeek: number;
    @Input() getEventTooltip: any;
    @Input() showGroup = false;
    @Input() paddingRight = 0;

    // [(isCustomizeView)]
    @Input() isCustomizeView = false;
    @Output() isCustomizeViewChange = new EventEmitter<boolean>();

    // [(isSmallIcon)]
    @Input() isSmallIcon = false;
    @Output() isSmallIconChange = new EventEmitter<boolean>();

    // [(itemHeight)]
    @Input() itemHeight = 144;
    @Output() itemHeightChange = new EventEmitter<number>();

    // [(pageSize)]
    @Input('pageSize') NUMBER_ITEMS_PER_PAGE = 20;
    @Output('pageSizeChange') pageSizeChange = new EventEmitter<number>();


    @Output() resourceClick = new EventEmitter();
    @Output() prevButtonClick = new EventEmitter();
    @Output() nextButtonClick = new EventEmitter();
    @Output() updateEvent = new EventEmitter();
    @Output() moveEvent = new EventEmitter();
    @Output() getResources = new EventEmitter();
    @Output() buttonActionClick = new EventEmitter();
    @Output() eventClick = new EventEmitter();
    @Output() eventDblClick = new EventEmitter();
    @Output() dayPlanningClick = new EventEmitter();
    @Output() dayPlanningDblClick = new EventEmitter();
    @Output() eventDragStart = new EventEmitter();
    @Output() eventDragStop = new EventEmitter();

    @ViewChild('virtualScroll', {static: false}) scrollViewPort: VirtualScrollerComponent;
    @ViewChild('eventHelperTemplate', {static: true}) eventHelperTemplate: TemplateRef<any>;
    @ViewChild('eventHoverTemplate', {static: true}) eventHoverTemplate: TemplateRef<any>;

    currentGroup: {
        Id: string;
        Name: string;
    };
    droppableDisabled = false;

    $element: JQuery;

    constructor(injector: Injector,
                private elementRef: ElementRef,
                private render2: Renderer2,
                private viewContainerRef: ViewContainerRef,
                private configService: ResourcePlanningConfigService,
                private resourcePlanningService: ResourcePlanningService,
                private cd: ChangeDetectorRef) {
        super(injector);
        this.$element = $(elementRef.nativeElement);

        this.resourcePlanningService.getDisabledDroppable().subscribe((disabled: boolean) => {
            this.droppableDisabled = disabled;
        });
    }

    get ViewMode() {
        return ResourcePlanningViewMode;
    }

    ngOnInit() {
        this.configService.set({
            eventIndexProperty: this.options.eventIndexProperty,
            eventParentIdProperty: this.options.eventParentIdProperty
        });
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();

        // Config templates
        let templates = {};
        templates[ResourcePlanningTemplate.EventHelperTemplate] = this.eventHelperTemplate;
        templates[ResourcePlanningTemplate.EventHoverTemplate] = this.eventHoverTemplate;
        this.configService.set({
            templates: templates
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.viewMode || changes.isCustomizeView) {
            this.updateView();
        }
        if (changes.showGroup && !changes.showGroup.isFirstChange()) {
            this.updateFirstPersonInGroup();
            this.updateGroup();
        }
    }

    loadData(startIndex: number, pageSize: number): Observable<IDataItems<ILazyItem>> {
        return new Observable<IDataItems<ILazyItem>>((observer) => {
            this.getResources.emit({
                startIndex: startIndex,
                pageSize: pageSize,
                observer: observer
            });
        });
    }

    onResourceRendered() {
        setTimeout(() => {
            if (this.showGroup) {
                this.updateFirstPersonInGroup();
                this.updateGroup();
            }

            // Check scrollbar
            this.paddingRight = this.getScrollbarWidth();


            this.safeApply();
        });
    }

    updateViewPortChanged(viewPortItems: any[]) {
        super.updateViewPortChanged(viewPortItems);

        this.safeApply();
    }


    onResize() {
        this.resourcePlanningService.raiseResize(this.$element.width());

        this.checkPadding();
    }

    refresh() {
        this.scrollViewPort.scrollToPosition(0);
        this.scrollViewPort.refresh();
        this.refreshList(true);
    }

    onUpdateEvent(data) {
        this.updateEvent.emit(data);
    }

    onMoveEvent(data) {
        this.moveEvent.emit(data);
    }

    onButtonActionClick(data) {
        this.buttonActionClick.emit(data);
    }

    onEventClicked(data) {
        this.eventClick.emit(data);
    }

    onEventDbClicked(data) {
        this.eventDblClick.emit(data);
    }

    onDayPlanningClicked(data) {
        this.dayPlanningClick.emit(data);
    }

    onDayPlanningDblClicked(data) {
        this.dayPlanningDblClick.emit(data);
    }

    onPrevButtonClicked(data) {
        this.prevButtonClick.emit(data);
    }

    onNextButtonClicked(data) {
        this.nextButtonClick.emit(data);
    }

    onResourceClicked(data) {
        this.resourceClick.emit(data);
    }

    onEventDragStarted(data) {
        this.eventDragStart.emit(data);
    }

    onEventDragStopped(data) {
        this.eventDragStop.emit(data);
    }

    updateResourcePlanning(resources: ICalendarResourcePlanning[], dates: string[]) {
        resources.forEach((resource) => {
            if (resource.Id) {
                let matched = this.items.find((r) => {
                    return r.Id === resource.Id;
                });
                if (matched) {
                    Object.assign(matched, resource);
                }
            }
        });
        this.resourcePlanningService.raiseResourceChange({
            resources: resources,
            dates: dates
        });
    }

    trackByFunction(index: number, item: ICalendarResourcePlanning) {
        return item.Id + '-' + this.viewMode + '-' + this.isCustomizeView;
    }

    onFetchDataFinished() {
        this.safeApply();
    }

    private updateView() {
        if (this.isCustomizeView) {
            this.itemHeight = this.options.customizeView.itemHeight;
            this.isSmallIcon = this.options.customizeView.isSmallIcon;
            this.NUMBER_ITEMS_PER_PAGE = this.options.customizeView.pageSize;
        } else {
            if (this.viewMode === ResourcePlanningViewMode.Week) {
                this.itemHeight = this.options.week.itemHeight;
                this.isSmallIcon = this.options.week.isSmallIcon;
                this.NUMBER_ITEMS_PER_PAGE = this.options.week.pageSize;
            }
            if (this.viewMode === ResourcePlanningViewMode.Month) {
                this.itemHeight = this.options.month.itemHeight;
                this.isSmallIcon = this.options.month.isSmallIcon;
                this.NUMBER_ITEMS_PER_PAGE = this.options.month.pageSize;
            }
        }
    }

    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    private updateFirstPersonInGroup() {
        let groupId,
            firstGroupId,
            resources: ICalendarResourcePlanning[] = this.scrollViewPort.items;
        if (resources.length > 0 && resources[0].Resource) {
            firstGroupId = resources[0].Resource.GroupId;
        }
        resources.forEach((resource: ICalendarResourcePlanning) => {
            if (!resource.Resource || !resource.Id) {
                return;
            }
            let gId = resource.Resource.GroupId;
            if (gId !== groupId && gId !== firstGroupId) {
                groupId = gId;
                resource.Resource.isFirstPersonInGroup = true;
            } else {
                resource.Resource.isFirstPersonInGroup = false;
            }
        });
    }

    private updateGroup() {
        this.currentGroup = this.getCurrentGroup();
    }

    private getCurrentGroup() {
        if (!this.scrollViewPort) {
            return null;
        }
        let resourcesEls = this.$element.find('.resource-item').get().reverse(),
            scrollerTop = this.$element.find('virtual-scroller').offset().top,
            resourceEl = resourcesEls.find((el) => {
                return $(el).offset().top <= scrollerTop;
            });
        if (resourceEl) {
            let $resourceEl = $(resourceEl);
            return {
                Id: $resourceEl.attr('group-id'),
                Name: $resourceEl.attr('group-name')
            };
        } else {
            return null;
        }
    }

    private checkPadding() {
        setTimeout(() => {
            this.paddingRight = this.getScrollbarWidth();
            this.safeApply();
        }, 100);
    }

    private getScrollbarWidth() {
        let container = this.$element;
        if (container.length > 0) {
            let content = container.find('.scrollable-content');
            return container.width() - content.width();
        } else {
            return 0;
        }
    }
}

