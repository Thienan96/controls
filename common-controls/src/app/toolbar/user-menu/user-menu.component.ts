import { Component, Injector, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { ToolbarService } from '../shared/toolbar.service';
import { NotificationService } from '../shared/notification.service';
import { HelperService } from '../../core/services/helper.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'ntk-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnDestroy, AfterViewInit {

    @Input() imageUrl: string;
    highlightNewReleaseAlert: boolean;
    @Input() showNotificationMenu: boolean = true;
    private _eventFromNg1: Subscription;

    // Services
    protected helperService: HelperService;
    protected toolbarService: ToolbarService;
    protected notificationService: NotificationService;

    @Input() showUserProfileItem = true;
    @Input() showChangePasswordItem = true;
    @Input() showUserSettingItem = true;
    @Input() showReleaseNotesItem = true;

    @Input() showChangeLangualeItem = true;

    @Input() allowNotificationSettingItem = true;
    constructor(protected injector: Injector) {
        // Load services
        this.helperService = this.injector.get(HelperService);
        this.toolbarService = this.injector.get(ToolbarService);
        this.notificationService = this.injector.get(NotificationService);

        //NBSHD-3646: Only Addmin and Manager can configure the notification & email setting

        // the component used in many applicaiton, we cannot write the rule here. Need to mode to code of HS/CL

        // let role = 'Admin';

        // if (this.helperService.AuthenticationService.workingContext) {
        //     role = this.helperService.AuthenticationService.workingContext.Role;
        // }
        // this.showNotificationMenu = role === 'Admin' || role === 'Manager';
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.highlightNewReleaseAlert = this.toolbarService.isShowNewReleaseAlert();

            // NBSHD-3991: we should hide the button when user check the checkbox
            this._eventFromNg1 = this.helperService.UtilityService.onEventFromNg1().subscribe(param => {
                if (param.name === 'releasenotes_dismiss') {
                    this.highlightNewReleaseAlert = this.toolbarService.isShowNewReleaseAlert();
                }
            });

            // NBSHD-4705: in apps that run full on Angular2 which will fire event on toolbar service when user dissmiss
            this.toolbarService.onReleasenotesDismiss().subscribe(() => {
                this.highlightNewReleaseAlert = this.toolbarService.isShowNewReleaseAlert();                
            });
        }, 500);
    }

    ngOnDestroy() {
        if (this._eventFromNg1) {
            this._eventFromNg1.unsubscribe();
        }
    }

    menuOpened() {
        jQuery('.ntk-toolbar-menu').closest('.cdk-overlay-connected-position-bounding-box').addClass('ntk-toolbar-menu-overlay');
    }

    onLogoutClick() {
        this.raiseUserMenuClick('logOut');
    }

    onChangePasswordClick() {
        this.raiseUserMenuClick('showChangePassword');
    }

    onChangeLanguageClick() {
        this.raiseUserMenuClick('showChangeLanguage');
    }


    onShowProfileClick() {
        this.raiseUserMenuClick('showUserProfile');
    }

    onAboutClick() {
        this.raiseUserMenuClick('showAbout');
    }

    onGeneralSettingClick() {
        this.raiseUserMenuClick('showGeneralSetting');
    }

    onNotificationSettingClick() {
        this.notificationService.raiseSettingsClick();
    }

    onReleaseNotesClick() {
        this.raiseUserMenuClick('showReleaseNotes');
    }

    raiseUserMenuClick(eventName: string) {
        this.toolbarService.raiseUserMenuClick(eventName);
    }
}
