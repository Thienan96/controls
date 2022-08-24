import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-es6';
import {AuthenticationService} from '../../core/services/authentication.service';
import { TranslationService } from '../../core/services/translation.service';
import { AppConfig } from '../../core/app.config';
import { extend } from 'jquery';

class DateTimeBase {
     
    private lastDateFormat: string = null;
    private lastMomentFormat: string = null;
    private lastLocale: string = null;

    constructor(protected authenticationService: AuthenticationService,
                protected translationService: TranslationService,
                protected appConfig: AppConfig) {        
        this.translationService.onLanguageChange().subscribe(x => {
            delete this.lastLocale;
        });
    }
    getMomentDatePattern(angularDatePattern: string): string {
        let returnPattern: string = angularDatePattern;

        // remove non support tokens
        // NBSHD-4572: format MMMM|MMM is using in the ticket portal
        // let nonSupportTokensReg: RegExp = /MMMM|MMMLLLL|EEEE|EEE|a|Z|ww|w|GGGG|GGG|GG|G/;
        let nonSupportTokensReg: RegExp = /LLLL|EEEE|EEE|a|Z|ww|w|GGGG|GGG|GG|G/;
        if (returnPattern) { returnPattern = angularDatePattern.replace(nonSupportTokensReg, ''); }

        if (returnPattern) { returnPattern = returnPattern.replace(/yyyy/, 'YYYY'); }
        if (returnPattern) { returnPattern = returnPattern.replace(/yy/, 'YY'); }
        if (returnPattern) { returnPattern = returnPattern.replace(/y/, 'Y'); }
        // M, MM <=> M, MM => don't need to replace
        if (returnPattern) { returnPattern = returnPattern.replace(/dd/, 'DD'); }
        if (returnPattern) { returnPattern = returnPattern.replace(/d/, 'D'); }
        // m, mm <=> m, mm => don't need to replace
        // H, HH <=> H, HH => don't need to replace
        // h, hh <=> h, hh => don't need to replace
        // s, ss, sss <=> s, ss, sss => don't need to replace

        return returnPattern;
    }

    protected getCurrentDateFormat() {
        let dateFormat = this.appConfig.DATE_FORMAT || this.authenticationService.dateFormat;
        if (dateFormat === this.lastDateFormat && this.lastMomentFormat) {  return this.lastMomentFormat; }
        this.lastDateFormat = dateFormat;
        this.lastMomentFormat = this.getMomentDatePattern(dateFormat || 'DD/MM/YYYY');
        return this.lastMomentFormat;
    }

    protected getCurrentLocale() {
        if (this.lastLocale) { return this.lastLocale; }

        this.lastLocale = this.translationService.getLocale() || this.translationService.getDefaultLocal();
        return this.lastLocale;
    }
}

@Pipe({ name: 'formatDate' })
export class FormatDatePipe extends DateTimeBase implements PipeTransform {
    constructor(authenticationService: AuthenticationService, translationService: TranslationService, appConfig: AppConfig) {
        super(authenticationService, translationService, appConfig);
    }
    transform(value: Date, params?: any): string {
        if (value) {
            let m = moment.utc(value);

            if(m.isValid()) {
                const dateFormat = this.getCurrentDateFormat();
                if(m.hour() > 0) {                    
                    return m.locale(this.getCurrentLocale()).local().format(dateFormat);    
                } else {                    
                    return m.locale(this.getCurrentLocale()).utc().format(dateFormat);
                }
            } else {
                return '<INVALID DATE>';
            }           
        }
        return '';
    }
}

@Pipe({ name: 'formatDateTime' })
export class DateTimePipe extends DateTimeBase implements PipeTransform {
    constructor(authenticationService: AuthenticationService, translationService: TranslationService, appConfig: AppConfig) {
        super(authenticationService, translationService, appConfig);
    }
    transform(value: Date, params: any): string {
        if (value) {
            let m = moment(value);

            if (m.isValid()) {
                const dateFormat = this.getCurrentDateFormat();
                return m.locale(this.getCurrentLocale()).local().format(dateFormat + ' HH:mm');
            } else {
                return '<INVALID DATE>';
            }
        }
        return '';
    }
}

@Pipe({ name: 'formatTimeOnly' })
export class TimeOnlyPipe implements PipeTransform {
    transform(value: Date, params: any): string {
        if (value) {
            let m = moment(value);
            let result = m.local().format('HH:mm');
            return result;
        }
        return '';
    }
}


@Pipe({ name: 'formatTime' })
export class TimePipe implements PipeTransform {
    transform(value: string): string {
        if (value) {
            let hourAndMinuteNumber: number = Number(value);
            if (!hourAndMinuteNumber) return '00:00';

            let hour: number = Math.floor(hourAndMinuteNumber);
            let minute: number = Math.round((hourAndMinuteNumber - hour) * 60);

            return ('0' + hour).substring(('0' + hour).length - 2) + ':' + ('0' + minute).substring(('0' + minute).length - 2)
        }
        return '';
    }
}


@Pipe({name: 'friendlyDate'})
export class FriendlyDatePipe implements PipeTransform {
    transform(inputValue: Date): string {
        if (inputValue) {
            let dff = moment().diff(moment(inputValue), 'minute');
            if (dff > 0 && dff < 60)
                return moment(inputValue).startOf('minutes').fromNow();
            else
                return moment(inputValue).utc().calendar(undefined, {
                    lastDay: '[Yesterday]',
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    lastWeek: '[last] dddd',
                    nextWeek: 'dddd',
                    sameElse: 'L'
                });
        }
        return '';
    }
}


@Pipe({name: 'formatTimesOfDayBoundaries'})
export class TimesOfDayBoundariesPipe implements PipeTransform {
    transform(timesOfDayBoundaries: string): string {
        let result: string = "";
        if (timesOfDayBoundaries) {
            let tokens = timesOfDayBoundaries.split(",");
            for (let i = 0; i < tokens.length; i++) {
                result += tokens[i];
                if (i < tokens.length - 1) {
                    if (i % 2 === 0) {
                        result += " - ";
                    }
                    else {
                        result += ", ";
                    }
                }
            }
        }
        return result;
    }
}

