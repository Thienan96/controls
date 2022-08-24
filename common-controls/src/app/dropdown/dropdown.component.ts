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
    OnInit,
    Optional,
    Output,
    Renderer2,
    Self,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {CanUpdateErrorState, ErrorStateMatcher, MAT_DIALOG_DATA} from '@angular/material';
import {ControlValueAccessor, FormBuilder, FormGroup, FormGroupDirective, NgControl, NgForm} from '@angular/forms';
import {Observable, of, Subject} from 'rxjs';
import {FocusMonitor} from '@angular/cdk/a11y';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
    CdkOverlayOrigin,
    FlexibleConnectedPositionStrategy,
    Overlay,
    OverlayConfig,
    OverlayRef
} from '@angular/cdk/overlay';
import {DropdownPanelComponent} from './dropdown-panel.component';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';
import {debounceTime, distinctUntilChanged, filter, map, tap} from 'rxjs/operators';
import {String} from 'typescript-string-operations';
import {IDataItems, ILazyItem} from '../shared/models/common.info';
import {_MatInputMixinBase} from '../core/input.base';
import {IDropdownCallbackData, IDropdownGetDataEvent} from './shared/dropdown.model';
import {UtilityService} from '../core/services/utility.service';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {MatFormFieldControl} from '@angular/material/form-field';

@Component({
    selector: 'ntk-mat-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: DropdownComponent }],
    // tslint:disable-next-line: use-host-property-decorator
    host: {
        '[class.floating]': 'shouldLabelFloat',
        '[id]': 'id',
        '[attr.aria-describedby]': 'describedBy',
        //'(change)' : '_onChange($event.target.value)',
        '(blur)': '_onTouched()'
    }
})

