import {AfterViewInit, Component, ContentChild, Injector} from '@angular/core';
import {TableEditableCellBase} from '../shared/table-editable-cell-base';
import {NgControl} from '@angular/forms';

@Component({
    selector: 'ntk-table-editable-cell-input',
    templateUrl: './table-editable-cell-input.component.html',
    styleUrls: ['./table-editable-cell-input.component.scss']
})
export class TableEditableCellInputComponent extends TableEditableCellBase implements AfterViewInit {
    @ContentChild(NgControl, {static: true}) input: NgControl;

    constructor(protected injector: Injector) {
        super(injector);
    }

    onReady() {
        super.onReady();

        // Set auto-focus
        if (this.autoFocus) {
            this.getInputControl()['focus']({
                preventScroll: true
            });
        } else {
            this.elementRef.nativeElement.focus();
        }


        if (this.input) {
            // Update cell if have any change
            this.input.valueChanges.subscribe((value) => {
                this.valueChanged.emit(value);
            });
        }

        $(this.getInputControl()).on('blur', () => {
            this.blur.emit();
        });
    }

    /**
     * Get value of control
     * @returns {any}
     */
    getValue() {
        return this.getInputControl()['value'];
    }

    /**
     * Restore value
     */
    restoreValue() {
        this.input.reset(this.prevValue);
    }

    /**
     * Get input control
     * @returns {Element}
     */
    private getInputControl(): Element {
        let element: Element = this.elementRef.nativeElement;
        return element.querySelector('input') || element.querySelector('textarea');
    }

}
