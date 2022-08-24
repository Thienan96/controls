import {Injectable, Injector} from '@angular/core';
import {LanguageModel, SelectableItem} from '../../shared/models/common.info';
import {AppConfig} from '../app.config';
import {Observable, Subject} from 'rxjs';
import {Comunication} from './ajs-upgraded-providers';
import {DOCUMENT} from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import {CommunicationService} from './communication.service';
import * as moment_ from 'moment';

const moment = moment_;

// Used this lib to solve the floating point of Javascript
import Decimal from 'decimal.js-light';

@Injectable({
    providedIn: 'root'
})
export class UtilityService {
    private _isOpera: boolean;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    private _isFirefox: boolean
    private _isSafari: boolean;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    private _isChrome: boolean;              // Chrome 1+
    private _isIE: boolean; // At least IE6

    private _onAPISucess = new Subject<any>();
    private _communicationService: CommunicationService;

    constructor(private _injector: Injector,
                private appConfig: AppConfig,
                private breakpointObserver: BreakpointObserver) {
        //http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
        this._isOpera = !!(<any>window).opera || window.navigator.userAgent.indexOf(' OPR/') >= 0;
        // @ts-ignore
        this._isSafari = /constructor/i.test(window['HTMLElement']) || (function (p) { return p.toString() === '[object SafariRemoteNotification]'; })(!window['safari'] || window['safari'].pushNotification);
        this._isChrome = !!(<any>window).chrome && !this._isOpera;              // Chrome 1+
        this._isIE = (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) ? true : false;
        this._isFirefox = window.navigator.userAgent.indexOf("Firefox") > 0   // Firefox 1.0+
    }

    get communicationService(): CommunicationService {
        if (!this._communicationService) {
            this._communicationService = this._injector.get(CommunicationService);
        }

        return this._communicationService;
    }

    get isIE(): boolean { return this._isIE; }
    get isFirefox(): boolean { return this._isFirefox; }
    get isSafari(): boolean { return this._isSafari; }
    get isChrome(): boolean { return this._isChrome; }
    get isOpera(): boolean { return this._isOpera; }

    get isWindowOS(): boolean { return navigator.appVersion.indexOf("Win") != -1; }
    get isMacOS(): boolean { return navigator.appVersion.indexOf("Mac") != -1; }
    get isiOS(): boolean {
        let isMobile: boolean = (/iphone|ipad|ipod/).test(navigator.userAgent.toLowerCase());
        return isMobile;
    }

    get isAndroid(): boolean {
        let isMobile: boolean = (/android/).test(navigator.userAgent.toLowerCase());
        return isMobile;
    }

    get isWindowPhone(): boolean {
        let isMobile: boolean = (/windows phone/).test(navigator.userAgent.toLowerCase());
        return isMobile;
    }

    get isDevice(): boolean {
        let isDevice: boolean = (/android|webos|iphone|ipad|ipod|blackberry|windows phone/).test(navigator.userAgent.toLowerCase());
        return isDevice;
    }

    get isMobile(): boolean {
        let isMobile: boolean = (/android|iphone|blackberry|windows phone/).test(navigator.userAgent.toLowerCase());
        return isMobile;
    }

    get isSmallScreen(): boolean {
        return this.breakpointObserver.isMatched('(max-width: 599px)');
    }

    get comService(): any {
        let communicationServiceAngularJS = this.communicationService.getCommunicationServiceAngularJS();
        if (!communicationServiceAngularJS) {
            communicationServiceAngularJS = new Comunication();
        }
        return communicationServiceAngularJS;
    }

    screenResizeToSmall(): Observable<boolean> {
        return this.breakpointObserver.observe(['(max-width: 599px)']).pipe(map(obs => obs.matches));
    }
    formatText(text: string, ...tokens: any[]) {
        return text.replace(/{(\d+)}/g, function (match, number) {
            return typeof (tokens[number] !== undefined && tokens[number] !== null) ? tokens[number] : match;
        });
    }

