import {MatMenuTrigger} from '@angular/material';
import {forkJoin, interval, Observable, of, Subscription, timer} from 'rxjs';
import {debounce, finalize, tap} from 'rxjs/operators';
import {
    AfterViewInit,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    HostBinding,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {
    BaseQueryCondition,
    CustomFilter,
    DataType,
    DisplayItem,
    FilterDefinition,
    FilterOperator,
    FilterType,
    IDisplayItem,
    SelectableItem,
    SortItem,
    TemplateRefModel,
    ToolbarFilterViewType
} from '../shared/models/common.info';


import {ToolbarFiltersComponent} from './toolbar-filters/toolbar-filters.component';
import {ToolbarSortsComponent} from './toolbar-sorts/toolbar-sorts.component';
import {FiltersBarComponent} from './filters-bar/filters-bar.component';
import {ToolbarService} from './shared/toolbar.service';
import {HelperService} from '../core/services/helper.service';
import {CustomFiltersComponent} from './custom-filters/custom-filters.component';
import {Subscriber} from 'rxjs/Subscriber';
import {ToolbarLayoutsComponent} from './toolbar-layouts/toolbar-layouts.compopnent';
import {CustomFilterDialog} from './custom-filter-dialog/custom-filter-dialog';
import {AppConfig} from '../core/app.config';
import {TemplateDirective} from '../shared/directives/template.directive';
import {AuthenticationService} from '../core/services/authentication.service';
import {ToolbarSearchComponent} from './toolbar-search/toolbar-search.component';
import {NotificationService} from './shared/notification.service';
import {Subject} from 'rxjs/Subject';

@Component({
    selector: 'ntk-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    // @HostBinding('class')
    protected _elementClass = 'ntk-toolbar ntk-toolbar-theme';
    private baseClassList = 'ntk-toolbar ntk-toolbar-theme ';

    @Input('class')
    @HostBinding('class')
    get elementClass(): string {
        let elementClass = this._elementClass.split(' ');
        elementClass.push('ntk-flexible-toolbar');
        if (this.isSmallScreen) {
            elementClass.push('is-small-screen');
        }
        if (this.isDevice) {
            elementClass.push('is-device');
        }
        if (this.isSearchFullscreen) {
            elementClass.push('is-search-fullscreen');
        }
        return elementClass.join(' ');
    }

    set elementClass(val: string) {
        this._elementClass = this.baseClassList + val;
    }

    // Title
    @Input() public title: string;
    @Input() public titlePrefixKey: string;
    @Input() public titleMinWidth: number; // The width of title
    @Output() private titleClicked = new EventEmitter();


    // Viewmode
    @Input() public currentViewMode: string;
    @Input() public showViewModeMenu = true;
    @Output() private viewModeChanged = new EventEmitter();


    @Input() public showFilterMenu = true;
    @Input() public showSortMenu = true;
    @Input() public showUserMenu = true;
    @Input() public showCustomFilter = true;
    @Input() public showNotification = true;
    @Input() public showNewReleaseAlert = true;
    @Input() public showTitle = true;
    @Input() public showSearch = true;
    @Input() public showFavorite = true;
    @Input() public showClearFilter = false;
    @Input() public disableSearchText = false;
    @Input() public showMoreOver = true; // using for mobile
    @Input() public showNotificationTooltip = true; // NF-356: show/hide notification tooltip

    // EJ4-1486
    @Input() public canManageGlobalFilters = false;


    // Toogle button
    @Input() showExpandCollapseButton = false;
    @Output() expandCollapseButtonClick = new EventEmitter();
    isCollapsedButton = false;


    @Input() public menuAlignRight = true;
    @Input() public outDateFormat: string;
    @Input() private extraFieldFilters: FilterDefinition[] = [];
    @Input() private extraSorts: SortItem[] = [];
    @Input() storageKey: string;
    @Input('value') private queryCondition: BaseQueryCondition;
    @Output() private filtersChanged = new EventEmitter();

    //

    // For user menu items config
    @Input() showUserProfileItem = true;
    @Input() showChangePasswordItem = true;
    @Input() showChangeLangualeItem = true;
    @Input() showUserSettingItem = true;
    @Input() showNotificationMenu = true;
    @Input() showReleaseNotesItem = true;
    //


    @Output() private getColumnFilterChange = new EventEmitter();
    @Output() private countDataChange = new EventEmitter();
    @Output() private canCreateFilterChange = new EventEmitter();
    @Output() private getPredefineFiltersChange = new EventEmitter();
    @Output() onReady = new EventEmitter();

    @ViewChild('menuFiltersTrigger', {static: false}) menuFiltersTrigger: MatMenuTrigger;
    @ViewChild(FiltersBarComponent, {static: false}) private filtersBarComponent: FiltersBarComponent;
    @ViewChild(CustomFiltersComponent, {static: false}) private customFiltersBar: CustomFiltersComponent;


    @ContentChild(ToolbarFiltersComponent, {static: false}) private toolbarFiltersComponent: ToolbarFiltersComponent;
    @ContentChild(ToolbarSortsComponent, {static: false}) private toolbarSortsComponent: ToolbarSortsComponent;
    @ContentChild(ToolbarLayoutsComponent, {static: false}) private toolbarLayoutsComponent: ToolbarLayoutsComponent;

    @ContentChild('userAccountTemplate', {static: false}) userAccountTemplate: TemplateRef<any>;


    @ContentChildren(TemplateDirective) templateDirectives: QueryList<TemplateDirective>;
    public templates: TemplateRefModel[] = [];

    public searchText = ''; // Keysearch
    public disabledSorted = false; // Check sort disabled
    public availableSorts: SortItem[] = []; // Menu sort
    public availableFilters: FilterDefinition[] = []; // Menu field filters
    public filterBys: FilterDefinition[] = []; // Contains items in Filter-By Menu (Menu Filter)
    public filterFields: FilterDefinition[] = []; // Contains items which don't exist currentFilterFields  in Fields-filter Menu (Menu Filter)

    public availableViewModes: SelectableItem[] = []; // Layouts
    public currentFilterFields: FilterDefinition[] = []; //  current fields  on second bar
    public customFilters: CustomFilter[] = []; // items on Custom Filters Menu
    public pinnedFilters: CustomFilter[] = []; // items on first bar
    public selected: CustomFilter; // current custom filter on first bar
    public isShowFirstBar = false; // Check visible first-bar
    public isShowSecondBar = false; // Check visible second-bar
    public toolbarReady = false; // Check  toolbar ready

    public oldQueryCondition: BaseQueryCondition; // old condition to compare 2 conditions  to raise the changes
    private readyCounter = 0; // To check when toolbar ready ( Toolbar is ready when readyCounter = 2)


    private customFiltersChanged = new EventEmitter();
    private fieldsFilterChanged = new EventEmitter();
    protected readonly toolbarService: ToolbarService; // toolbarService is instance of ToolbarService
    protected authenticationService: AuthenticationService;
    public toolbarConfig: any;

    isShowNewReleaseAlert: boolean;
    isShowNotification: boolean;
    shownFavoriteIcon: boolean;

    // For Notification Panel Config
    hideNotificationSetting = false;
    hideNotificationHistory = false;


    isShowFavorite = false;
    favorites: FilterDefinition[] = [];

    @Input() protected shownAllItemsOnFilterFields = true;

    protected helperService: HelperService;

    // for app config
    configHideNotification = false;
    configHideNewReleaseAlert = false;
    configHideUserMenu = false;


    // NBSHD-4407
    @Input() showMenuButton = false;
    @Input() isForceDesktop = true; // Force toolbar work on desktop mode
    @Output() menuButtonClick = new EventEmitter();
    @ViewChild('menuSortsTrigger', {static: false}) private menuSortsTrigger: MatMenuTrigger;
    @ViewChild('menuFiltersByTrigger', {static: false}) private menuFiltersByTrigger: MatMenuTrigger;
    @ViewChild('menuViewModeTrigger', {static: false}) private menuViewModeTrigger: MatMenuTrigger;
    @ViewChild(ToolbarSearchComponent, {static: false}) toolbarSearchComponent: ToolbarSearchComponent;
    isForceShowSearch = true;
    isSearchFullscreen = false;
    isSmallScreen = false;
    isDevice = false;
    @Input() showUserMenuOnOptionMenu = true;
    userMenuItems: IDisplayItem[] = [];
    optionsItems: IDisplayItem[] = [];

    // NBSHD-4134: Display count for custom filter
    @Input() showCustomFiltersCount = false; // Check visible Count of CustomFilter
    @Input() controllerName: string; // The name of controller in server to get custom filter count
    @Input() getCustomFiltersCount: any;
    @Input() updateCountMinute = 15;
    private customFiltersCountInterval: Subscriber<any>;
    loadingRequest: Subscription;
    showLoadingCountTimer: any;
    private customFiltersCountChange: Subject<boolean> = new Subject<any>(); // search event
    private customFiltersCountChangeTimer: Subscription;

    private unCustomFiltersCountRefresh: Subscription;
    private unCustomFiltersLoaded: Subscription;
    // reset these value to init value when using back button;
    private _initShowMenuButton: boolean;
    private _initShowMoreOver: boolean;

    get FilterType() {
        return FilterType;
    }

    get FilterOperator() {
        return FilterOperator;
    }

    constructor(protected injector: Injector) {
        this.helperService = this.injector.get(HelperService);
        this.toolbarService = this.injector.get(ToolbarService).getInstance(); // toolbarService is intance of ToolbarService
        this.authenticationService = this.injector.get(AuthenticationService);
        this.isDevice = this.helperService.UtilityService.isDevice; // Check is run on device

        let appCfg = this.injector.get(AppConfig, null);

        if (appCfg && appCfg.toolbarConfig) {
            this.configHideNotification = appCfg.toolbarConfig.hideNotification === true;
            this.configHideNewReleaseAlert = appCfg.toolbarConfig.hideNewReleaseAlert === true;
            this.configHideUserMenu = appCfg.toolbarConfig.hideUserMenu === true;
            this.hideNotificationHistory = appCfg.toolbarConfig.hideNotificationHistory;
            this.hideNotificationSetting = appCfg.toolbarConfig.hideNotificationSetting;

            if (appCfg.toolbarConfig.userMenuConfig) {
                this.showUserProfileItem = appCfg.toolbarConfig.userMenuConfig.showUserProfileItem === true;
                this.showChangePasswordItem = appCfg.toolbarConfig.userMenuConfig.showChangePasswordItem === true;
                this.showChangeLangualeItem = appCfg.toolbarConfig.userMenuConfig.showChangeLangualeItem === true;
                this.showUserSettingItem = appCfg.toolbarConfig.userMenuConfig.showUserSettingItem === true;
                this.showNotificationMenu = appCfg.toolbarConfig.userMenuConfig.showNotificationMenu === true;
                this.showReleaseNotesItem = appCfg.toolbarConfig.userMenuConfig.showReleaseNotesItem === true;
            }
        }
    }

    ngOnInit() {
        // Listen Custom-Filters when changed
        this.customFiltersChanged.subscribe(() => {
            this.checkVisibleBar();
        });
        this.fieldsFilterChanged.subscribe(() => {
            this.checkVisibleBar();
        });


        // Check status of sorted
        this.disabledSorted = this.isDisabledSorted();


        // Set storageKey for storage
        this.setStorageKey(this.storageKey);

        // Set ControllerName for CustomFilterCount
        this.setControllerName(this.controllerName);

        /**
         * NBSHD-4407: Watch resize to update layout
         */
        this.helperService.UtilityService.screenResizeToSmall().subscribe((isSmallScreen) => {
            if (!this.isForceDesktop) {
                this.isSmallScreen = isSmallScreen; // Update screen
                this.isForceShowSearch = !isSmallScreen;


                this.updateScreen();
            }

        });

        // NBSHD-4134: Refresh update count
        // @ts-ignore
        this.customFiltersCountInterval = interval(this.updateCountMinute * 60 * 1000).subscribe(() => {
            if (this.showCustomFiltersCount) {
                this.refreshCustomFiltersCount();
            }
        });

        // delay 1000 to update count
        this.customFiltersCountChangeTimer = this.customFiltersCountChange.asObservable().pipe(debounce(() => {
            return timer(1000);
        })).subscribe((showLoading) => {
            if (this.showCustomFiltersCount) {
                this.updateCustomFiltersCount(showLoading);
            }
        });

        // Refresh customFilter when refresh data from list, datatable
        this.unCustomFiltersCountRefresh = this.injector.get(ToolbarService, null).onCustomFiltersCountRefresh().subscribe(() => {
            if (this.showCustomFiltersCount) {
                this.refreshCustomFiltersCount();
            }
        });
        this._initShowMenuButton = this.showMenuButton;
        this._initShowMoreOver = this.showMoreOver;
    }

    ngAfterViewInit() {
        this.init();
    }

    ngOnDestroy() {

        // Unregister load custom-filters
        if (this.unCustomFiltersLoaded) {
            this.unCustomFiltersLoaded.unsubscribe();
        }

        // Unregister interval to refresh count
        if (this.customFiltersCountInterval) {
            this.customFiltersCountInterval.unsubscribe();
        }

        // Unregister delay 15 minutes to refresh count
        if (this.customFiltersCountChange) {
            this.customFiltersCountChange.unsubscribe();
        }

        if (this.customFiltersCountChangeTimer) {
            this.customFiltersCountChangeTimer.unsubscribe();
        }

        // Unregister on toolbar service
        if (this.unCustomFiltersCountRefresh) {
            this.unCustomFiltersCountRefresh.unsubscribe();
        }

        this.cancelRequest();
    }


    ngOnChanges(changes: SimpleChanges) {
        // Disable/Enable sort when layout was changed
        if (changes.currentViewMode && !changes.currentViewMode.isFirstChange()) {
            this.disabledSorted = this.isDisabledSorted();
        }

        // Update availableFilters
        if (changes.extraFieldFilters && !changes.extraFieldFilters.isFirstChange()) {
            this.setAvailableFilters(changes.extraFieldFilters.currentValue);
            if (this.queryCondition.ArchiveType) {
                this.setFilterBy(this.queryCondition.ArchiveType);
            }
        }

        // Update availableSorts
        if (changes.extraSorts && !changes.extraSorts.isFirstChange()) {
            this.setAvailableSorts(changes.extraSorts.currentValue);
            if (this.queryCondition.SortBy) {
                this.setSort(this.queryCondition.SortBy);
            }
        }

        // Update toolbar by queryCondition when storageKey was changed
        if (changes.storageKey && !changes.storageKey.isFirstChange()) {
            this.setStorageKey(changes.storageKey.currentValue);
        }

        // Update controllerName for count custom filters
        if (changes.controllerName && !changes.controllerName.isFirstChange()) {
            this.setControllerName(changes.controllerName.currentValue);
        }
    }

    /**
     * Check ready toolbar
     * This function is called 2 times:
     *  - Toolbar was loaded child component  (ngAfterViewInit)
     *  - The component includes toolbar will call this function when user logined
     */
    init() {
        this.readyCounter++;
        if (this.readyCounter === 2) { // Toolbar is ready when readyCounter = 2
            setTimeout(() => {
                this.ready();
            }, 0);
        }
    }

    /**
     * the child component was ready and User logined
     */
    private ready() {
        // Format date is loaded from AuthenticationService
        this.outDateFormat = this.authenticationService.dateFormat;

        this.toolbarReady = true;

        // Set templates for filter-bar
        this.templateDirectives.forEach((item) => {
            this.templates.push({
                tpl: item.tpl,
                name: item.name
            });
        });

        // NF-458: some module dont work with filter component
        if (this.toolbarFiltersComponent) {
            this.toolbarFiltersComponent.items.forEach((item) => {
                this.templates.push({
                    tpl: item.template,
                    name: item.columnName
                });
            });
        }        

        this.setAvailableFilters(this.extraFieldFilters);
        this.setAvailableSorts(this.extraSorts);

        // Layout
        if (this.toolbarLayoutsComponent) {
            this.availableViewModes = this.toolbarLayoutsComponent.items.toArray().map((item) => {
                return new SelectableItem(item.value, null, item.translateKey, false);
            });
        } else {
            this.availableViewModes = this.getViewModes();
        }

        // Restore toolbar from QueryCondition
        this.restoreToolbarByQueryCondition(this.queryCondition);


        // Show|Hide 2 bar
        setTimeout(() => {
            this.checkVisibleBar();
        }, 100);

        let onReady = () => {
            this.onReady.emit();
        };

        if (this.showFavorite) {
            let currentCustomFilter: CustomFilter = this.toolbarService.getCurrentCustomFilter();
            this.shownFavoriteIcon = currentCustomFilter == null;
        }

        // Set oldQueryCondition
        this.oldQueryCondition = this.buildQueryCondition();

        // Init custom-filters
        if (this.showCustomFilter) {
            this.setAvailableCustomFilters(onReady);
        } else {
            this.filtersBarComponent.ready();
            onReady();
        }

        // NBSHD-4407
        this.buildUserMenuItems(); // Build userMenu
        this.buildOptionsItems(); // Build a
        this.updateScreen();
    }

    setAvailableCustomFilters(cb?) {
        if (this.unCustomFiltersLoaded) {
            this.unCustomFiltersLoaded.unsubscribe();
            this.unCustomFiltersLoaded = null;
        }

        this.unCustomFiltersLoaded = this.initCustomFilters().subscribe(() => {
            // Restore selected if selected is custom-filter
            let currentCustomFilter: CustomFilter = this.toolbarService.getCurrentCustomFilter();


            if (currentCustomFilter) {
                // EJ4-1552: Move the code of get this.selected only when the currentCustomFilter have value
                // NBSHD-4211: Incorrect management of the "module" in the saved filter (filter bar)
                // Reset selected in the case have more than one content depend on 1 toolbar
                this.selected = JSON.parse(JSON.stringify(currentCustomFilter));

                let matched: CustomFilter = this.customFilters.find((item) => {
                    return item.Id === currentCustomFilter.Id;
                });
                if (matched) {
                    let currentFilter: BaseQueryCondition = this.toolbarService.getCurrentFilter();
                    if (this.toolbarService.isEqualFieldsFilter(currentFilter.ColumnFilters, matched.Filters)) {
                        this.oldQueryCondition.ColumnFilters = currentFilter.ColumnFilters;
                    }
                    this.setSelected(matched);

                } else {
                    this.setSelected(null);
                }
            } else { // Check visible toolbar
                this.checkVisibleBar();
            }

            this.filtersBarComponent.ready();

            // NBSHD-4134: Display count
            this.refreshCustomFiltersCount();

            if (cb) {
                cb();
            }
        });
    }


    /**
     * Change the layout, when click on layout-item
     * @param {string} viewModeValue
     */
    onViewModeClicked(viewModeValue: string) {
        this.currentViewMode = viewModeValue;
        this.disabledSorted = this.isDisabledSorted();

        this.saveViewMode(viewModeValue);
        this.viewModeChanged.emit(viewModeValue);
    }


    /**
     * Click on title to emit to parent
     */
    onTitleClicked() {
        this.titleClicked.emit();
        this.refreshCustomFiltersCount(false);
    }


    onFilterByClicked(item: FilterDefinition) {
        // document.getElementById('ntk-toolbar-btn-filter');
        this.filterBy(item.ColumnName);
        this.refreshCustomFiltersCount();
    }

    /**
     * Bind event when click on field-filter (menu)
     * Add or Edit filter if type is selector
     * Raise filter changed if type is action
     * When click on filter-item
     * @param {FilterDefinition} item
     */
    onFieldFilterClicked(item: FilterDefinition) {
        let pos = this.currentFilterFields.findIndex((filter) => {
            return filter.ColumnName === item.ColumnName;
        });
        let newItem = pos === -1 ? item : this.currentFilterFields[pos];
        this.addOrEditFilter(newItem).subscribe();
    }

    public clearFilter(fireEvent = true) {
        this.searchText = '';
        this.oldQueryCondition = null;
        this.filtersBarComponent.clearFilter(fireEvent);
    }

    onFieldFiltersChanged() {
        this.raiseFieldFilterChanged();
        this.raiseFiltersChanged();
    }

    /**
     * When sort changed, Update sort and raise filter changed
     * @param {SortItem} item
     */
    onSortClicked(item: SortItem) {
        if (item.IsSelected) {
            item.toggleSort();
        } else {
            // Set active
            item.active('desc');
        }

        // Save sort
        this.sortBy(item.SortBy);
    }

    /**
     * Detect can create a filter
     * @param data
     */
    canCreateFilter(data) {
        this.canCreateFilterChange.emit(data);
    }

    /**
     * Count total of multi-choice
     * @param data
     */
    countData(data) {
        this.countDataChange.emit(data);
    }

    getPredefineFilters(data) {
        this.getPredefineFiltersChange.emit(data);
    }

    /**
     * Get the list of multi-choice
     * @param data
     */
    filterMultiSelectionValues(data) {
        this.getColumnFilterChange.emit(data);
    }

    menuOpened() {
        this.updateMenuFilters();

        let overlay = jQuery('.ntk-toolbar-menu').closest('.cdk-overlay-connected-position-bounding-box').addClass('ntk-toolbar-menu-overlay');
        if (this.menuAlignRight) {
            overlay.addClass('ntk-toolbar-menu-overlay-align-right');
        }

        // Style only for device if browser run on device
        if (this.isDevice) {
            overlay.addClass('ntk-toolbar-menu-overlay-view-mode-is-device');
        }
    }

    public addFilter(name: string, data: string | DisplayItem[] | any, canEdit = true, canRemove = true) {
        let filterIndex = this.currentFilterFields.findIndex((item: FilterDefinition) => {
            return item.ColumnName === name;
        });
        let availablefilter = this.availableFilters.find((item: FilterDefinition) => {
            return item.ColumnName === name;
        });
        let filter = new FilterDefinition(availablefilter);
        filter.canEdit = canEdit;
        filter.canRemove = canRemove;

        if (filterIndex === -1) {
            this.currentFilterFields.push(filter);
        } else {
            // Push filter to old position
            this.currentFilterFields.splice(filterIndex, 1, filter);
        }


        if (this.toolbarService.isSimpleFilter(filter)) {
            filter.Value = [data];
        }
        if (this.toolbarService.isMultiChooseFilter(filter)) {
            // tslint:disable-next-line
            filter.SelectedItems = <DisplayItem[]>data;
            let ids = filter.SelectedItems.map((item) => {
                return item.Value;
            });
            if (this.toolbarService.isEnumBool(filter)) {
                filter.Value = ids;
            } else {
                filter.Value = {
                    IsExclude: false,
                    EffectedIds: ids
                };
            }

        }


        this.raiseFiltersChanged();
    }


    /**
     * Bind event when click on custom-filter item (menu)
     * @param {CustomFilter} item
     */
    onCustomFilterClicked(item: CustomFilter) {
        // Select item if  item isn't  selected
        if (!this.isSelected(item)) {
            this.selectCustomFilter(item).subscribe();
            this.refreshCustomFiltersCount();
        }
    }


    private closeFiltersMenu() {
        this.menuFiltersTrigger.closeMenu();
    }

    /**
     * Bind event when click on remove button on menu to remove custom-filter
     * @param {CustomFilter} filter
     * @param {MouseEvent} ev
     */
    onButtonRemoveCustomFilterClicked(filter: CustomFilter, ev: MouseEvent) {
        // Prevent event
        ev.stopImmediatePropagation();

        // Close menu
        this.closeFiltersMenu();

        // Call handle remove
        this.showConfirmAndRemoveRemoveCustomFilter(filter);
    }

    /**
     * Bind event when click on edit button on menu to edit custom-filter
     * @param {CustomFilter} filter
     * @param {MouseEvent} ev
     */
    onButtonEditCustomFilterClicked(filter: CustomFilter, ev: MouseEvent) {
        // Prevent event
        ev.stopImmediatePropagation();

        // Close menu
        this.closeFiltersMenu();

        // Show dialog "Edit Custom Filter"
        this.showEditCustomFilterDialog(filter);
    }

    /**
     * Bind event when click on pin button (on menu)
     * @param {CustomFilter} item
     * @param {MouseEvent} ev
     */
    onButtonTogglePinClicked(item: CustomFilter, ev: MouseEvent) {
        // Prevent event
        ev.stopImmediatePropagation();

        // We only allow change the pin status when not public filter or not pinned filter
        if (!item.Public || !item.MustPinned) {
            // Pin|UnPin item
            this.setPin(item, !item.Pinned);
        }
        this.refreshCustomFiltersCount();
    }

    /**
     * Bind event when click on favorite icon (menu)
     * @param {FilterDefinition} item
     * @param {MouseEvent} ev
     */
    onButtonFavoriteClicked(item: FilterDefinition, ev: MouseEvent) {
        // Prevent event
        ev.stopImmediatePropagation();

        this.setFavorite(item, !item.IsFavorite);
    }


    /**
     * Bind event when click on favorite icon on second-bar
     * @param item
     */
    onFavoriteToggled(item: FilterDefinition) {
        this.setFavorite(item, !item.IsFavorite);
    }


    /**
     * Select custom-filter
     * @param {CustomFilter} item
     */
    private selectCustomFilter(item: CustomFilter): Observable<any> {
        this.setSelected(item);
        return of(item);
    }

    /**
     * Bind event when click on custom-filter on first-bar
     * Select item if item is not selected
     * Unselect item if item is selected
     * @param {CustomFilter} item
     */
    onCustomFilterSelected(item: CustomFilter) {
        if (this.isSelected(item)) {
            // Unselect item
            this.selectCustomFilter(null).subscribe();
        } else {
            // Select item
            this.selectCustomFilter(item).subscribe();
        }

        this.refreshCustomFiltersCount(false);
    }

    /**
     * Show confirm removed and remove cutom-filter if choose yes
     * @param {CustomFilter} item
     */
    showConfirmAndRemoveRemoveCustomFilter(item: CustomFilter) {
        this.toolbarService.confirmRemoveCustomFilter().subscribe((result) => {
            if (result) { // agree remove
                this.blockUI();
                this.removeCustomFilter(item).pipe(finalize(() => {
                    this.unBlockUI();
                })).subscribe(() => {
                    // Unselect item if item is selected
                    if (this.isSelected(item)) {
                        this.setSelected(null);
                    }
                });
            }

        });
    }

    /**
     * Bind event when click on  remove button on first-bar
     */
    onCustomFilterRemoved(item: CustomFilter) {
        this.removeCustomFilterFromFirstToolbar(item);
        this.checkVisibleBar();
    }

    /**
     * Bind event when click on  pin button on first-bar to pin|unpin custom-filter
     * @param {CustomFilter} item
     */
    onCustomFilterPinToggled(item: CustomFilter) {
        this.setPin(item, !item.Pinned);
    }

    /**
     * Bind event when click on clear button on first-bar to unselect custom-filter
     */
    onClearFilterClicked() {
        this.setSelected(null);
    }

    /**
     * Check customFilter selected ?
     * @param {CustomFilter} customFilter
     * @returns {boolean}
     */
    private isSelected(customFilter: CustomFilter) {
        return this.selected && this.selected.Id === customFilter.Id;
    }


    /**
     * Save filters on second-bar when click "save filters" button
     * @param {FilterDefinition[]} filtes
     */
    onFieldFiltersSaved(filtes: FilterDefinition[]) {
        if (this.selected) { // Update custom-filtter
            // Show create custom filter dialog
            let clonedItem = new CustomFilter(this.selected);
            clonedItem.Filters = filtes;
            if (!clonedItem.Public) {
                clonedItem.Public = false;
            }
            if (!clonedItem.MustPinned) {
                clonedItem.MustPinned = false;
            }
            this.blockUI();
            this.toolbarService.saveCustomFilter(clonedItem)
                .pipe(finalize(() => {
                    this.unBlockUI();
                    this.refreshCustomFiltersCount();
                }))
                .subscribe((updatedCustomFilter: CustomFilter) => {
                    this.changeFieldFilters({
                        updated: updatedCustomFilter
                    });
                    this.setFilterBarStatus(false);
                });

        } else { // Create new custom-filter
            // Show create custom filter dialog
            let clonedItem = new CustomFilter({
                Filters: filtes
            });
            this.showCustomFilterDialog(clonedItem).subscribe((newCustomFilter: CustomFilter) => {
                if (newCustomFilter) { // ok
                    if (newCustomFilter.Public && newCustomFilter.MustPinned) {
                        newCustomFilter.Pinned = true;
                    }
                    this.changeFieldFilters({
                        created: newCustomFilter
                    });
                    this.setSelected(newCustomFilter);

                    this.refreshCustomFiltersCount();
                }

            });
        }
    }


    public filterBy(filterBy: string) {
        this.setFilterBy(filterBy);

        this.raiseFiltersChanged();
    }

    public sortBy(sortBy: string) {
        this.setSort(sortBy);

        this.raiseFiltersChanged();
    }


    /**
     * Get the list of layout
     * @returns {SelectableItem[]}
     */
    private getViewModes() {
        return [
            new SelectableItem('list-preview', null, 'lbLayoutListWithPreview', false),
            new SelectableItem('grid-preview', null, 'lbLayoutGridWithPreview', false),
            new SelectableItem('grid-full', null, 'lbLayoutGridFullScreen', false)
        ];
    }

    /**
     * Is sort disabled
     * @returns {boolean}
     */
    private isDisabledSorted() {
        let viewModeValue = this.currentViewMode,
            disabled = false;
        if (viewModeValue === 'list-preview') {
            disabled = false;
        }
        if (viewModeValue === 'grid-preview' || viewModeValue === 'grid-full') {
            disabled = true;
        }
        return disabled;
    }


    private raiseFiltersChanged() {
        let newQueryCondition: BaseQueryCondition = this.buildQueryCondition();
        if (!this.toolbarService.isEqualBaseQueryCondition(newQueryCondition, this.oldQueryCondition)) {

            this.oldQueryCondition = newQueryCondition.clone();


            // Optimize ColumnFilters
            // this.toolbarService.optimizeFieldsFilter(newQueryCondition.ColumnFilters);


            // Copy to queryCondition
            Object.assign(this.queryCondition, {
                ColumnFilters: newQueryCondition.ColumnFilters,
                SearchKeyword: newQueryCondition.SearchKeyword,
                SortBy: newQueryCondition.SortBy,
                ArchiveType: newQueryCondition.ArchiveType
            });

            // Save current filter
            this.toolbarService.saveCurrentFilter(JSON.parse(JSON.stringify(this.queryCondition)));

            this.filtersChanged.emit(this.queryCondition);

        }
    }

    /**
     * Build QueryBuild from Filters, Sorts
     * @returns {BaseQueryCondition}
     */
    private buildQueryCondition(): BaseQueryCondition {
        let queryCondition: BaseQueryCondition = new BaseQueryCondition();


        // Build ArchiveType
        this.availableFilters.forEach((f) => {
            if (f.FilterType === FilterType.Action && f.IsSelected) {
                queryCondition.ArchiveType = f.ColumnName;
            }
        });


        // Build Field-Filters
        this.currentFilterFields.forEach((f: FilterDefinition) => {
            if (f.IsValid) {
                let cloned = f.clone();
                queryCondition.ColumnFilters.push(cloned);
            }
        });

        // Build Sorts
        this.availableSorts.forEach((item) => {
            if (item.IsSelected) {
                queryCondition.SortBy = item.SortBy;
            }
        });


        // Build SearchKeyword
        queryCondition.SearchKeyword = this.searchText;


        // ExpandCollapseButton
        queryCondition.IsCollapsedButton = this.isCollapsedButton;

        return queryCondition;
    }

    private findCustomFilter(item: CustomFilter) {
        return this.pinnedFilters.findIndex((filter) => {
            return filter.Id === item.Id;
        });
    }

    private showEditCustomFilterDialog(filter: CustomFilter) {
        this.showCustomFilterDialog(filter).subscribe((updatedFilter: CustomFilter) => {
            if (updatedFilter) {
                filter.Name = updatedFilter.Name;
                filter.Public = updatedFilter.Public;
                filter.MustPinned = updatedFilter.MustPinned;
                if (filter.Public && filter.MustPinned) {
                    filter.Pinned = true;
                }

                this.customFiltersBar.updateScroller();
            }

        });
    }

    private showCustomFilterDialog(customFilter: CustomFilter) {
        let formData = {
            customFilter: customFilter,
            customFilters: this.customFilters,
            canManageGlobalFilters: this.canManageGlobalFilters,
            saveCallback: (item: CustomFilter) => {
                return this.toolbarService.saveCustomFilter(item, true);
            },
            autoFocus: this.toolbarService.canAutoFocus()
        };
        return this.helperService.DialogService.openDialog(CustomFilterDialog, formData, '500px', '300px', true, true, {
            panelClass: ['ntk-toolbar-custom-filter-dialog-panel', 'ntk-toolbar-theme'],
            autoFocus: false
        });
    }

    raiseCustomFiltersChanged() {
        this.customFiltersChanged.emit();
    }

    raiseFieldFilterChanged() {
        this.fieldsFilterChanged.emit();
    }

    /**
     * Pin|Unpin CustomFilter
     * @param {CustomFilter} item
     * @param {boolean} pinned
     */
    private setPin(item: CustomFilter, pinned: boolean) {
        // Set Pinned
        item.Pinned = pinned;

        // Save to localStorage
        this.toolbarService.togglePin(item.Id, pinned);

        // If item hasn't yet been, push it to list of pinned
        if (pinned) {
            let pos = this.pinnedFilters.findIndex((filter) => {
                return filter.Id === item.Id;
            });
            if (pos === -1) {
                this.pinnedFilters.push(item);
            }
        }

        this.raiseCustomFiltersChanged();

    }


    /**
     * Update favorite
     * @param {FilterDefinition} item
     * @param {boolean} isFavorite
     */
    private setFavorite(item: FilterDefinition, isFavorite: boolean) {

        // Set favorite
        item.IsFavorite = isFavorite;

        // Save to localStorage
        this.toolbarService.toggleFavorite(item.ColumnName, isFavorite);


        // Update favorite on Menu filters
        this.availableFilters.forEach((fieldFilter: FilterDefinition) => {
            if (fieldFilter.ColumnName === item.ColumnName) {
                fieldFilter.IsFavorite = isFavorite;
            }
        });

        // Update favorite on second-bar
        this.currentFilterFields.forEach((fieldFilter: FilterDefinition) => {
            if (fieldFilter.ColumnName === item.ColumnName) {
                fieldFilter.IsFavorite = isFavorite;
            }
        });

        this.raiseFieldFilterChanged();
    }


    private changeFieldFilters(changed) {
        let changedItem: CustomFilter = null;
        if (changed.created) {
            this.addCustomFilter(changed.created);
            changedItem = changed.created;
        }
        if (changed.updated) {
            this.updateCustomFilter(changed.updated);

        }
        return changedItem;
    }

    private removeCustomFilter(item: CustomFilter) {
        return this.toolbarService.removeCustomFilter(item).pipe(tap(() => {
            // Unpin item
            this.toolbarService.togglePin(item.Id, false);


            // Remove item from customFilters //
            let i = this.customFilters.findIndex((filter: CustomFilter) => {
                return item.Id === filter.Id;
            });
            if (i !== -1) {
                this.customFilters.splice(i, 1);
            }

            // Remove item from pinnedFilters
            let j = this.pinnedFilters.findIndex((filter: CustomFilter) => {
                return item.Id === filter.Id;
            });
            if (j !== -1) {
                this.pinnedFilters.splice(j, 1);
            }
        }));
    }

    /**
     * Remove custom-filter from toolbar, steps:
     * - Unpin custom-filter
     * - Remove custom-filter from pinnedFilters (items in first toolbar)
     * - Unselect if item is selected
     * @param {CustomFilter} item
     */
    private removeCustomFilterFromFirstToolbar(item: CustomFilter) {
        // Unpin current custom-filter
        item.Pinned = false;

        // Unpin item in local-storage
        this.toolbarService.togglePin(item.Id, false);

        // Remove item from pinnedFilters
        let j = this.pinnedFilters.findIndex((filter: CustomFilter) => {
            return item.Id === filter.Id;
        });
        if (j !== -1) {
            this.pinnedFilters.splice(j, 1);
        }

        // Unselect item if item is selected
        if (this.isSelected(item)) {
            this.setSelected(null);
        }
    }

    private getCustomFilters(): Observable<CustomFilter[]> {
        return this.toolbarService.getCustomFilters();
    }

    private addCustomFilter(filter: CustomFilter) {
        // Add to customFilters on menu bar
        let posOfCustomFilters = this.customFilters.findIndex((item) => {
            return item.Id === filter.Id;
        });
        if (posOfCustomFilters === -1) {
            this.customFilters.push(filter);
        }

        // Add to  pinnedFilters on first-bar
        let posOfPinnedFilters = this.pinnedFilters.findIndex((item) => {
            return item.Id === filter.Id;
        });
        if (posOfPinnedFilters === -1) {
            this.pinnedFilters.push(filter);
        }
    }

    private updateCustomFilter(filter: CustomFilter) {
        // Update customFilters on menu bar
        let posOfCustomFilters = this.customFilters.findIndex((item) => {
            return item.Id === filter.Id;
        });
        if (posOfCustomFilters !== -1) {
            this.customFilters[posOfCustomFilters].Filters = filter.Filters;
        }

        // Update pinnedFilters on first-bar
        let posOfPinnedFilters = this.pinnedFilters.findIndex((item) => {
            return item.Id === filter.Id;
        });
        if (posOfPinnedFilters !== -1) {
            this.pinnedFilters[posOfPinnedFilters].Filters = filter.Filters;
        }
    }


    /**
     * Change selected
     * @param {CustomFilter} item
     * @param {boolean} trigger
     */
    private setSelected(item: CustomFilter, trigger = true) {

        // Update for first bar
        this.selected = item;

        // Update field filters on second bar
        this.setCurrentFieldFilters(item ? item.Filters : []);


        // Push item to first-bar if item don't exist in first-bar
        if (item && this.findCustomFilter(item) === -1) {
            this.pinnedFilters.push(item);
        }

        /**
         * Remove currentCustomFilter in localStorage if  Item is null
         * Save  currentCustomFilter if  Item is CustomFilter
         */
        if (!item) {
            this.toolbarService.removeCurrentCustomFilter();
        } else {
            this.toolbarService.saveCurrentCustomFilter(item);
        }


        if (trigger) {
            // Raise changed
            this.raiseFiltersChanged();
            this.raiseCustomFiltersChanged();
        }

        if (this.showFavorite) {
            this.shownFavoriteIcon = this.selected == null;
        }

    }


    /**
     * Set field-filters on second-bar
     * @param {FilterDefinition[]} items
     */
    private setCurrentFieldFilters(items: FilterDefinition[]) {

        let cannotRemoves = this.currentFilterFields.filter(f => !f.canRemove);
        // Set field-filter on second-bar
        this.currentFilterFields.splice(0, this.currentFilterFields.length);
        this.currentFilterFields.push(...cannotRemoves);

        items.forEach((filter: FilterDefinition) => {
            this.currentFilterFields.push(new FilterDefinition(filter));
        });
    }

    /**
     * Init custom-filters
     * @returns {Observable<CustomFilter[]>}
     */
    private initCustomFilters(): Observable<CustomFilter[]> {
        // NBSHD-4211: Incorrect management of the "module" in the saved filter (filter bar)
        // Reset pinnedFilters, customFilters in the case have more than one content depend on 1 toolbar
        this.pinnedFilters.splice(0, this.pinnedFilters.length);
        this.customFilters.splice(0, this.customFilters.length);


        return this.getCustomFilters().pipe(tap((filters: CustomFilter[]) => {
            // Init customFilters, pinnedFilters
            filters.forEach((filter) => {
                filter.Pinned = this.toolbarService.getPin(filter.Id) || filter.MustPinned;
                filter.Filters = filter.Filters.map((item: FilterDefinition) => {

                    // Use data from availableFilters, don't use from localStorage
                    let resultAvailableFilter = this.availableFilters.find((availableFilter) => {
                        return availableFilter.ColumnName === item.ColumnName;
                    });
                    if (resultAvailableFilter) {
                        item.CanUpdateCheckedAll = resultAvailableFilter.CanUpdateCheckedAll;
                    }


                    return new FilterDefinition(item);
                });
                this.customFilters.push(filter);
                if (filter.Pinned) {
                    this.pinnedFilters.push(filter);
                }
            });
        }));
    }


    /*--------- Begin:Favorite ----------*/

    /**
     * Check fileds-filter have any favorite
     * @returns {boolean}
     */
    private hasFavorite(): boolean {
        return this.availableFilters.findIndex((item: FilterDefinition) => {
            return item.IsFavorite;
        }) !== -1;
    }


    /**
     * Bind event when click select a favorite
     *
     * @param {FilterDefinition} f
     */
    onFavoriteClicked(f: FilterDefinition) {
        let filter = f.clone();
        if (!this.selected) { // selected is null(favorite)
            let pos = this.currentFilterFields.findIndex((item) => {
                return filter.ColumnName === item.ColumnName;
            });
            let newItem = pos === -1 ? filter : this.currentFilterFields[pos];
            this.addOrEditFilter(newItem).subscribe();

        } else { // selected is CustomFilter
            this.setSelected(null, false);
            this.addOrEditFilter(filter).subscribe();
        }

    }

    onMenuFavoriteClicked() {
        this.favorites = this.availableFilters
            // Get all favorites
            .filter((filter: FilterDefinition) => {
                return filter.IsFavorite;
            })
            .map((filter: FilterDefinition) => {
                let cloned = filter.clone();
                cloned.IsSelected = false; // Deselect all
                if (!this.selected) {
                    if (this.currentFilterFields.find((fieldFilter) => {
                        return fieldFilter.ColumnName === cloned.ColumnName;
                    })) {
                        cloned.IsSelected = true;
                    }
                }
                return cloned;
            });
    }


    /*--------- End:Favorite ----------*/


    private showFirstBar() {
        this.isShowFirstBar = true;
    }

    private hideFirstBar() {
        this.isShowFirstBar = false;
    }

    private hideSecondBar() {
        this.isShowSecondBar = false;
    }

    private showSecondBar() {
        this.isShowSecondBar = true;
    }

    private checkVisibleSecondBar() {
        if (!this.selected && this.currentFilterFields.length === 0) {
            this.hideSecondBar();
        } else {
            this.showSecondBar();
        }
    }


    private checkVisibleFirstBar() {
        this.isShowFavorite = this.hasFavorite();


        // Check to show|hide first bar
        (this.pinnedFilters.length > 0 || this.hasFavorite()) ? this.showFirstBar() : this.hideFirstBar();

    }

    private checkVisibleBar() {
        this.checkVisibleFirstBar();
        this.checkVisibleSecondBar();
    }

    private blockUI() {
        this.helperService.isBusy = true;
    }

    private unBlockUI() {
        this.helperService.isBusy = false;
    }


    private saveViewMode(mode: string) {
        this.toolbarService.saveViewMode(mode);
    }


    private setFilterBy(archiveType: string) {
        this.availableFilters
            .filter((item) => {
                return item.FilterType === FilterType.Action;
            })
            .forEach((item) => {
                item.IsSelected = item.ColumnName === archiveType;
            });
    }

    private setSort(sortBy: string) {
        this.availableSorts.forEach((item: SortItem) => {
            // Restore to default
            if (item.equal(sortBy)) {
                item.active(sortBy);
            } else {
                item.reset();
            }
        });
    }

    private setFilterBarStatus(status: boolean) {
        this.filtersBarComponent.isDirty = status;
    }


    public restoreToolbarByQueryCondition(queryCondition: BaseQueryCondition) {
        // Restore SearchKeyword
        this.searchText = queryCondition.SearchKeyword || '';


        // Restore ArchiveType if ArchiveType is set
        if (queryCondition.ArchiveType) {
            this.setFilterBy(queryCondition.ArchiveType);
        }

        // Restore Sort
        if (queryCondition.SortBy) {
            this.setSort(queryCondition.SortBy);
        }

        // Restore favorite from storage
        this.availableFilters.forEach((item: FilterDefinition) => {
            item.IsFavorite = this.toolbarService.getFavorite(item.ColumnName);
        });


        if (queryCondition.ColumnFilters) {
            // NBSHD-3666:Reopen. Favorite filter: The start icon isn't updated when I come back from other module.
            // Update Favorite in ColumnFilters from localStorage
            queryCondition.ColumnFilters.forEach((filter: FilterDefinition) => {
                let result = this.availableFilters.find((availableFilter) => {
                    return availableFilter.ColumnName === filter.ColumnName;
                });
                if (result) {
                    filter.IsFavorite = result.IsFavorite;
                    filter.CanUpdateCheckedAll = result.CanUpdateCheckedAll;
                }
            });

            this.setCurrentFieldFilters(queryCondition.ColumnFilters);
        }

        // Restore fields-filter on second-bar
        this.isCollapsedButton = queryCondition.IsCollapsedButton;

        // Check visible toolbar
        this.checkVisibleBar();

    }


    /**
     * Update filter-by, fields filter
     */
    private updateMenuFilters() {
        this.filterBys.splice(0, this.filterBys.length);
        this.filterFields.splice(0, this.filterFields.length);

        // filterFields contains item in availableFilters without currentFilterFields
        this.availableFilters.forEach((item: FilterDefinition) => {
            if (item.FilterType === FilterType.Action) {
                this.filterBys.push(item);
            } else {
                if (this.shownAllItemsOnFilterFields) {
                    this.filterFields.push(item);
                } else {
                    if (this.currentFilterFields.findIndex((currentFilterField) => {
                        return currentFilterField.ColumnName === item.ColumnName;
                    }) === -1) {
                        this.filterFields.push(item);
                    }
                }

            }
        });
    }

    /**
     * Get instance of ToolbarService to get|save data to local
     * @returns {ToolbarService}
     */
    getToolbarService() {
        return this.toolbarService;
    }

    setStorageKey(storageKey: any) {
        this.storageKey = storageKey;
        this.toolbarService.setStorageKey(storageKey);
    }

    setControllerName(controllerName: string) {
        this.controllerName = controllerName;
        this.toolbarService.setControllerName(controllerName);
    }

    /**
     * Raise event when change text to search
     */
    onSearchChanged() {
        this.raiseFiltersChanged();
    }

    onToggleClicked() {
        // Toogle button
        this.isCollapsedButton = !this.isCollapsedButton;

        // Storage IsCollapsedButton
        this.queryCondition.IsCollapsedButton = this.isCollapsedButton; // Update queryCondition.IsCollapsedButton
        this.toolbarService.saveCurrentFilter(this.queryCondition); // Save currentFilter to localStorage


        this.expandCollapseButtonClick.emit(this.isCollapsedButton);
    }

    private addOrEditFilter(newItem: FilterDefinition) {
        this.showSecondBar();
        return new Observable((subscriber) => {
            this.filtersBarComponent.addOrEditFilter(newItem).subscribe(() => {
                subscriber.next();
                subscriber.complete();
            }, () => {
                // Check visible bar
                this.checkVisibleBar();
            });
        });
    }

    /**
     * Clear toolbar when click on item for notification
     * @param filter
     */
    clearToolbar(filter?) {

        // Reset queryCondition
        this.queryCondition.SearchKeyword = '';
        this.queryCondition.ColumnFilters.splice(0, this.queryCondition.ColumnFilters.length);


        // Update QueryCondition
        if (filter) {
            this.queryCondition.set(filter);
        }

        // Reset oldQuery
        this.oldQueryCondition = null;

        // Clear search
        this.searchText = '';

        // Unselect custom-filter
        this.setSelected(null, false);

        // Change filter
        this.setFilterBy(this.queryCondition.ArchiveType);

        // Check visible toolbar
        this.checkVisibleBar();
    }

    /**
     * Add new  aailable filters but keep filters from element
     * @param {FilterDefinition[]} filters
     */
    setAvailableFilters(filters: FilterDefinition[]) {
        // Save to extraFieldFilters
        this.extraFieldFilters = filters;


        // Remove all current-filter
        this.availableFilters.splice(0, this.availableFilters.length);

        // Get Filters from  filter-element

        if (this.toolbarFiltersComponent) {
            this.toolbarFiltersComponent.items.forEach((item) => {
                // tslint:disable
                this.availableFilters.push(new FilterDefinition({
                    ColumnName: item.columnName,
                    DisplayValue: item.displayValue,
                    TranslateKey: item.translateKey,
                    FilterType: <FilterType>item.filterType,
                    FilterOperator: <FilterOperator>item.filterOperator,
                    DataType: <DataType>item.dataType,
                    IsSelected: item.isSelected,
                    ViewType: <ToolbarFilterViewType>item.viewType,
                    LeafType: item.leafType,
                    NodeType: item.nodeType,
                    ExpectedFilterItem: item.expectedFilterItem,
                    IsExpectedSingleSelection: item.isExpectedSingleSelection,
                    IsFavorite: item.isFavorite,
                    AvailableOperators: item.availableOperators,
                    MinValue: item.minValue,
                    MaxLength: item.maxLength,
                    AllowNegative: item.allowNegative,
                    CanUpdateCheckedAll: item.canUpdateCheckedAll
                }));
                // tslint:enable
            });
        }
        


        // Set new filter
        filters.forEach((newFilter) => {
            // Fill displayValue if it don't input
            newFilter.DisplayValue = this.helperService.TranslationService.getTranslation(newFilter.TranslateKey);
            this.availableFilters.push(newFilter);
        });
    }

    /** Add new sorts */
    setAvailableSorts(sorts: SortItem[]) {
        // keep value
        this.extraSorts = sorts;
        // remove all sorts
        this.availableSorts.splice(0, this.availableSorts.length);
        if (!!this.toolbarSortsComponent && !!this.toolbarSortsComponent.items) {
            this.toolbarSortsComponent.items.forEach((item) => {
                this.availableSorts.push(new SortItem(item.columnName, item.translateKey, item.isSelected, item.order));
            });
        }

        // set new sorts
        sorts.forEach((newSort) => {
            this.availableSorts.push(newSort);
        });
    }

    /**
     * Trigger item when click on menu item
     * @param name
     */
    onOptionsMenuClicked(name: string) {
        let notificationService = this.injector.get(NotificationService, null),
            toolbarService = this.injector.get(ToolbarService, null);
        switch (name) {
            case 'filterBy':
                this.menuFiltersByTrigger.openMenu();
                break;
            case 'sortBy':
                this.menuSortsTrigger.openMenu();
                break;
            case 'viewMode':
                this.menuViewModeTrigger.openMenu();
                break;
            case 'showUserProfile':
            case 'showChangePassword':
            case 'showChangeLanguage':
            case 'showGeneralSetting':
            case 'showReleaseNotes':
            case 'showAbout':
            case 'logOut':
                toolbarService.raiseUserMenuClick(name);
                break;
            case 'notificationsEmails':
                notificationService.raiseSettingsClick();
                break;
        }
    }

    /**
     * Focus to end of keySearch when focus
     * @param text
     */
    onSearchFocused(text: string) {
        // Focus to end of text if searchControl is small mode
        if (!this.isSearchFullscreen) {
            this.isSearchFullscreen = true;
            // NBSHD-4597: problem 6: hide menu button and filter menu when searching
            if (this.showMenuButton) {
                this.showMenuButton = false;
            }
            if (this.showMoreOver){
                this.showMoreOver = false;
            }

            let elementRef = this.injector.get(ElementRef);
            let input = jQuery(elementRef.nativeElement).find('ntk-toolbar-search input');

            input.val(''); // clear the value of the element

            setTimeout(() => {
                input.val(text); // set that value back.
            }, 10);
        }
    }

    /**
     * Clear keySearch when back
     */
    onSearchBack() {
        this.toolbarSearchComponent.clearSearch(); // Clear search
        this.isSearchFullscreen = false; // Exit search mode
        this.showMenuButton = this._initShowMenuButton;
        this.showMoreOver = this._initShowMoreOver;
    }

    private updateScreen() {
        if (this.isSmallScreen && this.searchText) {
            this.isSearchFullscreen = true;
        }
    }

    /**
     * NBSHD-4407: Build userMenu
     * @private
     */
    private buildUserMenuItems() {
        this.userMenuItems.splice(0, this.userMenuItems.length);

        if (this.showUserProfileItem) {
            this.userMenuItems.push({
                Value: 'showUserProfile',
                TranslateKey: 'btShowProfile'
            });
        }
        if (this.showChangePasswordItem) {
            this.userMenuItems.push({
                Value: 'showChangePassword',
                TranslateKey: 'btChangePassword'
            });
        }
        if (this.showChangeLangualeItem) {
            this.userMenuItems.push({
                Value: 'showChangeLanguage',
                TranslateKey: 'btChangeLanguage'
            });
        }
        if (this.showUserSettingItem) {
            this.userMenuItems.push({
                Value: 'showGeneralSetting',
                TranslateKey: 'btGeneralSettings'
            });
        }
        if (this.showNotificationMenu) {
            this.userMenuItems.push({
                Value: 'notificationsEmails',
                TranslateKey: 'lbNotificationsEmails'
            });
        }
        if (this.showReleaseNotesItem) {
            this.userMenuItems.push({
                Value: 'showReleaseNotes',
                TranslateKey: 'lbReleaseNotes'
            });
        }

        this.userMenuItems.push({
            Value: 'showAbout',
            TranslateKey: 'btShowAbout'
        });
        this.userMenuItems.push({
            Value: '---',
            TranslateKey: '---'
        });
        this.userMenuItems.push({
            Value: 'logOut',
            TranslateKey: 'btLogout'
        });
    }

    /**
     * NBSHD-4407: Build options menu
     * @private
     */
    private buildOptionsItems() {
        this.optionsItems.splice(0, this.optionsItems.length);

        if (this.showFilterMenu) {
            this.optionsItems.push({
                Value: 'filterBy',
                TranslateKey: 'lbFilterBy'
            });
        }
        if (this.showSortMenu) {
            this.optionsItems.push({
                Value: 'sortBy',
                TranslateKey: 'lbSortBy'
            });
        }
        if (this.showViewModeMenu) {
            this.optionsItems.push({
                Value: 'viewMode',
                TranslateKey: 'lbLayout'
            });
        }

        if (this.showUserMenuOnOptionMenu && this.userMenuItems.length > 0) {
            this.optionsItems.push({
                Value: '---',
                TranslateKey: '---'
            });

            this.userMenuItems.forEach((item) => {
                this.optionsItems.push(item);
            });
        }

    }

    onMenuClicked() {
        this.injector.get(ToolbarService).raiseMenuButtonClick();
        this.menuButtonClick.emit();
    }

    /**
     * Get QueryCondition by CustomFilter
     * @param customFilter
     * @private
     */
    private getQueryConditionByCustomFilter(customFilter: CustomFilter) {
        let queryCondition: BaseQueryCondition = new BaseQueryCondition();

        // Build ArchiveType
        this.availableFilters.forEach((f) => {
            if (f.FilterType === FilterType.Action && f.IsSelected) {
                queryCondition.ArchiveType = f.ColumnName;
            }
        });

        // Build Field-Filters
        queryCondition.ColumnFilters = customFilter.Filters;


        if (this.getCustomFiltersCount) {
            return new Observable((subscriber) => {
                this.getCustomFiltersCount({
                    queryCondition: queryCondition,
                    subscriber: subscriber
                });
            });
        } else {
            return of(queryCondition);
        }
    }

    /**
     * Update count of CustomFilter
     * @private
     */
    private updateCustomFiltersCount(showLoading = true) {
        if (!this.showCustomFiltersCount) {
            return;
        }

        let loaded = false;


        // Clear timer show loading
        clearTimeout(this.showLoadingCountTimer);

        if (showLoading) {
            // Reset to show indicate
            this.showLoadingCountTimer = setTimeout(() => {
                if (!loaded) {
                    this.customFilters.forEach((customFilterItem) => {
                        customFilterItem.Count = undefined;
                    });
                }
            }, 1000);
        }


        // Cancel request get count
        this.cancelRequest();

        let obs: Observable<any>[] = [];
        this.pinnedFilters.forEach((customFilter) => {
            obs.push(this.getQueryConditionByCustomFilter(customFilter));
        });
        this.loadingRequest = forkJoin(obs).subscribe((queryList: any[]) => {
            let customFilterList = [];
            queryList.forEach((query, i) => {
                customFilterList.push({
                    CustomFilterId: this.pinnedFilters[i].Id,
                    Query: query
                });
            });

            let getCustomFiltersCount: Observable<any>;
            if (customFilterList.length > 0) {
                getCustomFiltersCount = this.toolbarService.getCustomFiltersCount(customFilterList);
            } else {
                getCustomFiltersCount = of([]);
            }

            this.loadingRequest = getCustomFiltersCount.subscribe((list: {
                Id: string,
                Count: number
            }[]) => {
                loaded = true;

                if (!list) {
                    list = [];
                }
                this.customFilters.forEach((customFilterItem) => {
                    customFilterItem.Count = 0;
                });
                list.forEach((item) => {
                    let customFilter = this.customFilters.find((customFilterItem) => {
                        return customFilterItem.Id === item.Id;
                    });
                    if (customFilter) {
                        customFilter.Count = item.Count;
                    }
                });

                this.customFiltersBar.updateScroller();
            });
        });
    }

    unfocusAreaInput() { 
        console.log('out focus')    
    }

    onfocusAreaInput() { 
        console.log('on focus')   
    }

    private cancelRequest() {
        if (this.loadingRequest) {
            this.loadingRequest.unsubscribe();
            this.loadingRequest = null;
        }
    }

    refreshCustomFiltersCount(showLoading = true) {
        this.customFiltersCountChange.next(showLoading);
    }
}
