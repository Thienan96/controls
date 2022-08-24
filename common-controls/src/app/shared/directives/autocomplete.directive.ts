import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {AutocompleteComponent} from '../../autocomplete/autocomplete/autocomplete.component';

@Directive({
    selector: '[ntkAutocomplete]'
})
export class AutocompleteDirective {
    @Input('ntkAutocomplete') private autocompleteComponent: AutocompleteComponent;
    // blurTimer: any;

    @HostListener('focus')
    onFocus() {
        // clearTimeout(this.blurTimer);
        if (this.el.nativeElement.readOnly) {
            this.el.nativeElement.blur();
            return;
        }
        if (!this.autocompleteComponent.isOpen) {
            this.autocompleteComponent.showPanel();
        }
    }

    // we will managed by overlay key to support mobile
    // @HostListener('blur')
    // onBlur() {
    //     clearTimeout(this.blurTimer);
    //     this.blurTimer = setTimeout(() => {
    //         if (this.autocompleteComponent.isOpen && !this.autocompleteComponent.autocompletePanelComponent.focused) {
    //             this.autocompleteComponent.hidePanel();
    //         }
    //     }, 200);
    // }

    @HostListener('keydown', ['$event.key'])
    onKeyDown(key: string) {
        switch (key) {
            case 'Down': // IE
            case 'ArrowDown':
                if (this.autocompleteComponent.isOpen) {
                    this.autocompleteComponent.selectNextItem(1);
                } else {
                    this.autocompleteComponent.showPanel();
                }
                break;

            case 'Up': // IE
            case 'ArrowUp':
                if (this.autocompleteComponent.isOpen) {
                    this.autocompleteComponent.selectNextItem(-1);
                } else {
                    this.autocompleteComponent.showPanel();
                }
                break;

            case 'Enter':
                if (this.autocompleteComponent.isOpen && this.autocompleteComponent.getCurrentItem()) {
                    this.autocompleteComponent.selectItemAndClose();
                    this.clearSearchKey();
                }
                break;

            // we will managed by overly keys event to support also mobile device
            // case 'Esc':
            // case 'Escape':
            //     if (this.autocompleteComponent.isOpen) {
            //         this.autocompleteComponent.hidePanel();
            //     }
            //     break;

            default:
                if (!this.autocompleteComponent.isOpen) {
                    this.autocompleteComponent.showPanel();
                }
        }
    }


    constructor(private el: ElementRef) {
    }


    private setSearchKey(val) {
        $(this.el.nativeElement).val(val);
    }

    private clearSearchKey() {
        this.setSearchKey('');
    }
}
