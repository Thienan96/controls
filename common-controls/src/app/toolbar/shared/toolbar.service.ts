import {Observable} from 'rxjs/Observable';
import moment from 'moment-es6';
import {HelperService} from '../../core/services/helper.service';
import {StorageKeys, StorageLocation} from '../../core/services/storage.service';
import {
    BaseQueryCondition,
    CustomFilter,
    DataType,
    DisplayItem,
    FilterDefinition,
    FilterOperator
} from '../../shared/models/common.info';
import {Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import * as _ from 'underscore';
import {AppConfig} from '../../core/app.config';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DateRange, DateSelection, DateType, RelativeDateSelection} from './toolbar.model';
import {ToolbarReleaseAlertDialog} from '../toolbar-release-dialog-alert/toolbar-release-alert.dialog';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';


@Injectable({
    providedIn: 'root'
})
export class ToolbarService {
    private storageKey: any;
    private _userMenuClick = new Subject<any>();
    private _rememberFilter = true;
    private _menuButtonClick = new Subject<any>();
    private _controllerName: string;
    private _countRefresh = new Subject<any>();
    private _releasenotesDismiss = new Subject<any>();

    constructor(private helperService: HelperService,
                private http: HttpClient,
                private appConfig: AppConfig) {
    }

    getInstance() {
        return new ToolbarService(this.helperService, this.http, this.appConfig);
    }

    onUserMenuClick(): Observable<any> {
        return this._userMenuClick.asObservable();
    }

    raiseUserMenuClick(action: string) {
        this._userMenuClick.next(action);
    }

    onMenuButtonClick() {
        return this._menuButtonClick.asObservable();
    }

    raiseMenuButtonClick() {
        this._menuButtonClick.next();
    }

    raiseRefreshCustomFiltersCount() {
        this._countRefresh.next();
    }

    onCustomFiltersCountRefresh() {
        return this._countRefresh.asObservable();
    }

    onReleasenotesDismiss() {
        return this._releasenotesDismiss.asObservable();
    }

     raiseReleasenotesDismiss() {
        this._releasenotesDismiss.next();
    }

    getOperators() {
        return [
            {
                value: FilterOperator.Equals,
                translateKey: 'lbEqualTo'
            }, {
                value: FilterOperator.NotEqual,
                translateKey: 'lbNotEqualTo'
            }, {
                value: FilterOperator.Less,
                translateKey: 'lbLessThan'
            },
            {
                value: FilterOperator.LessOrEqual,
                translateKey: 'lbLessThanOrEqualTo'
            }, {
                value: FilterOperator.Greater,
                translateKey: 'lbGreaterThan'
            }, {
                value: FilterOperator.GreaterOrEqual,
                translateKey: 'lbGreaterThanOrEqualTo'
            }, {
                value: FilterOperator.Between,
                translateKey: 'lbBetween'
            }];
    }


    getFullOperators() {
        let operators = this.getOperators();
        operators.push({
            value: FilterOperator.Contains,
            translateKey: 'lbContainsValue'
        });
        operators.push({
            value: FilterOperator.In,
            translateKey: 'In'
        });

        return operators;
    }

    isSimpleFilter(item: FilterDefinition) {
        return item.DataType === DataType.None &&
            (item.FilterOperator === FilterOperator.Equals || item.FilterOperator === FilterOperator.Contains);
    }

    isNumberFilter(item: FilterDefinition) {
        return item.DataType === DataType.Decimal || item.DataType === DataType.Integer;
    }

    isDateFilter(item: FilterDefinition) {
        return item.DataType === DataType.Date;
    }

    isMultiChooseFilter(item: FilterDefinition) {
        return (item.DataType.split(':')[0] === DataType.Enum ||
            item.DataType === DataType.Boolean ||
            item.DataType === DataType.Custom ||
            (item.DataType === DataType.None && item.FilterOperator === FilterOperator.In));
    }

    isDurationFilter(item: FilterDefinition) {
        return item.DataType === DataType.Duration;
    }

    isMonthFilter(item: FilterDefinition) {
        return item.DataType === DataType.Month;
    }

    getListByEnum(enumeration, translateKey: string) {
        return Object.keys(enumeration)
            .filter((value) => {
                return isNaN(Number(value)) === false;
            })
            .map((i) => {
                let key = translateKey + '_' + enumeration[i];
                return new DisplayItem(enumeration[i], this.helperService.TranslationService.getTranslation(key), false, key);
            });
    }

    getListByBoolean() {
        return [
            new DisplayItem('True', this.helperService.TranslationService.getTranslation('btYes'), false, 'btYes'),
            new DisplayItem('False', this.helperService.TranslationService.getTranslation('btNo'), false, 'btNo')
        ];
    }

