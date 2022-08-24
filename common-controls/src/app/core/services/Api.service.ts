import {Injectable, Injector} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TranslationService} from './translation.service';
import {DialogService} from './dialog.service';
import {CustomHttpParamEncoder} from '../../shared/models/customhttpparamencoder';

@Injectable({
  providedIn: 'root'
})
/**
 * This class make easieer to call http client to API
 */
export class ApiService {

  static SKIP_API_ERROR_HEADER_KEY = 'skipShowAPIError';
  constructor(private injector: Injector, private _http: HttpClient) { }

  post<T>(url: string, data: any, skipShowError = false): Observable<T> {
    if (skipShowError) {
      return this._http.post<T>(url, data, {
        headers: { 'skipShowAPIError' : 'true' }
      });
    } else {
      return this._http.post<T>(url, data);
    }
  }

  get<T>(url: string, params?: { [param: string]: string | string[] }, skipShowError = false, options= {}): Observable<T> {
    // process to remove undefined values
    let p: { [param: string]: string | string[] } = {};
    for (let k in params) {
      if (params[k] !== undefined) {
        p[k] = params[k];
      }
    }

    if (skipShowError) {
      let headers: HttpHeaders = options[`headers`];
      if (!headers) {
        headers = new HttpHeaders();
      } else {
        if (!(headers instanceof HttpHeaders)) {
          headers = new HttpHeaders(headers);
        }
      }
      headers = headers.set(`skipShowAPIError`, `true`);
      options[`headers`] = headers;
    }
    options[`params`] = new HttpParams({fromObject: p, encoder: new CustomHttpParamEncoder()});


    return this._http.get<T>(url, options);
  }

  public processBaseErrors(ex: any): boolean {
    if (ex.error) {
      if (ex.error.code === 'InvalidReferenceId' && (<string>ex.error.message).indexOf('"ManagedById"') >= 0) {
        let translation = this.injector.get(TranslationService);
        let dlgSvc = this.injector.get(DialogService);
        let mess = translation.getTranslation('ManagerNoVisibilityOnSiteOrUnsuitableRole');
        dlgSvc.showErrorToastMessage(mess);
        return true;
      }
    }
    return false;
  }
}
