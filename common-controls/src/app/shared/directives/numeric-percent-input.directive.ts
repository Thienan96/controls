import { Directive, HostListener, ElementRef, OnInit, Injector, Input, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { FormatDecimalPipe } from '../pipes/number.pipe';
import { NgControl, NgModel } from '@angular/forms';
import { UtilityService } from '../../core/services/utility.service';


@Directive(
  {
    selector: '[ntkNumericPercentInput]',
    providers: [FormatDecimalPipe],
    exportAs: 'ntkNumericPercentInput'
  }
)

/**
 * NBSHD-3901: we apply the same logic as EJ4
 * - we allow to input any of . or , as decimal char but not allow to input group separator
 * - When control got focus we display a simple number which will remove group separator so that user easy to input
 */
export class NumericPercentInputDirective implements OnInit {
  @Input('ntkNumericPercentInput') allowNull: boolean;

  @Input() alwaysPercent:boolean = false;   

  private el: HTMLInputElement;
  private decimalPipe: FormatDecimalPipe;

  private _util: UtilityService;
  private _isFocus = false;

  @Input() numberDecimals: number = 2;
  @Input() minDecimals : number = 2;

  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
    private injector: Injector,
    public model: NgControl
  ) {
    this.el = this.elementRef.nativeElement;
    this.el.style.textAlign = 'right';
    this.decimalPipe = injector.get(FormatDecimalPipe);
    this._util = injector.get(UtilityService);
  }


  ngOnInit() {
    if (this.model) {
      // Try to format display value when init
      this.formatDisplayValue();
      let firstChangeSubs = this.model.control.valueChanges.subscribe(v => {
          firstChangeSubs.unsubscribe();
          this.formatDisplayValue();
      });
    }
  }

  public formatDisplayValue() {
    
    // Do not format the display value when in focus
    if (this._isFocus) return;

    if (this.allowNull && !this.el.value) {
      this.el.value = null;
    } else {
        let havePercent = this.el.value.indexOf('%') >= 0;
        let tempValue = this.el.value.replace('%', '');
        let formattedValue = this.decimalPipe.transform(tempValue, this.numberDecimals, true, this.minDecimals);
        if (havePercent || this.alwaysPercent) formattedValue += '%';
        this.el.value = formattedValue;
    }
  }

  @HostListener('blur', ['$event.target.value'])
  onBlur(value) {
    this._isFocus = false;
    /* 
        Fix NBSHD-4007 (1.51.6): HS Web Html: Error saving an incident
          There are 2 problems
          1.  Try to press delete/backspace cause empty string value to post server
          2.  Modify decimal value EX 15000.44 to "15 000.45" cause wrong format to post server
    */

    if (this.allowNull && !value) {
      this.el.value = null;
      return;
    }

    value = ('' + value).replace(/,/g, '.');
    // Handle leading decimal point, like ".5"
    if (value.indexOf('.') === 0) {
      value = '0' + value;
    }
    let havePercent = value.indexOf('%') >= 0;
    let tempValue = value.replace('%', '');

    let parts = tempValue.split('.');
    if (parts.length > 2) {
        tempValue =  parts.slice(0,-1).join('') + '.' + parts.slice(-1);
    }
    value = parseFloat(tempValue);

    let formattedValue = this.decimalPipe.transform(value, this.numberDecimals, true, this.minDecimals); // transform to formated display
    if (havePercent || this.alwaysPercent) formattedValue += '%';
    this.el.value = formattedValue;
    if (this.model) {
      if (value) {
        this.model.viewToModelUpdate(formattedValue);
        /*
          Fix NBSHD-4007 (1.51.6): HS Web Html: Error saving an incident
          There are 2 problems
          1.  Try to press delete/backspace cause empty string value to post server
          2.  Modify decimal value EX 15000.44 to "15 000.45" cause wrong format to post server
        */
        this.model.control.patchValue(formattedValue);

        // Force display format and prevent binding above
        this.el.value = formattedValue; //this.decimalPipe.transform(value); // transform to fortmaed display
      } else {
        let v = 0;
        this.model.viewToModelUpdate(v);
        this.model.control.patchValue(v);
        // Force display format and prevent binding above
        let displayValue = this.decimalPipe.transform(v, this.numberDecimals, true, this.minDecimals); // transform to formated display
        if (this.alwaysPercent) displayValue += '%';
        this.el.value = displayValue;
      }
    }
  }

  @HostListener('focus', ['$event.target.value'])
  onFocus(value) {
    this._isFocus = true;
    if (this._util.isEmptyOrSpaces(value)) {
      if (this.allowNull) {
        this.el.value = null;
      } else {
        this.el.value = this.decimalPipe.parse('0', 2);
      }
      return;
    }

    let havePercent = value.indexOf('%') >= 0;
    let tempValue = value.replace('%', '');

    
    let formattedValue = this.decimalPipe.parse(tempValue, this.numberDecimals); 

    if (havePercent || this.alwaysPercent) {
      let localeDecimalSep: string = '.';
      let [integer, fraction = ''] = (formattedValue || '').toString().split(localeDecimalSep);   
      if (fraction) {
        while(fraction.endsWith('0')) {
          fraction = fraction.substr(0, fraction.length - 1);
        } 
      }
      if(fraction.length === 1 && fraction === localeDecimalSep)
        fraction = '';
      
      formattedValue = integer;
      if (fraction && fraction !== '') formattedValue += localeDecimalSep + fraction;
      formattedValue += '%';
      
    } 
    this.el.value = formattedValue;
    
  }
}
