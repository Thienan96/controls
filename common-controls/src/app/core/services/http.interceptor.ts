import {Injectable, Injector, isDevMode} from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpEvent,
    HttpEventType,
    HttpHandler,
    HttpHeaders,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';

import {Observable} from 'rxjs/Observable';
import {StorageKeys, StorageLocation, StorageService} from './storage.service';
import {DialogService} from './dialog.service';
import {AuthenticationService} from './authentication.service';
import {AppConfig} from '../app.config';
import {Subscriber, Subscription, throwError} from 'rxjs';
import {UtilityService} from './utility.service';
import {ApiService} from './Api.service';
import {TranslationService} from './translation.service';
import {map} from 'rxjs/operators';
import {CommunicationService} from './communication.service';

export class PendingCall {
    request: HttpRequest<any>;
    handler: HttpHandler;
    subcriber: Subscriber<any>;

    httpSubScription?: Subscription;
}


@Injectable(
    {
        providedIn: 'root',
    }
)
export class CustomHttpInterceptor implements HttpInterceptor {
    private _dialogSvc: DialogService;
    private _storageSvc: StorageService;

    private _authenticationSvc: AuthenticationService;

    private _util: UtilityService;

    private _i18n: TranslationService;
    private pendingCalls: PendingCall[] = [];

    protected _lastCallToServer: Date | undefined;

    private _refreshTokendSub: Subscription;

    constructor(protected injector: Injector, protected _appConfig: AppConfig) {
        this._dialogSvc = injector.get(DialogService);
        this._storageSvc = injector.get(StorageService);
        this._authenticationSvc = injector.get(AuthenticationService);
        this._util = injector.get(UtilityService);
        this._i18n = injector.get(TranslationService);

        if (_appConfig.WITH_NG1) {
            this._util.onEventFromNg1().subscribe(e => {
                if (e.name === 'apiRequestCompleted' || e.name === 'onAPIRequestCompleted') {
                    this._lastCallToServer = new Date();
                } else if (e.name === 'onSessionRenewOK') {
                    this.performAllPendingRequests();
                } else if (e.name === 'onSessionRenewKO') {
                    // when Ng1 cannot renew session most open as network error then we dont need to wait for the pendding request
                    if (e.value[0] === 'no_refresh_infor') {
                        this.performAllPendingRequests();
                    } else {
                        this.rejectAllPendingRequests(e.value[0] || 'unknow_error');
                    }
                }
            });
        }        
    }    

    buildApiUrl(method: string): string {
        let result: string = this._appConfig.API_APP_URL + method;
        return result;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // console.log('----------intercept request: ', request.url);

        // in case we are renew session
        if (request.headers.has('skipRenewSession')) {
            request.headers.delete('skipRenewSession');
            return new Observable<HttpEvent<any>>(x => {
                this.performRequest(request, next, x);
            });
        }

        let ob = new Observable<HttpEvent<any>>(x => {
            let lastRequest: Subscription;
            let lastPendingIndex = -1;
            if (this.checkIfNeedRenewSession()) {
                console.log('---wating for refresh token -> add pedding');
                lastPendingIndex = this.pendingCalls.push(
                    {
                        request: request,
                        handler: next,
                        subcriber: x,
                        httpSubScription: undefined
                    }
                ) - 1;
            } else {
                lastRequest = this.performRequest(request, next, x);
            }
            return (() => {
                // this call when the caller unsuncribe the call, the try to cancel to server
                if (lastRequest && !lastRequest.closed) {
                    lastRequest.unsubscribe();
                } else if (lastPendingIndex >= 0) {
                    try {
                        if (this.pendingCalls.length > lastPendingIndex) {
                            let pending = this.pendingCalls[lastPendingIndex];
                            if (pending.httpSubScription) { pending.httpSubScription.unsubscribe(); }

                            this.pendingCalls.splice(lastPendingIndex, 1);
                        }
                    } catch (ex) {
                        console.log('Cancel pending request error => ', ex);
                    }
                }
            });
        });
        return ob;
    }


