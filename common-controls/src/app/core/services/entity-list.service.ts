import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class EntityListService {

    constructor(private _http: HttpClient) {
    }

    getCount(method: string, queryCondition?: any): Observable<any> {
        if (!queryCondition) { queryCondition = {}; }
        return this._http.post(method, queryCondition);
    }

    getListWithPost<T>(method: string, queryCondition?: any): Observable<T[]> {
        return this._http.post(method, queryCondition).pipe(map(data => <T[]>data));
    }

    getDataWithPost<T>(method: string, queryCondition?: any): Observable<T> {
        return this._http.post(method, queryCondition).pipe(map(data => <T>data));
    }

    getList<T>(method: string, params: { [param: string]: string | string[] }): Observable<T[]> {
        return this._http.get(method, { params: params} ).pipe(map( o => <T[]>o));
    }
}
