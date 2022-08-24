import {
    AfterContentInit,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    Optional,
    Output,
    QueryList,
    Self,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {ILazyItem} from '../shared/models/common.info';
import {TemplateDirective} from '../shared/directives/template.directive';
import {IGetDataEvent} from '../virtual-list/virtual-list/virtual-list.component';
import {AutocompleteComponent} from '../autocomplete/autocomplete/autocomplete.component';
import {ThemePalette} from '@angular/material/core/typings/common-behaviors/color';
import {ErrorStateMatcher, MatChipList, MatFormFieldControl} from '@angular/material';
import {FormGroupDirective, NgControl, NgForm} from '@angular/forms';
import {Directionality} from '@angular/cdk/bidi';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {UtilityService} from '../core/services/utility.service';

@Component({
    selector: 'ntk-chip',
    templateUrl: './chip.component.html',
    styleUrls: ['./chip.component.scss'],
    host: {
        class: 'ntk-chip',
        '[class.ntk-chip-invalid]': 'errorState'
    },
    providers: [{provide: MatFormFieldControl, useExisting: ChipComponent}]
})
export class ChipComponent extends MatChipList implements AfterContentInit, OnChanges, OnDestroy {
    @ViewChild('inputChip', {static: false}) inputChipRef: ElementRef;
    @ViewChild('chipList', {static: false}) chipList: MatChipList;
    @ViewChild(AutocompleteComponent, {static: false}) autocompleteComponent: AutocompleteComponent;
    @ContentChildren(TemplateDirective) templateDirectives: QueryList<TemplateDirective>;

    @Input() value: ILazyItem[] = []; // The chip is selected
    @Input() removable = true; // Determines whether or not the chip displays the remove styling and emits (removed) events.
    @Input('onGetData') _onGetData; // Get data in the popup
    @Input() isItemDisabled;
    @Input() debounce = 1000;
    @Input() maxHeight = 300;
    @Input() minHeight = 50;
    @Input() itemHeight = 48;
    @Input() readonly = false; // Control is readonly
    @Input() showArrow = true;
    @Input() color: ThemePalette = 'primary';
    @Input() sorted = false;

    @Output() created = new EventEmitter(); // Event emitted when a chip is created
    @Output() removed = new EventEmitter(); // Event emitted when the selected chip is remove
    @Output() added = new EventEmitter(); // Event emitted when the selected chip is added
    @Output() changed = new EventEmitter(); // Event emitted when the selected chip is changed (add, delete, create a chip)

    // Control
    controlType = 'ntk-chip';

    // NBSHD-4600: Apply for small-screen
    searchKeyword = '';
    chipTemplate: TemplateRef<any>;
    listItemTemplate: TemplateRef<any>;
    isSmallScreen = false;
    @Input() title: string;

    constructor(public elementRef: ElementRef<HTMLElement>,
                changeDetectorRef: ChangeDetectorRef,
                _dir: Directionality,
                _defaultErrorStateMatcher: ErrorStateMatcher,
                @Optional() _parentForm: NgForm,
                @Optional() _parentFormGroup: FormGroupDirective,
                @Optional() @Self() ngControl: NgControl,
                private injector: Injector) {
        super(elementRef, changeDetectorRef, _dir, _parentForm, _parentFormGroup, _defaultErrorStateMatcher, ngControl);
    }

    @Input()
    get disabled() {
        return this._disabled;
    }

    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this.stateChanges.next();
    }

    get chipInput(): HTMLElement | null {
        return this.inputChipRef ? this.inputChipRef.nativeElement : null;
    }

    get empty() {
        return !!!this.value || (this.value && this.value.length === 0);
    }

    get focused(): boolean {
        return (this.chipInput && $(this.chipInput).is(':focus')) || false;
    }

    get shouldLabelFloat() {
        return this.focused || !this.empty || !!this.searchKeyword;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.color) {
            this.removeColor();
            this.elementRef.nativeElement.classList.add(`mat-${changes.color.currentValue}`);
        }
    }

    ngAfterContentInit() {
        let utl = this.injector.get(UtilityService);
        utl.screenResizeToSmall().subscribe((isSmallScreen) => {
            this.isSmallScreen = isSmallScreen;
        });

        // Touch control if blur input
        $(this.elementRef.nativeElement).on('blur.chipinput', 'input', () => {
            this._markAsTouched();
        });

        this.removeColor();
        this.elementRef.nativeElement.classList.add(`mat-${this.color}`);

        this.templateDirectives.forEach((templateDirective) => {
            if (templateDirective.name === 'chipTemplate') {
                this.chipTemplate = templateDirective.tpl;
            }
            if (templateDirective.name === 'listItemTemplate') {
                this.listItemTemplate = templateDirective.tpl;
            }
        });
    }


    ngOnDestroy() {
        $(this.elementRef.nativeElement).off('blur.chipinput');

        this.stateChanges.complete();
    }


    onContainerClick(event: MouseEvent): void {
        this.focus();
    }

    onGetData(event: IGetDataEvent) {
        event.searchKeyword = this.searchKeyword;
        return this._onGetData(event);
    }

    /**
     * Event emitted when type to search the list
     */
    onSearchChange() {
        if (this.autocompleteComponent.isOpen) {
            this.autocompleteComponent.refresh();
        }
    }

    /**
     * Event emitted when a chip is selected , Add chip to selected chip
     * @param item
     */
    onItemSelected(item: ILazyItem) {
        if (this._isItemDisabled(item)) {
            this.focus();
            return;
        }

        // Clear search
        this.clearSearchKey();

        // Add new chip to list
        this.add(item);


        // Blur input
        this.blur();

        // Force touched control
        this._markAsTouched();

        // Update state
        this.stateChanges.next();
    }

    /**
     * Event emitted when click on remove button to remove a chip
     * @param item
     */
    onItemRemoved(item: ILazyItem) {
        // Remove chip
        this.remove(item);

        // Force touched control
        this._markAsTouched();

        // Update state
        this.stateChanges.next();

        // Hide panel
        if (this.autocompleteComponent.isOpen) {
            this.autocompleteComponent.hidePanel();
        }
    }

    /**
     * Event emitted when Show|Hide panel
     * @param ev
     */
    toggle(ev: MouseEvent) {
        ev.stopImmediatePropagation();
        if (this.autocompleteComponent.isOpen) {
            this.autocompleteComponent.hidePanel();
        } else {
            this.focus();
        }
    }

    onShowPanel(ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.autocompleteComponent.showPanel();
    }

    /**
     * Focus input
     * @param options
     */
    focus(options?: FocusOptions) {
        // Don't focus if chip is disabled, readonly, focuced
        if (this.disabled || this.readonly || this.focused) {
            return;
        }

        if (this.chipInput) {
            // Focus
            this.chipInput.focus();


            // Update state
            this.stateChanges.next();
        }
    }

    /**
     * Blur input
     */
    blur() {
        if (this.chipInput) {

            // Blur input
            this.chipInput.blur();


            // Update state
            this.stateChanges.next();
        }
    }

    updateErrorState() {
        this._onChange(this.value);
        super.updateErrorState();
    }

    writeValue(value) {
        this._value = value;
    }

    /**
     * Remove color
     */
    private removeColor() {
        this.elementRef.nativeElement.classList.remove('mat-primary');
        this.elementRef.nativeElement.classList.remove('mat-accent');
        this.elementRef.nativeElement.classList.remove('mat-warn');
    }

    /**
     * Remove item from selected chip
     * @param item
     */
    private remove(item: ILazyItem) {
        let pos = this.value.findIndex((itemvalue) => {
            return itemvalue.Id === item.Id;
        });
        if (pos !== -1) {
            let itemRemoved = this.value.splice(pos, 1);
            this.removed.emit(itemRemoved);
            this.changed.emit({
                action: 'removed',
                item: item
            });
        }
    }

    /**
     * Add item to selected chip
     * @param item
     */
    private add(item: ILazyItem) {
        let pos = this.value.findIndex((itemvalue) => {
            return itemvalue.Id === item.Id;
        });
        if (pos === -1) {
            this.value.push(item);
            if (this.sorted) {
                this.value = this.value.sort((a, b) => (a.Name.toLowerCase() > b.Name.toLowerCase()) ? 1 : -1);
            }

            this.added.emit(item);
            this.changed.emit({
                action: 'added',
                item: item
            });

            this.stateChanges.next();
        }
    }

    /**
     * Clean searchKey
     */
    private clearSearchKey() {
        this.searchKeyword = '';

        this.stateChanges.next();
    }

    private _isItemDisabled(item) {
        return this.isItemDisabled ? this.isItemDisabled(item) : false;
    }
}
