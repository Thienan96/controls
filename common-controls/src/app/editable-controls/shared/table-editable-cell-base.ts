import {AfterViewInit, ElementRef, EventEmitter, HostListener, Injector, Input, OnDestroy, Output} from '@angular/core';
import {ENTER, ESCAPE} from '@angular/cdk/keycodes';

export class TableEditableCellBase implements AfterViewInit, OnDestroy {
    @Input() value;
    @Input() autoFocus = false;
    @Input() prevValue: any;

    @Output() valueChanged = new EventEmitter();
    @Output() destroy = new EventEmitter();
    @Output() enter = new EventEmitter();
    @Output() load = new EventEmitter();
    @Output() escape = new EventEmitter();
    @Output() blur = new EventEmitter();

    elementRef: ElementRef;
    destroyed = false;

    constructor(protected injector: Injector) {
        this.elementRef = injector.get(ElementRef, null);
    }

    @HostListener('keydown', ['$event']) _onKeyDown(ev: KeyboardEvent) {
        this.onKeyDown(ev);
    }

    @HostListener('dblclick', ['$event']) _onDblClick(ev: KeyboardEvent) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
    }

    ngAfterViewInit() {
        // Notify  component is loaded
        this.load.emit();
        this.onReady();
    }

    onReady() {
    }

    ngOnDestroy() {
        // Raise blur if control is destroyed
        this.blur.emit();

        // Raise destroy
        this.destroy.emit({
            value: this.getValue(),
            element: this.elementRef.nativeElement
        });


        // Mark destroyed
        this.destroyed = true;
    }

    /**
     * Get the value of control
     */
    getValue() {
        throw new Error('not yet implemented getValue function');
    }

    /**
     * Restore the value of control
     */
    restoreValue() {
        throw new Error('not yet implemented getValue function');
    }

    preventDefault(ev) {
        ev.stopImmediatePropagation();
    }

    /**
     * Trigger the changes
     */
    protected apply() {
        let value = this.getValue();
        this.valueChanged.emit(value);
    }

    /**
     * Press enter
     */
    protected onEnter() {
        this.apply();
        this.enter.emit();
    }

    /**
     * Press escape
     */
    protected onEscape() {
        this.restoreValue();
        this.escape.emit();
    }

    /**
     * Trigger when user press keyboard
     * @param {KeyboardEvent} ev
     */
    protected onKeyDown(ev: KeyboardEvent) {
        if (ev.key === 'Enter' || ev['keyCode'] === ENTER) {
            this.onEnter();
        }

        // Escape to restore value
        if (ev.key === 'Escape' || ev['keyCode'] === ESCAPE) {
            this.onEscape();
        }

    }
}
