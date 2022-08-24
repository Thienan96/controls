import { Pipe, PipeTransform } from '@angular/core';
import * as moment_ from 'moment';
const moment = moment_;

@Pipe({
  name: 'weekNumber'
})
export class WeekNumberPipe implements PipeTransform {

  transform(value: string, toDate: Date, fromDate: Date): any {
    if (this.weeknumber(toDate) === this.weeknumber(fromDate)) {
      return `${value} ${this.weeknumber(toDate)}`;
    } else {
      return `${value} ${this.weeknumber(toDate)}, ${this.weeknumber(fromDate)}`;
    }
    return null;
  }

  weeknumber(date: Date): number {
    return moment(date, 'MM-DD-YYYY').isoWeek();
  }

}
