import {
    AfterViewInit,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Inject,
    Input,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {ILazyItem} from '../../shared/models/common.info';
import {VirtualListComponent} from '../../virtual-list/virtual-list/virtual-list.component';
import {UtilityService} from '../../core/services/utility.service';
import {TranslationService} from '../../core/services/translation.service';
import {Subject} from 'rxjs/Subject';


@Component({
    selector: 'ntk-autocomplete-panel',
    templateUrl: './autocomplete-panel.component.html',
    styleUrls: ['./autocomplete-panel.component.scss']
})
export class AutocompletePanelComponent implements AfterViewInit {
    @ViewChild(VirtualListComponent, {static: true}) virtualListComponent: VirtualListComponent;
    @HostBinding('class.visible-control') showControl = false;

    @Input() noDataText = 'No data to display';

    template: TemplateRef<any>;
    onSelected: (item: ILazyItem) => {};
    changeTotal: (total: number) => {};
    onClose: () => {};
    currentItem: ILazyItem;
    dataLoaded = false;
    itemHeight: number;
    loading = false;
    focused = false;
    blurTimer: any;


    _currentIndex = -1;

    isSmallScreen: boolean;
    title: string;
    isShowSearch = false;
    searchKeyword = '';
    searchKeywordChange = new Subject<string>();

    get currentIndex() {
        return this._currentIndex;
    }

    set currentIndex(value) {
        this._currentIndex = value;

        // Reset check
        this.virtualListComponent.items.forEach((item) => {
            item.isChecked = false;
        });

        // Check current item
        this.currentItem = this.virtualListComponent.items[value];
        if (this.currentItem) {
            this.currentItem.isChecked = true;
        }

    }

    constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any,
                private elementRef: ElementRef,
                private utilityService: UtilityService,
                i18n: TranslationService) {
        this.template = dialogData['template'];
        this.onSelected = dialogData['onSelected'];
        this.changeTotal = dialogData['changeTotal'];
        this.itemHeight = dialogData['itemHeight'];
        this.onClose = dialogData['onClose'];


        // Fix focus on IE
        if (this.utilityService.isIE) {
            this.elementRef.nativeElement.tabIndex = -1;
        }

        if (i18n.isExistsTranslation('lbNoDataToDisplay')) {
            this.noDataText = i18n.getTranslation('lbNoDataToDisplay');
        }
    }


    /**
     * Fix focus IE
     */
    @HostListener('focus')
    onFocus() {
        this.focused = true;

        clearTimeout(this.blurTimer);
    }

    /**
     * Fix blur IE
     */
    @HostListener('blur')
    onBlur() {
        this.focused = false;

        clearTimeout(this.blurTimer);
        this.blurTimer = setTimeout(() => {
            this.close();
        }, 200);

    }

    @HostListener('keydown', ['$event.key'])
    onKeyDown(key: string) {
        switch (key) {
            case 'Down': // IE
            case 'ArrowDown':
                this.selectNextItem(1);
                break;
            case 'Up': // IE
            case 'ArrowUp':
                this.selectNextItem(-1);
                break;
            case 'Enter':
                this.select(this.getCurrentItem());
                break;
            case 'Esc':
            case 'Escape':
                this.close();
                break;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.virtualListComponent.refresh();
        });
    }

    onGetData(dataInfo) {
        this.loading = true;
        let callBack = dataInfo.callBack;
        dataInfo.callBack = (data) => {
            this.loading = false;
            callBack(data);
        };
        dataInfo.searchKeyword = this.searchKeyword;
        this.dialogData['onGetData'](dataInfo);
    }

    onTotalItemChange(total) {
        this.dataLoaded = true;
        this.showControl = true;

        this.changeTotal(total);
    }

    selectNextItem(indicate: number) {
        if (this.virtualListComponent.itemCount === 0) {
            return;
        }
        if (!this.currentItem && indicate === 1) {
            this.currentIndex = 0;
            return;
        }
        if (this.currentItem) {
            let currentIndex = this.currentIndex + indicate;
            if (0 <= currentIndex && currentIndex < this.virtualListComponent.itemCount) {
                this.currentIndex = this.currentIndex + indicate;
            }
        }
        this.scrollTo(this.currentIndex);
    }

    getCurrentItem(): ILazyItem {
        return this.currentItem;
    }


    private scrollTo(selectedIndex: number) {
        let virtualScroll = this.virtualListComponent.getVirtualScroll(),
            info = virtualScroll.viewPortInfo,
            startIndex = info.startIndex,
            endIndex = info.endIndex;
        if (selectedIndex > endIndex - 1) {
            let index = selectedIndex,
                itemHeight = this.virtualListComponent.itemHeight,
                scrollPosition = itemHeight * index - $(this.elementRef.nativeElement).height() + itemHeight;
            virtualScroll.scrollToPosition(scrollPosition, 0);
        }
        if (selectedIndex <= startIndex - 1) {
            this.virtualListComponent.scrollToIndex(selectedIndex);
            virtualScroll.scrollToIndex(selectedIndex, true, 0, 0);
        }
    }

    /**
     * Select a item
     * @param item
     */
    select(item: ILazyItem) {
        this.onSelected(item);
    }

    /**
     * Close panel
     */
    close() {
        this.onClose();
    }

    onSearchKeywordChange(value: string) {
        this.searchKeywordChange.next(value);
        setTimeout(() => {
            this.virtualListComponent.refresh();
        }, 10);
    }
}
