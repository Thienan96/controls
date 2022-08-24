import moment from 'moment-es6';

export enum DateType {
    isYesterday,
    isToday,
    isTomorrow,
    isLastWeek,
    isThisWeek,
    isNextWeek,
    isThisQuarter,
    isLastMonth,
    isThisMonth,
    isNextMonth,
    isThisYear
}

export enum DateSelection {
    QuickDate,
    AbsoluteDate,
    RelativeDate
}

export class RelativeDateSelection {
    lastNext: string;
    periodNumber: number;
    period: string;
}

export class DateRange {
    from: moment.Moment;
    to: moment.Moment;
}
