import {EventEmitter, Injectable, Injector, Optional, Output} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, finalize, map, mergeMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {StorageKeys, StorageLocation, StorageService} from './storage.service';
import {UtilityService} from './utility.service';
import {TranslationService} from './translation.service';
import {AuthenticatedUser, ManagedCompanyRelativeInfo, ModuleAccessRights, WorkingContext} from '../../shared/models/user.info';
import {BaseItem, CommonSharedConfig} from '../../shared/models/common.info';
import {AppConfig} from '../app.config';
import {ApiService} from './Api.service';
import {CommunicationService} from './communication.service';
import {PasswordStrength} from '../../authentication/shared/authentication.model';


@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    @Output() sessionExpired: EventEmitter<any> = new EventEmitter();
    @Output() notAllowLogon: EventEmitter<any> = new EventEmitter();
    @Output() authenticated: EventEmitter<any> = new EventEmitter();
    // fired when user log out
    @Output() onlogout: EventEmitter<any> = new EventEmitter();
    protected _storageSvc: StorageService;
    protected _util: UtilityService;
    protected _translationSvc: TranslationService;

    protected _validWorkingContexts: Array<WorkingContext> | undefined = undefined;
    protected _authUser: AuthenticatedUser | undefined = undefined;

    protected _decimalSep = '.';
    protected _groupSep = ',';
    protected _numberDecimals = 2;

    protected _dateFormat = 'DD/MM/YYYY';

    protected _appConfig: AppConfig;

    protected _api: ApiService;

    _managedCompanyRelativeInfo: ManagedCompanyRelativeInfo;

    constructor(protected injector: Injector, protected _http: HttpClient, @Optional() private _sharedConfig: CommonSharedConfig) {
        this._storageSvc = injector.get(StorageService);
        this._util = injector.get(UtilityService);
        this._translationSvc = injector.get(TranslationService);
        this._appConfig = injector.get(AppConfig);
        this._api = injector.get(ApiService);
    }


    // read only properties
    get sessionId(): string | undefined {
        return this._authUser ? this._authUser.SessionId : undefined;
    }

    get login(): string | undefined {
        return this._authUser ? this._authUser.UserLogin : undefined;
    }

    get contact(): BaseItem | undefined {
        return this._authUser ? this._authUser.Contact : undefined;
    }

    get isAuthenticated(): boolean {
        return !!this._authUser && !!this.sessionId;
    }

    get workingContext(): WorkingContext | undefined {
        return this._authUser ? this._authUser.WorkingContext : undefined;
    }

    get UILanguageId(): string | undefined {
        return this._authUser ? this._authUser.UILanguageId : undefined;
    }

    get currentManagedCompany(): BaseItem | undefined {
        return this._authUser ? this._authUser.ManagedCompany : undefined;
    }

    get validWorkingContexts(): Array<WorkingContext> | undefined {
        return this._validWorkingContexts;
    }

    get isKeepSignedInMode(): boolean {
        // we consider the keep me signed when we have the value UserLogin and UserPassword (value of password is replaced by a RefreshToken) in the local storage
        // this value may be not available when the user open 2 CHECKLISTS tab and logout on one tab (it means that user log out on a tab, other tab also is logged out)
        let loginByKeepMeSigned: string = this._storageSvc.getValue(StorageKeys.UserLogin, StorageLocation.Local);
        let refreshTokenByKeepMeSigned: string = this._storageSvc.getValue(StorageKeys.RefreshToken, StorageLocation.Local);
        if (!!loginByKeepMeSigned && !!refreshTokenByKeepMeSigned) {
            return true;
        }

        return false;
    }

    get decimalSep(): string {
        return this._decimalSep;
    }

    get numberDecimals(): number {
        return this._numberDecimals;
    }

    get groupSep(): string {
        return this._groupSep;
    }

    get dateFormat() {
        return this._dateFormat;
    }

    get managedCompanyRelativeInfo() {
        return this._managedCompanyRelativeInfo;
    }

    setManagedCompanyRelativeInfo(managedCompanyRelativeInfo) {
        this._managedCompanyRelativeInfo = managedCompanyRelativeInfo;
    }

    //NBSHD-3373: CL Angular - Do not keep the user password in the local storage of browser
    get clientId(): string {
        let clientId: string = this._storageSvc.getValue(StorageKeys.ClientId);
        if (!clientId) {
            clientId = this._util.createGuid();
            this._storageSvc.setLocalValue(StorageKeys.ClientId, clientId);
        }
        return clientId;
    }

    /**
     * keep the session alive by increase the lifetime of the session
     */
    keepSessionAlive(): Observable<boolean> {
        // check first, we keep the session alive only when the user is authenticated
        if (!this.isAuthenticated) {
            return of(false);
        }

        // keep the session alive
        return this._http.post('session/KeepAlive', {}).pipe(map(data => true));
    }

    /**
     * Try to logon with the sessionId or information keep in browser storage (session and local)
     * Information is used to check is StorageKeys.SessionId, StorageKeys.UserLogin, StorageKeys.UserPassword, StorageKeys.CompanyRelationId
     * after calling autoLogon, we have following cases:
     * - autoLogon fail:
     *   + all the information in the browser storages (both session and local) are deleted.
     *   + all the private infromation in this service are reset
     * - autoLogon success with refresh token
     *   + all the information in the browser storages (both session and local) are filled.
     *   + we have 1 item in the validWorkingContexts
     *   + all the private information in this service are filled
     */
    autoLogon(): Observable<boolean> {
        /**
         * What the autoLogon do:
         * - Firstly, We try to logon use the sessionId in the browser session storage if the sessionId exists
         * - If the sessionId is not exists, or the sessionId is not valid, we try the second change by checking whether the RefreshToken exists in the local storage
         * - The RefreshToken only exists in the local storage if the last logon the user tick on the KeepMeSignedIn?
         */
        let languageCode: string = this._translationSvc.getDefaultLanguageCodeUI();
        let sessionId = this._storageSvc.getValue(StorageKeys.SessionId);
        let objObservable: Observable<any>;
        if (!!sessionId) {
            // objObservable = this.getAuthInfoBySession();
            return this.getAuthInfoBySession().pipe(
                mergeMap((authInfo, index) => {
                    if (!!authInfo) {
                        this.processAuthInfo(<AuthenticatedUser>authInfo);
                        return of(true);
                    } else {
                        // here happen only the sessionId is not exists
                        // Or the sessionId is invalid or expired

                        // wait... when will the this.login !== loginByKeepMeSigned ?
                        // in the cause the session is not created by the logon function, but created by the external app
                        // in that case, the current login maybe differ than the saved login (when the last logon user
                        // tick on the keep me signed in)
                        // in that case, we will not try to regenerate the session id based on the kept user login.
                        return this.tryAutologonByRefreshToken(languageCode);
                    }
                }),
                catchError((err) => {
                    return this.tryAutologonByRefreshToken(languageCode);
                })
                );
        } else {
            return this.tryAutologonByRefreshToken(languageCode);
        }
       
        // }), catchError(failedResp => {
        //    // clear session and password stored be keepMeSignedIn
        //    this.clearAllAuthenticationStates();
        //    return of(false);
        // });
    }

    protected tryAutologonByRefreshToken(languageCode: string): Observable<boolean> {
        let loginByKeepMeSigned: string = this._storageSvc.getValue(StorageKeys.UserLogin, StorageLocation.Local);
        let refreshTokenByKeepMeSigned: string = this._storageSvc.getValue(StorageKeys.RefreshToken, StorageLocation.Local);

        if (!!loginByKeepMeSigned && !!refreshTokenByKeepMeSigned) {
            //try to rebuild the session information

            // why we pass the staySignedIn to the function logon as true
            // we know that because in this case, the RefreshToken keep in StorageKeys.RefreshToken is not null
            // the RefreshToken is not null only when the last call to function logon is passed with the staySignedIn === true
            return this.logon(loginByKeepMeSigned, '', languageCode, undefined, true, refreshTokenByKeepMeSigned).pipe(map(data => {
                return !!data ? true : false;
            }));
        } else {
            // if getAuthInfoBySession failure, that mean the sessionId is not valid
            // we should clear the session information
            // clear all information, it will refill if the logon success
            this.clearAllAuthenticationStates();
        }

        return of(false);
    }

    /**
     * * after calling logon, we have following cases:
     * - logon fail:
     *   + all the information in the browser storages (both session and local) are deleted.
     *   + all the private infromation in this service are reset
     * - logon success with more than 1 roles/companies
     *   + all the information in the browser session storage are deleted. we still have the infromation in the local storage (if exists)
     *   + we have at least 2 items in the validWorkingContexts
     *   + all the private information in this service (EXCEPT validWorkingContexts) are reset
     * - logon success with only 1 company selected
     *   + all the information in the browser storages (both session and local) are filled.
     *   + we have 1 item in the validWorkingContexts
     *   + all the private information in this service are filled
     * @param login
     * @param password
     * @param contextId
     * @param staySignedIn
     * @param languageCode
     */
    logon(login: string, password: string, languageCode: string, contextId?: string, staySignedIn?: boolean
        , refreshToken?: string, skipShowError = false): Observable<AuthenticatedUser | WorkingContext[]> {
        let loginInfo: { [index: string]: any } = {
            login: login,
            contextId: contextId,
            languageCode: languageCode,
            clientId: this.clientId
        };

        if (password) {
            loginInfo['password'] = password;
        }

        // only append keepMeSignedIn if authentication is manual (from login form)
        if (!!staySignedIn && password) {
            loginInfo['keepMeSignedIn'] = staySignedIn;
        }

        if (refreshToken) {
            loginInfo['refreshToken'] = refreshToken;
        }

        return this._api.post<AuthenticatedUser | WorkingContext[]>('session/logon', loginInfo, skipShowError).pipe(map(data => {
            if (!!data) {
                if (Array.isArray(data)) {
                    // if the logon return an list of relations, we consider as the login process is not completed
                    this.clearCurrentSession();

                    // this is the case the user have several companies and he should choose one.
                    this._validWorkingContexts = data;
                } else {
                    // rebuild the session info
                    this.processAuthInfo(data);

                    // store info about authenticated user in the browser session storage for next time the user comes to the application
                    this._storageSvc.setSessionValue(StorageKeys.UserLogin, login);

                    // keep or clear the user and refreshToken
                    if (!!staySignedIn) {
                        // try to overwrite password/refreshToken by new refreshToken
                        let authUser: AuthenticatedUser = data;
                        if (authUser && authUser.RefreshToken) {
                            this._storageSvc.setLocalValue(StorageKeys.RefreshToken, authUser.RefreshToken);
                        }

                        this._storageSvc.setLocalValue(StorageKeys.UserLogin, login);
                    } else {
                        // delete if exists UserPassword/UserLogin
                        this._storageSvc.deleteValue(StorageKeys.RefreshToken, StorageLocation.Local);
                        this._storageSvc.deleteValue(StorageKeys.UserLogin, StorageLocation.Local);
                    }
                }
            } else {
                // clear session and password stored be keepMeSignedIn
                this.clearAllAuthenticationStates();
            }
            return data;
        }));
    }

    logout(isGotoLoginWhenSuccess = true): Observable<boolean> {
        // remove current sessionId from server
        if (this.isAuthenticated) {
            return this._api.post('session/Logoff', undefined, true)
                .pipe(map(() => {
                    return true;
                }))
                .pipe(finalize(() => {
                    this.clearAllAuthenticationStates();
                    this.onlogout.emit(true);
                    this.gotoLogin(isGotoLoginWhenSuccess);
                }));
        } else {
            this.onlogout.emit(true);
            this.gotoLogin(isGotoLoginWhenSuccess);
            return of(true);
        }
    }

    gotoLogin(isGotoLoginWhenSuccess) {
        if (isGotoLoginWhenSuccess === true) {
            if (this._appConfig.WITH_NG1) {
                this.injector.get(CommunicationService).logOut();
            }
        }
    }

    getAuthInfoBySession(): Observable<AuthenticatedUser> {
        if (this._sharedConfig && this._sharedConfig.useCustomGetAuthInfoBySession) {
            return this._sharedConfig.CustomGetAuthInfoBySession(this.injector);
        } else {
            return this._http.get<AuthenticatedUser>('session/GetAuthenticatedUser');
        }
    }


    sendResetPasswordEmail(login: string): Observable<boolean> {
        let loginInfo: any = {
            login: login
        };

        return this._http.post<boolean>('SendResetPasswordEmail', loginInfo);
    }

    getLastUsedLogin(): string {
        // try to get the last login from the cookie
        return this._storageSvc.getValue(StorageKeys.UserLogin, StorageLocation.SessionAndLocal);
    }

    protected clearCurrentSession(): void {
        // clear info about authenticated user in the authentication service
        this._authUser = undefined;
        this._validWorkingContexts = undefined;

        // clear info about authenticated user in the session in case the user hits refresh in the browser
        this._storageSvc.deleteValue(StorageKeys.UserLogin, StorageLocation.Session);
        this._storageSvc.deleteValue(StorageKeys.SessionId, StorageLocation.Session);
        this._storageSvc.deleteValue(StorageKeys.CompanyRelationId, StorageLocation.Session);

        // the login user is not valid any more => reset the use information in the storage service
        this._storageSvc.setUserContextKey(undefined);
        this._storageSvc.setCompanyContextKey(undefined);
    }

    processAuthInfo(authUser: AuthenticatedUser) {
        // store info about authenticated user in the authentication service
        this._authUser = authUser;

        // store info about authenticated user in the session in case the user hits refresh in the browser
        this._storageSvc.setSessionValue(StorageKeys.UserLogin, this._authUser.UserLogin);
        this._storageSvc.setSessionValue(StorageKeys.SessionId, this._authUser.SessionId);
        if(this._authUser.WorkingContext) {
            this._validWorkingContexts = [this._authUser.WorkingContext];
            this._storageSvc.setSessionValue(StorageKeys.CompanyRelationId, this._authUser.WorkingContext.Id);
        }

        // set the login for the storage service in order to get/set value of current user context
        this._storageSvc.setUserContextKey(this._authUser.UserLogin || this._authUser['Login']);

        // Neofleet dont have Managed company context
        if (this._authUser.ManagedCompany) {
            this._storageSvc.setCompanyContextKey(this._authUser.ManagedCompany.Id);
        }


        if (this._authUser && this._authUser.Parameters && this._authUser.Parameters['NumberFormat']) {
            let numberFormatString = this._authUser.Parameters['NumberFormat'];
            let reg: RegExp = /\w+/g;
            let signs = numberFormatString.replace(reg, '');
            if (signs.length > 1) {
                this._groupSep = signs[0];
                this._decimalSep = signs[1];
            } else if (signs.length > 0) {
                this._groupSep = '';
                this._decimalSep = signs[0];
            }

            if (signs.length > 0) {
                this._numberDecimals = numberFormatString.length - numberFormatString.lastIndexOf(this._decimalSep) - 1;
            }
            if (this._numberDecimals <= 0) this._numberDecimals = 2;

        }

        if (this._authUser && this._authUser.Parameters && this._authUser.Parameters['DateFormat']) {
            this._dateFormat = this._authUser.Parameters['DateFormat'].toUpperCase();
        }


        // Raise the user is login
        this.authenticated.emit(this._authUser);

    }

    public clearAllAuthenticationStates() {
        // clear current session information
        this.clearCurrentSession();

        // clear info about authenticated user in the browser local storage for next time the user comes to the application
        this._storageSvc.deleteValue(StorageKeys.RefreshToken, StorageLocation.Local);
        this._storageSvc.deleteValue(StorageKeys.UserLogin, StorageLocation.Local);
    }

    /**
     * This funciton is executed when the session is becoming invalid or expired
     * This function will clear the current session information and try to renew a session when possible
     */
    processSessionExpired(callback?: (autoLogonSuccess: boolean) => void) {
        // clear current session from the session storage
        // this help the function autoLogon not check on the session id anymore
        // it will directly checked on the RefreshToken if exists
        this._storageSvc.deleteValue(StorageKeys.SessionId, StorageLocation.Session);

        this.autoLogon().subscribe((isSuccess: boolean) => {

            if (callback) {
                callback(isSuccess);
            }

            if (!isSuccess) {
                // if the autoLogon is unSuccess, all the session information has been cleared already

                // show expire toast message
                //this._helperService.DialogService.showSessionExpiredMessage();

                // go to the login screen
                this.logout(true).subscribe();
            }
        });
    }

    get ModuleAccessRights(): ModuleAccessRights {
        return this._authUser.ModuleAccessRights;
    }

    getParameterValue<T>(paramName: string): T {
        if (!this._authUser) {
            return undefined;
        }

        if (!this._authUser.Parameters) { 
            return undefined;
        } else {
			return <T>this._authUser.Parameters[paramName];
		}
    }

    // NBSHD-4344: [HS/CL] Update status change granted to users with restricted access to HS/CL
    getScreenAccessRight(screen: string) {
        if (!this._authUser) return '';
        return this._authUser.ScreenAccessRights[screen];
    }

    getAuthUser() {
        return this._authUser;
    }

    generatePassword(): Observable<string> {
        return this._api.get<string>('useraccount/GeneratePassword');
    }

    getManagedCompanyRelativeInfo(): Observable<ManagedCompanyRelativeInfo> {
        return this._http.get<ManagedCompanyRelativeInfo>('ManagedCompany/GetManagedCompanyRelativeInfo');
    }

    estimatePasswordStrength(newPassword: string): Observable<PasswordStrength> {
        return this._api.post<PasswordStrength>('useraccount/EstimatePasswordStrength', {
            NewPassword: newPassword
        });
    }

    changePassword(oldPassword: string, newPassword: string) {
        return this._api.post('useraccount/ChangePassword', {
            OldPassword: oldPassword,
            NewPassword: newPassword
        }, true);
    }
}
