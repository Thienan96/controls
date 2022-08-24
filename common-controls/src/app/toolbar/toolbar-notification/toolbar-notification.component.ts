import {Component, ElementRef, EventEmitter, Injector, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {
    CdkOverlayOrigin,
    FlexibleConnectedPositionStrategy,
    Overlay,
    OverlayRef
} from '@angular/cdk/overlay';
import {NotificationPanelComponent} from '../notification-panel/notification-panel.component';
import {ComponentPortal} from '@angular/cdk/portal';
import {interval} from 'rxjs';
import {takeWhile} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {NotificationService} from '../shared/notification.service';
import {HelperService} from '../../core/services/helper.service';


@Component({
    selector: 'ntk-toolbar-notification',
    templateUrl: './toolbar-notification.component.html'
})
export class ToolbarNotificationComponent implements OnInit, OnDestroy {
    @Input() intervals = 60000;
    @Input() showNotification: boolean;
    @Input() showNotificationTooltip = true; // NF-356: show/hide notification tooltip

    // For Notification Panel Config
    @Input() hideNotificationSetting = false;
    @Input() hideNotificationHistory = false;

    @Input() notificationPanelWidth = '25vw';

    @Output() showNotificationChange = new EventEmitter();
    @Output() notificationCountChanged = new EventEmitter();

    @ViewChild('notifButton', {static: false}) notifButtonRef: CdkOverlayOrigin;

    public notificationCount = 0;
    protected _notifOverlayRef: OverlayRef;
    private _notifOverlayPosition: FlexibleConnectedPositionStrategy;
    protected notifDropdownPanelPortal: ComponentPortal<NotificationPanelComponent>;
    private _notifDropdownInstance: NotificationPanelComponent;
    private _alive = true; // this for stop interval Observer

    private _deleteFinish: Subscription;
    private _eventFromNg1: Subscription;
    private _itemClickFinish: Subscription;

    // Services
    protected helperService: HelperService;
    protected overlay: Overlay;
    protected elementRef: ElementRef;

    constructor(protected injector: Injector,
                protected notificationService: NotificationService) {
        // Load Services
        this.helperService = this.injector.get(HelperService);
        this.overlay = this.injector.get(Overlay);
        this.elementRef = this.injector.get(ElementRef);


        this.notifDropdownPanelPortal = new ComponentPortal(NotificationPanelComponent, undefined);
    }

    ngOnInit() {
        this.startNotificationProcess();

        this._deleteFinish = this.notificationService.onDeleteMessageFinish().subscribe(() => {
            if (this._notifDropdownInstance) {
                this._notifDropdownInstance.refresh();
                this.updateNotificationCount();
            }
        });

        this._eventFromNg1 = this.helperService.UtilityService.onEventFromNg1().subscribe((param: any) => {
            if (param.name === 'notificationcountupdated') {
                this.updateNotificationCount();
            }
        });

        this._itemClickFinish = this.notificationService.onItemClickFinish().subscribe(() => {
            this.updateNotificationCount();
        });
    }

    ngOnDestroy() {
        this._alive = false;
        this._deleteFinish.unsubscribe();
        this._eventFromNg1.unsubscribe();
        this._itemClickFinish.unsubscribe();
    }

    onNotificationClick() {
        setTimeout(() => {
            this.toogleNotifDropdown();
        }, 100);
    }

    public startNotificationProcess() {
        this.updateNotificationCount();
        interval(this.intervals).pipe(
            takeWhile(() => this._alive))
            .subscribe(() => {
                this.updateNotificationCount();
            });
    }

    protected updateNotificationCount() {
        if (this.notificationService) {
            this.notificationService.getCount().subscribe(c => {
                this.notificationCount = c;
                this.showNotification = c > 0;
                this.showNotificationChange.emit(this.showNotification);
                this.notificationCountChanged.emit(c);

                if (this._notifOverlayRef && this._notifOverlayRef.hasAttached() && !this.showNotification) {
                    this.hideNotifDropdown();
                }
            });
        }
    }

    protected toogleNotifDropdown(externalParam?: any, uiSettingsParam?: any) {
        if (this._notifOverlayRef && this._notifOverlayRef.hasAttached()) {
            this._notifOverlayRef.detach();
            this.disposeNotifDropdownEvents();
        } else {
            this.showNotificationsDropdown(externalParam, uiSettingsParam);
        }
    }

    protected hideNotifDropdown() {
        if (this._notifOverlayRef && this._notifOverlayRef.hasAttached()) {
            this._notifOverlayRef.detach();
        }

        this.disposeNotifDropdownEvents();
        this.updateNotificationCount();
    }

    private disposeNotifDropdownEvents() {
        this._notifDropdownInstance.onDeleteMessageClick.unsubscribe();
        this._notifDropdownInstance.onDeleteMessageClick = new EventEmitter();

        this._notifDropdownInstance.onDeleteAllMessagesClick.unsubscribe();
        this._notifDropdownInstance.onDeleteAllMessagesClick = new EventEmitter();

        this._notifDropdownInstance.onItemClick.unsubscribe();
        this._notifDropdownInstance.onDeleteAllMessagesClick = new EventEmitter();

        this._notifDropdownInstance.onDeleteAllMessagesClick.unsubscribe();
        this._notifDropdownInstance.onDeleteAllMessagesClick = new EventEmitter();
    }

    private showNotificationsDropdown(externalDataParam?: any, uiSettingsParam?: any) {
        if (!this._notifOverlayRef) {
            this.initOverlayPosition();
            this._notifOverlayRef = this.overlay.create({
                positionStrategy: this._notifOverlayPosition,
                width: this.notificationPanelWidth,
                maxHeight: 'calc(100vh - 52px - 20vh)',
                minWidth: '350px',
                hasBackdrop: true,
                backdropClass: 'cdk-overlay-transparent-backdrop',
                panelClass: 'ntk-toolbar-notification-panel'
            });

            this._notifOverlayRef.backdropClick().subscribe(() => this.hideNotifDropdown());

        } else {
            this._notifOverlayRef.updatePosition();
        }

        if (!this._notifOverlayRef.hasAttached()) {
            let ref = this._notifOverlayRef.attach(this.notifDropdownPanelPortal);
            this._notifDropdownInstance = ref.instance;            
            this._notifDropdownInstance.itemTemplate = this.notificationService.getRegisteredCustomItemTemplate();
            this._notifDropdownInstance.dataParam = externalDataParam; //EJ4-1966            
            ref.instance.hideNotificationHistory = this.hideNotificationHistory;
            ref.instance.hideNotificationSetting = this.hideNotificationSetting; 
            if(uiSettingsParam) {
                ref.instance.applyUISettings(uiSettingsParam);
            }

            this._notifDropdownInstance.onDeleteMessageClick.subscribe((item) => {
                this.notificationService.deleteOneNotification(item).subscribe(() => {
                    this._notifDropdownInstance.refresh();
                    this.updateNotificationCount();
                });
            });

            this._notifDropdownInstance.onDeleteAllMessagesClick.subscribe(() => {
                this.hideNotifDropdown();
                this.notificationService.deleteAllNotifications().subscribe(() => {
                    this.updateNotificationCount();
                });
            });

            this._notifDropdownInstance.onItemClick.subscribe((item) => {
                this.hideNotifDropdown();
                this.notificationService.raiseItemClick(item);
            });

            this._notifDropdownInstance.onSettingsClick.subscribe(() => {
                this.hideNotifDropdown();
                this.notificationService.raiseSettingsClick();
            });

            this._notifDropdownInstance.onNotificationHistoriesClick.subscribe((e) => {
                this.hideNotifDropdown();
                this.notificationService.raiseShowingNotifgicationHistory({
                    event: e,
                    param: externalDataParam
                });                
            });
        }
    }

    private initOverlayPosition() {
        if (!this._notifOverlayPosition) {
            this._notifOverlayPosition = this.overlay.position()
                .flexibleConnectedTo(
                    this.elementRef);

            this._notifOverlayPosition.positions.push(
                {
                    offsetX: 0,
                    offsetY: 10,
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top'
                },
                {
                    offsetX: 0,
                    offsetY: -10,
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'bottom'
                },
                {
                    offsetX: 0,
                    offsetY: 12,
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top'
                },
                {
                    offsetX: 0,
                    offsetY: -10,
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'bottom'
                }
            );
        }
    }
}
