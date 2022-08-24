import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    TemplateRef,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {DialogPosition, MatDialog, MatDialogConfig, MatDialogRef, MatMenuTrigger} from '@angular/material';
import {Observable, Subject} from 'rxjs';
import {CustomFilter, FilterDefinition, FilterOperator, FilterType} from '../../shared/models/common.info';
import {FiltersBarItemComponent} from '../filters-bar-item/filters-bar-item.component';
import {FiltersDialogSimpleComponent} from '../filters-dialog/filters-dialog-simple/filters-dialog-simple.component';
import {FiltersDialogMultiChooseComponent} from '../filters-dialog/filters-dialog-multi-choose/filters-dialog-multi-choose.component';
import {ToolbarService} from '../shared/toolbar.service';
import {FiltersDialogNumberComponent} from '../filters-dialog/filters-dialog-number/filters-dialog-number.component';
import {ScrollableComponent} from '../scrollable/scrollable.component';
import {finalize} from 'rxjs/operators';
import {FiltersDialogDateFilterComponent} from '../filters-dialog/filters-dialog-date-filter/filters-dialog-date-filter.component';
import {TemplateDirective} from '../../shared/directives/template.directive';
import {UtilityService} from '../../core/services/utility.service';
import {FiltersDialogDurationComponent} from '../filters-dialog/filters-dialog-duration/filters-dialog-duration.component';
import { FiltersDialogMonthComponent } from '../filters-dialog/filters-dialog-month/filters-dialog-month.component';

@Component({
    selector: 'ntk-filters-bar',
    templateUrl: './filters-bar.component.html',
    styleUrls: ['./filters-bar.component.scss']
})

export class FiltersBarComponent implements OnChanges {
    @Input() private filterItemWidth = 350;
    @Input() public currentFilters: FilterDefinition[] = [];
    @Input() public availableFilters: FilterDefinition[] = [];
    @Input() public outDateFormat: string;
    @Input() public customFilter: CustomFilter;
    // EJ4-1486
    @Input() public canManageGlobalFilters = false;


    @Input() showSaveFilter = true;
    @Input() showClearFilter = false;
    @Input() shownFavorite = false;
    @Input() templates: TemplateDirective[] = [];

    @Output() favoriteToggled = new EventEmitter();
    @Output() private getColumnFilterMultiSelectionValues = new EventEmitter();
    @Output() private countDataChange = new EventEmitter();
    @Output() private canCreateFilterChange = new EventEmitter();
    @Output() private fieldFiltersChanged = new EventEmitter();
    @Output() private fieldFiltersSaved = new EventEmitter();
    @Output() private fieldFilterRemoved = new EventEmitter();
    @Output() getPredefineFilters = new EventEmitter();

    @ViewChild('scroller', {static: false}) private scroller: ScrollableComponent;
    @ViewChildren(FiltersBarItemComponent) private filtersBarItemsComponent: QueryList<FiltersBarItemComponent>;
    @ViewChild('addFilterTrigger', {static: false}) private addFilterTrigger: MatMenuTrigger;

    public availableMenuItems: FilterDefinition[] = [];
    public showAddFilter = true;
    public isDirty = false;

    public isEmpty = true;
    private $element: JQuery;
    private loaded = new EventEmitter();
    private dialogResized = new Subject();
    // using for restore filter if next filter is invalid
    private oldClearFilter: FilterDefinition[] = [];
    private shouldNOTRaiseEvent: boolean;

    // Is first-toolbar blocked
    isFilterBarBlocked = false;

    get isShowSaveFilter() {
        return this.showSaveFilter && (!this.customFilter || !this.customFilter.Public || this.canManageGlobalFilters);
    }

