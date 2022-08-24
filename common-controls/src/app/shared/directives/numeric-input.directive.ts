import { Directive, HostListener, ElementRef, OnInit, Injector, Input, OnChanges, SimpleChanges, HostBinding, Optional, AfterViewInit } from '@angular/core';
import { FormatDecimalPipe } from '../pipes/number.pipe';
import { NgControl, NgModel } from '@angular/forms';
import { UtilityService } from '../../core/services/utility.service';
import { startWith, pairwise } from 'rxjs/operators';

@Directive(
  {
    selector: '[ntkNumericInput]',
    providers: [FormatDecimalPipe],
    exportAs: 'ntkNumericInput'
  }
)

/**
 * NBSHD-3901: we apply the same logic as EJ4
 * - we allow to input any of . or , as decimal char but not allow to input group separator
 * - When control got focus we display a simple number which will remove group separator so that user easy to input
 */
export class NumericInputDirective implements OnInit, AfterViewInit {

  @Input('ntkNumericInput') allowNull: boolean;

  private el: HTMLInputElement;
  private decimalPipe: FormatDecimalPipe;

  private _util: UtilityService;
  private _isFocus = false;

  @Input() numberDecimals: number = 2;
  @Input() minDecimals: number = 2;


  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
    private injector: Injector,
    @Optional() public model?: NgControl
  ) {
    this.el = this.elementRef.nativeElement;
    this.el.style.textAlign = 'right';
    this.decimalPipe = injector.get(FormatDecimalPipe);
    this._util = injector.get(UtilityService);
  }

  ngOnInit() {
    if (this.model) {
      let firstChangeSubs = this.model.control.valueChanges.subscribe(v => {
        firstChangeSubs.unsubscribe();
        this.formatDisplayValue();
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Try to format display value when init
      this.formatDisplayValue();
    }, 10);
  }

  public formatDisplayValue() {
    // Do not format the display value when in focus
    if (this._isFocus) { return; }
    if (this.allowNull && !this.el.value) {
      this.el.value = null;
    } else {
      let rawValue = '';

      if (this.model) {
        rawValue = this.model.value;
      } else {
        rawValue = this.decimalPipe.parse(this.el.value, this.numberDecimals);
      }

      this.el.value = this.decimalPipe.transform(rawValue, this.numberDecimals, this.numberDecimals !== this.minDecimals, this.minDecimals);
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

    // Try to round with decimals number for the model 
    let decimalValue =  this._util.tryParseFloat(value);
    value =  this._util.roundDecimal(decimalValue, this.numberDecimals);

    this.el.value = this.decimalPipe.transform(value, this.numberDecimals, this.numberDecimals !== this.minDecimals, this.minDecimals); // transform to formated display
    if (this.model) {
      if (value) {
        this.model.viewToModelUpdate(value);
        /*
          Fix NBSHD-4007 (1.51.6): HS Web Html: Error saving an incident
          There are 2 problems
          1.  Try to press delete/backspace cause empty string value to post server
          2.  Modify decimal value EX 15000.44 to "15 000.45" cause wrong format to post server
        */
        this.model.control.patchValue(value);

        // Force display format and prevent binding above
        this.el.value = this.decimalPipe.transform(value, this.numberDecimals, this.numberDecimals !== this.minDecimals, this.minDecimals); // transform to fortmaed display
      } else {
        let v = 0;
        this.model.viewToModelUpdate(v);
        this.model.control.patchValue(v);
        // Force display format and prevent binding above
        this.el.value = this.decimalPipe.transform(v, this.numberDecimals, this.numberDecimals !== this.minDecimals, this.minDecimals); // transform to formated display
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
        this.el.value = this.decimalPipe.parse('0');
      }
      return;
    }

    this.el.value = this.decimalPipe.parse(value, this.numberDecimals);

  }
}
