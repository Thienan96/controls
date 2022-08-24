import { Platform } from '@angular/cdk/platform';
import { Directive, Inject, Injectable } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material';
import { HelperService } from '../../core/services/helper.service';
import moment from 'moment-es6';
import { HsclDateAdapter } from './min-date.directive';

@Injectable()
export class OnlyDateAdapter extends HsclDateAdapter {
  constructor(_helper: HelperService, @Inject(MAT_DATE_LOCALE) locale: string, flatForm: Platform) {
    super(_helper, locale, flatForm);
  }

  createDate(year: number, month: number, date: number): Date {    
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    let result = new Date(Date.UTC(year, month, date));

    return result;
  }

  parse(value: any): Date | null {
    // console.log('---------parse date: ', value);
    // validate the length before parse by moment

    if (this._helper.UtilityService.isEmptyOrSpaces(value)) {
      return null;
    }

    let dateFormat = this.getDateFormat();

    let tokens = (<string>value).split(/[. -/]/);

    // console.log('dateFormat = ', dateFormat);

    // if thre is not any / inside -> validaate by max len === 8
    if (tokens.length === 1) {
      // if there is not any / but the string too long -> not OK
      if (value.length > 8) {
        return this.invalid();
      }
      // if there are 2 / but the year too long -> not OK
    } else if (tokens.length === 3) {
      if (tokens[dateFormat.yearPosition].length === 3 || tokens[dateFormat.yearPosition].length > 4) {
        return this.invalid();
      }
    }

    // Then parse by moment
    let m = moment.utc(value, dateFormat.format, false);   

    if (m.isValid()) {
      // NBSHD-3982
      if (m.year() < 1000 || m.year() > 9999) {
        // console.log('invalid year  =', m.year());
        return this.invalid();
      }
      // console.log('year 1  =', m.year());
      // console.log('invalid at 1 =', m.invalidAt());
      let d = m.startOf('day').toDate();
      // console.log('>>>>>> result = ', d.toUTCString());
      return d;
    }
    
    return this.invalid();
  }

  format(date: Date, displayFormat: any): string {    
    let dateFormat = this.getDateFormat();
    return moment(date).utc().format(dateFormat.format);
  }
}

/**
 * The directive just simple to allow customize the date picker so that it only 
 */
@Directive({
  selector: '[ntkOnlyDatePicker]',
  providers: [
    {provide: DateAdapter, useClass: OnlyDateAdapter}    
  ]
})
export class OnlyDatePickerDirective {

  constructor() { }
}