    private checkIfNeedRenewSession(): boolean {
        if (this._appConfig.WITH_NG1) {
            return this._util.checkIfNeedRenewSession();
        } else {
            let lastCall = this._lastCallToServer;

            let diffInSecond = 0;
            if (lastCall) {
                let current = new Date();
                diffInSecond = (current.getTime() - lastCall.getTime()) / 1000;
            }

            if (diffInSecond > 1795) { // 1795 second = 29 minutes 55 seconds
                let _self = this;
                if (this._refreshTokendSub === undefined || this._refreshTokendSub.closed) {
                    if (lastCall) {
                        console.log('ng2 API last call was:', lastCall.toString());
                        console.log('ng2 Current :', new Date().toString());
                    }
                    console.log('---------------Now refresh token');
                    this._refreshTokendSub = this.reNewSession().subscribe(x => {
                        if (this._refreshTokendSub && !this._refreshTokendSub.closed) {
                            this._refreshTokendSub.unsubscribe();
                        }

                        this._refreshTokendSub = undefined;


                        this.performAllPendingRequests();
                    }, (err) => {
                        console.log('---------------refresh token <fail> - ', err);

                        if (this._refreshTokendSub && !this._refreshTokendSub.closed) {
                            this._refreshTokendSub.unsubscribe();
                        }
                        this._refreshTokendSub = undefined;

                        // in case we cannot refresh session becasue there is no refresh token
                        // then still need to applied the call normally and let session expired process run
                        setTimeout(() => {
                            if ('no_refresh_infor' === err) {
                                this.performAllPendingRequests();
                            } else {
                                this.rejectAllPendingRequests(err || 'unknow_error');
                            }
                        }, 200);
                    });

                }
                return true;
            }
        }

        return false;
    }

    private performAllPendingRequests() {
        console.log('--performAllPendingRequests ', this.pendingCalls.length);

        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.pendingCalls.length; i++) {
            this.pendingCalls[i].httpSubScription = this.performRequest(this.pendingCalls[i].request
                , this.pendingCalls[i].handler, this.pendingCalls[i].subcriber);
        }