    toggleItem(item: DisplayItem, checked: boolean, isExclude: boolean, selected: DisplayItem[], deselected: DisplayItem[]) {
        if (!item.Value) {
            return;
        }
        item.IsSelected = !checked;
        if (!isExclude) {
            if (!checked) {
                if (selected.findIndex((selectedItem) => {
                    return item.Value === selectedItem.Value;
                }) === -1) {
                    selected.push(item);
                }

            } else {
                const i = selected.findIndex((x) => {
                    return x.Value === item.Value;
                });
                let removedItems = selected.splice(i, 1);
                removedItems.forEach((removedItem) => {
                    removedItem.IsSelected = false;
                });
            }

        } else {
            if (checked) {
                if (deselected.findIndex((deselectedItem) => {
                    return item.Value === deselectedItem.Value;
                }) === -1) {
                    deselected.push(item);
                }

            } else {
                const i = deselected.findIndex((x) => {
                    return x.Value === item.Value;
                });
                let removedItems = deselected.splice(i, 1);
                removedItems.forEach((removedItem) => {
                    removedItem.IsSelected = true;
                });
            }
        }
    }

    setSelected(items: DisplayItem[], isExclude: boolean, selected: DisplayItem[], deselected: DisplayItem[]) {
        items.forEach((item) => {
            if (!item.Value) {
                return;
            }
            if (!isExclude) {
                item.IsSelected = selected.findIndex((selectedItem: DisplayItem) => {
                    return selectedItem.Value === item.Value;
                }) !== -1;
            } else {
                item.IsSelected = deselected.findIndex((deselectedItem: DisplayItem) => {
                    return deselectedItem.Value === item.Value;
                }) === -1;
            }
        });
    }

    getSelectedItemsTotal(items: DisplayItem[], isExclude, selected, deselected) {
        if (isExclude) {
            return items.length - deselected.length;
        } else {
            return selected.length;
        }
    }

    isEnumBool(filterItem): boolean {
        return filterItem.DataType.split(':')[0] === DataType.Enum || filterItem.DataType === DataType.Boolean;
    }

    isEnum(filterItem): boolean {
        return filterItem.DataType.split(':')[0] === DataType.Enum;
    }

    getSelectedItemsFromDateFilter(data) {
        let filterOperator = data.filterOperator,
            from = moment(moment(data.from).format(this.dateFormat), this.dateFormat), // Reset HH:mm to 00:00
            to = moment(moment(data.to).format(this.dateFormat), this.dateFormat), // Reset HH:mm to 00:00
            selectedItems: DisplayItem[] = [];

        let from_12 = () => {
            return from.clone().add(23, 'hours').add(59, 'minutes');
        };
        let d1 = () => {
            return new DisplayItem(from.toISOString(), from.format(this.dateFormat));
        };
        let d2 = () => {
            return new DisplayItem(from_12().toISOString(), from_12().format(this.dateFormat));
        };

        let to_12 = () => {
            return moment(to).add(23, 'hours').add(59, 'minutes');
        };
        let d3 = () => {
            return new DisplayItem(to.toISOString(), to.format(this.dateFormat));
        };
        let d4 = () => {
            return new DisplayItem(to_12().toISOString(), to_12().format(this.dateFormat));
        };

        // Equals,NotEqual
        if (filterOperator === FilterOperator.Equals || filterOperator === FilterOperator.NotEqual) {
            selectedItems.push(d1());
            selectedItems.push(d2());
        }
        if (filterOperator === FilterOperator.GreaterOrEqual) {
            selectedItems.push(d1());
        }
        if (filterOperator === FilterOperator.Greater) {
            selectedItems.push(d2());
        }


        if (filterOperator === FilterOperator.LessOrEqual) {
            selectedItems.push(d4());
        }
        if (filterOperator === FilterOperator.Less) {
            selectedItems.push(d3());
        }

        // Between
        if (filterOperator === FilterOperator.Between) {
            selectedItems.push(d1());
            selectedItems.push(d4());
        }
        return selectedItems;
    }

    removeCustomFilter(item: CustomFilter) {
        return this.http.post('CustomFilter/Delete', {Id: item.Id});
    }

    getCustomFilters(): Observable<CustomFilter[]> {
        return this.http.get('CustomFilter/GetList', {
            params: {
                Module: this.getStorageKeyName()
            }
        }).pipe(map((data: any) => {
            if (!data) { // Fix if data is null
                data = [];
            }
            // data = _.sortBy(data, "Public").reverse();
            return data.map((item) => {
                let filters = [];
                try {
                    filters = <FilterDefinition[]>JSON.parse(item.Value || '[]').map((filter: FilterDefinition) => {
                        return new FilterDefinition(filter);
                    });
                } catch (e) {
                    console.error(e);
                }
                let customFilter = new CustomFilter({
                    Id: item.Id,
                    Name: item.Name,
                    MustPinned: item.Pinned,
                    Public: item.Public,
                    Filters: filters
                });
                return new CustomFilter(customFilter);
            });

        }));
    }

