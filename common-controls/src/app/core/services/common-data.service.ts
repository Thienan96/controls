import { Injectable, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BaseItem, Language, AboutInformation, IPartyEmail } from '../../shared/models/common.info';
import { map } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class CommonDataService {

    @Output() onShowGeneralSettings: EventEmitter<any> = new EventEmitter();

    constructor(private _http: HttpClient) { }

    getAvailableSites(): Observable<BaseItem[]> {
        return this._http.get('Common/GetAvailableSites').pipe(map(data => <BaseItem[]>data));
    }

    getEmailLanguages(): Observable<Language[]> {
        return this._http.get('Common/GetEmailLanguages').pipe(map(data => <Language[]>data));
    }

    estimatePasswordStrength(password: string): Observable<string> {
        let postData = { Password: password };
        return this._http.post('Common/EstimatePasswordStrength', postData).pipe(map(data => <string>data));
    }

    getAboutInformation(): Observable<AboutInformation> {
        return this._http.get('Common/GetAboutInformation').pipe(map(data => <AboutInformation>data));
    }

    getPartyEmails(query: string): Observable<IPartyEmail[]> {
        let postData = { Query: query };
        return this._http.post('Common/GetPartyEmails', postData).pipe(map(data => <IPartyEmail[]>data));
    }

    getMailContent(mailId: string): Observable<string> {
        let url = 'MailProcess/GetContent?mailId=' + mailId;
        return this._http.get(url).pipe(map(data => <string>data));
    }

    getManagedCompanyEmailLanguages(): Observable<any[]> {
        return this._http.get('Common/GetManagedCompanyEmailLanguages').pipe(map(data => <any[]>data));
    }

    checkValidContactsInCc(contactIds: string): Observable<any> {
        let params = { contactIds: contactIds };
        return this._http.get('Common/CheckValidContactsInCc', { params: params });
    }
}