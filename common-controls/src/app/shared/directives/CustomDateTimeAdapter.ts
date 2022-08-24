import { NgxMatDateAdapter } from '@angular-material-components/datetime-picker';
import { Platform } from '@angular/cdk/platform';
import { Inject, Injectable, Optional } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment-es6';
import { HelperService } from '../../core/services/helper.service';

// TODO(mmalerba): Remove when we no longer support safari 9.
/** Whether the browser supports the Intl API. */
let SUPPORTS_INTL_API: boolean;

// We need a try/catch around the reference to `Intl`, because accessing it in some cases can
// cause IE to throw. These cases are tied to particular versions of Windows and can happen if
// the consumer is providing a polyfilled `Map`. See:
// https://github.com/Microsoft/ChakraCore/issues/3189
// https://github.com/angular/components/issues/15687
try {
  SUPPORTS_INTL_API = typeof Intl != 'undefined';
} catch {
  SUPPORTS_INTL_API = false;
}

/** The default month names to use if Intl API is not available. */
const DEFAULT_MONTH_NAMES = {
  'long': [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'
  ],
  'short': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  'narrow': ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
};


/** The default date names to use if Intl API is not available. */
const DEFAULT_DATE_NAMES = range(31, i => String(i + 1));


/** The default day of the week names to use if Intl API is not available. */
const DEFAULT_DAY_OF_WEEK_NAMES = {
  'long': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'narrow': ['S', 'M', 'T', 'W', 'T', 'F', 'S']
};