    saveCustomFilter(item: CustomFilter, skipShowAPIError: boolean = false): Observable<CustomFilter> {
        let data: any = {
            Module: this.getStorageKeyName()
        };
        if (item.Id) {
            data.Id = item.Id;
        }
        if (item.Name) {
            data.Name = item.Name;
        }
        data.Public = item.Public;

        // Pinned is used in the UI before, then we map the MustPinned to use to send to the API
        data.Pinned = item.MustPinned;

        if (item.Filters) {
            data.Value = JSON.stringify(item.Filters);
        }

        let headers: any;
        if (skipShowAPIError) {
            headers = {skipShowAPIError: 'true'};
        }

        return this.http.post('CustomFilter/Save', data, {headers}).pipe(map((id: string) => {
            let newFilter = new CustomFilter(item);
            newFilter.Id = id;
            this.saveCurrentCustomFilter(newFilter); // Save currentCustomFilter
            return newFilter;
        }));
    }

    setStorageKey(storageKey: string) {
        this.storageKey = storageKey;
    }

    getStorageKey() {
        return <any>this.storageKey;
    }

    getStorageKeyName() {
        let sKey: string;
        if (typeof this.storageKey === 'string') {
            sKey = <string>this.storageKey;
        } else {
            sKey = StorageKeys[this.storageKey];
        }

        return sKey;
        // return StorageKeys[this.storageKey];

    }


    private clone(obj) {
        function stringify(data) {
            return JSON.stringify(data, (k, v) => {
                return v === undefined ? null : v; // fix issue undefined
            });
        }

        function parse(data) {
            return JSON.parse(data);
        }

        return parse(stringify(obj));
    }

    getStorage(key: string) {
        let data: any = this.helperService.StorageService.getUserValue(this.getStorageKey(), StorageLocation.Local) || {},
            toolbar = data.Toolbar || {};
        return this.clone(toolbar[key]);
    }

    setStorage(key: string, value: any) {
        let data: any = this.helperService.StorageService.getUserValue(this.getStorageKey(), StorageLocation.Local) || {};
        if (!data.Toolbar) {
            data.Toolbar = {};
        }
        data.Toolbar[key] = value;
        this.helperService.StorageService.setLocalUserValue(this.getStorageKey(), this.clone(data));
    }

    removeStorage(key: string) {
        let data: any = this.helperService.StorageService.getUserValue(this.getStorageKey(), StorageLocation.Local);
        if (!data || !data['Toolbar']) {
            return;
        }
        delete data['Toolbar'][key];
        this.helperService.StorageService.setLocalUserValue(this.getStorageKey(), this.clone(data));
    }

    toggleFavorite(name: string, checked: boolean) {
        let favorites = this.getStorage('Favorites') || {};
        if (checked) {
            favorites[name] = true;
        } else {
            delete favorites[name];
        }
        this.setStorage('Favorites', favorites);
    }

    getFavorite(name: string) {
        let favorites = this.getStorage('Favorites') || {};
        return favorites[name] || false;
    }


    togglePin(id: string, checked: boolean) {
        let list = this.getStorage('Pinneds') || {};
        if (checked) {
            list[id] = true;
        } else {
            delete list[id];
        }
        this.setStorage('Pinneds', list);
    }

    getPin(name: string) {
        let data = this.getStorage('Pinneds') || {};
        return data[name] || false;
    }

    saveViewMode(mode: string) {
        this.setStorage('currentViewMode', mode);
    }

    saveSearch(searchKeyword: string) {
        let currentFilter: BaseQueryCondition = this.getCurrentFilter();
        currentFilter.SearchKeyword = searchKeyword;
        this.saveCurrentFilter(currentFilter);
    }

    saveFilterBy(name: string) {
        let currentFilter: BaseQueryCondition = this.getCurrentFilter();
        currentFilter.ArchiveType = name;
        this.saveCurrentFilter(currentFilter);
    }


    getCurrentViewMode() {
        return this.getStorage('currentViewMode');
    }

    getCurrentFilter() {
        return this._rememberFilter ? this.getStorage('currentFilter') || {} : {};
    }

    saveCurrentFilter(currentFilter: BaseQueryCondition) {
        if (this._rememberFilter) {
            this.setStorage('currentFilter', currentFilter);
        }
    }

    saveSort(sortBy: string) {
        let currentFilter: BaseQueryCondition = this.getCurrentFilter();
        currentFilter.SortBy = sortBy;
        this.saveCurrentFilter(currentFilter);
    }

    saveFieldsFilter(items: FilterDefinition[]) {
        let currentFilter: BaseQueryCondition = this.getCurrentFilter();
        currentFilter.ColumnFilters = items;
        this.saveCurrentFilter(currentFilter);
    }

