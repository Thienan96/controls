import {EventEmitter, Injectable, Output, TemplateRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {IEntity, IDataItems} from '../../shared/common-controls-shared.module';
import { ApiService } from '../../core/services/Api.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    protected _countMethod = 'notification/getnotificationscount';
    protected _getListMethod = 'notification/getnotificationslist';
    protected _getDeleteMethod = 'notification/markasread';
    protected _getDeleteAllMethod = 'notification/markallasread';

    private _itemTemplate?: TemplateRef<any>;

    private _subjectHistoryTemplate?: TemplateRef<any>;

    private _itemClick = new Subject<any>();

    private _historyItemClick = new Subject<any>();
    private _settingClick = new Subject<any>();
    private _deleteMessageFinish = new Subject<any>();
    private _itemClickFinish = new Subject<any>();

    private _showingNotificationHistory = new Subject<any>();

    onDeleteMessageFinish(): Observable<any> {
        return this._deleteMessageFinish.asObservable();
    }

    raiseDeleteMessageFinish(item: any) {
        this._deleteMessageFinish.next(item);
    }

    onItemClick(): Observable<any> {
        return this._itemClick.asObservable();
    }

    raiseItemClick(item: any) {
        return this._itemClick.next(item);
    }

    onItemClickFinish(): Observable<any> {
        return this._itemClickFinish.asObservable();
    }

    raiseItemClickFinish(item: any) {
        return this._itemClickFinish.next(item);
    }

    onHistoryItemClick(): Observable<any> {
        return this._historyItemClick.asObservable();
    }

    raiseHistoryItemClick(item: any) {
        return this._historyItemClick.next(item);
    }

    getNotifications(startIndex: number, pageSize: number, isRead = false, extenalParam?: any): Observable<IDataItems<any>> {
        let param = {
            StartIndex: startIndex,
            PageSize: pageSize,
            IsRead: isRead
        }

        // EJ4-1966: need external param in case there is some more param to filter
        if (extenalParam) {
            Object.assign(param, extenalParam)
        }
        return this._api.post<IDataItems<any>>(this._getListMethod, param);
    }

    onSettingsClick(): Observable<any> {
        return this._settingClick.asObservable();
    }

    raiseSettingsClick() {
        this._settingClick.next();
    }

    constructor(protected _api: ApiService) {
    }

    getCount(): Observable<any> {
        return this._api.get(this._countMethod);
    }

    // custom show error
    deleteOneNotification(message: IEntity): Observable<any> {
        let param = {
            Id: message.Id
        };
        return this._api.post(this._getDeleteMethod, param);
    }

    deleteAllNotifications(): Observable<any> {
        return this._api.post(this._getDeleteAllMethod, {});
    }

    getRegisteredCustomItemTemplate(): TemplateRef<any> | undefined {
        return this._itemTemplate;
    }

    getRegisteredCustomHistorySubjectTemplate(): TemplateRef<any> | undefined {
        return this._subjectHistoryTemplate;
    }

    registeredCustomItemTemplate(template: TemplateRef<any>) {
        this._itemTemplate = template;
    }

    registeredCustomItemHostorySubjectTemplate(template: TemplateRef<any>) {
        this._subjectHistoryTemplate = template;
    }

    onShowingNotificationHistory(): Observable<any> {
        return this._showingNotificationHistory.asObservable();
    }

    raiseShowingNotifgicationHistory($event: any) {
        this._showingNotificationHistory.next($event);
    }
}
