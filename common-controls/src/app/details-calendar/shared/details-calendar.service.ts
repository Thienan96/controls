import {Injectable} from '@angular/core';
import moment from 'moment-es6';
import {IEvent, IOptions, IPosition} from './models/details-calendar.model';
import * as _ from 'underscore';

@Injectable({
    providedIn: 'root'
})
export class DetailsCalendarService {
    controls = {};


    /**
     * Convert hour from string to number , 20:30 --> 20.5
     * @param hour
     */
    hourToNumber(hour: string): number {
        if (!hour) {
            return 0;
        }
        let res = hour.split(':');
        // tslint:disable-next-line:radix
        return parseInt(res[0]) + (parseInt(res[1]) / 60);
    }


    /**
     * Convert hour from number to string with format is separation (20.5 --> 20:30)
     * @param hour
     * @param separation
     */
    hourToString(hour: number, separation = ':'): string {
        let duration = moment.duration(hour, 'hours'),
            h: any = duration.days() * 24 + duration.hours(),
            m: any = duration.minutes();
        if (h < 10) {
            h = '0' + h;
        }
        if (m < 10) {
            m = '0' + m;
        }
        return h + separation + m;
    }


    /**
     * Get spacing for each day when display
     * @param daysLength
     * @param isSplit
     * @param index
     */
    getDaySpacing(daysLength: number, isSplit: boolean, index: number): number {
        let left = 8;
        if (isSplit && index === (daysLength / 2) - 1) {
            left = 16;
        }
        return left;
    }

    /**
     * Make hour round , 1.31 to 1.30
     * @param hour
     */
    roundHour(hour: number): number {
        let duration = moment.duration(hour, 'hours'),
            date = moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate();
        let timeToReturn = new Date(date);
        timeToReturn.setMilliseconds(Math.round(date.getMilliseconds() / 1000) * 1000);
        timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
        timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
        return timeToReturn.getHours() + timeToReturn.getMinutes() / 60;
    }


    /**
     * Update Start,End of event from position
     * @param event
     * @param position
     * @param options
     */
    updateEventFromPosition(event: IEvent, position: { left: number; top: number }, options: IOptions) {
        let timeRange = this.getRangeTimeFromPosition(event, position, options);
        event.Start = this.hourToString(timeRange.start);
        event.End = this.hourToString(timeRange.end);
    }

    /**
     * Get Start, End from position
     * @param event
     * @param position
     * @param options
     */
    getRangeTimeFromPosition(event: IEvent, position: { left: number; top: number }, options: IOptions): { start: number, end: number } {
        let duration = this.hourToNumber(event.End) - this.hourToNumber(event.Start),
            startHour = this.roundHour((position.top / options.hourPerPixel) + options.timeRange.startTime);
        return {
            start: startHour,
            end: startHour + duration
        };
    }


    /**
     * Set event to list
     * @param events
     * @param newEvent
     */
    setEvent(events: IEvent[], newEvent: IEvent) {
        let matchIndex = events.findIndex((event) => {
            return event.Id === newEvent.Id;
        });
        if (matchIndex >= 0) {
            events[matchIndex] = newEvent;
        }
    }

    /**
     * Get position of event to display
     * @param event
     * @param options
     * @param columnContainer
     */
    getEventPosition(event: IEvent, options: IOptions, columnContainer: HTMLElement): IPosition {
        let startTime = this.hourToNumber(event.Start),
            duration = this.getDuration(event),
            left = event.columnIndex * options.overlapping.leftDistance,
            right = (event.columnTotal - event.columnIndex - 1) * options.overlapping.rightDistance,
            top = options.hourPerPixel * (startTime - options.timeRange.startTime),
            width = 100 / (event.columnTotal),
            height = options.hourPerPixel * duration;

        // Height must more than minHeight
        if (height < options.minHeight) {
            height = options.minHeight;
        }
        // Decrease 5px if have a item at below of this item
        if (event.hasNeighbour) {
            height = height - 5;
        }

        // Overlap right
        if (event.columnTotal >= 2) {
            if ($(columnContainer).width() - (event.columnTotal - 1) * options.overlapping.leftDistance < options.overlapping.minWidth) {
                left = event.columnIndex * options.overlapping.minLeftDistance;
                right = (event.columnTotal - event.columnIndex - 1) * options.overlapping.minRightDistance;
            }
        }

        return {
            left: left,
            right: right,
            top: top,
            height: height,
            width: width,
            zIndex: event.zIndex
        };
    }