    removeFieldsFilter() {
        let currentFilter: BaseQueryCondition = this.getCurrentFilter();
        delete currentFilter.ColumnFilters;
        this.saveCurrentFilter(currentFilter);
    }

    getCurrentFieldsFilter() {
        if (this._rememberFilter) {
            let currentFilter: BaseQueryCondition = this.getCurrentFilter();
            let currentCustomFilter: CustomFilter = this.getCurrentCustomFilter();
            if (currentCustomFilter) {
                return this.prepareFieldsFilter(currentCustomFilter.Filters || []);
            }
            if (currentFilter) {
                return this.prepareFieldsFilter(currentFilter.ColumnFilters || []);
            }
        }
        return [];
    }


    optimizeFieldsFilter(items: FilterDefinition[]) {
        items.forEach((item) => {
            delete item.SelectedItems;
        });
    }

    getCurrentCustomFilter() {
        return this._rememberFilter ? this.getStorage('currentCustomFilter') : undefined;
    }

    saveCurrentCustomFilter(item: CustomFilter) {
        if (this._rememberFilter) {
            this.setStorage('currentCustomFilter', item);
        }
    }

    removeCurrentCustomFilter() {
        this.removeStorage('currentCustomFilter');
        this.removeFieldsFilter(); // We have to Remove current fileds-filter
    }


    confirmRemoveCustomFilter() {
        let title = this.helperService.TranslationService.getTranslation('btDelete'),
            message = this.helperService.TranslationService.getTranslation('msgConfirmToRemoveCustomFilter');
        return this.helperService.DialogService.showMessageDialog(title, message, 'btYesNo');
    }

    private prepareDataToCompareChanged(filters: FilterDefinition[]) {
        return filters.map((filter: FilterDefinition) => {
            let values = filter.Value;
            if (filter.Value) {
                if (filter.Value.EffectedIds) {

                    // Sort EffectedIds if have EffectedIds
                    filter.Value.EffectedIds = _.sortBy(filter.Value.EffectedIds);
                } else {
                    // Sort Value if Value if array
                    filter.Value = _.sortBy(filter.Value);
                }
            }

            // Reset value for Date
            if (filter.DataType === DataType.Date) {
                values = [];
            }

            return <FilterDefinition>{
                ColumnName: filter.ColumnName,
                Value: values,
                FilterOperator: filter.FilterOperator,
                SelectedItemsTotal: filter.SelectedItemsTotal,
                Data: filter.Data
            };
        });
    }

    /**
     * Check toolbar have any change
     * @returns {boolean}
     */
    isEqualFieldsFilter(filters1: FilterDefinition[], filters2: FilterDefinition[]) {
        let oldFilters: FilterDefinition[] = _.sortBy(JSON.parse(JSON.stringify(filters1 || [])), 'ColumnName');
        let newFilters: FilterDefinition[] = _.sortBy(JSON.parse(JSON.stringify(filters2 || [])), 'ColumnName');
        return _.isEqual(this.prepareDataToCompareChanged(oldFilters), this.prepareDataToCompareChanged(newFilters));
    }

    /**
     * Compare 2 BaseQueryCondition
     * @param {BaseQueryCondition} cond1
     * @param {BaseQueryCondition} cond2
     * @returns {boolean}
     */
    isEqualBaseQueryCondition(cond1: BaseQueryCondition, cond2: BaseQueryCondition) {
        if (!cond1) {
            cond1 = new BaseQueryCondition();
        }
        if (!cond2) {
            cond2 = new BaseQueryCondition();
        }
        cond1 = JSON.parse(JSON.stringify(cond1));
        cond2 = JSON.parse(JSON.stringify(cond2));

        cond1.ColumnFilters = this.prepareDataToCompareChanged(_.sortBy(cond1.ColumnFilters, 'ColumnName'));
        cond2.ColumnFilters = this.prepareDataToCompareChanged(_.sortBy(cond2.ColumnFilters, 'ColumnName'));
        return _.isEqual(cond1, cond2);
    }

