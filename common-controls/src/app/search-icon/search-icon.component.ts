import {
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {debounce} from 'rxjs/operators';
import {timer} from 'rxjs';
import {UtilityService} from '../core/services/utility.service';
import {TranslationService} from '../core/services/translation.service';

@Component({
    selector: 'ntk-search-icon',
    templateUrl: './search-icon.component.html',
    styleUrls: ['./search-icon.component.scss'],
    host: {
        class: 'ntk-search-icon',
        '[class.normal-mode]': '!isShowSearch',
        '[class.is-show-search]': 'isShowSearch',
        '[class.is-force-show-search]': 'isForceShowSearch',
        '[class.is-show-background]': 'isShowBackground'
    }
})
export class SearchIconComponent implements OnChanges {
    @Input() placeholder = '';
    @Input() disableControl = false;
    @Input() isClearOnBack = true;
    @Input() isForceShowSearch = false;
    @Input() delay = 1000;
    @Input() isAutoHideSearchWhenLostFocus = false;
    @Input() isShowBackButton = true;
    @Input() isShowBackground = false;

    @ViewChild('searchInput', {static: true}) searchInput: ElementRef;

    // [(value)]
    @Input() value: string;
    @Output() valueChange = new EventEmitter<string>();

    // [(isShowSearch)]
    @Input() isShowSearch = false;
    @Output() isShowSearchChange = new EventEmitter<boolean>();


    @Output() focused = new EventEmitter<void>();

    showSearchButton: boolean;
    showClearButton: boolean;
    showBackButton: boolean;
    private searchChanged: Subject<string> = new Subject<string>(); // search event
    private isChangedNow = false;
    private preventBlurInput = false;

    constructor(private elementRef: ElementRef,
                private utilityService: UtilityService,
                protected injector: Injector) {
        let translationService = this.injector.get(TranslationService);
        if (!this.placeholder && translationService.isExistsTranslation('lbSearch')) {
            this.placeholder = translationService.getTranslation('lbSearch');
        }

        // listen search to raise change
        this.searchChanged
            .pipe(debounce(() => {
                this.checkDisplay();
                if (!this.isChangedNow) { // delay 1000
                    return timer(this.delay);
                } else { // don't delay
                    this.isChangedNow = false;
                    return timer(0);
                }
            }))
            .subscribe((text) => {
                this.valueChange.emit(text);
            });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.isForceShowSearch || changes.isShowSearch || changes.value) {
            this.checkDisplay();
        }
    }

    onFocus() {
        if (!this.isForceShowSearch && !this.isShowSearch) {
            this.changeShowSearch(true);


            let input = this.searchInput.nativeElement;
            let val = input.value; // store the value of the element
            input.value = ''; // clear the value of the element

            setTimeout(() => {
                input.value = val; // set that value back.
            }, 10);

        }
        this.focused.emit();
    }

    onBlur() {
        if (!this.preventBlurInput && this.isAutoHideSearchWhenLostFocus) {
            this.changeShowSearch(false);
        }
        this.preventBlurInput = false;
    }

    onClear() {
        this.clearSearch();
        this.focusSearch(); // Focus textbox search
    }

    onBack() {
        if (!this.isForceShowSearch) {
            this.changeShowSearch(false);
        }

        if (this.isClearOnBack) {
            this.clearSearch();
        }
    }

    /**
     * Bind event when user type search
     * @param {string} text
     */
    onSearchChanged(text: string) {
        this.searchChanged.next(text);
    }

    onMouseDown() {
        this.preventBlurInput = true;
    }

    onKeyPress(ev: KeyboardEvent) {
        if (ev.key === 'Enter') {
            if (document.activeElement) {
                document.activeElement['blur']();
            }
        }
    }

    private changeShowSearch(value: boolean) {
        this.isShowSearch = value;
        this.isShowSearchChange.emit(value);
    }

    private checkDisplay() {
        this.showBackButton = this.isShowBackButton && this.isShowSearch && !this.isForceShowSearch;
        this.showSearchButton = (this.utilityService.isSmallScreen && !this.isShowSearch && !this.isForceShowSearch) || !this.value;
        this.showClearButton = (this.isForceShowSearch || this.isShowSearch) && !!this.value;
    }

    private clearSearch() {
        this.isChangedNow = true;
        this.value = ''; // Reset
        this.searchChanged.next(this.value);
    }

    private focusSearch() {
        let searchEl = this.elementRef.nativeElement.getElementsByTagName('input')[0];
        if (searchEl.focus) {
            searchEl.focus();
        }
    }
}