    /**
     * Get duration of event
     * @param event
     */
    getDuration(event: IEvent): number {
        let startTime = this.hourToNumber(event.Start),
            endTime = this.hourToNumber(event.End),
            duration = endTime - startTime;
        return duration || 0;
    }


    /**
     * Calc column, columnTotal to display events
     * @param events
     * @param options
     */
    formatEvents(events: IEvent[], options: IOptions) {
        if (!events) {
            return;
        }
        // reset column,relatives
        events.forEach((event) => {
            event.columnIndex = 0;
            event.columnTotal = 1;
            event.hasNeighbour = false;
            event.checked = false;
            event.zIndex = 0;
            event.checked = false;
        });

        // format column
        this.sortEvents(events).forEach((event, index) => {
            if (event.checked) {
                return;
            }
            let relatives = this.getRelativeItems(event, events, options);
            relatives.forEach((item) => {
                item.checked = true;
            });
            this.formatColumn(relatives, options);

            // Check neighbour
            let start = this.hourToNumber(event.Start),
                end = this.hourToNumber(event.End),
                minHour = options.minHeight / options.hourPerPixel,
                hourDistance = 5 / options.hourPerPixel;
            for (let i = 0; i < index; i++) {
                let item = events[i],
                    itemEnd = this.hourToNumber(item.End);
                if ((end - start > minHour + hourDistance) && start - itemEnd < hourDistance) {
                    item.hasNeighbour = true;
                }
            }
        });
    }


    private formatColumn(events: IEvent[], options: IOptions) {
        if (events.length === 0) {
            return;
        }
        let columns: IEvent[][] = [];


        // Push first item to first column
        events.forEach((event, index) => {
            if (index === 0) {
                event.columnIndex = 0;
                columns.push([event]);
            } else {
                let columnIndex = this.getColumnIndex(event, columns, options);
                if (columnIndex !== -1) {
                    event.columnIndex = columnIndex;
                    columns[columnIndex].push(event);
                } else {
                    columns.push([event]);
                    event.columnIndex = columns.length - 1;
                }
            }
        });

        events.forEach((item) => {
            item.columnTotal = columns.length;
            item.zIndex = item.columnIndex + 1;
        });
    }

    /**
     * Get index of column for event
     * @param event
     * @param columns
     * @param options
     * @private
     */
    private getColumnIndex(event: IEvent, columns: IEvent[][], options: IOptions): number {
        let minHour = options.minHeight / options.hourPerPixel,
            evStart = this.hourToNumber(event.Start);
        return columns.findIndex((column) => {
            let lastItemOfColumn = column[column.length - 1],
                itemStart = this.hourToNumber(lastItemOfColumn.Start),
                itemEnd = this.hourToNumber(lastItemOfColumn.End);
            // @ts-ignore
            return (event.Start >= itemEnd) && (evStart - itemStart >= minHour);
        });
    }

    /**
     * Sort event by Start
     * @param events
     * @private
     */
    private sortEvents(events: IEvent[]) {
        return _.sortBy(events, (event) => {
            return this.hourToNumber(event.Start);
        });
    }

    /**
     * Get events has relation with item
     * @param event
     * @param events
     * @param options
     * @private
     */
    private getRelativeItems(event: IEvent, events: IEvent[], options: IOptions): IEvent[] {
        let min = this.hourToNumber(event.Start),
            max = this.hourToNumber(event.End),
            minHour = options.minHeight / options.hourPerPixel;
        if (max < min + minHour) {
            max = min + minHour;
        }
        for (let item of events) {
            let start = this.hourToNumber(item.Start),
                end = this.hourToNumber(item.End);
            if (min <= start && start < max && end > max) {
                max = end;
            }
        }
        return this.findEventsRange(events, min, max);
    }

    /**
     * Find events from range
     * @param events
     * @param min
     * @param max
     * @private
     */
    private findEventsRange(events: IEvent[], min: number, max: number): IEvent[] {
        let filtered = events.filter((item) => {
            let start = this.hourToNumber(item.Start);
            return min <= start && start < max;
        });
        return this.sortEvents(filtered);
    }

    /**
     * Trigger mouseup
     */
    triggerMouseUp() {
        let ev;
        if (typeof (Event) === 'function') {
            ev = new Event('mouseup');
        } else {
            ev = document.createEvent('Event');
            ev.initEvent('mouseup', true, true);
        }
        document.dispatchEvent(ev);
    }
}
