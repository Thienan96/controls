import {
    AfterViewInit,
    Component,
    ContentChild,
    DoCheck,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    Optional,
    Output,
    Renderer2,
    Self,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import { CanUpdateErrorState, ErrorStateMatcher, MAT_DIALOG_DATA, MatFormFieldControl } from '@angular/material';
import { ControlValueAccessor, FormBuilder, FormGroup, FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CdkOverlayOrigin, FlexibleConnectedPositionStrategy, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { TreePanelComponent } from './tree-panel.component';
import { ILazyItem } from '../shared/models/common.info';
import { _MatInputMixinBase } from '../core/input.base';
import { UtilityService } from '../core/services/utility.service';
import { filter, map } from 'rxjs/operators';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';


// export const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase =
//     mixinErrorState(MatInputBase);

@Component({
    selector: 'ntk-mat-tree-dropdown',
    templateUrl: './tree-dropdown.component.html',
    styleUrls: ['./tree-dropdown.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: TreeDropdownComponent }],
    host: {
        '[class.floating]': 'shouldLabelFloat',
        '[id]': 'id',
        '[attr.aria-describedby]': 'describedBy',
        //'(change)' : '_onChange($event.target.value)',
        '(blur)': '_onTouched()'
    }
})

export class TreeDropdownComponent extends _MatInputMixinBase implements MatFormFieldControl<any>, OnChanges
    , OnDestroy, DoCheck, ControlValueAccessor, AfterViewInit, CanUpdateErrorState {
    get empty() {
        // console.log('---asked for empty: ', this._value);
        return !this._value;
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
            this._skipChangeEvent = true;
            this.displayText = this.value.Name;
        }
    }

    @Input() titleKey: string;
    @Input() disableSearch: boolean;

    @Output('valueChanged') _valueChanged = new EventEmitter<any>();

    static nextId = 0;

    autofilled?: boolean;

    displayText: string;

    private _searchText: string;

    private _skipChangeEvent = false;

    /** An object used to control when error messages are shown. */
    @Input() errorStateMatcher: ErrorStateMatcher;

    @Input() getData: (searchText: string, parentNode: any, context?: string) => Observable<ILazyItem[]>;

    @Input() context: string;

    @ViewChild('dropdownButton', { static: false }) buttonRef: CdkOverlayOrigin;

    overlayRef: OverlayRef;
    private _overlayPosition: FlexibleConnectedPositionStrategy;
    private dropdownPanelPortal: ComponentPortal<TreePanelComponent>;

    @ContentChild(TemplateRef, { static: false }) _itemTemplate: TemplateRef<any>;

    @ViewChild('textBox', { static: true }) _textBox: ElementRef;

    parts: FormGroup;
    stateChanges = new Subject<void>();
    focused = false;
    // ngControl = null;
    errorState = false;
    controlType = 'ntk-dropdown';
    id = `ntk-tree-dropdown-${TreeDropdownComponent.nextId++}`;
    describedBy = '';
    private _placeholder: string;
    private _required = false;
    private _disabled = false;

    private _value: any;

    private _isIE = false;
    private _dropdownInstance: TreePanelComponent;

    private _onChange: (_: any) => void;

    public _onTouched: () => void;
    isSmallScreen: boolean;

    ngOnChanges(changes: SimpleChanges): void {
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

    constructor(private _injector: Injector, private _renderer: Renderer2, fb: FormBuilder
        , private fm: FocusMonitor, private elRef: ElementRef<HTMLElement>,
        @Optional() @Self() public ngControl: NgControl,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher,
        private overlay: Overlay) {

        super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);

        let utl = this._injector.get(UtilityService);
        this._isIE = utl.isIE;

        utl.screenResizeToSmall().subscribe(response => {
            this.onClickOutside();
            if (this._overlayPosition) {
                this._overlayPosition.dispose();
            }
            this.overlayRef = null;
            this.isSmallScreen = response;
            if (this.isSmallScreen) {
                this.disableSearch = true;
            } else {
                this.disableSearch = false;
            }
        });

        fm.monitor(elRef.nativeElement, true).subscribe(origin => {

            console.log('focus change=', origin);
            if (!this.isSmallScreen) {
                this.focused = !!origin;
                this.stateChanges.next();
    
                if (!this.focused) {
                    // console.log('control lost focus');
                    setTimeout(() => {
                        // console.log('really lost focus?: ', this.focused);
    
                        if (!this.focused) {
                            this.onClickOutside();
    
                            this._onTouched();
                            this.updateErrorState();
                        }
    
                    }, this._isIE ? 1000 : 200);
                }
            }
        });

        if (this.ngControl != null) {
            // Setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.

            // console.log('ngControl=', this.ngControl);

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

    onContainerClick(event: MouseEvent) {
        if ((event.target as Element).tagName.toLowerCase() !== 'input') {
            this.elRef.nativeElement.querySelector('input')!.focus();
            this.elRef.nativeElement.querySelector('input')!.select();
        }
    }

    ngAfterViewInit() {
        let callback = {
            getData: (parentNode) => { return this._getData(parentNode); }
        }

        this.dropdownPanelPortal = new ComponentPortal(TreePanelComponent, undefined, this.createInjector(callback));

        this._renderer.addClass(this.elRef.nativeElement, 'ntk-mat-dropdown');
    }

    onInputKeyDown($event: KeyboardEvent) {
        // console.log('onInputKeyDown: ', $event.key);
        switch ($event.key) {
            case 'Down': // IE
            case 'ArrowDown':
                if (this._dropdownInstance) {
                    this._dropdownInstance.selectNextItem(1);
                    $event.stopPropagation();
                } else {
                    this.showDropdown();
                }
                break;
            case 'Up': // IE
            case 'ArrowUp':
                if (this._dropdownInstance) {
                    this._dropdownInstance.selectNextItem(-1);
                    $event.stopPropagation();
                }
                break;
            case 'Right': // IE
            case 'ArrowRight':
                if (this._dropdownInstance) {
                    this._dropdownInstance.expandSelectedRow();
                    $event.stopPropagation();
                }
                break;
            case 'Left': // IE
            case 'ArrowLeft':
                if (this._dropdownInstance) {
                    this._dropdownInstance.collapseSelectedRow();
                    $event.stopPropagation();
                }
                break;
            case 'Enter':
                this.selectItemAndClose();
                $event.preventDefault();
                break;
            // we control this by event dispatcher of overlay
            // case 'Esc': // IE
            // case 'Escape':
            //     this.onClickOutside();
            //     $event.stopPropagation();
            //     break;
        }
    }

    private _getData(parentNodeId?: string): Observable<ILazyItem[]> {
        if (this.getData) {
            return this.getData(this._searchText, parentNodeId, this.context).pipe(map(
                data => {
                    if (!this.isSmallScreen) {
                        if (!data || data.length < 1) {
                            this.overlayRef.updateSize({ height: 30, maxHeight: '45vh' });
                            this.overlayRef.updatePosition();
                        } else {
                            this.overlayRef.updateSize({ height: '45vh', maxHeight: '45vh' });
                            this.overlayRef.updatePosition();
                        }
                    }
                    return data;
                }
            ));
        }
        return of([])
    }

    displayTextChanged($event) {
        if (this._skipChangeEvent) {
            this._skipChangeEvent = false;
            return;
        }

        this._searchText = $event;

        // whwen user try to delete the text, we consider that it is null
        if (!this._searchText || this._searchText.length === 0) {
            this._value = null;
            if (this._valueChanged) {
                this._valueChanged.emit(this._value);
            }

            this.ngControl.viewToModelUpdate(null);
            this.notifyChange();
        }

        if (this.focused || this.isSmallScreen) {
            this.showDropdown();

            if (this._dropdownInstance) {
                this._dropdownInstance.refresh();
            }
        }
    }

    focusOnTextBox(autoShowDropdown = false) {
        if (this._textBox) {
            this._textBox.nativeElement.focus();
        }

        if (autoShowDropdown) {
            this.showDropdown();
        }
    }


    private notifyChange() {
        if (this._onChange) {
            this._onChange(this._value);
        }
        this.updateErrorState();
    }

    createInjector(dataToPass: any): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(MAT_DIALOG_DATA, dataToPass);
        return new PortalInjector(this._injector, injectorTokens);
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

        if (this._value) {
            this._skipChangeEvent = true;
            this.displayText = this.value.Name;
        } else {
            this.displayText = null;
        }
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
        console.log('--------setDisabledState: ', isDisabled);
        //this._renderer.setProperty(this.elRef.nativeElement, 'disabled', isDisabled);

        this._renderer.setProperty(this.elRef.nativeElement.querySelector('input'), 'disabled', isDisabled);

        this.disabled = isDisabled;
        if (isDisabled) {
            this._renderer.addClass(this.elRef.nativeElement, 'ntk-mat-dropdown-disabled');
        } else {
            this._renderer.removeClass(this.elRef.nativeElement, 'ntk-mat-dropdown-disabled');
        }
    }

    private initOverlayPosition() {
        if (!this._overlayPosition) {
            this._overlayPosition = this.overlay.position()
                .flexibleConnectedTo(
                    this.buttonRef.elementRef);

            this._overlayPosition.positions.push(
                {
                    offsetX: 0,
                    offsetY: 10,
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top'
                },
                {
                    offsetX: 0,
                    offsetY: -10,
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'bottom'
                },
                {
                    offsetX: 0,
                    offsetY: 10,
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top'
                },
                {
                    offsetX: 0,
                    offsetY: -10,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'bottom'
                },
                {
                    offsetX: 0,
                    offsetY: 0,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'center'
                },
                {
                    offsetX: 0,
                    offsetY: 0,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'center'
                }
            );
        }
    }

    onDropdownButtonClick() {
        if (!this._disabled) {
            setTimeout(() => {
                this.toogleDropdown();
            }, 100);
        }
    }

    private toogleDropdown() {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            this.overlayRef.detach();
        } else {
            this.showDropdown();
        }
    }

    private showDropdown() { 
        if (!this.overlayRef) {
            this.initOverlayPosition();
            let element = jQuery(this.elRef.nativeElement);
            let configPanel;
            // in mobile, the panel is fullscreen
            if (this.isSmallScreen) {
                configPanel = {                    
                    width: '100vw',
                    height: '100vh',
                    maxHeight: '100vh',
                    minWidth: '100vw',
                    panelClass: 'ntk-mat-dropdown-panel'
                };                
            } else {
                configPanel = {
                    positionStrategy: this._overlayPosition,
                    width: element.width(),
                    height: '45vh',
                    maxHeight: '500px',
                    minWidth: '350px',
                    panelClass: 'ntk-mat-dropdown-panel'
                };
            }
            this.overlayRef = this.overlay.create(configPanel);

            this.overlayRef.keydownEvents()
                    .pipe(filter(event => {
                        return event.keyCode === ESCAPE && !hasModifierKey(event);
                    }))
                    .subscribe(event => {
                        event.preventDefault();
                        this.onClickOutside();
                    });

            this.overlayRef.backdropClick().subscribe(() => {
                    this.onClickOutside();
                });

        } else {
            this.overlayRef.updatePosition();
        }

        if (!this.overlayRef.hasAttached()) {
            let ref = this.overlayRef.attach(this.dropdownPanelPortal);
            ref.instance.itemTemplate = this._itemTemplate;
            ref.instance.titleKey = this.titleKey;
            ref.instance.isSmallScreen = this.isSmallScreen;
            this._dropdownInstance = ref.instance;

            //let listener = new EventListener('nodeClick', this.nodeClick)
            this._dropdownInstance.nodeToogle.subscribe((node) => {
                this.onNodeToogle(node);
            });
            this._dropdownInstance.closePanel.subscribe(() => {
                this.onClickOutside();
            });

            this._dropdownInstance._onSearchChanged.subscribe(searchText => {
                this.displayText = searchText;
                this.displayTextChanged(this.displayText);
            });

            this._dropdownInstance._onClickSelect.subscribe(listSelected => {
                this.selectItemAndClose();
            });
        }
    }

    private onNodeToogle(item: any) {
        this.elRef.nativeElement.querySelector('input').focus();
    }

    onClickOutside() {
        // // console.log('onClickOutside');
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            this._dropdownInstance = null;
            this.overlayRef.detach();
            this._searchText = undefined;
        }

        // this._skipChangeEvent = true;
        if (this.value) {
            this.displayText = this.value.Name;
        } else {
            this.displayText = null;
        }

        this.ngControl.viewToModelUpdate(this._value);
        this.notifyChange();
    }

    private isOpenning(): boolean {
        return this.overlayRef && this.overlayRef.hasAttached();
    }

    selectItemAndClose() {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            // console.log('selectItemAndClose  selected is: ', this._dropdownInstance.selectedItem);

            if (this._dropdownInstance.selectedItem) {
                this._value = this._dropdownInstance.selectedItem;

                this._skipChangeEvent = true;
                this.displayText = this.value.Name;

                this.elRef.nativeElement.querySelector('input')!.focus();
                this.elRef.nativeElement.querySelector('input')!.select();

                if (this._valueChanged) {
                    this._valueChanged.emit(this._value);
                }

                this.ngControl.viewToModelUpdate(this._value);
                this.notifyChange();

                // console.log('this.ngControl.valid=', this.ngControl.valid);


                this._dropdownInstance = null;
                this.overlayRef.detach();
                this._searchText = undefined;
            }
        }
    }
    onInputClick() {
        if (this.disableSearch) {
            this.onDropdownButtonClick();
        }
    }

    clearText() {
        this.displayText = null;
        this.displayTextChanged(null);
        if (this._onTouched) {
            this._onTouched();
        }
    }

}
