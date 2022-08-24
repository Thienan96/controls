import { Directive, Input, AfterViewInit, Injectable, Inject, OnInit } from '@angular/core';
import { MatDatepicker, MatDatepickerInput, NativeDateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material';
import moment from 'moment-es6';
import { Platform } from '@angular/cdk/platform';
import { HelperService } from '../../core/services/helper.service';


@Directive({
  selector: 'input[matDatepicker][ntk-min-date]'
})
export class MinDateDirective implements OnInit {

  private _limitMin = new Date(1000, 0, 1);
  @Input('ntk-min-date') public minDate?: Date | string;

  constructor(private picker: MatDatepickerInput<Date>) {
    // console.log('found the picker: ', picker);
  }

  ngOnInit(): void {
    // console.log('MinDateDirective ngAfterViewInit this.picker.min=', this.picker.min);

    if (this.minDate && this.picker) {
      if (moment.isDate(this.minDate)) {
        this.picker.min = this.minDate;
      } else {
        let m = moment(<string>this.minDate, ['DD/MM/YYYY', 'YYYY/MM/DD', 'MM/DD/YYYY'], false);
        if (m.isValid()) {
          this.picker.min = m.toDate();
        }
      }
    }

    if (this.picker && (!this.picker.min || moment(this.picker.min).isBefore(this._limitMin))) {
      this.picker.min = this._limitMin;
    }
  }
}

@Injectable()
export class HsclDateAdapter extends NativeDateAdapter {
  private _dateFormat?: string;
  private _yearPosition = 2; // index of YYYY token in date format

  private _lastDateParam?: string;
  constructor(protected _helper: HelperService, @Inject(MAT_DATE_LOCALE) locale: string, flatForm: Platform) {
    super(locale, flatForm);
  }

  protected getDateFormat(): { format: string, yearPosition: number } {
    let paramFormat = this._helper.AuthenticationService.getParameterValue<string>('DateFormat');

    if (!this._dateFormat || this._lastDateParam !== paramFormat) {
      this._lastDateParam = paramFormat;

      // console.log('paramFormat =', paramFormat);

      if (!paramFormat) { paramFormat = 'DD/MM/YYYY'; }

      this._dateFormat = this._helper.UtilityService.getMomentDatePattern(paramFormat);

      // console.log('date format=', this._dateFormat);

      let tokens = this._dateFormat.split(/[. -/]/);

      // console.log('tokens =', tokens);

      this._yearPosition = tokens.indexOf('YYYY');
    }

    return { format: this._dateFormat, yearPosition: this._yearPosition };
  }

  createDate(year: number, month: number, date: number): Date {

    // console.log('----createDate with format = ', this.matDateFormat);
    
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    let result = new Date(year, month, date);

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
    let m = moment(value, dateFormat.format, false);

    if (m.isValid()) {
      // NBSHD-3982
      if (m.year() < 1000 || m.year() > 9999) {
        // console.log('invalid year  =', m.year());
        return this.invalid();
      }     
      return m.toDate();
    }
    console.log('invalidDate');
    return this.invalid();
  }

  format(date: Date, displayFormat: any): string {
    // console.log('format date: ', date, ' displayFormat=', displayFormat);
    let dateFormat = this.getDateFormat();
    if (displayFormat === 'onlyDate') {
      console.log('format date: ', date, ' displayFormat=', displayFormat);
      return moment(date).utc().format(dateFormat.format);
    } else if (displayFormat === 'input') {
      // TODO
      return moment(date).format(dateFormat.format);
    } else {
      return moment(date).format(dateFormat.format);
    }
  }

  // deserialize(date): Date | null {
  //   let dateFormat = this.getDateFormat();
  //   const stringDate = moment(date, dateFormat.format).format('YYYY-MM-DD');
  //   if (stringDate !== 'Invalid date') {
  //     console.log(new Date(stringDate + 'T00:00:00.000Z'));
  //     console.log(new Date().getTimezoneOffset()/60)
  //     return new Date(Date.UTC(0, 0, 0, 0, 0, 0));
  //   } else {
  //     return null;
  //   }
  // }
}

export const hsclDateFormats = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' }
  },
  display: {
    // dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
    dateInput: 'input',
    // monthYearLabel: { month: 'short', year: 'numeric', day: 'numeric' },
    monthYearLabel: 'inputMonth',
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  }
}
