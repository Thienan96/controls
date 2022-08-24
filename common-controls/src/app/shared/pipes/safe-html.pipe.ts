import {Pipe, PipeTransform, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
    }

    transform(html) {
        // return this.sanitizer.bypassSecurityTrustHtml(html);
        // console.log('---safe HTML in ', html);
        let result = SafeHtmlPipe.encodeEntities(html); //this.sanitizer.sanitize(SecurityContext.HTML, html);
        // console.log('---safe HTML out ', result);
        return result;        
    }

     // get from https://github.com/angular/angular.js/blob/67688d5ca00f6de4c7fe6084e2fa762a00d25610/src/ngSanitize/sanitize.js#L450
     public static encodeEntities(value) {
        if (!value) {
            return '';
        }
        let SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
        NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;


        return value.
          replace(/&/g, '&amp;').
          replace(SURROGATE_PAIR_REGEXP, function(value) {
            var hi = value.charCodeAt(0);
            var low = value.charCodeAt(1);
            return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
          }).
          replace(NON_ALPHANUMERIC_REGEXP, function(value) {
            return '&#' + value.charCodeAt(0) + ';';
          }).
          replace(/</g, '&lt;').
          replace(/>/g, '&gt;');
    }
}
