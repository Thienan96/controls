import {
    Component,
    ContentChild,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {TableEditableCellBase} from '../shared/table-editable-cell-base';
import {DOWN_ARROW, ENTER, ESCAPE, SPACE, UP_ARROW} from '@angular/cdk/keycodes';
import * as _ from 'underscore';

@Component({
    selector: 'ntk-table-editable-cell-dropdown',
    templateUrl: './table-editable-cell-dropdown.component.html',
    styleUrls: ['./table-editable-cell-dropdown.component.scss'],
    host: {
        '[class.disabled]': 'disabled'
    }
})
export class TableEditableCellDropdownComponent extends TableEditableCellBase implements OnDestroy, OnChanges {
    @Input() dropdownWidth = 150;
    @Input() onGetDropdownData: any;
    @Input() canSearch = false;
    @Input() isShowDropDown = false;
    @Input() searchText: string;
    @Input() getDisplayText: any;
    @Input() allowAddItem = false;
    @Input() addItemText;
    @Input() disabled = false;
    @Output('onClickAction') _onClickAction = new EventEmitter<any>();
    @ViewChild(DropdownComponent, {static: false}) dropdown: DropdownComponent;
    @ContentChild(TemplateRef, {static: false}) template: TemplateRef<any>;

    constructor(protected injector: Injector) {
        super(injector);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.searchText && changes.searchText.currentValue) {
            setTimeout(() => {
                this.setSearchText(this.searchText);
            }, 10);
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();

        // Hide drop-down
        this.hideDropDown();
    }

    onReady() {
        // Apply search
        if (this.searchText) {
            this.setSearchText(this.searchText);
        }

        if (this.isShowDropDown) {
            this.showDropDown();
        }

        if (this.autoFocus) {
            let element: Element = this.elementRef.nativeElement,
                input = element.querySelector('input');
            input.focus({
                preventScroll: true
            });

        } else {
            this.elementRef.nativeElement.focus();
        }
    }

    /**
     * Get value of control
     * @returns {any}
     */
    getValue() {
        return this.dropdown.value;
    }


    onValueChanged() {
        this.apply();
    }

    /**
     * Restore value
     */
    restoreValue() {
        this.dropdown.value = this.prevValue;
        this.apply();
    }

    onKeyDown(ev: KeyboardEvent) {

        // Escape to restore value
        if (ev.key === 'Escape' || ev['keyCode'] === ESCAPE) {
            this.hideDropDown();
            this.onEscape();
        }

        // Enter to apply
        if (ev.key === 'Enter' || ev['keyCode'] === ENTER) {
            if (this.isOpenning()) {
                this.selectItemAndClose();

                ev.preventDefault();
                ev.stopImmediatePropagation();
            } else {
                if (_.isObject(this.value)) {
                    this.onEnter();
                } else {
                    this.enter.emit();
                }
            }
        }


        if (ev.key === 'ArrowUp' || ev['keyCode'] === UP_ARROW) {
            if (this.isOpenning()) {
                this.dropdown.getDropdownInstance().selectNextItem(-1);
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        }

        if (ev.key === 'ArrowDown' || ev['keyCode'] === DOWN_ARROW) {
            if (this.isOpenning()) {
                this.dropdown.getDropdownInstance().selectNextItem(1);
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        }


        if (ev.code === 'Space' || ev['keyCode'] === SPACE) {
            if (this.isOpenning()) { // Apply if press spacing and popup is opening
                this.selectItemAndClose();
            } else {
                this.showDropDown();
            }
            ev.preventDefault();
            ev.stopImmediatePropagation();
        }
    }


    private isOpenning() {
        return this.dropdown.isOpenning();
    }

    private hideDropDown() {
        if (this.isOpenning()) {
            this.dropdown.overlayRef.detach();
        }
    }

    private showDropDown() {
        this.dropdown.showDropdown();
    }

    private selectItemAndClose() {
        if (this.isOpenning()) {
            if (this.dropdown.getDropdownInstance().selectedItem) {
                this.dropdown.selectItemAndClose();
            } else {
                this.hideDropDown();
            }
        }
    }

    actionClicked() {
        if (this._onClickAction) {
            this._onClickAction.emit();
        }
    }

    private setSearchText(searchText) {
        this.dropdown.setSearchText(searchText);
        this.dropdown.displayText = searchText;
    }
}
