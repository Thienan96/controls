import {Injectable} from '@angular/core';
import {LocalStorageService} from './local-storage.service';
import {SessionStorageService} from './session-storage.service';
import {AppConfig} from '../app.config';

export enum StorageKeys {
    // managed authentication keys
    UserLogin,
    RefreshToken,
    SessionId,
    CompanyRelationId,
    ClientId,
    SelectedCompany,
    SelectedBusinessUnit,

    // managed translation keys    
    UserLanguage, // Keep the last change app language
    LangVIE,
    LangFRA,
    LangZHS,
    LangENG,
    LangZHT,
    LangNLD,
    LangDEU,
    GridViewStates,
    IncidentStates,
    InterventionStates,
    GeneralSettings,
    IncidentHistoryStates,
    InterventionHistoryStates,
    MasterDataConfig2States,
    ReleaseNotesDismissVersion,
    MasterDataConfig2UnitStates,
    MasterDataConfig2EquipmentTypesStates,
    MasterDataConfig2ProblemTypesStates,
    MasterDataConfig2ItemStates,
    MasterDataConfig2CategoriesStates,
    MasterDataConfig2CustomValueTypesStates,
    MasterDataConfig2PrintingLayoutsStates,
    SiteHistoryStates,
    DocumentHistoryStates,
    LastSiteInDocument,
    DefaultSiteForDocument,
    Locale,
    MaintenanceScheduleStorage,
    UserPreferences, // Eurojob4
    InspectionStorage // Checklists
}

export enum StorageLocation {
    None,
    Session,
    Local,
    SessionAndLocal
}

@Injectable({ 
    providedIn: 'root' 
})
export class StorageService {
    protected _companyContextKey: string | undefined = undefined;
    protected _userContextKey: string | undefined = undefined;

    // the prefix key use in case we need to read value from ng1
    protected _ng1PrefixKey: string | undefined = undefined;


    // Use customize LocalStorageService, SessionStorageService to fix conflict Storage AngularJs and Angular
    constructor(protected _localStorage: LocalStorageService, protected _sessionStorage: SessionStorageService, private _appConfig: AppConfig) {
        _sessionStorage.config.prefix = 'ngStorage';
        _sessionStorage.config.debugMode = true;
    }

    setCompanyContextKey(companyContextKey: string) {
        this._companyContextKey = companyContextKey;
    }

    setUserContextKey(key: string | undefined) {
        this._userContextKey = key;
    }

    setNg1PrefixKey(key: string) {
        this._ng1PrefixKey = key;
    }

    // Set or Get session value at level application (Not depend on current user)
    setSessionValue(key: StorageKeys | string, value: any) {
        let sKey: string;
        if (typeof key ===  'string') {
            sKey = <string>key;
        } else {
            sKey = StorageKeys[<StorageKeys>key];
        }

        let obj: any = this._sessionStorage.get(this._appConfig.APP_SESSION);
        if (!obj) { obj = {}; }
        obj[sKey] = value;
        this._sessionStorage.set(this._appConfig.APP_SESSION, obj);
    }
    // Set or Get local value at level application (Not depend on current user)
    setLocalValue(key: StorageKeys | string, value: any) {
        let sKey: string;
        if (typeof key ===  'string') {
            sKey = <string>key;
        } else {
            sKey = StorageKeys[<StorageKeys>key];
        }


        let obj: any = this._localStorage.get(this._appConfig.APP);
        if (!obj) { obj = {}; }
        obj[sKey] = value;
        this._localStorage.set(this._appConfig.APP, obj);
    }

    getValue(key: StorageKeys | string, location: StorageLocation = StorageLocation.SessionAndLocal): any {
        try {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            let value: any;
            if (location === StorageLocation.Session && this._sessionStorage.get(this._appConfig.APP_SESSION)) {
                return this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey];
            } else if (location === StorageLocation.Local && this._localStorage.get(this._appConfig.APP)) {
                return this._localStorage.get(this._appConfig.APP)[sKey];
            } else if (location === StorageLocation.SessionAndLocal) {
                // try to look in the session storage first
                if (this._sessionStorage.get(this._appConfig.APP_SESSION) && this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey]) {
                    value = this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey];
                }

