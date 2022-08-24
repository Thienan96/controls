import {InjectionToken} from '@angular/core';

export interface IWeekTSEvent {
    Id: string;
    StartTime: string; // 08:30
    EndTime: string;   // 10:00

    [propName: string]: any;
}

export interface IWeekTSDayPlanning {
    Events: IWeekTSEvent[];
    BackgroundEvents: IWeekTSEvent[];

    [propName: string]: any;
}


export interface IWeekTSOptions {
    startTime: number; // 8
    endTime: number;  // 20
    overlapping: {
        topDistance: number // 5
    };
}

export interface IWeekTsPosition {
    left: number; // %
    width: number; // %
    top: number;
    bottom: number;
}

export interface IWeekTsHour {
    width?: number;
    label?: string;
    showHour?: boolean;
    left?: number;
    round?: boolean;
    duration?: number;
}

export const NTK_WEEK_TS = new InjectionToken('NTK_WEEK_TS');
export const NTK_WEEK_TS_DAY_PLANNING = new InjectionToken('NTK_WEEK_TS_DAY_PLANNING');


export interface WeekTsComponentInterface {
    options: IWeekTSOptions;
    isResizing: boolean;
    isDraggingToCreate: boolean;
    selected: IWeekTSEvent;

    setSelected(event: IWeekTSEvent);
}

export interface WeekTsDayPlanningComponentInterface {
    dayPlanning: IWeekTSDayPlanning;

    getEvent(event: IWeekTSEvent);
}