/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (https://tools.ietf.org/html/rfc3339). Note that the string may not actually be a valid date
 * because the regex will match strings an with out of bounds month, date, etc.
 */
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;


/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

@Injectable()
export class CustomDateAdapter extends NgxMatDateAdapter<Date>  {
  /** Whether to clamp the date between 1 and 9999 to avoid IE and Edge errors. */
  private readonly _clampDate: boolean;
  private _dateFormat?: string;
  private _yearPosition = 2; // index of YYYY token in date format

  private _lastDateParam?: string;

  /**
   * Whether to use `timeZone: 'utc'` with `Intl.DateTimeFormat` when formatting dates.
   * Without this `Intl.DateTimeFormat` sometimes chooses the wrong timeZone, which can throw off
   * the result. (e.g. in the en-US locale `new Date(1800, 7, 14).toLocaleDateString()`
   * will produce `'8/13/1800'`.
   *
   * TODO(mmalerba): drop this variable. It's not being used in the code right now. We're now
   * getting the string representation of a Date object from its utc representation. We're keeping
   * it here for sometime, just for precaution, in case we decide to revert some of these changes
   * though.
   */
  useUtcForDisplay: boolean = true;

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string, platform: Platform, private _helper: HelperService) {
    super();
    super.setLocale(matDateLocale);

    // IE does its own time zone correction, so we disable this on IE.
    this.useUtcForDisplay = !platform.TRIDENT;
    this._clampDate = platform.TRIDENT || platform.EDGE;
  }
  private getDateFormat(): { format: string, yearPosition: number} {
    let paramFormat = this._helper.AuthenticationService.getParameterValue<string>('DateFormat');

    if (!this._dateFormat || this._lastDateParam !== paramFormat) {
      this._lastDateParam = paramFormat;

      // console.log('paramFormat =', paramFormat);

      if (!paramFormat) { paramFormat = 'DD/MM/YYYY'; }

      if (paramFormat.indexOf('HH')) { paramFormat += ' HH:mm'; };

      this._dateFormat = this._helper.UtilityService.getMomentDatePattern(paramFormat);

      console.log('date format=', this._dateFormat);

      let tokens = this._dateFormat.split(/[. -/]/);

      // console.log('tokens =', tokens);

      this._yearPosition = tokens.indexOf('YYYY');
    }
    return { format: this._dateFormat, yearPosition: this._yearPosition };
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, { month: style, timeZone: 'utc' });
      return range(12, i =>
        this._stripDirectionalityCharacters(this._format(dtf, new Date(2017, i, 1))));
    }
    return DEFAULT_MONTH_NAMES[style];
  }

  getDateNames(): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, { day: 'numeric', timeZone: 'utc' });
      return range(31, i => this._stripDirectionalityCharacters(
        this._format(dtf, new Date(2017, 0, i + 1))));
    }
    return DEFAULT_DATE_NAMES;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, { weekday: style, timeZone: 'utc' });
      return range(7, i => this._stripDirectionalityCharacters(
        this._format(dtf, new Date(2017, 0, i + 1))));
    }
    return DEFAULT_DAY_OF_WEEK_NAMES[style];
  }

  getYearName(date: Date): string {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, { year: 'numeric', timeZone: 'utc' });
      return this._stripDirectionalityCharacters(this._format(dtf, date));
    }
    return String(this.getYear(date));
  }

  getFirstDayOfWeek(): number {
    // We can't tell using native JS Date what the first day of the week is, we default to Sunday.
    return 0;
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(this._createDateWithOverflow(
      this.getYear(date), this.getMonth(date) + 1, 0));
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  createDate(year: number, month: number, date: number): Date {
    // Check for invalid month and date (except upper bound on date which we have to check after
    // creating the Date).
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    let result = this._createDateWithOverflow(year, month, date);
    // Check that the date wasn't above the upper bound for the month, causing the month to overflow
    if (result.getMonth() != month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result;
  }

  today(): Date {
    return new Date();
  }

  parse(value: any): Date | null {
    // console.log('parseeeeeee', value);
    // // We have no way using the native JS Date to set the parse format or locale, so we ignore these
    // // parameters.
    // if (typeof value == 'number') {
    //   return new Date(value);
    // }
    // let result = value ? new Date(moment(value).format('DD/MM/YYYY HH:mm')) : null;
    // console.log('result', result);
    // return result;

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
      // console.log('year 1  =', m.year());

      // console.log('invalid at 1 =', m.invalidAt());

      return m.toDate();
    }
    return this.invalid();
  }

  format(date: Date, displayFormat: Object): string {
    let dateFormat = this.getDateFormat();
    date.setSeconds(0);
    return moment(date).format(dateFormat.format);
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = this._createDateWithOverflow(
      this.getYear(date), this.getMonth(date) + months, this.getDate(date));

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (this.getMonth(newDate) != ((this.getMonth(date) + months) % 12 + 12) % 12) {
      newDate = this._createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return this._createDateWithOverflow(
      this.getYear(date), this.getMonth(date), this.getDate(date) + days);
  }

  toIso8601(date: Date): string {
    return [
      date.getUTCFullYear(),
      this._2digit(date.getUTCMonth() + 1),
      this._2digit(date.getUTCDate())
    ].join('-');
  }

  /**
   * Returns the given value if given a valid Date or null. Deserializes valid ISO 8601 strings
   * (https://www.ietf.org/rfc/rfc3339.txt) into valid Dates and empty string into null. Returns an
   * invalid date for all other values.
   */
  deserialize(value: any): Date | null {
    if (typeof value === 'string') {
      if (!value) {
        return null;
      }
      // The `Date` constructor accepts formats other than ISO 8601, so we need to make sure the
      // string is the right format first.
      if (ISO_8601_REGEX.test(value)) {
        let date = new Date(value);
        if (this.isValid(date)) {
          return date;
        }
      }
    }
    return super.deserialize(value);
  }

  isDateInstance(obj: any) {
    return obj instanceof Date;
  }

  isValid(date: Date) {
    return !isNaN(date.getTime());
  }

  invalid(): Date {
    return new Date(NaN);
  }

  getHour(date: Date): number {
    return date.getHours();
  }
  getMinute(date: Date): number {
    return date.getMinutes();
  }
  getSecond(date: Date): number {
    return date.getSeconds()
  }

  setHour(date: Date, value: number): void {
    date.setHours(value);
  }
  setMinute(date: Date, value: number): void {
    date.setMinutes(value);
  }
  setSecond(date: Date, value: number): void {
    date.setSeconds(value);
  }

  /** Creates a date but allows the month and date to overflow. */
  private _createDateWithOverflow(year: number, month: number, date: number) {
    const result = new Date(year, month, date);

    // We need to correct for the fact that JS native Date treats years in range [0, 99] as
    // abbreviations for 19xx.
    if (year >= 0 && year < 100) {
      result.setFullYear(this.getYear(result) - 1900);
    }
    return result;
  }

  /**
   * Pads a number to make it two digits.
   * @param n The number to pad.
   * @returns The padded number.
   */
  private _2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  /**
   * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
   * other browsers do not. We remove them to make output consistent and because they interfere with
   * date parsing.
   * @param str The string to strip direction characters from.
   * @returns The stripped string.
   */
  private _stripDirectionalityCharacters(str: string) {
    return str.replace(/[\u200e\u200f]/g, '');
  }

  /**
   * When converting Date object to string, javascript built-in functions may return wrong
   * results because it applies its internal DST rules. The DST rules around the world change
   * very frequently, and the current valid rule is not always valid in previous years though.
   * We work around this problem building a new Date object which has its internal UTC
   * representation with the local date and time.
   * @param dtf Intl.DateTimeFormat object, containg the desired string format. It must have
   *    timeZone set to 'utc' to work fine.
   * @param date Date from which we want to get the string representation according to dtf
   * @returns A Date object with its UTC representation based on the passed in date info
   */
  private _format(dtf: Intl.DateTimeFormat, date: Date) {
    const d = new Date(Date.UTC(
      date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
      date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
    return dtf.format(d);
  }
}
