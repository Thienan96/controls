import { Directive, ElementRef, HostListener, Injector, Input } from '@angular/core';
import { AuthenticationService } from '../../core/services/authentication.service';

@Directive({
    selector: '[ntk-only-number]'
})
export class OnlyNumberDirective {
    @Input('ntk-only-number') hsOnlyNumber = true;
    @Input() decimal = true;
    @Input() allowNegative = false;

    // To allow input %
    @Input() allowPercentage = false;

    constructor(private el: ElementRef, private injector: Injector) {
    }

    @HostListener('keydown', ['$event']) onKeyDown(event) {
        let e = <KeyboardEvent>event,
            keyCodeDecimal = [];
        if (this.decimal) {
            keyCodeDecimal = [190, 110, 188]; // this.authenticationService.decimalSep === '.' ? [190, 110] : [188]; // 190,110: "." and  180: ","            
        }
        if (this.allowNegative) {
            keyCodeDecimal.push(109); // '-': minus
            keyCodeDecimal.push(189); // '-': NumpadSubtract
        }

        if (this.hsOnlyNumber) {
            // if (e.keyCode !== 16) { // shift
            //     console.log('with shift =', e.shiftKey);
            //     console.log('e.keyCode =', e.keyCode);
            // }

            if (keyCodeDecimal.indexOf(e.keyCode) !== -1 // demcial "." or ","
                || [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A
                (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
                // 59: is keycode of , in Firefox on Mac with French keyboard when press with shift
                (e.keyCode === 59 && (e.shiftKey)) ||
                // Allow: Ctrl+C
                (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
                // Allow: Ctrl+V
                (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
                // Allow: Ctrl+X
                (e.keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39) ||
                // allow backspace, delete, left & right arrows, home, end keys
                [46, 8, 9, 27, 13].indexOf(e.keyCode) > -1) {
                // let it happen, don't do anything
                return;
            }

            // Ensure that it is a number and stop the keypress
            let charValue = e.key;
            // let charValue2 = e.key;
            // if (e.keyCode !== 16) { // shift
            //     console.log('charValue=', charValue);
            // }
            let target = event.target;
            let currentValue: string = target ? target.value : "";
            let isSelectAll: boolean = target && target.selectionEnd > 0 && (target.selectionEnd - target.selectionStart === currentValue.length);


            // console.log('charValue =', charValue);
            let valid = /^[0-9]+$/.test(charValue) 
            || (this.allowPercentage && charValue === '%' && currentValue.indexOf('%') < 0) 
            || (this.allowNegative && charValue === '-' && 
                (isSelectAll || currentValue.indexOf('-') < 0));
            
            if (!valid) {
                // console.log('prevent key...');
                e.returnValue = false;
                e.preventDefault();
            }
            


            
        }
    }
}
