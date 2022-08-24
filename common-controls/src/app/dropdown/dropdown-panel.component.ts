import { Component, TemplateRef, ViewChild, AfterViewInit, Inject, Injector, Output, EventEmitter, ChangeDetectorRef, Input, ElementRef, OnInit, NgZone } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Observable, Subject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VirtualScrollBaseController } from '../core/controllers/virtual-scroll-base-controller';
import { ILazyItem, IDataItems } from '../shared/models/common.info';
import { TranslationService } from '../core/services/translation.service';
import { UtilityService } from '../core/services/utility.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


export class DropdownCallbackData {
    count: () => Observable<any>;
    getData: (startIndex: number, pageSize: number) => Observable<ILazyItem[]>;
}

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'ntk-mat-dropdown-panel',
    templateUrl: './dropdown-panel.component.html',
    styleUrls: ['./dropdown-panel.component.scss']
})
export class DropdownPanelComponent extends VirtualScrollBaseController<ILazyItem> implements OnInit, AfterViewInit {
    @ViewChild('inputQuery', { static: false }) inputQuery: ElementRef;
    @ViewChild('scrollViewPort', { static: true }) _viewport: CdkVirtualScrollViewport;
    @Output() _onClickAction = new EventEmitter<any>();
    @Output() _onClickSelect = new EventEmitter<any>();
    @Output() _onSearchChanged = new EventEmitter<any>();
    @Output() _onClosePanel = new EventEmitter<any>();

    @Input() noDataText = 'No data to display';
    headerTemplate: TemplateRef<any>;
    itemTemplate: TemplateRef<any>;

    items: any;

    _callBack: any;
    loading = false;
    noData = false;

    ready = false;

    addItemText: string;
    allowAddItem: boolean;
    // currently, if want to use this option, dropdown need load all data
    hasSelectItem: boolean;
    // allow to display header
    allowHeader: boolean;

    hasFocus = false;
    hasScroll = false;

    isSmallScreen: boolean;
    isShowSearch: boolean;
    searchText: string;
    onSearchTextChange = new Subject<string>();
    titleKey: string;
    protected _util: UtilityService;
    canSearch: boolean;
    constructor(protected injector: Injector, @Inject(MAT_DIALOG_DATA) _callBack: DropdownCallbackData) {
        super(injector.get(ChangeDetectorRef));

        this._callBack = _callBack;

        let i18n = injector.get(TranslationService);
        this._util = injector.get(UtilityService);

        if (i18n.isExistsTranslation('lbNoDataToDisplay')) {
            this.noDataText = i18n.getTranslation('lbNoDataToDisplay');
        }        
    }

   
    ngOnInit() {
        super.ngOnInit();
        this.searchTextChange();
    }
    ngAfterViewInit(): void {
    }
    loadData(startIndex: number, pageSize: number): Observable<IDataItems<ILazyItem>> {
        return this._callBack.getData(startIndex, pageSize);
    }

    loadPageFinish(startIndex: number) {
        if (startIndex === 0) {
            // setTimeout to avoid stupid error of onAfterViewInit of Angular
            setTimeout(() => {
                this.noData = this.dataSource.length === 0;
            }, 100);
        }

        super.loadPageFinish(startIndex);

        if (this.allowHeader) {
            setTimeout(() => {
                this.hasScroll = this._viewport.elementRef.nativeElement.scrollHeight > this._viewport.elementRef.nativeElement.clientHeight;
            }, 100);
        }
    }
    refresh() {
        super.refresh();
        if (this.hasSelectItem) {
            this.checkedCount = 0;
            this.isSelectAll = false;
        }
        this.selectedIndex = -1;
    }

    selectNextItem(offset: number) {
        if (this.selectedIndex < 0 && offset < 0) { return; }

        // console.log('---selectNextItem = ', offset);

        if (this.selectedIndex < 0 && offset > 0) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex += offset;
        }

        // console.log('---this.selectedIndex = ', this.selectedIndex);

        let totalItems = this.getTotalItems();

        // make sure it does go exceed the count
        if (this.selectedIndex >= totalItems) {
            this.selectedIndex = totalItems - 1;
        }

        if (this.selectedIndex >= 0 && this.dataSource.length) {
            this.selectedItem = this.dataSource.cachedData[this.selectedIndex];
        }

        if (this.selectedIndex >= 0 && this._viewport) {
            let itemSize = 48;
            let viewPortSize = this._viewport.getViewportSize();
            let measureScrollOffset = this._viewport.measureScrollOffset('top');

            let startIndex = Math.round(measureScrollOffset / itemSize);
            // console.log('startIndex=', startIndex);
            let endIndex = Math.round(viewPortSize / itemSize) + startIndex - 1;
            // console.log('endIndex=', endIndex);


            if (this.selectedIndex > endIndex) {
                this._viewport.scrollToIndex(startIndex + (this.selectedIndex - endIndex));
            } else if (this.selectedIndex < startIndex) {
                this._viewport.scrollToIndex(this.selectedIndex);
            }
        }
    }

    // fix for IE when user click on scrollbar, it lost focus for imput, we need to focus again
    onFocus() {
        this.hasFocus = true;
    }

    // fix for IE
    onLostFocus() {
        this.hasFocus = false;
    }

    disableSearch() {
        this.isShowSearch = false;
        this.clearQuery();
    }

    clearQuery() {
        this.searchText = '';
        this._onSearchChanged.emit('');
    }

    enableSearch() {
        this.isShowSearch = true;

        if (this._util.isDevice) {
            TimerObservable.create(200).subscribe(() => this.inputQuery.nativeElement.focus());
        }
    }

   
    onSelectionChanged(index: number) {        
        if (!this.hasSelectItem) {
            this._onClickSelect.emit([this.selectedItem]);
        }
    }

    appliedMultipleSelect() {
        this.listSelectedRows = this.dataSource.cachedData.filter(item => item && item.Id && item.isChecked);
        this._onClickSelect.emit(this.listSelectedRows);
    }
   
    close() {
        this._onClosePanel.emit();
    }

    searchTextChange() {
        this.onSearchTextChange.pipe(
            debounceTime(500),
            distinctUntilChanged())
            .subscribe(value => {
                this._onSearchChanged.emit(value);
            });
    }

    onInputClick() {
        TimerObservable.create(200).subscribe(() => this.inputQuery.nativeElement.focus());
    }

    updateLayout() {
        this._viewport.checkViewportSize();
    }

    safeApply() {
        let cd = this.injector.get(ChangeDetectorRef);
        cd.detectChanges();
    }
}
