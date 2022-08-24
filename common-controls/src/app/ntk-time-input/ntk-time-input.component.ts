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
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { String } from 'typescript-string-operations';
import moment from 'moment-es6';
import * as _ from 'underscore';
import { KeyCode } from '../shared/models/common.info';
import { _MatInputMixinBase } from '../core/input.base';

@Component({
// tslint:disable-next-line: component-selector
  selector: 'ntk-time-input',
  templateUrl: './ntk-time-input.component.html',
  styleUrls: ['./ntk-time-input.component.scss'],
  providers: [{provide: MatFormFieldControl, useExisting: TimeInputComponent}],
  // tslint:disable-next-line: use-host-property-decorator
  host: {
    '[class.floating]': 'shouldLabelFloat',
    '[id]': 'id',
    '[attr.aria-describedby]': 'describedBy',
    '(change)' : 'textValueChanged($event.target.value)',
    '(blur)': '_onTouched()'
  }
})

export class TimeInputComponent extends _MatInputMixinBase implements MatFormFieldControl<any>, OnChanges
      , OnDestroy, DoCheck, ControlValueAccessor, AfterViewInit, CanUpdateErrorState {
    
    errorStateMatcher: ErrorStateMatcher;

    static nextId = 0;

    @Output('valueChanged') _valueChanged = new EventEmitter<any>();

    @HostBinding('class.ntk-time-input') setClass = true;

    

    displayText: string;


    stateChanges = new Subject<void>();
    focused = false;
    //ngControl = null;
    errorState = false;
    controlType = 'ntk-time-input';
    id = `ntk-time-input-${TimeInputComponent.nextId++}`;
    describedBy = '';
    private _placeholder: string;
    private _required = false;
    private _disabled = false;
    private _value: any;
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
    get value(): any {
        // console.log('get value:', this._value);
        return this._value;
    }
    set value(value: any) {
        // console.log('set value:', value);

        this._value = value;
        this.stateChanges.next();

        if (this._value) {
            this.displayText = this.value;
        }
    }

    // HS - Intervention - PlannedStartTime save as decimal
    @Input() dataType: string = "number"; //number, string

    ngOnChanges(changes: SimpleChanges): void {
        let dataTypeChanged = changes['dataType'];
        if (dataTypeChanged && dataTypeChanged.firstChange) {
            this.displayText = this.getDisplayText(this.value);
        }
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

    private getDisplayText(value): any {
        if (value) {
            if (this.dataType === "string") {
                let m = moment(value, 'HH:mm', false)
                 return m.format('HH:mm');
            }
            else {
                let m = moment().startOf('day').add('h', value);
                return m.format('HH:mm');
            }
        } else {
            return null;
        }
    }

    constructor(private _injector: Injector, private _renderer: Renderer2, fb: FormBuilder
            , private fm: FocusMonitor, private elRef: ElementRef<HTMLElement>,
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
        // console.log('textValueChanged: ', value);
        this.parseAndFormatValue(<string>value);
    }

    private parseAndFormatValue(value: string) {

        if (String.IsNullOrWhiteSpace(value)) {
            this.displayText = null;
            this._value = null;
        } else {
            let m = moment(value, 'HH:mm', false);
            if (!m.isValid()) {
                this.displayText = value;
                this._value = null;
                this.addInvalidError(true);
            } else {
                this.displayText = m.format('HH:mm');
                if (this.dataType === "string") {
                    this._value = this.displayText;
                }
                else {
                    this._value = m.hour() + (m.minute() / 60);
                }
                
            }
        }
        this.ngControl.viewToModelUpdate(this._value);

        this._onTouched();

        this.notifyChange();
    }

    addInvalidError(isError: boolean) {
        this.errorState = this.errorState && isError;
        setTimeout(() => {
            if (this.ngControl.control) {
                let currentError =  {};
                if (this.ngControl.control.errors) {
                    currentError = _.clone(this.ngControl.control.errors);
                }
                Object.assign(currentError, { 'invalid': isError});
                this.ngControl.control.setErrors(currentError);
            }
            this.updateErrorState();
        }, 100);
    }

    onInputKeyDown($event: KeyboardEvent) {
        // console.log('key code: ', KeyCode.getKeyCode($event));
        // console.log('enter is: ', KeyCode.DOM_VK_ENTER);

        switch (KeyCode.getKeyCode($event)) {
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


    private notifyChange() {
        this._onChange(this._value);
        this.updateErrorState();
        this.stateChanges.next();
    }

    // createInjector(dataToPass: any): PortalInjector {
    //     const injectorTokens = new WeakMap();
    //     injectorTokens.set(MAT_DIALOG_DATA, dataToPass);
    //     return new PortalInjector(this._injector, injectorTokens);
    //     }

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

        this.displayText = this.getDisplayText(this._value);

        

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
            this._renderer.addClass(this.elRef.nativeElement, 'ntk-time-input-disabled');
        } else {
            this._renderer.removeClass(this.elRef.nativeElement, 'ntk-time-input-disabled');
        }
    }

    onDisplayTextChanged($event: string) {
        // console.log('onDisplayTextChanged: ', $event);
        // if (String.IsNullOrWhiteSpace($event) && !this.isOpenning()) {
        //     console.log('set to null');
        //     this._searchText = '';
        //     this._value = null;
        //     this.ngControl.viewToModelUpdate(this._value);
        //     this.notifyChange();
        // } else {
        //     this._skipChangeEvent = false;
        //     if (this.delaySearch) {
        //         clearTimeout(this.delaySearch);
        //     }
        //     this.delaySearch = setTimeout(() => {
        //         this.displayTextChanged($event);
        //     }, 500);
        // }
    }
    
    autoFocus() {
        this.fm.focusVia(this._input.nativeElement, 'program');
    }
}
