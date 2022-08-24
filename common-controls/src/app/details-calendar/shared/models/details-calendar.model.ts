import {InjectionToken} from '@angular/core';
import {NtkDragDropItem} from '../../../drag-drop/drag-drop.model';

export interface IHour {
    hour: number;
    displayValue: string;
}


export interface IEvent extends NtkDragDropItem {
    Id: string;
    Start: string; // Start time 8:30
    End: string; // End time 9:30


    Title?: string; // Title to display
    TextColor?: string; // text-color of title
    BackgroundColor?: string; // background of event
    DisablesSelection?: boolean; // Check Allow select item

    // Format Column
    columnIndex?: number; // Index of column
    columnTotal?: number; // Count of column
    hasNeighbour?: boolean; // Has a other item at bottom of this item
    checked?: boolean;
    zIndex?: number;
    isSelected?: boolean;
}

export interface IDay {
    [propName: string]: any;
}

export interface IColumn {
    [propName: string]: any;
}


export interface IOptions {
    hourPerPixel?: number; // height a hour
    minHour?: number; // min-hour of event
    minHeight?: number; // min-height of event
    timeRange?: { // Start and End time
        startTime: number
        endTime: number
    };
    overlapping?: { // config overlapping for event
        leftDistance: number
        rightDistance: number
        minRightDistance: number
        minLeftDistance: number
        minWidth: number
    };
    delaySelection?: number; // Time show highlight when click on event
    allowInputTimeOutRange?: boolean; // default = true , Allow user move event outside timerange
}


export interface IPosition {
    left: number;
    right: number;
    top: number;
    height: number;
    zIndex: number;
    width: number;
}


export interface IResizeParam {
    newEvent: IEvent;
    oldEvent: IEvent;
    events: IEvent[];
}

export interface IResizeResult {
    event: IEvent;
    updateResizeType: UpdateType;
}


export const NTK_DETAILS_CALENDARDAY_COLUMN = new InjectionToken('NTK_DETAILS_CALENDARDAY_COLUMN');
export const NTK_DETAILS_CALENDARDAY = new InjectionToken('NTK_DETAILS_CALENDARDAY');


export enum UpdateType {
    UpdateColumn, // Control  update column which is container event is resize
    UpdateControl // Update control
}