    getRootUrl(): string {
        let href: string = location.href;

        if (href.indexOf('#') > -1)
            href = href.substr(0, href.indexOf('#'));

        if (href.indexOf('index.html') > -1)
            href = href.substr(0, href.indexOf('index.html'));

        return href;
    }

    addSlashIfNotExists(source: string): string {
        if (!source) {
            return '/';
        }

        if (source.substr(source.length - 1) !== '/') {
            return source + '/';
        }

        return source;
    }

    adaptNoCacheSuffix(sourceUrl: string): string {
        if (!sourceUrl) return sourceUrl;

        let versionSuffix: string = this.getUniversalTicks();
        let separator = sourceUrl.indexOf('?') === -1 ? '?' : '&';

        /*if (location.hostname === "helpsites.netika.com" || location.hostname === "checklists.netika.com") {
            versionSuffix = this.AppConfig.APPLICATION_VERSION;
        }*/

        return sourceUrl + separator + 'v=' + versionSuffix;
    }

    createGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * https://stackoverflow.com/questions/105034/how-to-create-guid-uuid
     */
    createUUID() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    
        // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        //   var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        //   return v.toString(16);
        // });
    
      }
    

    //http://stackoverflow.com/questions/1043339/javascript-for-detecting-browser-language-preference
    getFirstBrowserLanguage(): any {
        var nav: any = window.navigator,
            browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
            i,
            language;

        // support for HTML 5.1 "navigator.languages"
        if (Array.isArray(nav.languages)) {
            for (i = 0; i < nav.languages.length; i++) {
                language = nav.languages[i];
                if (language && language.length) {
                    return language;
                }
            }
        }

        // support for other well known properties in browsers
        for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = nav[browserLanguagePropertyKeys[i]];
            if (language && language.length) {
                return language;
            }
        }

        return null;
    }


    convertLanguageCodeToPossibleSupportLanguageCode3(languageCode: string): string {
        let result: string = 'eng';

        if (languageCode && languageCode.length >= 2) {
            if (languageCode.substr(0, 2).toLowerCase() === 'fr') {
                result = 'fra';
            }
            else if (languageCode.substr(0, 2).toLowerCase() === 'nl') {
                result = 'nld';
            }
            else if (languageCode.substr(0, 2).toLowerCase() === 'de') {
                result = 'deu';
            }
            else if (languageCode.substr(0, 2).toLowerCase() === 'vi') {
                result = 'vie';
            } else if (languageCode.toLowerCase() === 'zh-cn') {
                result = 'zhs';
            } else if (languageCode.toLowerCase() === 'zh-tw') {
                result = 'zht';
            } else if (languageCode.substr(0, 2).toLowerCase() === 'zh') {
                if (languageCode.length >= 3) {
                    result = languageCode.substr(0, 3).toLowerCase();
                }
                else {
                    result = 'zht';
                }
            }
        }

        return result;
    }


    convertLanguageCodeToPossibleSupportLanguageCode2(languageCode: string): string {
        let result: string;
        if (!!languageCode && languageCode.toLowerCase() === 'fra') {
            result = 'fr';
        } else if (!!languageCode && languageCode.toLowerCase() === 'nld') {
            result = 'nl';
        } else if (!!languageCode && languageCode.toLowerCase() === 'deu') {
            result = 'de';
        }
         else if (!!languageCode && languageCode.toLowerCase() === 'vie') {
            result = 'vi';
        } else if (!!languageCode && languageCode.toLowerCase() === 'zhs') {
            result = 'zh-CN';
        } else if (!!languageCode && languageCode.toLowerCase() === 'zht') {
            result = 'zh-TW';
        } else {
            result = 'en';
        }

        return result;
    }

    getLanguages(){
        return <LanguageModel[]>  [{
            Code3:'ENG',
            Code2:"en",
            DisplayValue:'Language_eng',
            TranslationKey:'lbLanguageEngByEng',
            FileName:'en.json',
            Local:'en-us',
            Name: 'English'
        },{
            Code3:'FRA',
            Code2:'fr',
            DisplayValue:'Language_fra',
            TranslationKey:'lbLanguageFraByFra',
            FileName:'fr.json',
            Local: 'fr-fr',
            Name: 'French'
        },{
            Code3:'NLD',
            Code2:'nl',
            DisplayValue:'Language_nld',
            TranslationKey:'lbLanguageNldByNld',
            FileName:'nl.json',
            Local: 'nl-nl',
            Name: 'Dutch'
        },{
            Code3:'DEU',
            Code2:'de',
            DisplayValue:'Language_deu',
            TranslationKey:'lbLanguageDeuByDeu',
            FileName:'de.json',
            Local: 'de-de',
            Name: 'German'
        },{
            Code3:'VIE',
            Code2:'vi',
            DisplayValue:'Language_vie',
            TranslationKey:'lbLanguageVieByVie',
            FileName:'vi.json',
            Local: 'vi',
            Name: 'Vietnamese'
        },{
            Code3:'ZHS',
            Code2:'zh-cn',
            DisplayValue:'Language_zhs',
            TranslationKey:'lbLanguageZhsByZhs',
            FileName:'zh-CN.json',
            Local: 'zh-cn',
            Name: 'Simplified Chinese'
        },{
            Code3:'ZHT',
            Code2:'zh-tw',
            DisplayValue:'Language_zht',
            TranslationKey:'lbLanguageZhtByZht',
            FileName:'zh-TW.json',
            Local: 'zh-tw',
            Name: 'Traditional Chinese'
        }];
    }
    /**
     * Get available languages which the app is support
     */
    getSupportedLanguages(): Array<SelectableItem> {
        return this.getLanguages().map((language)=>{
            return  new SelectableItem(language.Code3,language.DisplayValue,language.TranslationKey);
        });
    }

    rgbStringToHex(rgbValue: string): string {
        var startIndex: number = rgbValue.lastIndexOf('(');
        var endIndex: number = rgbValue.lastIndexOf(')');
        var rgb: string[] = rgbValue.substr(startIndex + 1, (endIndex - startIndex) - 1).split(',');

        return this.rgbToHex(parseInt(rgb[0].trim()), parseInt(rgb[1].trim()), parseInt(rgb[2].trim()));
    }

    rgbToHex(R: any, G: any, B: any): string { return this.toHex(R) + this.toHex(G) + this.toHex(B) }

    toHex(n: any): string {
        n = parseInt(n, 10);
        if (isNaN(n)) return "00";
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
    }

    repaceInvalidFileCharacters(fileName: string): string {
        if (!fileName)
            return fileName;

        return fileName.replace(/[|&;$%@"<>()+,]/g, "_");
    }

    //http://stackoverflow.com/questions/14462612/escape-html-text-in-an-angularjs-directive
    encodeHTML(str: string): string {
        return String(str).replace(/[&<>"'\/]/g, function (s) {
            var entityMap: any = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': '&quot;',
                "'": '&#39;',
                "/": '&#x2F;'
            };
            return entityMap[s];
        });
    }

    getEmailRegularExpression(): any {
        //http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    }

    //https://forums.asp.net/t/1840098.aspx?Regex+to+allow+specific+special+characters+in+javascript
    checkContainAccentedCharacters(text: string): boolean {
        var accentChars = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'.split('');

        if (!text) return false;
        let bVal: boolean = false;
        text.split('').forEach(function (el, idx) {
            if (accentChars.indexOf(el) > 0)
                bVal = true;
        });

        return bVal;;
    }


    getUniversalTicks(date?: Date): any {
        if (!date)
            date = new Date();

        //The JavaScript Date type's origin is the Unix epoch: midnight on 1 January 1970.
        //The.NET DateTime type's origin is midnight on 1 January 0001.
        //You can translate a JavaScript Date object to .NET ticks as follows:

        // the number of .net ticks at the unix epoch
        let epochTicks = 621355968000000000;

        // there are 10000 .net ticks per millisecond
        let ticksPerMillisecond = 10000;

        // calculate the total number of .net ticks for your date
        let ticks = epochTicks + (date.getTime() * ticksPerMillisecond);

        return ticks;
    }

    isDecimal(strValue: string, excludeToCheckNegative?: boolean): boolean {
        //http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
        //http://lawrence.ecorp.net/inet/samples/regexp-validate2.php
        if (strValue) {
            let pattern = /^[-+]?\d{1,12}(\.\d{1,2})?$/;

            if (!!excludeToCheckNegative)
                pattern = /^\d{1,12}(\.\d{1,2})?$/;

            return pattern.test(strValue);
        }

        return false;
    }

    isInteger(strValue: string, excludeToCheckNegative?: boolean): boolean {
        if (strValue) {
            let pattern = /^\s*(\+|-)?\d+\s*$/;

            if (!!excludeToCheckNegative)
                pattern = /^[0 - 9]*$/;

            return pattern.test(strValue);
        }

        return false;
    }

    isNumber(value: any) {
        return typeof value === 'number' && isFinite(value);
    }

    isString(value: any) {
        return typeof value === 'string' || value instanceof String;
    }

    isFunction(value: any) {
        return typeof value === 'function';
    }

    isBoolean(value: any) {
        return typeof value === 'boolean';
    }

    isRegExp(value: any) {
        return value && typeof value === 'object' && value.constructor === RegExp;
    }

    isError(value: any) {
        return value instanceof Error && typeof value.message !== 'undefined';
    }

    isDate(value: any) {
        return value instanceof Date;
    }

    isSymbol(value: any) {
        return typeof value === 'symbol';
    }

    isGUId(value) {
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    }

    checkEntityChanged(before?: any, after?: any) : boolean {
        if ((!before && after) || (before && !after) || (before && after && before.Id !== after.Id)) return true;
        return false;
    }

    // Value input is number not formated
    // Result is format the value to display
    transform(value: number | string, groupSep: string, decimalSep: string, decCharsNumber: number
            , removeUnnecessaryZeros?: boolean, minDecimalCharsNumber?: number): string {

        let localeDecimalSep: string = '.';
        
        if (decCharsNumber && !this.isNumber(decCharsNumber)) decCharsNumber = parseInt('' + decCharsNumber);
        if (minDecimalCharsNumber && !this.isNumber(minDecimalCharsNumber)) minDecimalCharsNumber = parseInt('' + minDecimalCharsNumber);

        let valueString = value;
        if (this.isNumber(value)) { //round 2 decimal
            valueString = this.round(<number>value, decCharsNumber).toFixed(decCharsNumber);
        } else {
            let num = parseFloat('' + value);
            if (!this.isNumber(num)) { // if the parse give wrong value mena that it is not ok we set default to zero
                num = 0;
            }
            valueString = this.round(num, decCharsNumber).toFixed(decCharsNumber);
        }

        let [integer, fraction = ''] = (valueString || '').toString().split(localeDecimalSep);            

        // Try to round        
        if (fraction && fraction.length > decCharsNumber) {
            let tempValue = '0' + localeDecimalSep + fraction;
            let decimalRounded = parseFloat(tempValue).toFixed(decCharsNumber);
            if (decimalRounded.indexOf(localeDecimalSep) >= 0) {
                fraction = decimalRounded.split(localeDecimalSep)[1];
            }            
        }

        fraction = decCharsNumber > 0 ? decimalSep + (fraction + '000000').substring(0, decCharsNumber) : '0';

        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
        if (!integer) integer = '0'; //default 0       

        if (removeUnnecessaryZeros === true && fraction) {
            let minDecimalChars = minDecimalCharsNumber ? minDecimalCharsNumber : 0;

            let haveDecimalCharInFraction = fraction.indexOf(localeDecimalSep) >= 0 
                || fraction.indexOf(decimalSep) >= 0;
            if (haveDecimalCharInFraction) minDecimalChars ++;


            while(fraction.endsWith('0') && fraction.length > minDecimalChars) {
                fraction = fraction.substr(0, fraction.length - 1);
            }
            if(fraction === localeDecimalSep || fraction === decimalSep)
                fraction = '';
        }
        return integer + fraction;
    }

    // Value input is formated display value
    // Result is the string include the interger and the decimal without groupSep
    parse(value: string, groupSep: string, decimalSep: string, decCharsNumber: number): string {
        let localeDecimalSep: string = '.';
        let [integer, fraction = ''] = (value || '').split(decimalSep);
        integer = integer.split(groupSep).join('');
        fraction = parseInt(fraction, 10) > 0 && decCharsNumber > 0 ? localeDecimalSep + (fraction + '000000') : '0';     
        let negative = parseInt(integer) < 0 ? -1 : 1;
        return ((Math.abs(parseInt(integer)) + parseFloat(fraction)) * negative).toFixed(decCharsNumber);
    }

    isMajorVersionChanged(version1: string, version2: string): boolean {
        let currentTokens =  (version1 || '').split('.');
        let lastTokens =  (version2 || '').split('.');

        if (currentTokens.length > 0 && lastTokens.length > 0 && currentTokens[0] !== lastTokens[0]) {
            return true;
        }

        if (currentTokens.length > 1 && lastTokens.length > 1 && currentTokens[1] !== lastTokens[1]) {
            return true;
        }

        // console.debug('Version not changed -> version1 = ', version1,  ' version2 = ', version2);
        return false;
    }

    /**
     * Listion event on AngularJs
     */
    public onEventFromNg1(): Observable<{name: string; value: any}> {
        this.communicationService.registerEvent();
        return this.communicationService.onEventChange;
    }

    public onAPISucess(): Observable<void> {
        return this._onAPISucess.asObservable();
    }

    updateLastCallTimeStamp() {
        this.communicationService.updateLastCall();
        this._onAPISucess.next();
    }

    checkIfNeedRenewSession(): boolean {
        let result = false;
        if (this.appConfig.WITH_NG1) {
            result = this.communicationService.checkIfNeedRenewSession() || false;
        }
        return result;
    }

    showOfflineWarning() {
        if (this.appConfig.WITH_NG1) {
            this.communicationService.showOfflineWarning();
        }
    }

    getMomentDatePattern(angularDatePattern: string): string {
        let returnPattern: string = angularDatePattern;

        // remove non support tokens
        let nonSupportTokensReg: RegExp = /MMMM|MMM|LLLL|EEEE|EEE|a|Z|ww|w|GGGG|GGG|GG|G/;
        if (returnPattern) returnPattern = angularDatePattern.replace(nonSupportTokensReg, '');

        if (returnPattern) returnPattern = returnPattern.replace(/yyyy/, 'YYYY');
        if (returnPattern) returnPattern = returnPattern.replace(/yy/, 'YYYY');
        if (returnPattern) returnPattern = returnPattern.replace(/y/, 'YYYY');
        // M, MM <=> M, MM => don't need to replace
        if (returnPattern) returnPattern = returnPattern.replace(/dd/, 'DD');
        if (returnPattern) returnPattern = returnPattern.replace(/d/, 'D');
        // m, mm <=> m, mm => don't need to replace
        // H, HH <=> H, HH => don't need to replace
        // h, hh <=> h, hh => don't need to replace
        // s, ss, sss <=> s, ss, sss => don't need to replace

        return returnPattern;
    }

    isEmptyOrSpaces(str: string) {
        return str === undefined || str === null || str.match(/^ *$/) !== null;
    }

    roundDecimal(value: number, numberDecimal?: number): number {
        //if (!numberDecimal) numberDecimal = 2;
        // We have the problem floating-point-math-broken 
        // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
        // https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
        // So that we will add a epsilon value before multiple 
        // let multipleValue = Math.pow(10, numberDecimal);
        // let epsilonValue = 1/Math.pow(10, 10);
        // let valueNotRounded = (value + epsilonValue) * multipleValue;
        // let valueRounded = Math.round(valueNotRounded);
        // return  valueRounded/ multipleValue;

        return this.round(value, numberDecimal);
    }

    // stringValue is value formated 
    tryParseFloat(stringValue: string): number | undefined {
        if (!stringValue) return undefined;
        if (stringValue === "-") return 0;
        // Replace the space as thousand separator by empty
        // Replace the commas by .
        let replaceValue = stringValue.replace(/ /g,'').replace(/,/g, ".");
        let parts = replaceValue.split('.');
        if (parts.length > 2) {
            replaceValue =  parts.slice(0,-1).join('') + '.' + parts.slice(-1);
        }
        return parseFloat(replaceValue);
    }

    getDuration(start: string, end: string): number {
        var startTime = this.getTimestamp(start),
            endTime = this.getTimestamp(end);
        return (endTime - startTime) / (60 * 60 * 1000);
    }

    getHourFromString(hour: string) {
        if (!hour) {
            return 0;
        }
        let res = hour.split(':');
        // tslint:disable-next-line:radix
        return parseInt(res[0]) + parseInt(res[1]) / 60;
    }

    convertDurationStringToDuration(duration: any): number {
        if (!duration)
            return 0;

        let durationString: string = duration.toString();
        durationString = durationString.replace(',', '.'); // Convert , to .
        let result = 0;
        let isDecimal = durationString.indexOf('.') >= 0;
        if (isDecimal)
            return parseFloat(durationString);
        else {
            
            let isNegative = durationString.startsWith("-");
            if (isNegative) {
                durationString = durationString.replace(/-/g, '');
            }
            
            durationString = durationString.replace(/\s/g, '');
            durationString = durationString.toLowerCase();

            // in case user input just minutes, then by default set it to 0h
            if (durationString.indexOf("h") < 0 && durationString.indexOf("m") >= 0)
                durationString = "0h" + durationString;
            let hourAndMinute = (<string>durationString).split(/:|h|m|H|M| /);
            let hoursString = hourAndMinute[0];
            let hoursNumber = parseInt(hoursString);
            let minutesNumber = 0;
            if (hourAndMinute.length >= 2) {
                let minutesString = hourAndMinute[1];
                if (minutesString.length > 0)
                    minutesNumber = parseInt(minutesString);
                else
                    minutesNumber = 0;

                minutesNumber = minutesNumber / 60;
            }
            result = hoursNumber + minutesNumber;

            if (isNegative)
                result = result * -1;
            
            
        }
        return result;
    }

    transformDurationToString(duration: number, shouldNOTShowMinutesUnit?): string {
        let isNegative = duration < 0;
        if (isNegative) duration = duration * -1;

        let hour: number = Math.floor(duration);
        let minuteInDecimal: number = duration - hour;
        let minute = Math.round(60 * minuteInDecimal);

        // GF-588 (1.60.0): rounded to "2h" instead "1h60m" i
        if (minute == 60) {
            minute = 0;
            hour = hour + 1;
        }

        let result: string;
        let minuteString = minute >= 10 ? minute.toString() : "0" + minute.toString();

        if (minute === 0) {
            result = hour.toString() + 'h';
        }
        else if (shouldNOTShowMinutesUnit) {
            
            result = hour.toString() + 'h' + minuteString;
        } 
        else {
            result = hour.toString() + 'h' + minuteString + 'm';
        }

        if (isNegative) result = "-" + result;

        return result;
    }


    /**
    * Please note that, the result into milisecond
    **/
    getTimestamp(hour: string): number {
        if (!hour)
            return 0;
        var res = hour.split(":");
        return parseInt(res[0]) * 60 * 60 * 1000 + parseInt(res[1]) * 60 * 1000;
    }

    getHourFromTimestamp(timestamp: number): string {
        if (timestamp < 0 || timestamp > 24 * 3600 * 1000) {
            return null;
        }
        let duration = moment.duration(timestamp, 'ms'),
            h: any = duration.days() * 24 + duration.hours(),
            m: any = duration.minutes();

        let s = duration.seconds();
        let ms = duration.milliseconds();

        // GF-502: we found that from 2h2m convert to number become 2.03333 but convert back to string become 2h1m59s900+ms
        // so the auto correct way is to try to detect and correct data
        if (s > 58 && ms > 900) { 
            m++;
        }
        
        if (h < 10) {
            h = '0' + h;
        }
        if (m < 10) {
            m = '0' + m;
        }
        return h + ':' + m;
    }


    computeStartTimeFromDurationAndEndTime(duration: number, endTime: string): string {
        return this.getHourFromTimestamp(this.getTimestamp(endTime) - duration * 60 * 60 * 1000);
    }

    computeEndTimeFromDurationAndStartTime(duration: number, startTime: string): string {
        return this.getHourFromTimestamp(this.getTimestamp(startTime) + duration * 60 * 60 * 1000);
    }

    checkTimeInputValid(timeInput: string) : boolean {
        if (timeInput) {
            let testString = "24:00";
            if (testString.indexOf(timeInput) >= 0 && testString.length >= timeInput.length)
                return true;
            let m = moment(timeInput, 'HH:mm', false);
            return m.isValid();
        }
        return true;
    }

    // Convert the time input by the user to the correct time
    // Only allow 24:00
    parseStringToTime(timeInput: string): string {
        
        if (!timeInput || !this.checkTimeInputValid(timeInput)) 
            return timeInput;
        if (timeInput.indexOf("24") >= 0) {
            return  "24:00";
        }
        else {
            let m = moment(timeInput, 'HH:mm', false);        
            return m.format('HH:mm');
        }
    }


    loadDynamicScript(id: string, scriptPath: string, reload= false): Observable<any> {
        return new Observable<any>((subscriber) => {
            let document =this._injector.get(DOCUMENT);
            const head = document.getElementsByTagName('head')[0];
            let scriptLink = document.getElementById(id) as HTMLScriptElement;
            if (scriptLink && reload === false) {
                scriptLink.src = scriptPath;
                subscriber.next();
            } else {
                let script = document.createElement('script');
                script.id = id;
                script.src = `${scriptPath}`;
                script.async = false;
                script.onload = () => {
                    subscriber.next();
                    subscriber.complete();
                };
                script.onerror = (error) => {
                    subscriber.error(error);
                    subscriber.complete();
                };
                head.appendChild(script);
            }
        });
    }

    createRandomColor(): string {
        let letters = '0123456789ABCDEF';
        let color = "#";
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    plus(value1: number, value2: number, roundingDecimals?: number): number {
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value1)) return 0;
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value2)) return 0;

        let dec1 = new Decimal(value1);
        let result = dec1.plus(value2);
        if (roundingDecimals) return this.round(result.toNumber(), roundingDecimals);
        return result.toNumber();
    }

    minus(value1: number, value2: number, roundingDecimals?: number): number {
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value1)) return 0;
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value2)) return 0;

        let dec1 = new Decimal(value1);
        let result = dec1.minus(value2);
        if (roundingDecimals) return this.round(result.toNumber(), roundingDecimals);
        return result.toNumber();
    }

    multiply(value1: number, value2: number, roundingDecimals?: number): number {
         // Try to return 0 for invalid value
         if (!this.isValidNumber(value1)) return 0;
         // Try to return 0 for invalid value
         if (!this.isValidNumber(value2)) return 0;

        let dec1 = new Decimal(value1);
        let result = dec1.times(value2);
        if (roundingDecimals) return this.round(result.toNumber(), roundingDecimals);
        return result.toNumber();
    }

    divided(value1: number, value2: number, roundingDecimals?: number): number {
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value1)) return 0;
        // Try to return 0 for invalid value
        if (!this.isValidNumber(value2)) return 0;

        if (value2 === 0) return 0;
        
        let dec1 = new Decimal(value1);
        let result = dec1.dividedBy(value2);
        if (roundingDecimals) return this.round(result.toNumber(), roundingDecimals);
        return result.toNumber();
    }

    private round(value: number, numberDecimal?: number) : number {
         if (numberDecimal === null || numberDecimal === undefined) numberDecimal = 2;
         if (numberDecimal !== null && numberDecimal !==  undefined && !this.isNumber(numberDecimal)) numberDecimal = parseInt('' + numberDecimal);
         
         // Try to return 0 for invalid value
         if (!this.isValidNumber(value)) return 0;

         let dec1 = new Decimal(value);
         // 4 = rounding mode half_up
        return dec1.toDecimalPlaces(numberDecimal, 4).toNumber();
    }

    private isValidNumber(value: number) {
        if (value === null || value === undefined || isNaN(value)) return false;
        return this.isNumber(value);

    }
}