        this.pendingCalls.splice(0, this.pendingCalls.length);
    }

    protected rejectAllPendingRequests(error: any) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.pendingCalls.length; i++) {
            this.pendingCalls[i].subcriber.error(error);
            this.pendingCalls[i].subcriber.complete();
        }
        this.pendingCalls.splice(0, this.pendingCalls.length);
    }

    private performRequest(request: HttpRequest<any>, next: HttpHandler, callback: Subscriber<any>): Subscription {

        let skipShowError = false;

        if (request.headers.has(ApiService.SKIP_API_ERROR_HEADER_KEY)) {
            skipShowError = true;
            request.headers.delete(ApiService.SKIP_API_ERROR_HEADER_KEY);
        }

        // add a custom header
        let headers: HttpHeaders = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        // console.log('get token from: ', StorageKeys.SessionId);
        let sessionId = this._storageSvc.getValue(StorageKeys.SessionId, StorageLocation.Session);

        if (!!sessionId) {
            headers = headers.set('Authorization', 'Token ' + sessionId);
        }

        // NBSHD-3941: Pass the ClientId into request header when call the api
        // We need to get the ClientId from Angular JS
        let clientId: string;
        if (this._appConfig.WITH_NG1) {
            clientId = this.injector.get(CommunicationService).getCurrentClientId();
        } else {
            clientId = this._authenticationSvc.clientId;
        }

        if (!!clientId) {
            headers = headers.set('ClientId', clientId);
        }

        let finalUrl = request.url;

        let responseType = request.responseType; // replace responseType to download file
        
        // if the request is for resource or assets , we dont follow API call
        let testAssetsRegex = /(https?:)?\/\/?[^'"<>]+?\.(jpe?g|gif|png|json)$/im;
        if (!(/\/assets/gi.test(finalUrl)) && !testAssetsRegex.test(finalUrl)) {
            finalUrl = this.buildApiUrl(finalUrl);
        }
        // else {
        //     if (isDevMode()) {
        //         console.log('This is assets url= ', finalUrl);
        //     }
        // }


        let report = request.reportProgress; // for upload file request, we need to report status

        const customReq: HttpRequest<any> = request.clone({
            headers: headers,
            url: finalUrl,
            responseType: responseType,
            reportProgress: report
        });

        // console.log('handle request: ', customReq.url);

        return next.handle(customReq).subscribe( // Succeeds when there is a response; ignore other events
            successResp => {
                // console.log('request OK: ', successResp.type);

                if (successResp.type === HttpEventType.Sent || successResp.type === HttpEventType.UploadProgress) {
                    callback.next(successResp);
                }

                // ok = successResp instanceof HttpResponse ? 'succeeded' : ''

                if (successResp.type === HttpEventType.Response) {
                    let resp: HttpResponse<any> = successResp;

                    callback.next(resp);
                    callback.complete();


                    this._util.updateLastCallTimeStamp();
                    this._lastCallToServer = new Date();
                }
            },

            // Operation failed; error is an HttpErrorResponse
            failedResp => {
                // 'failed'

                // console.log('request KO: ', failedResp);

                let errResp: HttpErrorResponse = failedResp;

                try {
                    let errorJson = errResp.error;
                    if (errResp.error instanceof ArrayBuffer) {
                        // console.log('response error is array buffer');
                        try {
                            let errorString = String.fromCharCode.apply(null, new Uint8Array(<ArrayBuffer>errResp.error));
                            // console.log('convert to string: ', errorString);

                            errorJson = JSON.parse(errorString);
                            // console.log('convert to object: ', errorJson);
                        } catch { }
                    }

                    let url: string = errResp.url;
                    let httpCodeNumber: number = errResp.status;
                    let errorCode: string = errorJson ? errorJson.code : "";
                    let errorMessage: string = errorJson ? errorJson.message: "";

                    // debugger;
                    if (isDevMode()) {
                        console.log('url: ' + url);
                        console.log('httpCodeNumber: ' + httpCodeNumber);
                        console.log('errorCode: ' + errorCode);
                        console.log('errorMessage: ' + errorMessage);
                    }

                    if (httpCodeNumber === 0) {
                        this.showOfflineWarning();
                    }

                    // if get these errorCode => dont try to logon anymore
                    if (errorCode === 'AccountNotAllowLogon' || errorCode === 'InvalidRefreshToken') {
                        this._authenticationSvc.logout(true).subscribe();
                        this._authenticationSvc.notAllowLogon.emit(true);
                    }

                    if (errorCode === 'SessionExpired' ||
                        errorCode === 'InvalidSession' ||
                        errorCode === 'InvalidAuthorization') {

                        // dont raise message Session Expired for the request session/KeepAlive && session/GetAuthenticatedUser && session/Logoff
                        // this is IMPORTANT CHECK, don't remove the check
                        if (!(/\/session\/KeepAlive/gi.test(url))
                            && !(/\/session\/GetAuthenticatedUser/gi.test(url))
                            && !(/\/session\/Logoff/gi.test(url))
                        ) {
                            this._authenticationSvc.processSessionExpired(autoLogonSuccess => {
                                if (!autoLogonSuccess) {
                                    // show expire toast message
                                    this._dialogSvc.showSessionExpiredMessage();

                                    // emit sessionExpired for Media
                                    this._authenticationSvc.sessionExpired.emit(true);

                                    this._authenticationSvc.logout(true).subscribe();
                                }
                            });

                            return;
                        }
                    }

                    if (isDevMode()) {
                        console.log('receive error and skipShowError = ', skipShowError);
                    }

                    if (!skipShowError) {
                        this._dialogSvc.showApiError(errResp, errorJson);
                    }

                } catch { }

                callback.error(errResp);
                callback.complete();
            });
    }

    protected reNewSession(): Observable<any> {

        let refreshToken: string = this._storageSvc.getValue(StorageKeys.RefreshToken, StorageLocation.Local);
        let clientId: string = this._storageSvc.getValue(StorageKeys.ClientId);

        let language: string = this._i18n.getCurrentLanguage();
        let languageCode3: string = this._util.convertLanguageCodeToPossibleSupportLanguageCode3(language);

        if (clientId && refreshToken) {

            let loginInfor = {
                RefreshToken: refreshToken,
                ClientId: clientId,
                languageCode: languageCode3,  // server really need the language code to able to work
            };

            let http = this.injector.get(HttpClient);

            return http.post('session/logon', loginInfor, {
                headers: { 'Content-Type': 'application/json', skipRenewSession: 'ok' }
            }).pipe(
                map(x => {
                    console.log('renew session ok');
                    this._authenticationSvc.processAuthInfo(<any>x);
                    this._lastCallToServer = new Date();
                    return x;
                })
            );

        }

        return throwError('no_refresh_infor');
    }
    showOfflineWarning() {
        if (this._appConfig.WITH_NG1) {
            this._util.showOfflineWarning();
        } else {
            const key = 'msg_UnableConnectToServer';
            let msg = 'Unable to connect to server. Please check your network connection and try again.';

            const trns = this.injector.get(TranslationService);
            if (trns && trns.isExistsTranslation(key)) {
                msg = trns.getTranslation(key);
            }

            this._dialogSvc.showWarningToastMessage(msg);
        }
    }

    // these code not allow to use here anymore but keep as reference
    // private isNotDisplayAsError(errorCode: string): boolean {
    //     return [
    //         'AccountLocked',
    //         'InvalidLoginOrPassword',
    //         'AccountNotAllowLogon',
    //         'SessionExpired',
    //         'InvalidSession',
    //         'DataConcurrency',
    //         'SystemAdminLogonOnInvalidIpAddress',
    //         'InvalidOldPassword',
    //         'NewPasswordStrenghtIsTooWeak',
    //         'ExternalContactNotAllowLogon',
    //         'InvalidAuthorization',
    //         'InvalidReferenceId',
    //         'ExistFolderName',
    //         'InvalidExpectedDate', // NBSHD-3982
    //         'InvalidRequestedDate', // NBSHD-3982
    //         'InvalidPlannedDate'// NBSHD-3982
    //     ].indexOf(errorCode) >= 0;
    // }
}
