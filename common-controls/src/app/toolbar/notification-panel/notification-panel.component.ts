import {AfterViewInit, Component, EventEmitter, Injector, Input, OnInit, Output, TemplateRef} from '@angular/core';
import {Observable} from 'rxjs';
import {NotificationService} from '../shared/notification.service';
import {IDataItems, ILazyItem} from '../../shared/models/common.info';
import {HelperService} from '../../core/services/helper.service';
import {LazyDataController} from '../../core/controllers/lazy-data-controller';

@Component({
    selector: 'ntk-notification-panel',
    templateUrl: './notification-panel.component.html',
    styleUrls: ['./notification-panel.component.scss'],
    host: {'class': 'ntk-toolbar-theme'}
})
export class NotificationPanelComponent extends LazyDataController<ILazyItem> implements AfterViewInit, OnInit {

    // For Notification Panel Config
    hideNotificationSetting = false;
    hideNotificationHistory = false;
    hideClearAll = false;

    @Output() onDeleteMessageClick = new EventEmitter<any>();
    @Output() onDeleteAllMessagesClick = new EventEmitter<any>();
    @Output() onItemClick = new EventEmitter<any>();
    @Output() onSettingsClick = new EventEmitter<any>();
    @Output() onNotificationHistoriesClick = new EventEmitter<any>();

    itemTemplate: TemplateRef<any>;

    dataParam: any; // EJ4-1966: in case get for approve list we need to pass param
    

    showStatusText = false;
    statusTextKey = '';


    // Services
    protected helperService: HelperService;

    constructor(injector: Injector,
                protected notifSvc: NotificationService) {
        super(injector);

        // Load services
        this.helperService = injector.get(HelperService);
    }

    ngOnInit() {
        this.refreshList(true);
    }

    ngAfterViewInit(): void {
    }

    loadData(startIndex: number, pageSize: number): Observable<IDataItems<ILazyItem>> {
        return this.notifSvc.getNotifications(startIndex, pageSize, false /*Not read*/, this.dataParam);
    }

    onCountDataStart() {
        // this.helperService.isBusy = true;
        this.showStatusText = true;
        this.statusTextKey = 'lbLoadingData';
    }

    onCountDataFinished(countItems: number) {
        this.setPanelHeight(countItems);

        if (countItems > 0) {
            this.showStatusText = false;
        } else {
            this.showStatusText = true;
            this.statusTextKey = 'msgNoUnreadNotifications';
        }
        // this.helperService.isBusy = false;
    }

    itemClick(item, index: number) {
        this.onItemClick.emit(item);
    }

    onDeleteMessageClicked(item, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.onDeleteMessageClick.emit(item);
    }

    protected getPanelHeight(total: number) {
        return  total === 0 ? 100 : total * 80 + 50 + 4;
    }

    protected setPanelHeight(total: number) {
        let height = this.getPanelHeight(total);
        $('.ntk-toolbar-notification-panel').height(height);
    }

    refresh() {
        this.refreshList(true);
    }

    /**
     * EJ4-1966: allow customize UI
     * @param settingsParam 
     */
    public applyUISettings(settingsParam: any) {
        if (settingsParam) {
            this.hideNotificationSetting = settingsParam.hideNotificationSetting;
            this.hideNotificationHistory = settingsParam.hideNotificationHistory;
            this.hideClearAll = settingsParam.hideClearAll;
        }        
    }
}
