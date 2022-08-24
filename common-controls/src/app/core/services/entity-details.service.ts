import { Injectable, Type, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { IEntity } from '../../shared/models/common.info';
import { ApiService } from './Api.service';


@Injectable({
    providedIn:'root'
})
export class EntityDetailsService {

    constructor(private _api: ApiService) {
    }

    getInfor(method: string, params: { [param: string]: string | string[] }): Observable<any> {
        return this._api.get(method, params );
    }

    getById<T extends IEntity>(method: string, params: { [param: string]: string | string[] }): Observable<T> {
        return this._api.get<T>(method, params);
    }

    save<T extends IEntity>(method: string, entity: T, skipShowError = false): Observable<any> {
        return this._api.post<T>(method, entity, skipShowError);
    }
}
