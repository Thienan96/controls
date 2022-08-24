import {
    Component, Input, ElementRef, OnDestroy, Optional, Self, Renderer2, ViewChild
    , AfterViewInit, HostListener, TemplateRef, ContentChild, Injector, OnChanges, SimpleChanges, DoCheck, Output, EventEmitter, HostBinding
  } from '@angular/core';
  import {
    MatFormFieldControl, CanUpdateErrorState, ErrorStateMatcher
  } from '@angular/material';
  import {
      FormBuilder, NgControl, ControlValueAccessor, NgForm, FormGroupDirective, AbstractControl
  } from '@angular/forms';
  import { Subject, Observable, of } from 'rxjs';
  import { FocusMonitor, TOUCH_BUFFER_MS } from '@angular/cdk/a11y';
  import { coerceBooleanProperty } from '@angular/cdk/coercion';
  import { String } from 'typescript-string-operations';
  import * as _ from 'underscore';
  import { KeyCode } from '../shared/models/common.info';
  import { _MatInputMixinBase } from '../core/input.base';
  import { UtilityService } from '../core/services/utility.service';
import { AuthenticationService } from '../core/services/authentication.service';

  @Component({
  
    selector: 'ntk-number-input',
    templateUrl: './ntk-number-input.component.html',
    styleUrls: ['./ntk-number-input.component.scss'],
    providers: [{provide: MatFormFieldControl, useExisting: InputNumberComponent}],
    
    host: {
      '[class.floating]': 'shouldLabelFloat',
      '[id]': 'id',
      '[attr.aria-describedby]': 'describedBy',
      '(change)' : 'textValueChanged($event.target.value)',
      '(blur)': '_onTouched()'
    }
  })
  
  export class InputNumberComponent extends _MatInputMixinBase implements MatFormFieldControl<number>, OnChanges
        , OnDestroy, DoCheck, ControlValueAccessor, AfterViewInit, CanUpdateErrorState {
      
      errorStateMatcher: ErrorStateMatcher;
  
      static nextId = 0;
  
      @HostBinding('class.ntk-number-input') setClass = true;

      @Output('valueChanged') _valueChanged = new EventEmitter<any>();
    
      @Input() maxValue: number = null;
      @Input() minValue: number = null;

      //number of decimals to be display and rounding 
      @Input() numberDecimals: number;

      @Input() minDecimals: number;

      @Input() allowInputNegative: boolean = false;

      // Allow display empty and post null value into the model
      // Default = false meand the model = 0 and display 0.00..
      @Input() allowNull: boolean = false;
      

      // Specifial for EJ4, some fileds allow negative but not allow zero
      @Input() notAllowZero: boolean = false;


      
  
      // Text display in the control
      displayText: string;
  
  
      stateChanges = new Subject<void>();
      focused = false;

      //ngControl = null;
      errorState = false;
      controlType = 'ntk-number-input';
      id = `ntk-number-input-${InputNumberComponent.nextId++}`;
      describedBy = '';
      
      private _placeholder: string;
      private _required = false;
      private _disabled = false;

      private _value: number;
      private _onChange: (_: any) => void;
      public _onTouched: () => void;
  
      /** An object used to control when error messages are shown. */
  
      @ViewChild('input', {static: false}) _input: ElementRef<HTMLElement>;
  
  
      updateErrorState(): void {
          super.updateErrorState();
      }
  
      onContainerClick(event: MouseEvent): void {
          if (this._input) {
              this._input.nativeElement.focus();
          }
      }
  
      get empty() {
          // console.log('---asked for empty: ', this._value);
          return !this._value && !this.displayText;
      }
  
      get shouldLabelFloat() { return this.focused || !this.empty; }
  
      @Input()
      get placeholder(): string { return this._placeholder; }
      set placeholder(value: string) {
          this._placeholder = value;
          this.stateChanges.next();
      }
  
      @Input()
      get required(): boolean { return this._required; }
      set required(value: boolean) {
          this._required = coerceBooleanProperty(value);
          this.stateChanges.next();
      }
  
      @Input()
      get disabled(): boolean { return this._disabled; }
      set disabled(value: boolean) {
          this._disabled = coerceBooleanProperty(value);
          this.stateChanges.next();
      }
  
      @Input()
      get value(): number {
          return this._value;
      }

      set value(value: number) {
        if (this._value !== value) {
            this._value = value;
            this.stateChanges.next();
            this.formatValueToView();
            if (this._valueChanged) {
                this._valueChanged.emit(this._value);
            }
        }
          
      }
  
  
      ngOnChanges(changes: SimpleChanges): void {
        let needReDisplay = changes['numberDecimals'] || changes['minDecimals'] || changes['allowNull'];
        if (needReDisplay) this.formatValueToView();
        
        this.stateChanges.next();
      }
  
      ngDoCheck() {
          if (this.ngControl) {
              // We need to re-evaluate this on every change detection cycle, because there are some
              // error triggers that we can't subscribe to (e.g. parent form submissions). This means
              // that whatever logic is in here has to be super lean or we risk destroying the performance.
              this.updateErrorState();
          }
      }

      private formatValueToView() {
        
        if ((this._value === null || this._value === undefined) && this.allowNull) {
            this.displayText = null;
        }
        else {
            let numberDecimals = this.numberDecimals ? this.numberDecimals : 2;
            let minDecimals = this.numberDecimals ? this.minDecimals : numberDecimals;
            this.displayText = this.utilityService.transform(this._value, this.authenticationService.groupSep
            , this.authenticationService.decimalSep
            , numberDecimals, true, minDecimals);

        }
        

      }
  
      constructor(private _injector: Injector, private _renderer: Renderer2, fb: FormBuilder
              , private fm: FocusMonitor, private elRef: ElementRef<HTMLElement>,
              private utilityService: UtilityService,
              private authenticationService: AuthenticationService,
                  @Optional() @Self() public ngControl: NgControl,
                  @Optional() _parentForm: NgForm,
                  @Optional() _parentFormGroup: FormGroupDirective,
                  _defaultErrorStateMatcher: ErrorStateMatcher) {
  
          super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
  
          fm.monitor(elRef.nativeElement, true).subscribe(origin => {
              this.focused = !!origin;
          });
  
          if (this.ngControl != null) {
              // Setting the value accessor directly (instead of using
              // the providers) to avoid running into a circular import.
              this.ngControl.valueAccessor = this;
          }
      }
  
      ngOnDestroy() {
          this.stateChanges.complete();
          this.fm.stopMonitoring(this.elRef.nativeElement);
      }
  
      setDescribedByIds(ids: string[]) {
          this.describedBy = ids.join(' ');
      }
  
      ngAfterViewInit() {
      }
  
      /**
       * this is when the text change from outside (not in side code of control)
       */
      textValueChanged(value: any) {
          this.parseAndFormatValue(<string>value);

         
      }
  
      private parseAndFormatValue(stringValue: string) {

        let oldValue = this._value;

        let numberValue = String.IsNullOrWhiteSpace(stringValue) ? 0 : this.utilityService.tryParseFloat(stringValue);

        if (String.IsNullOrWhiteSpace(stringValue)) {
            if (this.allowNull) {
                this.displayText = null;
                this._value = null;
            }
            else {
                this._value = 0;
                this.formatValueToView();
            }
        }
        else {
            if (this.utilityService.isNumber(numberValue) && !isNaN(numberValue)) {
                // Try to rounding the value input by the user
                let numberDecimals = this.numberDecimals ? this.numberDecimals : 2;
                numberValue = this.utilityService.roundDecimal(numberValue, numberDecimals);

                if (this.maxValue !== null && numberValue > this.maxValue) {
                    this.displayText = stringValue;
                    this._value = null;
                    this.addError('max');

                }
                else if (this.minValue !== null && numberValue < this.minValue) {
                    this.displayText = stringValue;
                    this._value = null;
                    this.addError('min');
                }
                else if (this.notAllowZero && numberValue === 0) {
                    this.displayText = stringValue;
                    this._value = null;
                    this.addError('zero');
                }
                else {
                    this._value = numberValue;
                    this.formatValueToView();
                }
            }
            else {
                this.displayText = stringValue;
                this._value = null;
                this.addError('invalid');
            }
        }

        this.ngControl.viewToModelUpdate(this._value);

        this._onTouched();

        this.notifyChange(oldValue);
      }
  
      addError(errorCode: string) {
        this.errorState = true;
        let errors : { [key: string]: boolean } = {};
        errors[errorCode] = true;
        setTimeout(() => {
            if (this.ngControl.control) {
                let currentError =  {};
                if (this.ngControl.control.errors) {
                    currentError = _.clone(this.ngControl.control.errors);
                }
                Object.assign(currentError, errors);
                this.ngControl.control.setErrors(currentError);
            }
            this.updateErrorState();
        }, 100);
      }
  
      onInputKeyDown($event: KeyboardEvent) {
        // console.log('key code: ', KeyCode.getKeyCode($event));
        // console.log('enter is: ', KeyCode.DOM_VK_ENTER);
        let  allowkeyCodes = [];
        
        allowkeyCodes = [190, 110, 188]; // this.authenticationService.decimalSep === '.' ? [190, 110] : [188]; // 190,110: "." and  180: ","

        if (this.allowInputNegative === true) {
            allowkeyCodes.push(109); // '-': minus
            allowkeyCodes.push(189); // '-': NumpadSubtract
            allowkeyCodes.push(173); // '-': NumpadSubtract
        }

        let keyCode = KeyCode.getKeyCode($event);
        
        
        if (allowkeyCodes.indexOf(keyCode) !== -1 // demcial "." or ","
        || [46, 8, 9, 27, 13].indexOf(keyCode) !== -1 ||
        // Allow: Ctrl+A
        (keyCode === 65 && ($event.ctrlKey || $event.metaKey)) ||
        // 59: is keycode of , in Firefox on Mac with French keyboard when press with shift
        (keyCode === 59 && ($event.shiftKey)) ||
        // Allow: Ctrl+C
        (keyCode === 67 && ($event.ctrlKey || $event.metaKey)) ||
        // Allow: Ctrl+V
        (keyCode === 86 && ($event.ctrlKey || $event.metaKey)) ||
        // Allow: Ctrl+X
        (keyCode === 88 && ($event.ctrlKey || $event.metaKey)) ||
        // Allow: home, end, left, right
        (keyCode >= 35 && keyCode <= 39) ||
        // allow backspace, delete, left & right arrows, home, end keys
        [46, 8, 9, 27, 13].indexOf(keyCode) > -1) {
        // let it happen, don't do anything
            return;
        }
           
            // Ensure that it is a number and stop the keypress
        let charValue = $event.key;
        // let charValue2 = e.key;
        // if (e.keyCode !== 16) { // shift
        //     console.log('charValue=', charValue);
        // }

        // console.log('charValue =', charValue);
        let valid = /^[0-9]+$/.test(charValue) 
        
        if (!valid) {
            // console.log('prevent key...');
            $event.returnValue = false;
            $event.preventDefault();
        }

        switch (keyCode) {
            case KeyCode.DOM_VK_RETURN:
            case KeyCode.DOM_VK_ENTER:
                this.parseAndFormatValue(this.displayText);
                $event.preventDefault();
            break;
            case KeyCode.DOM_VK_ESCAPE:
                this.resetValue();
                $event.preventDefault();
            break;
        }
      }
  
      private resetValue() {
          this.writeValue(this._value);
      }
  
      private notifyChange(oldValue?: number) {
          this._onChange(this._value);
          this.updateErrorState();
          this.stateChanges.next();

          if (this._valueChanged && oldValue !== this._value) {
            this._valueChanged.emit(this._value);
          }
      }
  
    
  
      /**
       * @description
       * Writes a new value to the element.
       *
       * This method is called by the forms API to write to the view when programmatic
       * changes from model to view are requested.
       *
       * @usageNotes
       * ### Write a value to the element
       *
       * The following example writes a value to the native DOM element.
       *
       * ```ts
       * writeValue(value: any): void {
       *   this._renderer.setProperty(this._elementRef.nativeElement, 'value', value);
       * }
       * ```
       *
       * @param obj The new value for the element
       */
      writeValue(obj: any): void {
          this._value = obj;

          this.formatValueToView();

         
      }
  
      /**
       * @description
       * Registers a callback function that is called when the control's value
       * changes in the UI.
       *
       * This method is called by the forms API on initialization to update the form
       * model when values propagate from the view to the model.
       *
       * When implementing the `registerOnChange` method in your own value accessor,
       * save the given function so your class calls it at the appropriate time.
       *
       * @usageNotes
       * ### Store the change function
       *
       * The following example stores the provided function as an internal method.
       *
       * ```ts
       * registerOnChange(fn: (_: any) => void): void {
       *   this._onChange = fn;
       * }
       * ```
       *
       * When the value changes in the UI, call the registered
       * function to allow the forms API to update itself:
       *
       * ```ts
       * host: {
       *    (change): '_onChange($event.target.value)'
       * }
       * ```
       *
       * @param fn The callback function to register
       */
      registerOnChange(fn: (_: any) => void): void {
          // console.log('registerOnChange: ', fn);
          this._onChange = fn;
      }
  
      /**
       * @description
       * Registers a callback function is called by the forms API on initialization
       * to update the form model on blur.
       *
       * When implementing `registerOnTouched` in your own value accessor, save the given
       * function so your class calls it when the control should be considered
       * blurred or "touched".
       *
       * @usageNotes
       * ### Store the callback function
       *
       * The following example stores the provided function as an internal method.
       *
       * ```ts
       * registerOnTouched(fn: any): void {
       *   this._onTouched = fn;
       * }
       * ```
       *
       * On blur (or equivalent), your class should call the registered function to allow
       * the forms API to update itself:
       *
       * ```ts
       * host: {
       *    '(blur)': '_onTouched()'
       * }
       * ```
       *
       * @param fn The callback function to register
       */
      registerOnTouched(fn: () => void): void {
          // console.log('registerOnTouched: ', fn);
          this._onTouched = fn;
      }
  
      /**
       * @description
       * Function that is called by the forms API when the control status changes to
       * or from 'DISABLED'. Depending on the status, it enables or disables the
       * appropriate DOM element.
       *
       * @usageNotes
       * The following is an example of writing the disabled property to a native DOM element:
       *
       * ```ts
       * setDisabledState(isDisabled: boolean): void {
       *   this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
       * }
       * ```
       *
       * @param isDisabled The disabled status to set on the element
       */
      setDisabledState?(isDisabled: boolean): void {
          //console.log('--------setDisabledState: ', isDisabled);
          //this._renderer.setProperty(this.elRef.nativeElement, 'disabled', isDisabled);
  
          if (this._input) {
              this._renderer.setProperty(this._input.nativeElement, 'disabled', isDisabled);
          }
  
          this.disabled = isDisabled;
          if (isDisabled) {
              this._renderer.addClass(this.elRef.nativeElement, 'ntk-number-input-disabled');
          } else {
              this._renderer.removeClass(this.elRef.nativeElement, 'ntk-number-input-disabled');
          }
      }
  
      onDisplayTextChanged($event: string) {
        
      }

      autoFocus() {
        this.fm.focusVia(this._input.nativeElement, 'program');
      }
  }
  