                // then, look in the local storage
                if (!value && this._localStorage.get(this._appConfig.APP)) {
                    value = this._localStorage.get(this._appConfig.APP)[sKey];
                }
            }

            return value;
        } catch (e) {
            return undefined;
        }
    }

    deleteValue(key: StorageKeys | string, location: StorageLocation) {
        if (location === StorageLocation.None) {
            return;
        }

        try {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            if (location === StorageLocation.SessionAndLocal) {
                if (!!this._sessionStorage.get(this._appConfig.APP_SESSION) && !!this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey]) {
                    let obj = this._sessionStorage.get(this._appConfig.APP_SESSION);
                    delete obj[sKey];
                    this._sessionStorage.set(this._appConfig.APP_SESSION, obj);
                }

                if (!!this._localStorage.get(this._appConfig.APP) && !!this._localStorage.get(this._appConfig.APP)[sKey]) {
                    let obj = this._localStorage.get(this._appConfig.APP);
                    delete obj[sKey];
                    this._localStorage.set(this._appConfig.APP, obj);
                }
            } else if (location === StorageLocation.Local) {
                if (!!this._localStorage.get(this._appConfig.APP) && !!this._localStorage.get(this._appConfig.APP)[sKey]) {
                    let obj: any = this._localStorage.get(this._appConfig.APP);
                    delete obj[sKey];
                    this._localStorage.set(this._appConfig.APP, obj);
                }
            } else if (location === StorageLocation.Session) {
                if (!!this._sessionStorage.get(this._appConfig.APP_SESSION) && !!this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey]) {
                    let obj: any = this._sessionStorage.get(this._appConfig.APP_SESSION);
                    delete obj[sKey];
                    this._sessionStorage.set(this._appConfig.APP_SESSION, obj);
                }
            }
        } catch (e) { }
    }

    isExistsValue(key: StorageKeys | string): boolean {
        try {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            return (!!this._sessionStorage.get(this._appConfig.APP_SESSION) && !!this._sessionStorage.get(this._appConfig.APP_SESSION)[sKey]) ||
                (!!this._localStorage.get(this._appConfig.APP) && !!this._localStorage.get(this._appConfig.APP)[sKey]);
        } catch (e) {
            return false;
        }
    }

    deleteUserValue(key: StorageKeys | string, location: StorageLocation) {
        if (location === StorageLocation.None) {
            return;
        }

        try {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;
            if (location === StorageLocation.SessionAndLocal) {
                if (!!this._sessionStorage.get(mcUserKey) && !!this._sessionStorage.get(mcUserKey)[sKey]) {
                    let obj: any = this._sessionStorage.get(mcUserKey);
                    delete obj[sKey];
                    this._sessionStorage.set(mcUserKey, obj);
                }

                if (!!this._localStorage.get(mcUserKey) && !!this._localStorage.get(mcUserKey)[sKey]) {
                    let obj: any = this._localStorage.get(mcUserKey);
                    delete obj[sKey];
                    this._localStorage.set(mcUserKey, obj);
                }
            } else if (location === StorageLocation.Local) {
                if (!!this._localStorage.get(mcUserKey) && !!this._localStorage.get(mcUserKey)[sKey]) {
                    let obj: any = this._localStorage.get(mcUserKey);
                    delete obj[sKey];
                    this._localStorage.set(mcUserKey, obj);
                }
            } else if (location === StorageLocation.Session) {
                if (!!this._sessionStorage.get(mcUserKey) && !!this._sessionStorage.get(mcUserKey)[sKey]) {
                    let obj: any = this._sessionStorage.get(mcUserKey);
                    delete obj[sKey];
                    this._sessionStorage.set(mcUserKey, obj);
                }
            }
        } catch (e) { }
    }

    getUserStorageLocation(key: StorageKeys | string): StorageLocation {
        let location: StorageLocation = StorageLocation.None;

        try {
            if (!!this._companyContextKey && !!this._userContextKey) {
                let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;

                if (!!this._sessionStorage.get(mcUserKey) && this._sessionStorage.get(mcUserKey)[StorageKeys[key]] !== undefined) {
                    if (location === StorageLocation.None) {
                        location = StorageLocation.Session;
                    }
                }

                if (!!this._localStorage.get(mcUserKey) && this._localStorage.get(mcUserKey)[StorageKeys[key]] !== undefined) {
                    if (location === StorageLocation.None) {
                        location = StorageLocation.Local;
                    } else {
                        location = StorageLocation.SessionAndLocal;
                    }
                }
            }

        } catch (e) { return location; }

        return location;
    }
    isExistsUserValue(key: StorageKeys | string): boolean {
        try {
            if (!!this._companyContextKey && !!this._userContextKey) {
                let sKey: string;
                if (typeof key ===  'string') {
                    sKey = <string>key;
                } else {
                    sKey = StorageKeys[<StorageKeys>key];
                }

                let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;

                return (!!this._sessionStorage.get(mcUserKey) && !!this._sessionStorage.get(mcUserKey)[sKey]) ||
                    (!!this._localStorage.get(mcUserKey) && !!this._localStorage.get(mcUserKey)[sKey]);
            }
        } catch (e) { return false; }

        return false;
    };
    // Set or Get session value at level user (depend on current login email)
    setSessionUserValue(key: StorageKeys | string, value: any) {
        if (!!this._companyContextKey && !!this._userContextKey) {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;

            let obj: any = this._sessionStorage.get(mcUserKey);
            if (!obj) { obj = {}; }
            obj[sKey] = value;
            this._sessionStorage.set(mcUserKey, obj);
        }
    };

    // Set or Get local value at level user (depend on current login email)
    setLocalUserValue(key: StorageKeys | string, value: any) {
        if (!!this._companyContextKey && !!this._userContextKey) {
            let sKey: string;
            if (typeof key ===  'string') {
                sKey = <string>key;
            } else {
                sKey = StorageKeys[<StorageKeys>key];
            }

            let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;

            let obj: any = this._localStorage.get(mcUserKey);
            if (!obj) { obj = {}; }
            obj[sKey] = value;
            this._localStorage.set(mcUserKey, obj);
        }
    }

    getUserValue(key: StorageKeys | string, location: StorageLocation = StorageLocation.SessionAndLocal): any {
        try {
            if (!!this._companyContextKey && !!this._userContextKey) {

                let sKey: string;
                if (typeof key ===  'string') {
                    sKey = <string>key;
                } else {
                    sKey = StorageKeys[<StorageKeys>key];
                }

                let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;

                let value: any;
                if (location === StorageLocation.Session && !!this._sessionStorage.get(mcUserKey)) {
                    return this._sessionStorage.get(mcUserKey)[sKey];
                } else if (location === StorageLocation.Local && !!this._localStorage.get(mcUserKey)) {
                    return this._localStorage.get(mcUserKey)[sKey];
                } else if (location === StorageLocation.SessionAndLocal) {
                    // try to look in the session storage first
                    if (!!this._sessionStorage.get(mcUserKey) && !!this._sessionStorage.get(mcUserKey)[sKey]) {
                        value = this._sessionStorage.get(mcUserKey)[sKey];
                    }

                    // then, look in the local storage
                    if (!value && !!this._localStorage.get(mcUserKey)) {
                        value = this._localStorage.get(mcUserKey)[sKey];
                    }
                }

                return value;
            }
        } catch (e) { return undefined; }
    }

    mergeLocalUserValue(oldcompanyContextKey: string | null) {
        if (!!oldcompanyContextKey && !!this._companyContextKey && !!this._userContextKey) {
            let mcUserKey: string = this._appConfig.APP + '|' + this._companyContextKey + '|' + this._userContextKey;
            let oldMcUserKey: string = this._appConfig.APP + '|' + oldcompanyContextKey + '|' + this._userContextKey;
            let obj: any = this._localStorage.get(oldMcUserKey); 
            if (obj) {
                this._localStorage.set(mcUserKey, obj);
                this._localStorage.remove(oldMcUserKey);
            }

        }
    }

    getLocalUserOnlyValue(key: StorageKeys | string) {
        let sKey: string;
        if (typeof key ===  'string') {
            sKey = <string> key;
        } else {
            sKey = StorageKeys[<StorageKeys> key];
        }

        let userKey: string = this._appConfig.APP + '|' + this._userContextKey;

        if (this._localStorage && !!this._localStorage.get(userKey)) {
            return this._localStorage.get(userKey)[sKey];
        }

        return undefined;
    }


    setLocalUserOnlyValue(key: StorageKeys | string, value) {
        let sKey: string;
        if (typeof key ===  'string') {
            sKey = <string> key;
        } else {
            sKey = StorageKeys[<StorageKeys> key];
        }

        let userKey: string = this._appConfig.APP + '|' + this._userContextKey;

        let data =  this._localStorage.get(userKey) || {};
        data[sKey] = value;
        this._localStorage.set(userKey, data);
    }


    /**This method working on context key that only application name and user acocunt (not managed company context) */
    getNgLocalUserOnlyValue(key: StorageKeys) {
        try {
            if (!!this._userContextKey) {
                let appPrefix = this._ng1PrefixKey;

                if (!appPrefix) {
                    // this is becasue we need to get value of storage form ng1 project so that we need to specified
                    // from API prefix into AngularJS's prefix
                    if (this._appConfig.API_APP === 'hs') {
                        appPrefix = 'helpsites';
                    } else if (this._appConfig.API_APP === 'cl') {
                        appPrefix = 'htmlchecklists';
                    } else {
                        appPrefix = this._appConfig.APP;
                    }
                }

                let storage = this._localStorage.getNgStorage(appPrefix + '|' + this._userContextKey);

                // console.log('AngualrJS storage = ', storage);

                let realKey = StorageKeys[key];

                // console.log('AngualrJS realKey = ', realKey);

                if (storage && !!storage[realKey]) {
                    return storage[realKey];
                }
            }
        } catch (e) {
            console.log('getNgLocalUserOnlyValue with key=', key, ' error=', e);
            return undefined;
        }

        return undefined;
    }

    deleteCompanyValue(key: StorageKeys, location: StorageLocation) {
        if (location === StorageLocation.None) {
            return;
        }

        try {
            let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;
            if (location === StorageLocation.SessionAndLocal) {
                if (!!this._sessionStorage.get(mcKey) && !!this._sessionStorage.get(mcKey)[StorageKeys[key]]) {
                    let obj: any = this._sessionStorage.get(mcKey);
                    delete obj[StorageKeys[key]];
                    this._sessionStorage.set(mcKey, obj);
                }

                if (!!this._localStorage.get(mcKey) && !!this._localStorage.get(mcKey)[StorageKeys[key]]) {
                    let obj: any = this._localStorage.get(mcKey);
                    delete obj[StorageKeys[key]];
                    this._localStorage.set(mcKey, obj);
                }
            } else if (location === StorageLocation.Local) {
                if (!!this._localStorage.get(mcKey) && !!this._localStorage.get(mcKey)[StorageKeys[key]]) {
                    let obj: any = this._localStorage.get(mcKey);
                    delete obj[StorageKeys[key]];
                    this._localStorage.set(mcKey, obj);
                }
            } else if (location === StorageLocation.Session) {
                if (!!this._sessionStorage.get(mcKey) && !!this._sessionStorage.get(mcKey)[StorageKeys[key]]) {
                    let obj: any = this._sessionStorage.get(mcKey);
                    delete obj[StorageKeys[key]];
                    this._sessionStorage.set(mcKey, obj);
                }
            }
        } catch (e) { }
    }

    getCompanyStorageLocation(key: StorageKeys): StorageLocation {
        let location: StorageLocation = StorageLocation.None;

        try {
            if (!!this._companyContextKey) {
                let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;

                if (!!this._sessionStorage.get(mcKey) && this._sessionStorage.get(mcKey)[StorageKeys[key]] !== undefined) {
                    if (location === StorageLocation.None) {
                        location = StorageLocation.Session;
                    }
                }

                if (!!this._localStorage.get(mcKey) && this._localStorage.get(mcKey)[StorageKeys[key]] !== undefined) {
                    if (location === StorageLocation.None) {
                        location = StorageLocation.Local;
                    } else {
                        location = StorageLocation.SessionAndLocal;
                    }
                }
            }
        } catch (e) { return location; }

        return location;
    }
    isExistsCompanyValue(key: StorageKeys): boolean {
        try {
            if (!!this._companyContextKey) {
                let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;

                return (!!this._sessionStorage.get(mcKey) && !!this._sessionStorage.get(mcKey)[StorageKeys[key]]) ||
                    (!!this._localStorage.get(mcKey) && !!this._localStorage.get(mcKey)[StorageKeys[key]]);
            }

        } catch (e) { return false; }

    };
    // Set or Get session value at level company (depend on current login email and current working company)
    setSessionCompanyValue(key: StorageKeys, value: any) {
        if (!!this._companyContextKey) {
            let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;

            let obj: any = this._sessionStorage.get(mcKey);
            if (!obj) { obj = {}; }
            obj[StorageKeys[key]] = value;
            this._sessionStorage.set(mcKey, obj);
        }
    };
    // Set or Get local value at level company (depend on current login email and current working company)
    setLocalCompanyValue(key: StorageKeys, value: any) {
        if (!!this._companyContextKey) {
            let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;

            let obj: any = this._localStorage.get(mcKey);
            if (!obj) { obj = {}; }
            obj[StorageKeys[key]] = value;
            this._localStorage.set(mcKey, obj);
        }
    };
    getCompanyValue(key: StorageKeys, location: StorageLocation = StorageLocation.SessionAndLocal): any {
        try {
            if (!!this._companyContextKey) {
                let mcKey: string = this._appConfig.APP + '|' + this._companyContextKey;
                let value: any;
                if (location === StorageLocation.Session && !!this._sessionStorage.get(mcKey)) {
                    return this._sessionStorage.get(mcKey)[StorageKeys[key]];
                } else if (location === StorageLocation.Local && !!this._localStorage.get(mcKey)) {
                    return this._localStorage.get(mcKey)[StorageKeys[key]];
                } else if (location === StorageLocation.SessionAndLocal) {
                    // try to look in the session storage first
                    if (!!this._sessionStorage.get(mcKey) && !!this._sessionStorage.get(mcKey)[StorageKeys[key]]) {
                        value = this._sessionStorage.get(mcKey)[StorageKeys[key]];
                    }

                    // then, look in the local storage
                    if (!value && !!this._localStorage.get(mcKey)) {
                        value = this._localStorage.get(mcKey)[StorageKeys[key]];
                    }
                }

                return value;
            }
        } catch (e) { return undefined; }
    };


    /**
     * get localStorage of AngularJs
     * @param {StorageKeys | string} key
     * @param {boolean} companyContextKey
     * @param {boolean} userContextKey
     * @returns {any}
     */
    getNgLocalValue(key: StorageKeys | string, companyContextKey = false, userContextKey = false) {
        let appPrefix = this._ng1PrefixKey;
        let sKey: string;
        if (typeof key === 'string') {
            sKey = <string>key;
        } else {
            sKey = StorageKeys[<StorageKeys>key];
        }

        let keys = [appPrefix];
        if (companyContextKey) {
            keys.push(this._companyContextKey);
        }
        if (userContextKey) {
            keys.push(this._userContextKey);
        }
        let storage = this.getNgLocalStorage(companyContextKey, userContextKey);
        if (storage && !!storage[sKey]) {
            return storage[sKey];
        }
    }

    protected getNgLocalStorage(companyContextKey = false, userContextKey = false){
        let appPrefix = this._ng1PrefixKey;
        let keys = [appPrefix];
        if (companyContextKey) {
            keys.push(this._companyContextKey);
        }
        if (userContextKey) {
            keys.push(this._userContextKey);
        }
        let mcKey: string = keys.join('|');
        return this._localStorage.getNgStorage(mcKey);
    }

    setNgLocalValue(key: StorageKeys | string, value : any, companyContextKey = false, userContextKey = false) {
        let appPrefix = this._ng1PrefixKey;
        let sKey: string;
        if (typeof key === 'string') {
            sKey = <string>key;
        } else {
            sKey = StorageKeys[<StorageKeys>key];
        }

        let keys = [appPrefix];
        if (companyContextKey) {
            keys.push(this._companyContextKey);
        }
        if (userContextKey) {
            keys.push(this._userContextKey);
        }
        let mcKey: string = keys.join('|'),
            storage = this.getNgLocalStorage(companyContextKey, userContextKey);
        storage[sKey] = value;
        this._localStorage.set(mcKey, storage);
    }
}
