import {AfterContentInit, Directive, ElementRef, Input, Optional} from '@angular/core';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {DurationInputComponent} from '../../ntk-duration-input/ntk-duration-input.component';

@Directive({
    selector: '[autoFocus]'
})
export class AutofocusDirective implements AfterContentInit {
    @Input() public autoFocus: any;

    public constructor(private el: ElementRef,
                       @Optional() private ntkDropdown?: DropdownComponent,
                       @Optional() private durationInputComponent?: DurationInputComponent) {
    }

    public ngAfterContentInit() {
        if (this.autoFocus === 'true' || this.autoFocus === '' || this.autoFocus === true) {
            setTimeout(() => {
                if (this.ntkDropdown) {
                    this.ntkDropdown.autoFocus();
                    return;
                }
                if (this.durationInputComponent) {
                    this.durationInputComponent.autoFocus();
                    return;
                }
                this.el.nativeElement.focus();
            }, 500);
        }
    }
}
