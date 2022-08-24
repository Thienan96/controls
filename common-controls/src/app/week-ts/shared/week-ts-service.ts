import {Injectable} from '@angular/core';
import {IWeekTSEvent, IWeekTsHour, IWeekTSOptions, IWeekTsPosition} from './week-ts.model';
import moment from 'moment-es6';
import {UtilityService} from '../../core/services/utility.service';

@Injectable({
    providedIn: 'root'
})
export class WeekTsService {

    constructor(private utilityService: UtilityService) {
    }

    /**
     * Get position of event
     * @param {IWeekTSEvent} event
     * @param options
     * @param column
     * @returns object
     */
    getPosition(event: IWeekTSEvent, options: IWeekTSOptions, column = 0): IWeekTsPosition {
        let strStartTime: string = event.StartTime,
            strEndTime: string = event.EndTime,
            st: number = options.startTime,
            et: number = options.endTime,
            startTime: number = this.utilityService.getHourFromString(strStartTime),
            endTime: number = this.utilityService.getHourFromString(strEndTime),
            left: number = ((startTime - st) / (et - st)) * 100,
            width: number = ((endTime - startTime) / (et - st)) * 100,
            top: number = column * options.overlapping.topDistance,
            bottom = 0;


        if (left < 0 && left + width > 0) {
            width = width + left;
            left = 0;
        }
        if (left + width > 100) {
            width = 100 - left;
        }
        return {
            left: left,
            width: width,
            top: top,
            bottom: bottom
        };
    }


    /**
     * Get hours object from startTime,endTime
     * @param startTime
     * @param endTime
     */
    getHours(startTime: number, endTime: number, hideQuaters = false): IWeekTsHour[] {
        let times: IWeekTsHour[] = [];
        for (let i = startTime; i <= endTime; i = i + (hideQuaters ? 1 : 0.25)) {
            if (Math.floor(i) === Math.ceil(i)) {
                times.push({
                    label: i + ``,
                    round: true,
                    showHour: true,
                    left: ((i - startTime) / (endTime - startTime)) * 100,
                    duration: i
                });
            } else {
                times.push({
                    label: '',
                    showHour: false,
                    left: ((i - startTime) / (endTime - startTime)) * 100,
                    duration: i
                });
            }
        }
        times.forEach((item) => {
            item.width = 100 / (times.length - 1);
        });
        return times;
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


}