    constructor(private dialog: MatDialog,
                private elementRef: ElementRef,
                private toolbarService: ToolbarService,
                private utilityService: UtilityService,
                private cd: ChangeDetectorRef) {
        this.$element = jQuery(elementRef.nativeElement);
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.customFilter && !changes.customFilter.isFirstChange()) {
            this.isDirty = this.isCustomFilterChanged();
            this.isEmpty = this.isCustomFiltersEmpty();
            this.updateFilterBar();
        }
    }

    ready() {
        this.isDirty = this.isCustomFilterChanged();
        this.isEmpty = this.isCustomFiltersEmpty();
        this.updateAvailableMenuItems();
    }


    public onFilterItemClicked(item: FilterDefinition) {
        if (item.canEdit && !this.isFilterBarBlocked) {
            // Boolean and QuickFilter have 1 value
            if (item.FilterType !== FilterType.Boolean && item.FilterType !== FilterType.QuickFilter) {
                this.isFilterBarBlocked = true;
                this.addOrEditFilter(item).subscribe(() => {
                }, () => {
                }, () => {
                    this.isFilterBarBlocked = false;
                });
            }
        }
    }

    public onMenuIemClicked(item: FilterDefinition) {
        setTimeout(() => {
            this.addOrEditFilter(item).subscribe();
        }, 500);
    }

    public onAddFilterClicked() {
        this.updateAvailableMenuItems();


        // Set height,position for menu
        let button = this.$element.find('.button-add-filter'),
            overlay = jQuery('.ntk-toolbar-available-menu-items').closest('.cdk-overlay-connected-position-bounding-box'),
            top = button.offset().top + button.height(),
            height = jQuery(window).height() - top;

        // Always at bottom if height*0.9 more than 230
        if (height * 0.9 < 230) {
            overlay.removeClass('ntk-toolbar-available-menu-overlay');
            overlay.find('.cdk-overlay-pane').css({'margin-top': '0px'});
            overlay.find('.mat-menu-panel').css({'max-height': 'none'});
        } else {
            overlay.addClass('ntk-toolbar-available-menu-overlay');
            overlay.find('.cdk-overlay-pane').css({'margin-top': top + 'px'});
            overlay.find('.mat-menu-panel').css({'max-height': 'calc(90vh - ' + top + 'px)'});
        }
    }


    /**
     * Reset filed-filters when click on Clear-Filter button
     */
    public onClearFieldFiltersClicked() {

        console.log('onClearFieldFiltersClicked');

        // Reset filed-filters
        let cannotRemoves = this.currentFilters.filter(f => !f.canRemove);
        // console.log('----------cannotRemoves=', cannotRemoves);

        this.currentFilters.splice(0, this.currentFilters.length);
        this.currentFilters.push(...cannotRemoves);

        this.isDirty = this.isCustomFilterChanged();
        this.isEmpty = this.isCustomFiltersEmpty();

        this.raiseFiltersChanged();
    }

    /**
     * Clear filter
     */
    public clearFilter(fireEvent = true) {
        // Remove item
        let removed = this.currentFilters.splice(0, this.currentFilters.length);

        // Reset values
        removed.forEach((itemRemoved) => {
            itemRemoved.reset();
        });

        if (fireEvent) {
            this.raiseFiltersChanged();
        }
    }

    /**
     * Show edit filter
     * @param {FilterDefinition} item
     */
    public addOrEditFilter(item: FilterDefinition): Observable<FilterDefinition[]> {
        return new Observable((subscriber) => {
            if (item.FilterOperator === FilterOperator.ClearBefore) {
                this.currentFilters.splice(0, this.currentFilters.length);
            } else {
                this.oldClearFilter = [];
                this.currentFilters.forEach((f, index) => {
                    if (f.FilterOperator === FilterOperator.ClearBefore) {
                        this.oldClearFilter.push(f);
                        this.currentFilters.splice(index, 1);
                    }
                });
            }
            // Remove filtes which is invaid  except current filter
            for (let i = 0; i < this.currentFilters.length; i++) {
                let filter = this.currentFilters[i];
                if (!this.isFilterItemValid(filter) && filter.ColumnName !== item.ColumnName) {
                    // Have to reset when remove filter
                    filter.reset();
                    this.currentFilters.splice(i, 1);
                    i--;
                }
            }

            // FilterType: Boolean
            if (item.FilterType === FilterType.Boolean) {
                let isNotExist: boolean = this.currentFilters.findIndex((currentFilter) => {
                    return currentFilter.ColumnName === item.ColumnName;
                }) === -1;
                if (isNotExist) { // Only push item if it don't exist
                    let newItem = item.clone(); // Clone new item
                    newItem.Value = [true];
                    this.currentFilters.push(newItem);

                    this.isDirty = this.isCustomFilterChanged(); // Check dirty
                    this.isEmpty = this.isCustomFiltersEmpty();

                    this.raiseFiltersChanged(); // Raise changes
                }
                this.updateFilterBar();
                this.createOrGetElementFromFilterItem(item).subscribe((result) => {
                    this.scroller.gotoElement(result[0]);
                });

                subscriber.next(this.currentFilters);
                subscriber.complete();
                return;
            }


            // Clone item
            let oldItem = item.clone();
            this.shouldNOTRaiseEvent = false;

            this.canCreateFilter(item).subscribe(() => {
                if (!this.isFilterItemValid(item)) { // Item is invaid
                    item.IsValid = false;
                    this.createOrGetElementFromFilterItem(item).subscribe((result) => {
                        let element: Element = result[0];
                        setTimeout(() => {
                            this.updateScroller();
                            setTimeout(() => {
                                this.scroller.gotoElement(element);
                                setTimeout(() => {
                                    this.updateScroller();
                                    subscriber.next(this.currentFilters);
                                    subscriber.complete();
                                }, 10);
                            }, 10);
                        }, 10);
                    });


                } else {
                    this.createOrGetElementFromFilterItem(item).subscribe((result) => {
                        let element: Element = $(result[0]).closest('.ntk-scrollable-item')[0],
                            newItem: FilterDefinition = result[1];
                        this.showInput(element);
                        this.updateScroller();
                        setTimeout(() => {
                            this.scroller.gotoElement(element);
                            this.showDialogFilter(newItem, element).pipe(finalize(() => {
                                this.hideInput(element);

                                setTimeout(() => {
                                    this.updateFilterBar();
                                    this.isDirty = this.isCustomFilterChanged();
                                    this.isEmpty = this.isCustomFiltersEmpty();
                                    if (!this.shouldNOTRaiseEvent) {
                                        this.raiseFiltersChanged();
                                    }
                                    subscriber.next(this.currentFilters);
                                    subscriber.complete();
                                }, 10);

                            })).subscribe(() => {
                                // Delete flag if item was accepted
                                if (newItem['isNew']) {
                                    delete newItem['isNew'];
                                }

                                // Valid currentFilters if filter has IsExpectedSingleSelection
                                this.currentFilters.forEach((filter) => {
                                    if (filter.IsExpectedSingleSelection) {
                                        filter.IsValid = this.isFilterItemValid(filter);
                                    }
                                });


                                // Remove expectors
                                for (let i = 0; i < this.currentFilters.length; i++) {
                                    let filter = this.currentFilters[i];
                                    if (filter.IsExpectedSingleSelection && filter.IsValid && filter.ExpectedFilterItem === oldItem.ColumnName) {
                                        if (!(newItem.SelectedItems.length === 1 && oldItem.SelectedItems.length === 1 && newItem.SelectedItems[0].Value === oldItem.SelectedItems[0].Value)) {
                                            const index = this.currentFilters.findIndex((currentItem) => {
                                                return currentItem.ColumnName === filter.ColumnName;
                                            });
                                            if (index !== -1) {
                                                let removedItems = this.currentFilters.splice(index, 1);
                                                removedItems.forEach((removedItem: FilterDefinition) => {
                                                    removedItem.reset();
                                                });
                                                i--;
                                            }
                                        }
                                    }
                                }


                            }, (action: string) => {
                                // Remove item if item is new item
                                if (action === 'remove') {
                                    let pos = this.currentFilters.indexOf(newItem);
                                    if (pos !== -1) {
                                        this.currentFilters.splice(pos, 1);
                                    }
                                    if (this.oldClearFilter.length > 0) {
                                        // this.currentFilters = JSON.parse(JSON.stringify(this.oldClearFilter));
                                        Object.assign(this.currentFilters, this.oldClearFilter);
                                        this.shouldNOTRaiseEvent = true;
                                    }
                                }

                            });
                        }, 10);


                    });
                }
            }, (error) => {
                if (this.oldClearFilter.length > 0) {
                    Object.assign(this.currentFilters, this.oldClearFilter);
                }
                subscriber.error(error);
                subscriber.complete();
            });


        });


    }


    /**
     * Emit loaded when FilterItem is loaded
     * @param {Element} el
     */
    public onFilterItemLoaded(el: Element) {
        this.updateScroller(); // Update scroller

        this.loaded.emit(el);
    }

    /**
     * Update scroller when have any fieldFilter was  destroy
     */
    public onFieldFilterDestroy() {
        setTimeout(() => {
            this.updateScroller(); // Update scroller
        }, 10);

    }


    /**
     * Remove filter
     * @param {FilterDefinition} item
     */
    public onRemoveClicked(item: FilterDefinition) {
        this.removeFieldFilter(item);

        this.isDirty = this.isCustomFilterChanged();
        this.isEmpty = this.isCustomFiltersEmpty();
        setTimeout(() => {
            this.updateFilterBar();
        }, 10);

    }


    /**
     * Show simple dialog
     * @param {FilterDefinition} item
     * @param {DialogPosition} position
     */
    private showSimpleDialog(item: FilterDefinition, position: DialogPosition) {
        const panelClass = [
            'no-animation',
            'ntk-toolbar-filters-dialog-component',
            'ntk-toolbar-theme'
        ];
        const dialogRef = this.openDialog(FiltersDialogSimpleComponent, {
            width: this.filterItemWidth + 'px',
            position: position,
            data: {
                filterDefinition: item.clone()
            },
            backdropClass: 'none-backdrop',
            panelClass: panelClass,
            disableClose: true
        });
        dialogRef.backdropClick().subscribe(() => {
            dialogRef.close(dialogRef.componentInstance.getFilterValues());
        });
        let ob = new Observable((subscriber) => {
            dialogRef.beforeClosed().subscribe((value) => {
                if (!value) { // cancel
                    subscriber.error(item['isNew'] ? 'remove' : '');
                    return;
                }

                item.Value = value.Value;
                item.CheckedAll = value.CheckedAll;
                subscriber.next(item);
                subscriber.complete();
            });
        });
        return {
            dialogRef: dialogRef,
            ob: ob
        };
    }

    /**
     * Show multi-choice dialog
     * @param {FilterDefinition} item
     * @param {DialogPosition} position
     */
    private showMultiChooseDialog(item: FilterDefinition, position: DialogPosition) {
        const panelClass = [
            'no-animation',
            'ntk-toolbar-filters-dialog-component',
            'ntk-toolbar-filters-dialog-component-has-content',
            'ntk-toolbar-filters-dialog-component-has-multi-choose',
            'ntk-toolbar-theme'
        ];

        let toolbarBottom = this.$element.offset().top + this.$element.height();
        let dialogRef = this.openDialog(FiltersDialogMultiChooseComponent, {
            width: this.filterItemWidth + 'px',
            position: position,
            data: {
                toolbarBottom: toolbarBottom,
                currentFilters: this.currentFilters,
                filterDefinition: item.clone(),
                template: this.geTemplate(item),
                getDisplayItems: (filter) => {
                    return new Observable((subscriber) => {
                        this.getColumnFilterMultiSelectionValues.emit({
                            filter: filter,
                            currentFilterItems: this.currentFilters,
                            observer: subscriber
                        });
                    });
                },
                getPredefineFilters: (filter) => {
                    return new Observable((subscriber) => {
                        this.getPredefineFilters.emit({
                            filter: filter,
                            currentFilterItems: this.currentFilters,
                            observer: subscriber
                        });
                    });
                }
            },
            backdropClass: 'none-backdrop',
            panelClass: panelClass
        });


        let ob = new Observable((subscriber) => {
            dialogRef.afterClosed().subscribe((value) => {
                if (!value) {
                    subscriber.error(item['isNew'] ? 'remove' : '');
                    return;
                }

                item.SelectedItems = value.SelectedItems;
                item.Value = value.Value;
                item.SelectedItemsTotal = value.SelectedItemsTotal;
                item.IsCheckboxSelectedAll = value.IsCheckboxSelectedAll;
                item.CheckedAll = value.CheckedAll;
                item.IsExclude = value.IsExclude;
                item.IsPredefined = value.IsPredefined;
                item.CanUpdateCheckedAll = value.CanUpdateCheckedAll;
                subscriber.next(item);
                subscriber.complete();

            });
        });

        return {
            dialogRef: dialogRef,
            ob: ob
        };
    }

    /**
     * Show Date dialog
     * @param {FilterDefinition} item
     * @param {DialogPosition} position
     */
    private showDateDialog(item: FilterDefinition, position: DialogPosition) {
        const panelClass = [
            'no-animation',
            'ntk-toolbar-filters-dialog-component',
            'ntk-toolbar-filters-dialog-component-has-content',
            'ntk-toolbar-filters-dialog-date-filter-panel',
            'ntk-toolbar-theme'
        ];
        const dialogRef = this.openDialog(FiltersDialogDateFilterComponent, {
            width: this.filterItemWidth + 'px',
            position: position,
            data: {
                filterDefinition: item.clone(),
                outDateFormat: this.outDateFormat
            },
            backdropClass: 'none-backdrop',
            panelClass: panelClass,
            autoFocus: false
        });
        let ob = new Observable((subscriber) => {
            dialogRef.beforeClosed().subscribe((value) => {
                if (!value) {
                    subscriber.error(item['isNew'] ? 'remove' : '');
                    return;
                }

                item.CheckedAll = value.CheckedAll;
                item.Value = value.Value;
                item.SelectedItems = value.SelectedItems;
                item.FilterOperator = value.FilterOperator;
                item.Data = {
                    Relative: value.Relative,
                    DateSelection: value.DateSelection,
                    DateType: value.DateType
                };

                subscriber.next(item);
                subscriber.complete();
            });
        });
        return {
            dialogRef: dialogRef,
            ob: ob
        };
    }

    /**
     * Show Number dialog
     * @param {any} component
     * @param {FilterDefinition} item
     * @param {DialogPosition} position
     */
    private showInputDialog(component: any, item: FilterDefinition, position: DialogPosition) {
        const panelClass = [
            'no-animation',
            'ntk-toolbar-filters-dialog-component',
            'ntk-toolbar-filters-dialog-component-has-content',
            'ntk-toolbar-filters-dialog-number-panel',
            'ntk-toolbar-theme'
        ];
        const dialogRef = this.openDialog(component, {
            width: this.filterItemWidth + 'px',
            position: position,
            data: {
                filterDefinition: item.clone(),
                outDateFormat: this.outDateFormat
            },
            backdropClass: 'none-backdrop',
            panelClass: panelClass,
            autoFocus: false
        });
        let ob = new Observable((subscriber) => {
            dialogRef.beforeClosed().subscribe((value) => {
                if (!value) {
                    subscriber.error(item['isNew'] ? 'remove' : '');
                    return;
                }
                if (value && value.Value.length === 0) { // value is empty
                    subscriber.error('remove');
                    return;
                }

                item.CheckedAll = value.CheckedAll;
                item.Value = value.Value;
                item.SelectedItems = value.SelectedItems;
                item.FilterOperator = value.FilterOperator;
                subscriber.next(item);
                subscriber.complete();
            });
        });
        return {
            dialogRef: dialogRef,
            ob: ob
        };
    }

    /**
     * Show month dialog
     * @param {FilterDefinition} item
     * @param {DialogPosition} position
     */
     private showMonthDialog(item: FilterDefinition, position: DialogPosition) {
        const panelClass = [
            'no-animation',
            'ntk-toolbar-filters-dialog-component',
            'ntk-toolbar-filters-dialog-component-has-content',
            'ntk-toolbar-theme'
        ];
        const dialogRef = this.openDialog(FiltersDialogMonthComponent, {
            width: this.filterItemWidth + 'px',
            position: position,
            data: {
                filterDefinition: item.clone()
            },
            backdropClass: 'none-backdrop',
            panelClass: panelClass
        });
        let ob = new Observable((subscriber) => {
            dialogRef.beforeClosed().subscribe((value) => {
                if (!value) { // cancel
                    subscriber.error(item['isNew'] ? 'remove' : '');
                    return;
                }

                item.Value = value.Value;
                subscriber.next(item);
                subscriber.complete();
            });
        });
        return {
            dialogRef: dialogRef,
            ob: ob
        };
    }

    private showNumberDialog(item: FilterDefinition, position: DialogPosition) {
        return this.showInputDialog(FiltersDialogNumberComponent, item, position);
    }

    private showDurationDialog(item: FilterDefinition, position: DialogPosition) {
        return this.showInputDialog(FiltersDialogDurationComponent, item, position);
    }

    private getOffset(el: Element) {
        let bodyRect = document.body.getBoundingClientRect(),
            elemRect = el.getBoundingClientRect();
        return {
            left: elemRect.left - bodyRect.left,
            top: elemRect.top - bodyRect.top
        };
    }

    /**
     * Show filter dialog
     * @param {FilterDefinition} item
     * @param {Element} el
     * @returns {Observable<any>}
     */
    private showDialogFilter(item: FilterDefinition, el: Element) {
        let result: { dialogRef: MatDialogRef<any>, ob: Observable<any> },
            dialogResizedObSubscriber = this.dialogResized.asObservable().subscribe(() => {
                this.scroller.gotoElement(el);
                let offset = this.getOffset(el),
                    offsetPx = {
                        left: offset.left + 'px',
                        top: offset.top + 'px'
                    };
                result.dialogRef.updatePosition(offsetPx);
            });


        let pos = this.getOffset(el),
            position = {
                left: pos.left + 'px',
                top: pos.top + 'px'
            };
        if (this.toolbarService.isSimpleFilter(item)) {
            result = this.showSimpleDialog(item, position);
        }
        if (this.toolbarService.isDateFilter(item)) {
            result = this.showDateDialog(item, position);
        }
        if (this.toolbarService.isNumberFilter(item)) {
            result = this.showNumberDialog(item, position);
        }
        if (this.toolbarService.isMultiChooseFilter(item)) {
            result = this.showMultiChooseDialog(item, position);
        }
        if (this.toolbarService.isDurationFilter(item)) {
            result = this.showDurationDialog(item, position);
        }
        if (this.toolbarService.isMonthFilter(item)) {
            result = this.showMonthDialog(item, position);
        }
        return result.ob.pipe(finalize(() => {
            dialogResizedObSubscriber.unsubscribe();
        }));
    }

    /**
     * Create or get element from filter
     * @param {FilterDefinition} item
     * @returns {Observable<any>}
     */
    private createOrGetElementFromFilterItem(item: FilterDefinition): Observable<[Element, FilterDefinition]> {
        if (!this.isFieldFilterExist(item)) {
            return this.createFieldFilter(item);
        } else {
            return this.getElementFromFilterItem(item);
        }
    }


    private getElementFromFilterItem(item: FilterDefinition): Observable<[Element, FilterDefinition]> {
        return new Observable((subscriber) => {
            let itemComponent = this.filtersBarItemsComponent.find((filtersBarItemComponent: FiltersBarItemComponent) => {
                return (filtersBarItemComponent.item.ColumnName === item.ColumnName);
            });
            subscriber.next([itemComponent.elementRef.nativeElement, item]);
        });
    }

    /**
     * Remove filter
     * @param {FilterDefinition} item
     */
    private removeFieldFilter(item: FilterDefinition) {
        const index = this.currentFilters.findIndex((currentItem) => {
            return currentItem.ColumnName === item.ColumnName;
        });
        if (index !== -1) {
            let removedItems = this.currentFilters.splice(index, 1);
            removedItems.forEach((removedItem: FilterDefinition) => {
                removedItem.reset();
            });
        }

        // Remove expectors
        for (let i = 0; i < this.currentFilters.length; i++) {
            let currentFilter = this.currentFilters[i];
            if (currentFilter.IsExpectedSingleSelection && currentFilter.ExpectedFilterItem === item.ColumnName) {
                // Remove currentFilters
                this.currentFilters.splice(i, 1);
                currentFilter.reset();

                // Raise event to parent
                this.fieldFilterRemoved.emit(currentFilter);

                i--;
            }
        }

        // Raise event to parent
        this.fieldFilterRemoved.emit(item);

        this.raiseFiltersChanged();
    }

    /**
     * Add new filter
     * @param item
     * @returns {Observable<any>}
     */
    private createFieldFilter(item: FilterDefinition): Observable<[Element, FilterDefinition]> {
        return new Observable((subscriber) => {
            let newItem = item.clone();
            newItem['isNew'] = true;
            this.currentFilters.push(newItem);
            this.loaded.subscribe({
                next: (el) => {
                    subscriber.next([el, newItem]);
                    subscriber.unsubscribe();
                }
            });
        });
    }

    /**
     * Update AvailableMenuItems
     */
    private updateAvailableMenuItems() {
        this.availableMenuItems = this.availableFilters.filter((filter: FilterDefinition) => {
            if ((filter.FilterType === FilterType.Selector || filter.FilterType === FilterType.Boolean) && filter.FilterOperator !== FilterOperator.ClearBefore) {
                return this.currentFilters.findIndex((item) => {
                    return item.ColumnName === filter.ColumnName;
                }) === -1;
            }
        });

        // Check display add-filter button
        setTimeout(() => {
            this.showAddFilter = this.availableMenuItems.length > 0 && !(this.currentFilters.length > 0 && this.currentFilters.findIndex(f => f.FilterOperator === FilterOperator.ClearBefore) !== -1);
        }, 100);
    }

    /**
     * Emit filter changed
     */
    private raiseFiltersChanged() {
        this.fieldFiltersChanged.emit(this.currentFilters);
    }

    /**
     * Update scroller
     */
    public updateScroller() {
        this.scroller.updateScroller();
    }

    public updateFilterBar() {
        this.updateAvailableMenuItems();

        this.cd.detectChanges();
        this.updateScroller();
    }

    /**
     * Can create filter
     * @param {FilterDefinition} item
     * @returns {Observable<any>}
     */
    private canCreateFilter(item: FilterDefinition) {
        return new Observable((subscriber) => {
            let data = {
                columnName: item.ColumnName,
                currentFilterItems: this.currentFilters,
                observer: subscriber
            };
            this.canCreateFilterChange.emit(data);
        });

    }

    /**
     * Check filter is valid
     * @param {FilterDefinition} filterItem
     * @returns {boolean}
     */
    private isFilterItemValid(filterItem: FilterDefinition) {
        if (filterItem.IsExpectedSingleSelection && filterItem.ExpectedFilterItem) {
            let matched = this.currentFilters.find((item) => {
                return item.ColumnName === filterItem.ExpectedFilterItem;
            });
            return matched && (matched.SelectedItemsTotal === 1);
        }
        return true;
    }


    /**
     * Bind event when click on save button to save CustomFilter
     */
    onSaveCustomFilterClicked() {
        this.fieldFiltersSaved.emit(this.currentFilters);
    }


    /**
     * Trigger toggle favorite
     * @param item
     */
    onFavoriteToggled(item) {
        this.favoriteToggled.emit(item);
    }

    private isFieldFilterExist(item: FilterDefinition) {
        return this.currentFilters.findIndex((filter) => {
            return filter.ColumnName === item.ColumnName;
        }) !== -1;
    }


    /**
     * Check toolbar have any change
     * @returns {boolean}
     */
    isCustomFilterChanged() {
        return !this.toolbarService.isEqualFieldsFilter(this.customFilter ? this.customFilter.Filters : [], this.currentFilters);
    }

    private isCustomFiltersEmpty() {
        return !this.currentFilters || this.currentFilters.length === 0;
    }

    showInput(element: Element) {
        $(element).addClass('hide-content');
    }

    hideInput(element: Element) {
        $(element).removeClass('hide-content');
    }

    onScrollResized() {
        setTimeout(() => { // Delay to render 2 button next, back
            this.dialogResized.next();
        }, 100);
    }

    private geTemplate(item: FilterDefinition): TemplateRef<any> {
        let templateDirective: TemplateDirective = this.templates.find((template: TemplateDirective) => {
            return template.name === item.ColumnName;
        });
        if (templateDirective) {
            return templateDirective.tpl;
        }
    }

    onSubMenuAddFilterClicked() {
        this.updateAvailableMenuItems();
        this.addFilterTrigger.restoreFocus = false;
        this.addFilterTrigger.openMenu();
    }

    private openDialog(component, config: MatDialogConfig): MatDialogRef<any> {
        // Setup autoFocus
        config.autoFocus = false;


        let isFullscreen = this.utilityService.isSmallScreen || this.utilityService.isDevice || ($(window).height() - parseFloat(config.position.top) < 350);

        if (isFullscreen) {
            // Fullscreen
            if (config.data) {
                config.data.isSmallScreen = true;
            }
            config.width = '100%';
            config.height = '100%';
            config.position = null;

            (<string[]>config.panelClass).push('ntk-toolbar-filters-dialog-component-fullscreen');
        }

        if (config.data) {
            config.data.autoFocus = this.toolbarService.canAutoFocus();
        }

        return this.dialog.open(component, config);
    }
}