    /**
     * Check show new-release-alert
     * @returns {boolean}
     */
    isShowNewReleaseAlert() {
        // console.log('---isShowNewReleaseAlert', this.appConfig);

        if (this.appConfig.APP === 'common-controls') {
            return true;
        }

        if (this.appConfig.MAJOR_RELEASE_DATE) {
            let diff = moment().diff(this.appConfig.MAJOR_RELEASE_DATE, 'day');

            if (diff <= 14) {
                let lastDismissVersion: string;

                if (this.appConfig.WITH_NG1) {
                    lastDismissVersion = this.helperService.StorageService.getNgLocalUserOnlyValue(StorageKeys.ReleaseNotesDismissVersion);
                } else {
                    lastDismissVersion = this.helperService.StorageService.getLocalUserOnlyValue(StorageKeys.ReleaseNotesDismissVersion);
                }

                let currentVersion = this.appConfig.VERSION;
                if (this.helperService.UtilityService.isMajorVersionChanged(currentVersion, lastDismissVersion)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get from of relative date
     * @param {moment.Moment} date
     * @param {RelativeDateSelection} relativeDate
     * @returns {moment.Moment}
     */
    getFromRelativeDate(date: moment.Moment, relativeDate: RelativeDateSelection): moment.Moment {
        let lastNext = relativeDate.lastNext,
            periodNumber = relativeDate.periodNumber,
            period = relativeDate.period;
        // Clone date
        date = date.clone();
        let func = lastNext === 'last' ? date['subtract'] : date['add'];
        switch (period) {
            case 'day':
                return func.apply(date, [periodNumber, 'day']);
            case 'week':
                return func.apply(date, [periodNumber, 'week']).isoWeekday(1);
            case 'month':
                return func.apply(date, [periodNumber, 'month']).startOf('month');
            case 'year':
                date = moment(date.year() + '-01-01', this.dateFormat);
                func = lastNext === 'last' ? date['subtract'] : date['add'];
                return func.apply(date, [periodNumber, 'year']);
        }
    }

    /**
     * Get to of relative date
     * @param {moment.Moment} date
     * @param {RelativeDateSelection} relativeDate
     * @returns {moment.Moment}
     */
    getToRelativeDate(date: moment.Moment, relativeDate: RelativeDateSelection): moment.Moment {
        let lastNext = relativeDate.lastNext,
            periodNumber = relativeDate.periodNumber,
            period = relativeDate.period;
        date = date.clone();
        let func = lastNext === 'last' ? date['subtract'] : date['add'];
        switch (period) {
            case 'day':
                return func.apply(date, [periodNumber, 'day']);
            case 'week':
                return func.apply(date, [periodNumber, 'week']).isoWeekday(7);
            case 'month':
                return func.apply(date, [periodNumber, 'month']).endOf('month');
            case 'year':
                date = moment(date.year() + '-12-31', this.dateFormat);
                func = lastNext === 'last' ? date['subtract'] : date['add'];
                return func.apply(date, [periodNumber, 'year']);
        }
    }

    capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Get Title to dipslay on second-bar
     * @param {FilterDefinition} item
     * @param {string} outDateFormat
     * @returns {any}
     */
    getDisplayValue(item: FilterDefinition, outDateFormat: string): string {
        if (!item.IsValid) {
            return this.helperService.TranslationService.getTranslation('lbNotAvailableMultipleSites');
        }
        if (item.CheckedAll) {
            return this.helperService.TranslationService.getTranslation('btFilterByAll');
        }
        if (item.Value.IsExclude) {
            let total = item.SelectedItemsTotal;
            if (!item.CanUpdateCheckedAll) {
                return this.helperService.TranslationService.getTranslation('lbMultiSelection');
            }
            return total + ' ' + this.helperService.TranslationService.getTranslation('lbItemsSelected');
        }
        if (item.SelectedItems.length >= 4) {
            let total = item.SelectedItems.length;
            return total + ' ' + this.helperService.TranslationService.getTranslation('lbItemsSelected');
        }
        if (item.SelectedItems.length === 0 && item.Value.length === 0) {
            return '';
        }
        let names = [];
        if (item.DataType === DataType.Date) {
            if (item.Data) {
                let dateSelection = item.Data.DateSelection;
                if (dateSelection === DateSelection.QuickDate) {
                    return this.translateDateType(item.Data.DateType);
                }
                if (dateSelection === DateSelection.AbsoluteDate ) {
                    let preview,
                        from = item.Data.Relative.from,
                        to = item.Data.Relative.to;
                    if (from && !to) {
                        preview = this.helperService.TranslationService.getTranslation('lbSince') + ' ' + this.dateToString(from, outDateFormat);
                    }
                    if (!from && to) {
                        preview = this.helperService.TranslationService.getTranslation('lbUntil') + ' ' + this.dateToString(to, outDateFormat);
                    }
                    if (from && to) {
                        preview = this.helperService.UtilityService.formatText(this.helperService.TranslationService.getTranslation('lbFromTo'), this.dateToString(from, outDateFormat), this.dateToString(to, outDateFormat));
                    }
                    if (from === to) {
                        preview = this.dateToString(from, outDateFormat);
                    }
                    return preview;
                }
                if (dateSelection === DateSelection.RelativeDate) {
                    let fromData: RelativeDateSelection = item.Data.Relative.from,
                        toData: RelativeDateSelection = item.Data.Relative.to,
                        from: moment.Moment,
                        to: moment.Moment,
                        preview: string;
                    if (fromData && fromData.lastNext && fromData.period && fromData.periodNumber) {
                        from = this.getFromRelativeDate(moment(), fromData);
                    }
                    if (toData && toData.lastNext && toData.period && toData.periodNumber) {
                        to = this.getToRelativeDate(moment(), toData);
                    }
                    if (from && !to) {
                        preview = this.helperService.TranslationService.getTranslation('lbSince') + ' ' + this.buildRelativeDate(fromData);
                    }
                    if (!from && to) {
                        preview = this.helperService.TranslationService.getTranslation('lbUntil') + ' ' + this.buildRelativeDate(toData);
                    }
                    if (from && to) {
                        preview = this.helperService.UtilityService.formatText(this.helperService.TranslationService.getTranslation('lbRelativeDate'), this.buildRelativeDate(fromData), this.buildRelativeDate(toData));
                    }
                    if (fromData && toData && (fromData.lastNext === toData.lastNext && fromData.periodNumber === toData.periodNumber && fromData.period === toData.period)) {
                        preview = this.capitalize(this.buildRelativeDate(fromData));
                    }
                    return preview;
                }
            } else {
                if (item.FilterOperator === FilterOperator.Equals) {
                    return item.SelectedItems[0].DisplayValue;
                }
                if (item.FilterOperator === FilterOperator.Between) {
                    item.SelectedItems.forEach((selectedItem) => {
                        names.push(selectedItem.DisplayValue);
                    });
                    return this.helperService.UtilityService.formatText(this.helperService.TranslationService.getTranslation('lbBetweenValue1AndValue2'), names[0], names[1]);
                }
                return this.translateOperator(item.FilterOperator) + ' ' + item.SelectedItems[0].DisplayValue;
            }

        }
        if (item.DataType === DataType.Decimal || item.DataType === DataType.Integer || item.DataType === DataType.Duration) {
            let authenticationService = this.helperService.AuthenticationService,
                utilityService = this.helperService.UtilityService,
                value: string;
            if (item.FilterOperator === FilterOperator.Equals) { // Equal
                value = item.SelectedItems[0].Value + '';
                if (item.DataType === DataType.Decimal) {
                    value = utilityService.transform(value, authenticationService.groupSep, authenticationService.decimalSep, authenticationService.numberDecimals);
                }
                if (item.DataType === DataType.Duration) {
                    value = utilityService.transformDurationToString(parseFloat(value));
                }
                return value;
            }
            if (item.FilterOperator === FilterOperator.Between) { // Between
                item.SelectedItems.forEach((selectedItem) => {
                    value = selectedItem.Value + '';
                    if (item.DataType === DataType.Decimal) {
                        value = utilityService.transform(value, authenticationService.groupSep, authenticationService.decimalSep, authenticationService.numberDecimals);
                    }
                    if (item.DataType === DataType.Duration) {
                        value = utilityService.transformDurationToString(parseFloat(value));
                    }
                    names.push(value);
                });
                return utilityService.formatText(this.helperService.TranslationService.getTranslation('lbBetweenValue1AndValue2'), names[0], names[1]);
            }

            value = item.SelectedItems[0].Value + '';
            if (item.DataType === DataType.Decimal) {
                value = utilityService.transform(value, authenticationService.groupSep, authenticationService.decimalSep, authenticationService.numberDecimals);
            }
            if (item.DataType === DataType.Duration) {
                value = utilityService.transformDurationToString(parseFloat(value));
            }
            return this.translateOperator(item.FilterOperator) + ' ' + value;

        }

        if (this.isEnumBool(item)) {
            item.SelectedItems.forEach((selectedItem: DisplayItem) => {
                let name = selectedItem.TranslateKey ? this.helperService.TranslationService.getTranslation(selectedItem.TranslateKey) : selectedItem.DisplayValue;
                names.push(name);
            });
            return names.join(', ');
        }

        if (this.isSimpleFilter(item)) {
            names = item.Value;
            //EJ4-2117: user input search text with HTNL tags, we need to encode before display
            return this.translateOperator(item.FilterOperator) + ' "' + names.map(x => SafeHtmlPipe.encodeEntities(x)).join(', ') + '"';
            // return this.translateOperator(item.FilterOperator) + ' "' + names.join(', ') + '"';
        }

        // NF-362: type 'Custom' used to display the custom template (show logo in the filter bar)
        if (item.DataType === DataType.Custom) {
            item.SelectedItems.forEach((selectedItem) => {
                names.push(selectedItem.Template ? selectedItem.Template : SafeHtmlPipe.encodeEntities(selectedItem.DisplayValue)); //EJ4-2117
            });
            return names.join(', ');
        }

        // NF-368: type 'Month' used to show year and month
        if (item.DataType === DataType.Month) {
            return moment(item.Value, 'YYYY-MM').format('MMM') + ' ' + moment(item.Value, 'YYYY-MM').format('YYYY');
        }

        item.SelectedItems.forEach((selectedItem) => {
            names.push( SafeHtmlPipe.encodeEntities(selectedItem.DisplayValue)); //EJ4-2117
        });
        return names.join(', ');
    }

    /**
     * Translate date-type
     * @param {DateType} key
     * @returns {string}
     */
    private translateDateType(key: DateType) {
        let translation = '';
        switch (key) {
            case DateType.isYesterday:
                translation = 'lbYesterday';
                break;
            case DateType.isToday:
                translation = 'lbToday';
                break;
            case DateType.isTomorrow:
                translation = 'lbTomorrow';
                break;
            case DateType.isLastWeek:
                translation = 'lbLastWeek';
                break;
            case DateType.isThisWeek:
                translation = 'lbThisWeek';
                break;
            case DateType.isNextWeek:
                translation = 'lbNextWeek';
                break;
            case DateType.isThisQuarter:
                translation = 'lbThisQuarter';
                break;
            case DateType.isLastMonth:
                translation = 'lbLastMonth';
                break;
            case DateType.isThisMonth:
                translation = 'lbThisMonth';
                break;
            case DateType.isNextMonth:
                translation = 'lbNextMonth';
                break;
            case DateType.isThisYear:
                translation = 'lbThisYear';
                break;
        }
        return translation ? this.helperService.TranslationService.getTranslation(translation) : '';
    }

    /**
     * Translate operator
     * @param {string} key
     * @returns {string}
     */
    private translateOperator(key: string) {
        let operators = this.getFullOperators(),
            result = operators.find((operator) => {
                return operator.value === key;
            });
        if (result) {
            return this.helperService.TranslationService.getTranslation(result.translateKey);
        } else {
            return key;
        }
    }

    /**
     * Translate date-period
     * @param {string} key
     * @returns {string}
     */
    private translatePeriod(key: string) {
        let data = {
            day: 'lbDay',
            week: 'lbWeek',
            month: 'lbMonth',
            year: 'lbYear'
        };
        return this.helperService.TranslationService.getTranslation(data[key]);
    }

    private translateLastNext(key: string) {
        let data = {
            last: 'lbPast',
            next: 'lbFuture'
        };
        return this.helperService.TranslationService.getTranslation(data[key]);
    }

    /**
     * Convert date to string
     * @param {string} date
     * @param {string} outDateFormat
     * @returns {string}
     */
    private dateToString(date: string, outDateFormat: string) {
        return moment(date, this.dateFormat).format((outDateFormat||"").toUpperCase());
    }

    /**
     * Get date format
     * @returns {string}
     */
    private get dateFormat() {
        return 'YYYY-MM-DD';
    }


    /**
     * Convert relative-date to string
     * @param {RelativeDateSelection} dateObj
     * @returns {string}
     */
    private buildRelativeDate(dateObj: RelativeDateSelection): string {
        if (dateObj) {
            return (dateObj.periodNumber + ' ' + this.translatePeriod(dateObj.period) + ' ' + this.translateLastNext(dateObj.lastNext)).toLowerCase();
        }
    }

    /**
     * Prepare FieldsFilter if DataType is date
     * @param {FilterDefinition[]} filters
     * @returns {FilterDefinition[]}
     */
    private prepareFieldsFilter(filters: FilterDefinition[]) {
        filters.forEach((filter: FilterDefinition) => {
            if (filter.DataType === DataType.Date && filter.Data) {
                let dateRange = this.getDateRangeFromFilter(filter),
                    selectedItems: DisplayItem[] = this.getSelectedItemsFromDateFilter({
                        filterOperator: filter.FilterOperator,
                        from: dateRange.from,
                        to: dateRange.to
                    }),
                    values = selectedItems.map((item) => {
                        return item.Value;
                    });
                filter.SelectedItems = selectedItems;
                filter.Value = values;
            }
        });
        return filters;
    }

    /**
     * Get date-range from month
     * @param {moment.Moment} date
     * @returns {DateRange}
     */
    private getDateRangeOfMonth(date: moment.Moment): DateRange {
        let from = date.clone().startOf('month'),
            to = date.clone().endOf('month');
        return <DateRange>{
            from: from,
            to: to
        };
    }

    /**
     * Get date-range from FilterDefinition
     * @param {FilterDefinition} filter
     * @returns {DateRange}
     */
    private getDateRangeFromFilter(filter: FilterDefinition): DateRange {
        let from: moment.Moment,
            to: moment.Moment,
            data = filter.Data,
            dateType: DateType = data.DateType,
            dataSelection: DateSelection = data.DateSelection;

        // Quick Date
        if (dataSelection === DateSelection.QuickDate) {
            let dateRange = this.getDateRangeFromDateType(dateType);
            from = dateRange.from;
            to = dateRange.to;
        }

        // Absolute Date
        if (dataSelection === DateSelection.AbsoluteDate) {
            if (data.Relative.from) {
                from = moment(data.Relative.from, this.dateFormat);
            }
            if (data.Relative.to) {
                to = moment(data.Relative.to, this.dateFormat);
            }
        }

        // Relative Date
        if (data.DateSelection === DateSelection.RelativeDate) {
            let date = moment(),
                fromData: RelativeDateSelection = data.Relative.from,
                toData: RelativeDateSelection = data.Relative.to;
            if (fromData) {
                from = this.getFromRelativeDate(date, fromData);
            }
            if (toData) {
                to = this.getToRelativeDate(date, toData);
            }
        }
        return <DateRange>{
            from: from,
            to: to
        };
    }


    /**
     * Get date-range from DateType
     * @param {DateType} dateType
     * @returns {DateRange}
     */
    public getDateRangeFromDateType(dateType: DateType): DateRange {
        let from, to, date = moment(), year, dateRange;
        switch (dateType) {
            case DateType.isYesterday:
                from = to = date.clone().subtract(1, 'days');
                break;
            case DateType.isToday:
                from = to = date;
                break;
            case DateType.isTomorrow:
                from = to = date.add(1, 'days');
                break;
            case DateType.isLastWeek:
                date = date.subtract(7, 'days');
                from = date.clone().isoWeekday(1);
                to = date.clone().isoWeekday(7);
                break;
            case DateType.isThisWeek:
                from = date.clone().isoWeekday(1);
                to = date.clone().isoWeekday(7);
                break;
            case DateType.isNextWeek:
                date = date.add(7, 'days');
                from = date.clone().isoWeekday(1);
                to = date.clone().isoWeekday(7);
                break;
            case DateType.isThisQuarter:
                year = date.year();
                let result = Math.ceil((date.month() + 1) / 3);
                switch (result) {
                    case 1:
                        from = moment(year + '-01-01');
                        to = moment(year + '-03-31');
                        break;
                    case 2:
                        from = moment(year + '-04-01');
                        to = moment(year + '-06-30');
                        break;
                    case 3:
                        from = moment(year + '-07-01');
                        to = moment(year + '-09-30');
                        break;
                    case 4:
                        from = moment(year + '-10-01');
                        to = moment(year + '-12-31');
                        break;
                }
                break;
            case DateType.isLastMonth:
                date = date.subtract(1, 'months');
                dateRange = this.getDateRangeOfMonth(date);
                from = dateRange.from;
                to = dateRange.to;
                break;
            case DateType.isThisMonth:
                dateRange = this.getDateRangeOfMonth(date);
                from = dateRange.from;
                to = dateRange.to;
                break;
            case DateType.isNextMonth:
                date = date.add(1, 'months');
                dateRange = this.getDateRangeOfMonth(date);
                from = dateRange.from;
                to = dateRange.to;
                break;
            case DateType.isThisYear:
                year = date.year();
                from = moment(year + '-01-01');
                to = moment(year + '-12-31');
                break;
        }
        return <DateRange>{
            from: from,
            to: to
        };
    }

    /**
     * Prepare Data before send to sever
     * @param {BaseQueryCondition} queryCondition
     * @returns {BaseQueryCondition}
     */
    public prepareQueryBuild(queryCondition: BaseQueryCondition) {
        // Clone and remove filter if check all or deselect all items
        let filter: BaseQueryCondition = JSON.parse(JSON.stringify(queryCondition));

        if (filter.ColumnFilters) {
            this.prepareFieldsFilter(filter.ColumnFilters);

            // Remove ColumnFilters have CheckAll
            filter.ColumnFilters = filter.ColumnFilters.filter((item: FilterDefinition) => {
                if (!item.CheckedAll) {
                    return item;
                }
            });

            // Remove SelectedItems
            filter.ColumnFilters.forEach((item: FilterDefinition) => {
                item.SelectedItems = [];
            });
        }

        return filter;
    }

    public toggleRememberFilter(rememberFilter: boolean) {
        this._rememberFilter = rememberFilter;
    }

    canAutoFocus(): boolean {
        let autoFocus = true;
        if (this.helperService.UtilityService.isiOS) {
            autoFocus = false;
        }
        return autoFocus;
    }

    setControllerName(controllerName: string) {
        this._controllerName = controllerName;
    }

    getCustomFiltersCount(list: any[]) {
        return this.http.post(this._controllerName + '/GetCountByCustomFilter', {
            Queries: list
        }, {
            headers: {skipShowAPIError: 'true'}
        });
    }

    showReleaseAlert() {
        this.helperService.DialogService.openDialog(ToolbarReleaseAlertDialog, {
            raiseUserMenuClick: this.raiseUserMenuClick.bind(this)
        }, 'auto', 'auto', true, true,{
            hasBackdrop: false,
            autoFocus: false,
            position: {
                top: '60px'
            }
        }).subscribe((version) => {
            if (version) {
                this.helperService.StorageService.setLocalUserOnlyValue(StorageKeys.ReleaseNotesDismissVersion, version);
            }
            this.raiseReleasenotesDismiss();
        });
    }
}
