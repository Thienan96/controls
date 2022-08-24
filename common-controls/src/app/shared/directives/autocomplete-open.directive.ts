import {Directive, HostListener, Input} from '@angular/core';
import {AutocompleteComponent} from '../../autocomplete/autocomplete/autocomplete.component';

@Directive({
    selector: '[ntkAutocompleteOpen]'
})
export class AutocompleteOpenDirective {
    @Input('ntkAutocompleteOpen') private autocompleteComponent: AutocompleteComponent;

    @HostListener('click') click() {
        this.autocompleteComponent.showPanel();
    }
}