export class DropdownComponent extends _MatInputMixinBase implements MatFormFieldControl<any>, OnChanges, OnInit
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
    get mandatory(): boolean { return this.required; }
    set mandatory(value: boolean) {
        this.required = value;
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
            this.displayText = this.getDisplayText ? this.getDisplayText(this.value) : this.value.Name;
        }
    }

    get readonly() {
        if (this.isSmallScreen) {
            return true;
        }
        return !this.canSearch;
    }

    // To allow add new item when open the drop-down
    @Input() allowAddItem: boolean = false;
    @Input() addItemText;
    @Input() canSearch = true; // readonly
    @Input() hasSelectItem = false;
    // pagesize will be 10000(as ej4) when isLoadAllData= true;
    @Input() isLoadAllData: boolean;

    // Media-28: allow to input directly on the dropdown fields
    @Input() allowInputNonExistValue = false;
    @Input() maxLengthNonExistValue;
    @Output('textChanged') _textChanged = new EventEmitter<any>();

    // Media: allow to display header
    @Input() allowHeader = false;

    @Input() titleKey: string;

    @Input() iconName: string;
    

    static nextId = 0;
    @Output('valueChanged') _valueChanged = new EventEmitter<any>();

    @Output('onClickAction') _onClickAction = new EventEmitter<any>();
    @Output('lostFocus') lostFocus = new EventEmitter();

    @ViewChild('inputRef', { static: true }) _inputEl: ElementRef;
    autofilled?: boolean;

    displayText: string;

    private _searchText: string;

    private _preAppendRows: ILazyItem[];
    isSmallScreen: boolean;

    /** An object used to control when error messages are shown. */
    @Input() errorStateMatcher: ErrorStateMatcher;

    @Input() getData: (startIndex: number, pageSize: number, search: string) => Observable<IDropdownCallbackData>;

    @Output('onGetData') _onGetData = new EventEmitter<IDropdownGetDataEvent>();

    @Input() dropdownWidth?: string;

    @Input() disableListenKeyboard = false;

    @Input() getDisplayText: (object: any) => any;

    @Input() template: TemplateRef<any>;

    @ViewChild('dropdownButton', { static: false }) buttonRef: CdkOverlayOrigin;
    overlayRef: OverlayRef;
    private _overlayPosition: FlexibleConnectedPositionStrategy;
    private dropdownPanelPortal: ComponentPortal<DropdownPanelComponent>;

    @ContentChild(TemplateRef, { static: false }) _itemTemplate: TemplateRef<any>;
    @Input() headerTemplate: TemplateRef<any>;

    @Input() tabIndex: number;


    @Output() inputKeyDown = new EventEmitter<any>();

    parts: FormGroup;
    stateChanges = new Subject<void>();
    focused = false;
    // ngControl = null;
    errorState = false;
    controlType = 'ntk-dropdown';
    id = `ntk-dropdown-${DropdownComponent.nextId++}`;
    describedBy = '';
    private _placeholder: string;
    private _required = false;
    private _disabled = false;

    private _value: any;

    private _isIE = false;

    private _dropdownInstance: DropdownPanelComponent;

    private _onChange: (_: any) => void;

    public _onTouched: () => void;

    public isLoading = false;

    private _inputChangeSub: Subject<any>;

    protected totalCount = 0;
    ngOnChanges(changes: SimpleChanges): void {
        let getDisplayTextChanged = changes['getDisplayText'];
        if (getDisplayTextChanged && getDisplayTextChanged.firstChange) {
            this.displayText = this.getDisplayText ? this.getDisplayText(this.value) : this.value.Name;
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
            this.isSmallScreen = response;
            this.updateLayout();
        });

        fm.monitor(elRef.nativeElement, true).subscribe(origin => {
            // console.log('----fn found focus');
            if (!this.isSmallScreen) {
                this.focused = !!origin;

                if (!this.focused) {
                    // console.log('control lost focus');
                    setTimeout(() => {
                        // console.log('really lost focus?: ', this.focused);

                        if (!this.focused) {
                            // console.log('really lost focus -> trigger click outside');
                            if (this._dropdownInstance && this._dropdownInstance.hasFocus) {
                                this.focusInput();
                            } else {
                                // hasSelectItem = true: dont close dropdown when clicking outsite
                                if (!this.hasSelectItem) {
                                    this.onClickOutside();
                                }

                                if (this._onTouched) {
                                    this._onTouched();
                                }

                                // this._onChange(null);
                                // this.updateErrorState();
                            }
                        }

                    }, this._isIE ? 1000 : 200);
                }
            }
        });

        if (this.ngControl != null) {
            // Setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            //console.log('ngControl=', this.ngControl);

            this.ngControl.valueAccessor = this;
        }
    }    

    public autoFocus(autoShowDropdown = false) {
        this.fm.focusVia(this._inputEl.nativeElement, 'program');

        if (autoShowDropdown) {
            setTimeout(() => {
                this.showDropdown();
            }, 200);
        }
    }

    ngOnDestroy() {
        this.stateChanges.complete();
        if (this.hasSelectItem) {
            this.onClickOutside();
        }
        this.fm.stopMonitoring(this.elRef.nativeElement);

        this._inputChangeSub.unsubscribe();
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

    private focusInput() {
        if (this._inputEl) {
            this.fm.focusVia(this._inputEl.nativeElement, 'program');
        }
    }

    ngOnInit(): void {
        this._inputChangeSub = new Subject();

        this._inputChangeSub.asObservable().pipe(
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe(x => {
            this.displayTextChanged(this.displayText);
        });

        this._inputEl.nativeElement.addEventListener('input', ($event) => {
            // we need a way to detect that on IE if it is fire when not nececssary like focus/blur
            // https://stackoverflow.com/questions/48138865/ie-11-text-input-with-placeholder-triggering-input-event-on-focus
            if (this._isIE) {
                let t = $event.target;
                let active = (t === document.activeElement);
                if (!active || (t.placeholder && t.composition_started !== true)) {
                    t.composition_started = active;
                    if ((!active && t.tagName === 'TEXTAREA') || t.tagName === 'INPUT') {
                        $event.stopPropagation();
                        $event.preventDefault();
                        return false;
                    }
                }

                this._inputChangeSub.next($event);
                return true;
            } else {
                this._inputChangeSub.next($event);
                return true;
            }
        }, true);
    }

    ngAfterViewInit() {
        let callback = {
            getData: (startIndex: number, pageSize: number) => this._getData(startIndex, pageSize)
        };

        this.dropdownPanelPortal = new ComponentPortal(DropdownPanelComponent, undefined, this.createInjector(callback));
        this._renderer.addClass(this.elRef.nativeElement, 'ntk-mat-dropdown');
    }

    onInputKeyDown($event: KeyboardEvent) {
        if (!this.disableListenKeyboard) {
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
                case 'Enter':
                    this.selectItemAndClose();
                    $event.preventDefault();
                    break;
                default:
                    this.inputKeyDown.emit($event);

            }
        }

    }
    private setLoading(loading: boolean) {
        setTimeout(() => {
            this.isLoading = loading;
        }, 1);
        if (this._dropdownInstance) { this._dropdownInstance.loading = loading; }
    }

    private _getData(startIndex: number, pageSize: number): Observable<IDataItems<ILazyItem>> {
        let realStartIndex = startIndex;

        // Media-139: fix problem the drop down is blinked each time typing a character to search
        // if (startIndex === 0) {
        //     this.restoreDefaulDropHeight();
        // }
        if (this.isSmallScreen) {
            if (this._dropdownInstance) {
                this._dropdownInstance.ready = true;
            }
        }
        this.setLoading(true);
        let firstDataPart: ILazyItem[];
        // in case of the control load secodn page and there are append row from claller then we need to check that to adjust the index
        if (this._preAppendRows && startIndex > 0) {
            if (startIndex < this._preAppendRows.length) {
                if (startIndex + pageSize <= this._preAppendRows.length) {
                    this.setLoading(false);

                    let preResult = this._preAppendRows.slice(startIndex, startIndex + pageSize);
                    return of({ ListItems: preResult });
                } else {
                    firstDataPart = this._preAppendRows.slice(startIndex, this._preAppendRows.length);
                    realStartIndex = 0;
                    pageSize -= firstDataPart.length;
                    // console.log('case of first part in pre:', firstDataPart);
                }
            } else {
                realStartIndex -= this._preAppendRows.length;
            }
        }

        let obResult: Observable<IDropdownCallbackData>;

        if (this.getData) {
            obResult = this.getData(realStartIndex, pageSize, this._searchText);
        } else {
            obResult = new Observable((subscriber) => {
                const data = <IDropdownGetDataEvent>{
                    startIndex: realStartIndex,
                    pageSize,
                    searchText: this._searchText,
                    callBack: subscriber
                };

                this._onGetData.emit(data);
            });
        }

        if (obResult) {
            return obResult.pipe(
                tap(() => {
                    this.setLoading(true);
                }, (err) => {
                    this.setLoading(false);
                }, () => {
                    this.setLoading(false);
                    if (this._dropdownInstance) {
                        this._dropdownInstance.ready = true;
                    }
                }),
                map(data => {
                    let result = [];
                    if (startIndex === 0) {
                        // when loading firt page it may contains count and AppendRows
                        // then we need to take into account that to tell the scroller with more rows
                        let totalCount = 0;
                        if (data.AppendRows) {
                            this._preAppendRows = data.AppendRows;
                            result.push(...this._preAppendRows);
                            if (pageSize > this._preAppendRows.length) {
                                result.push(...data.ListItems.slice(0, pageSize - this._preAppendRows.length));
                            }

                            totalCount = data.Count + this._preAppendRows.length;

                            // return { ListItems: result, Count:  totalCount};
                        } else {
                            totalCount = data.Count;
                            result.push(...data.ListItems);
                        }
                        this.totalCount = totalCount;
                        if (!this.isSmallScreen) {
                            this.adjustDropdownHeight(totalCount);
                        }
                        return { ListItems: result, Count: totalCount };
                    } else {
                        if (firstDataPart) {
                            result.push(...firstDataPart);
                            result.push(...data.ListItems);
                            // console.log('case of first part:', result);
                            return { ListItems: result };
                        }
                        return data;
                    }
                }));
        }

        return of({});
    }

    private adjustDropdownHeight(totalCount: number) {
        // console.log('---adjustDropdownHeight = ', totalCount);

        if (this.overlayRef) {
            if (totalCount === 0) {
                let height = 30;
                // Increase the height when having add item line
                if (this.allowAddItem) {
                    height += 50;
                }
                if (this.hasSelectItem) {
                    // Add space for the Select all checkbox and Ok button
                    height += 96;
                }
                this.overlayRef.updateSize({ height: height, maxHeight: '45vh' });
            } else {
                let height = totalCount * 48 + 10;
                // Increase the height when having add item line
                if (this.allowAddItem) {
                    height += 50;
                }
                if (this.hasSelectItem) {
                    // Add space for the Select all checkbox and Ok button
                    height += 96;
                }
                if (this.allowHeader) {
                    height += 48;
                }
                this.overlayRef.updateSize({ height: height, maxHeight: '45vh' });
            }

            this.overlayRef.updatePosition();


            // Update content after update position
            if (this._dropdownInstance) {
                this._dropdownInstance.updateLayout();
            }
        }
    }

    private restoreDefaulDropHeight() {
        if (this.overlayRef) {
            this.overlayRef.updateSize({ height: '45vh', maxHeight: '45vh' });
        }
    }
    displayTextChanged($event) {


        this._searchText = $event;

        // whwen user try to delete the text, we consider that it is null
        if (!this._searchText || this._searchText.length === 0) {
            this._value = null;
            if (this._valueChanged) {
                this._valueChanged.emit(this._value);
            }

            this.viewToModelUpdate(null);
        }

        if (this.focused || this.isSmallScreen) {
            this.showDropdown();
            // No need call a
            if (this._dropdownInstance) {
                this._dropdownInstance.refresh();
            }
        }
    }

    viewToModelUpdate(newValue: any) {
        if (this.ngControl) {
            let notif = false;
            if (this.ngControl.value && newValue) {
                notif = this.ngControl.value.Id !== newValue.Id;
            } else {
                notif = !!newValue || !!this.ngControl.value;
            }

            if (notif) {
                this.notifyChange();
            }
        }
    }

    private notifyChange() {
        this._onChange(this._value);
        this.updateErrorState();
        this.stateChanges.next();
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

        // console.log('write value = ', JSON.stringify(obj));

        if (this._value) {
            this.displayText = this.getDisplayText ? this.getDisplayText(this.value) : this.value.Name;
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
        // console.log('--------setDisabledState: ', isDisabled);
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
                    offsetY: 20,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'center'
                },
                {
                    offsetX: 0,
                    offsetY: 20,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'center'
                }
            );
        }
        }


    onDisplayTextChanged($event: string) {
        if (String.IsNullOrWhiteSpace($event) && !this.isOpenning()) {
            this._searchText = '';
            this._value = null;
            this.viewToModelUpdate(this._value);
        }
        // else {
        //     this.displayTextChanged($event);
        // }
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

    public showDropdown() {
        if (!this.overlayRef) {
            this.initOverlayPosition();
            let element = jQuery(this.elRef.nativeElement);
            let configPanel: OverlayConfig = {
                positionStrategy: this._overlayPosition,
                width: this.dropdownWidth || element.width(),
                height: '45vh',
                maxHeight: '45vh',
                minWidth: '350px',
                panelClass: 'ntk-mat-dropdown-panel',
            };
            this.overlayRef = this.overlay.create(configPanel);
            this.overlayRef.hostElement.classList.add(`ntk-dropdown-overlay-connected-position-bounding-box`);
            if(this.isSmallScreen) {
                this.overlayRef.hostElement.classList.add(`is-fullscreen`);
            }
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
            // Media-139: fix problem the drop down is blinked each time typing a character to search
            // this.overlayRef.updatePosition();
            // //this.overlayRef.updateSize({height: '50vh'});
        }

        if (!this.overlayRef.hasAttached()) {
            let ref = this.overlayRef.attach(this.dropdownPanelPortal);
            ref.instance.addItemText = this.addItemText;
            ref.instance.allowAddItem = this.allowAddItem;
            ref.instance.hasSelectItem = this.hasSelectItem;
            ref.instance.allowHeader = this.allowHeader;
            ref.instance.isSmallScreen = this.isSmallScreen;
            ref.instance.titleKey = this.titleKey;
            ref.instance.canSearch = this.canSearch;
            if (this.isLoadAllData) {
                ref.instance.defaultSize = 10000;
            }
            ref.instance.itemTemplate = this._itemTemplate || this.template;
            ref.instance.headerTemplate = this.headerTemplate || this.template;
            this._dropdownInstance = ref.instance;

            this._dropdownInstance._onClickAction.subscribe(() => {
                this._onClickAction.emit();
                this.onClickOutside();
            });
            this._dropdownInstance._onClickSelect.subscribe(listSelected => {
                if (this.hasSelectItem) {
                    this._valueChanged.emit(listSelected);
                    this.onClickOutside();
                } else {
                    this.selectItemAndClose();
                }                
            });
            this._dropdownInstance._onSearchChanged.subscribe(searchText => {
                this.displayText = searchText;
                this.displayTextChanged(this.displayText);
            });
            this._dropdownInstance._onClosePanel.subscribe(searchText => {
                this.onClickOutside();
            });
        }
    }

    onClickOutside() {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            this._dropdownInstance = null;

            this.overlayRef.detach();
            this._searchText = undefined;
        }

        if (this.allowInputNonExistValue) {
            if (this._textChanged) {
                this._textChanged.emit(this.displayText);
            }
        } else {
            if (this.value) {
                this.displayText = this.getDisplayText ? this.getDisplayText(this.value) : this.value.Name;
            } else {
                this.displayText = null;
            }
        }

        this.focused = false;

        // console.log('value is=', this._value);
        this.viewToModelUpdate(this._value);
    }

    isOpenning(): boolean {
        return this.overlayRef && this.overlayRef.hasAttached();
    }

    selectItemAndClose() {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            // tslint:disable-next-line: no-non-null-assertion
            this.elRef.nativeElement.querySelector('input')!.focus();
            // tslint:disable-next-line: no-non-null-assertion
            this.elRef.nativeElement.querySelector('input')!.select();

            let selected = JSON.stringify(this._dropdownInstance.selectedItem);
            // console.log('selectItemAndClose  selected is: ', selected);

            // NBHSD-3993: [HS/CL] Optimization of dropdown menu
            // Prevent to select group item
            if (this._dropdownInstance.selectedItem
                && this._dropdownInstance.selectedItem.Id
                && this._dropdownInstance.selectedItem.Id !== -1
                && this._dropdownInstance.selectedItem.Id != null
                && this._dropdownInstance.selectedItem.Id !== ''
                && this._dropdownInstance.selectedItem.Id !== '00000000-0000-0000-0000-000000000000') {
                this._value = this._dropdownInstance.selectedItem;

                this.displayText = this.getDisplayText ? this.getDisplayText(this.value) : this.value.Name;
                this._searchText = undefined;

                this.viewToModelUpdate(this._value);
                if (this._valueChanged) {
                    this._valueChanged.emit(this._value);
                }

                setTimeout(() => {
                    // console.log('---close');
                    this._dropdownInstance = null;
                    this.overlayRef.detach();
                }, 100);
            } else {
                this.displayText = null;
            }
        }
    }

    getDropdownInstance() {
        return this._dropdownInstance;
    }

    onInputClick() {
        this.onDropdownButtonClick();
    }

    setSearchText(text: string) {
        this._searchText = text;
    }

    onBlur($event) {
        if (this.lostFocus) {
            this.lostFocus.emit($event);
        }
    }

    clearText() {
        this.displayText = null;
        this.onDisplayTextChanged(null);
        if (this._onTouched) {
            this._onTouched();
        }
        this.focused = false;
    }

    onResizeSensor() {
        if (!this.isSmallScreen) {
            this.updateLayoutPanel();
        }
    }

    private updateLayoutPanel() {
        if (this.overlayRef) {
            this.overlayRef.updateSize({width: this.dropdownWidth || jQuery(this.elRef.nativeElement).width()});
            this.overlayRef.updatePosition();
        }
    }

    private updateLayout() {
        // Add|Remove fullscreen
        if (this.overlayRef) {
            if (this.isSmallScreen) {
                this.overlayRef.hostElement.classList.add(`is-fullscreen`);
            } else {
                this.overlayRef.hostElement.classList.remove(`is-fullscreen`);
            }
        }

        // Update for panel is opening
        if (this._dropdownInstance) {
            this._dropdownInstance.isSmallScreen = this.isSmallScreen;
            this._dropdownInstance.safeApply();

            // render
            if (!this.isSmallScreen) {
                this.updateLayoutPanel();
                this.adjustDropdownHeight(this.totalCount);
            } else {
                this._dropdownInstance.updateLayout();
            }
        }
    }
}
