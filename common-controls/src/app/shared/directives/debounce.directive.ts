import {Directive, Output, Input, EventEmitter} from '@angular/core';
import {NgControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

// tslint:disable-next-line: directive-selector
@Directive({selector: '[ngModel][debounce]'})
export class DebounceDirective {
    @Input('debounce') public debounceTime = 500;
    @Output() public onDebounce = new EventEmitter<any>();
    private _modelValue: any = null;

    constructor(public model: NgControl) {
    }

    ngOnInit() {
        
        this._modelValue = this.model.value;

        // if (!this._modelValue) {
        let firstChangeSubs = this.model.control.valueChanges.subscribe(v => {
            this._modelValue = v;
            firstChangeSubs.unsubscribe();
        });

        this.model.control.valueChanges
            .pipe(debounceTime(this.debounceTime))
            .pipe(distinctUntilChanged())
            .subscribe(mv => {
                if (this._modelValue !== mv) {
                    this._modelValue = mv;
                    this.onDebounce.emit(mv);
                }
            });
    }
}
