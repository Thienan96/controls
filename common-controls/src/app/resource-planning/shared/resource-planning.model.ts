import {ILazyItem} from "../../shared/models/common.info";

interface IEventResizable {
    $el: JQuery;
    offset: JQueryCoordinates;
    droppable: boolean;
}

export interface IResourcePlanningResizableData {
    events?: IEventResizable[];
    handle?: {
        offset: JQueryCoordinates
    };
}

export interface IResourcePlanningDroppableEventUIParam {
    draggable: JQuery;
    helper: JQuery;
    position: { top: number; left: number; };
    offset: { top: number; left: number; };
}

export interface IResourcePlanningDraggableEventUIParam {
    helper: JQuery;
    offset: { top: number; left: number; };
    originalPosition: { top: number; left: number; };
    position: { top: number; left: number; };
}

export interface IResourcePlanningAction {
    Id: number;
    ClassName: string;
    Name: string;
    IconName?: string;
}

export interface IResourcePlanningEvent {
    Id?: string | number;
    Color?: string;
    Duration?: number;
    Type?: string;
    Date?: string;
    ClassName?: string;
    Title: string;
    Tooltip?: string;
    ResourceId?: string;
    GroupId?: string;
    HasTooltipDetails?: boolean;
    canMoveOutside?: boolean;
    canMoveInside?: boolean;
    canResize?: boolean;
    actions?: IResourcePlanningAction[];
    subActions?: IResourcePlanningAction[];
    TaskId?: string;
}

export interface IResourcePlanningChanged {
    added: IResourcePlanningEvent[];
    updated: IResourcePlanningEvent[];
    deleted: IResourcePlanningEvent[];
}

export interface IResourcePlanningDayPlanning {
    Id?: string;
    Date?: string;
    Events?: IResourcePlanningEvent[];
    ClassName?: string;
    canDrop?: boolean;
    HeaderContent?: string;
    HeaderTooltip?: string;
    Content?: string;
    HasTooltipDetails?: boolean;
    Tooltip?: string;
}

export interface ICalendarResourcePlanning extends ILazyItem {
    Name: string;
    UniqueKey: string;
    Id: string;


    Resource: IResource;
    Availabilities?: IResourcePlanningDayPlanning[];
    BgColor?: string;
    ShowNextNavigate?: boolean;
    ShowPreNavigate?: boolean;
    ClassName?: string;
    Right?: string;
}

export interface IResource {
    Id: string;
    Name: string;
    LogoUrl: string;
    resourceIconClass?: string;
    resourceIconTooltip?: string;
    isFirstPersonInGroup?: boolean;
    GroupId?: string;
    GroupName?: string;
}

export enum ResourcePlanningViewMode {
    Week = 'week',
    Month = 'month'
}

export interface IResourcePlanningHeaderColumn {
    date: string;
    width: number;
    left?: number;
    shortDay?: string;
    fullDay?: string;
    dayOfMonth?: string;
    isToday?: boolean;
    isWeekend?: boolean;
}

export class ResourcePlanningConfig {
    eventParentIdProperty = 'TaskId';
    tooltip = {
        eventProperty: 'Tooltip',
        showDelay: 1000,
        hideDelay: 500,
        container: 'ntk-resource-planning virtual-scroller',
        direction: 'bottom',
        scroller: 'ntk-resource-planning virtual-scroller'
    };
    week = {
        pageSize: 10,
        itemHeight: 144,
        isSmallIcon: false
    };
    month = {
        pageSize: 20,
        itemHeight: 44,
        isSmallIcon: true
    };
    customizeView = {
        pageSize: 15,
        itemHeight: 60,
        isSmallIcon: true
    }
    eventIndexProperty = 'Index';
    delaySelection = 500;
    minHeight = 33.75;
    overlappingDistance = 20;
    eventDraggingHeight = 100;
    isShowNextNavigate = true;
    isShowPreNavigate = true;
    hourPerPixel = 15;
    minHour = 0.25; // 15m
    maxHour = 8; // 8h
    disableSelected = false;
    resizing = false;
    isShowRightColumnOfResource = false;
    headerOnRight = '';

    constructor(properties?) {
        if (properties) {
            Object.assign(this, properties);
        }
    }
}

export enum ResourcePlanningTemplate {
    EventHelperTemplate = 'EventHelperTemplate',
    EventHoverTemplate = 'EventHoverTemplate'
}

export interface IResourcePlanningColumn {
    availability: IResourcePlanningDayPlanning;
    left: number;
    width: number;
    id: number;
}
