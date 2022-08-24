import {Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {debounce} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';
import {timer} from 'rxjs';

@Component({
    selector: 'ntk-toolbar-search',
    templateUrl: './toolbar-search.component.html',
    styleUrls: ['./toolbar-search.component.scss'],
    host: {
        '[class.has-value]': 'searchText'
    }
})
export class ToolbarSearchComponent {
    @Input() searchText: string; // Keysearch
    @Input() placeHolderText: string;
    @Input() disableSearchText: boolean;
    @Output() searchTextChange = new EventEmitter();
    @Output() focused = new EventEmitter<string>();

    private _searchChanged: Subject<string> = new Subject<string>(); // search event
    private isChangedNow = false;

    constructor(private elementRef: ElementRef) {
        // listen search to raise change
        this._searchChanged
            .pipe(debounce(() => {
                if (!this.isChangedNow) { // delay 1000
                    return timer(1000);
                } else { // don't delay
                    this.isChangedNow = false;
                    return timer(0);
                }


            }))
            .subscribe((text) => {
                this.searchTextChange.emit(text);
            });
    }

    /**
     * Bind event when user type search
     * @param {string} text
     */
    onSearchChanged(text: string) {
        this._searchChanged.next(text);
    }

    /**
     * Clear Search
     */
    onClearSearch() {
        this.clearSearch();
        this.focusSearch(); // Foucs textbox search
    }

    private focusSearch() {
        let searchEl = $('input', this.elementRef.nativeElement)[0];
        if (searchEl.focus) {
            searchEl.focus();
        }
    }

    onFocus() {
        this.focused.emit(this.searchText);
    }

    clearSearch() {
        this.searchText = ''; // Reset
        this.isChangedNow = true;
        this._searchChanged.next(this.searchText);
    }
}
