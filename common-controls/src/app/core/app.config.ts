import {Injectable} from '@angular/core';
import moment from 'moment-es6';

@Injectable({
    providedIn: 'root',
})
export class AppConfig {
    [propName: string]: any;
    public APP_TITLE: string;
    public APP = 'common-controls'; // (hs)
    public APP_SESSION = 'ntk-session';
    public API_APP = ''; // prefix application to API
    public API_URL: string; // (http://192.168.45.7/trunk/)
    public API_APP_URL: string; // API + API_URL (http://192.168.45.7/trunk/hs/)
    public APP_ROOT_URL: string; // Root URL to get image url... (http://192.168.45.7/trunk/)

    public VERSION_BUILD: string;
    public VERSION: string;
    public RELEASE_DATE: moment.Moment;
    public WITH_NG1 = true; // by default almost application are work with AngualrJs
    public MAJOR_RELEASE_DATE: moment.Moment; // NBSHD-4167
    public toolbarConfig?: {
        hideUserMenu?: boolean;
        hideNotification?: boolean;
        hideNotificationSetting?: boolean;
        hideNotificationHistory?: boolean;
        hideNewReleaseAlert?: boolean;
        userMenuConfig?: {
            showUserProfileItem?: boolean;
            showChangePasswordItem?: boolean;
            showChangeLangualeItem?: boolean;
            showUserSettingItem?: boolean;
            showNotificationMenu?: boolean;
            showReleaseNotesItem?: boolean;
        }
    };
    public DATE_FORMAT: string;
}
