import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {CustomFilter, FilterDefinition} from '../../shared/models/common.info';
import {ScrollableComponent} from '../scrollable/scrollable.component';
import {Observable} from 'rxjs/index';
import {CustomFilterItemComponent} from '../custom-filter-item/custom-filter-item.component';
import {OnChanges, SimpleChanges} from '@angular/core';

@Component({
    selector: 'ntk-custom-filters',
    templateUrl: './custom-filters.component.html',
    styleUrls: ['./custom-filters.component.scss']
})
export class CustomFiltersComponent implements AfterViewInit, OnChanges {
    @Input() customFilters: CustomFilter[] = [];
    @Input() selected: CustomFilter;
    @Input() currentFieldsFilter: FilterDefinition[] = [];


    @Output() customFilterSelected = new EventEmitter();
    @Output() customFilterRemoved = new EventEmitter();
    @Output() customFilterPinToggled = new EventEmitter();
    @Output() clearFilterClicked = new EventEmitter();
    @Output() menuFavoriteClicked = new EventEmitter();
    @Output() favoriteClicked = new EventEmitter();


    @ViewChild('customFilterScroller', {static: false}) scroller: ScrollableComponent;
    @ViewChildren(CustomFilterItemComponent) private customFilterItems: QueryList<CustomFilterItemComponent>;


    @Input() showFavorite: boolean;
    @Input() favorites: FilterDefinition[] = [];
    // EJ4-1486
    @Input() public canManageGlobalFilters = false;

    // NBSHD-4134
    @Input() showCustomFiltersCount = false;

    /**
     * Check status of clear-filter button
     * When button is enable :
     *   - Selected is custom-filter(both)
     *   - Selected is null but have currentFieldsFilter
     * @returns {boolean}
     */
    get isClearCustomFiltersDisabled() {
        return !(this.selected || (!this.selected && this.currentFieldsFilter.length > 0));
    }

    constructor(private cd: ChangeDetectorRef) {
    }

    ngAfterViewInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.selected && !changes.selected.isFirstChange()) {
            // Scroll to selected
            if (changes.selected.currentValue) {
                setTimeout(() => {
                    this.gotoCustomFilter(changes.selected.currentValue);
                }, 100);

            }
        }
    }


    onCustomFilterClicked(item: CustomFilter) {
        this.customFilterSelected.emit(item);
    }

    onCustomFilterRemoved(item: CustomFilter) {
        this.customFilterRemoved.emit(item);
    }

    onCustomFilterPinToggled(item: CustomFilter) {
        this.customFilterPinToggled.emit(item);
    }

    updateScroller() {
        if (this.scroller) {
            this.safeApply();
            this.scroller.updateScroller();
        }
    }

    onCustomFilterLoaded() {
        this.updateScroller();
    }

    onCustomFilterDestroy() {
        this.updateScroller();
    }

    onClearFiltersClicked() {
        this.clearFilterClicked.emit();
    }


    onMenuFavoriteClicked() {
        this.menuFavoriteClicked.emit();
    }

    onFavoriteClicked(favorite: FilterDefinition) {
        this.favoriteClicked.emit(favorite);
    }


    gotoCustomFilter(item: CustomFilter) {
        this.getElementByCustomFilter(item).subscribe((result) => {
            let el: Element = result[0];
            this.scroller.gotoElement(el);
        }, () => {
            console.error('don\'t find component');
        });

    }

    private getElementByCustomFilter(item: CustomFilter): Observable<[Element, CustomFilter]> {
        return new Observable((subscriber) => {
            let itemComponent = this.customFilterItems.find((customFilterItem: CustomFilterItemComponent) => {
                return (customFilterItem.item.Id === item.Id);
            });
            if (itemComponent) {
                subscriber.next([itemComponent.elementRef.nativeElement, itemComponent.item]);
            } else {
                subscriber.error();
            }

        });
    }

    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch (e) {

        }
    }
}
