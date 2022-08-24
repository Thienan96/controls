import {Injectable, Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {StorageKeys, StorageLocation, StorageService} from './storage.service';
import {UtilityService} from './utility.service';
import {AppConfig} from '../app.config';
import {LanguageModel, SelectableItem} from '../../shared/models/common.info';
import {tap} from 'rxjs/operators';
import moment from 'moment-es6';

// Reference https://www.science.co.il/language/Locale-codes.php

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    protected _storageSvc: StorageService;
    protected _util: UtilityService;
    private _dicTranslations: { [id: string]: string } = {};

    private _currentLanguage: string; // code_3 (eng,zhs,vie)

    private languageChange = new Subject();

    constructor(protected injector: Injector, private _http: HttpClient, private _appConfig: AppConfig) {
        this._storageSvc = injector.get(StorageService);
        this._util = injector.get(UtilityService);
    }


    /**
     * EJ4-1681: try to fix the language code in case language with locale like en-GB, en-US
     */
    private fixLanguageCode(language: string): string {
        if (language.length > 2) {
            // for chinese, we try special treatment
            if (language.toLowerCase() === 'zhs') {
                return 'zh-CN';
            } else if (language.toLowerCase() === 'zht') {
                return 'zh-TW';
            } else if (language.toLowerCase().startsWith('zh')) {
                return 'zh-CN';
            }

            return language.substr(0, 2).toUpperCase();
        }

        return language;
    }

    getLocale(): string {
        let currentLanguage = this.getCurrentLanguage() || this.getDefaultLanguageCodeUI();
        currentLanguage = this.fixLanguageCode(currentLanguage);

        let language = this.getLanguage(currentLanguage);
        if (language) {
            return language.Local;
        } else {
            console.warn('TranslationService cannot find locale for language code = ', currentLanguage);
            return '';
        }
    }

    getDefaultLocal() {
        return 'en-us';
    }

    setLocale(local: string) { // en-us

        // Update locale for moment
        let m = window['moment'];
        if (m) {
            m.locale(local);
        }
        moment.locale(local);

        // Set locale to localstorage
        let storageService = this.injector.get(StorageService, null);
        storageService.setLocalValue(StorageKeys.Locale, local);
    }

    /**
     * Load locale of AngularJs
     * @param local
     */
    loadAngularJsLocale(local: string) {
        let language = this.getLanguage(local);
        let localeFile = 'angular-locale_' + language.Code2.toLowerCase() + '.js';
        return this._util.loadDynamicScript(localeFile, this._util.addSlashIfNotExists('src/assets/i10n/') + localeFile, true);
    }

    getDefaultLanguageCodeUI() {
        return this._storageSvc.getValue(StorageKeys.UserLanguage, StorageLocation.Local) || 'eng';
    }


    getTranslation(key: string): string {
        let result: string = key;

        if (this._dicTranslations && this._dicTranslations[key]) {
            result = this._dicTranslations[key];
        } else {
            result = '?' + result + '?';
        }

        return result;
    }


    loadTranslations(language?: string): Observable<boolean> {

        console.log('loadTranslations call for angular 2 app: ', language);

        return new Observable((ob) => {
            let loadLanguage: string | undefined = language;
            let translationFile: string;

            // get language from storage or from the broweser
            if (!loadLanguage) {
                loadLanguage = this._util.getFirstBrowserLanguage();
                if (!loadLanguage) {
                    loadLanguage = 'eng';
                }
            }

            // fix language values
            loadLanguage = this._util.convertLanguageCodeToPossibleSupportLanguageCode3(loadLanguage);

            if (this._currentLanguage === loadLanguage) {
                ob.next(true);
                ob.complete();
            } else {

                translationFile = this.getFileFromLanguageCode(loadLanguage);


                let url: string = this._util.addSlashIfNotExists(this._util.getRootUrl()) + 'src/assets/languages/' + translationFile + '?v=' + this._appConfig.VERSION_BUILD;
                this._http.get(url).subscribe(data => {
                    let dic: any = data;
                    this._dicTranslations = {};
                    Object.keys(data).forEach(key => {
                        this._dicTranslations[key] = dic[key];
                    });

                    this._currentLanguage = loadLanguage;
                    console.log('load translation OK');
                    ob.next(true);
                    ob.complete();
                }, (err) => {
                    console.error('Load translation error ', err);
                    ob.error(err);
                    ob.complete();
                });
            }
        });
    }

    /**
	 * Load translate file from serve
	 * @param language
	 * @param folder // Using for GF app
	 */
	loadLanguage(language?: string, folderInGF = ''): Observable<any> {
		let utilityService = this.injector.get(UtilityService, null);
		let languageCode = this.convertLanguageCode2ToLanguageCode3(language);
		let translationFile = this.getFileFromLanguageCode(languageCode);
		let http: HttpClient = this.injector.get(HttpClient, null);
		let appConfig = this.injector.get(AppConfig, null);
		let url: string = utilityService.addSlashIfNotExists(utilityService.getRootUrl()) + 'src/assets/languages/' + translationFile + '?v=' + appConfig.VERSION_BUILD;
		return http.get(url);
	}

    getSupportedLanguages(): SelectableItem[] {
        return this._util.getSupportedLanguages();
    }

    /**
     * GF-298: This for change language dialog
     */
    getDisplayItemLanguages(): Array<SelectableItem> {
        return this.getSupportedLanguages().map((languageItem) => {
            let displayItem = this.getTranslation(languageItem.DisplayValue) + ' - ' + this.getTranslation(languageItem.TranslationKey);
            return new SelectableItem(languageItem.Value, displayItem, languageItem.TranslationKey);
        });
    }

    /**
     * GF-298: This for login screen for display all available languages to select
     */
    getAllDisplayItemLanguages(): Array<SelectableItem> {
        return this.getSupportedLanguages().map((languageItem) => {
            let displayItem = this.getTranslation(languageItem.DisplayValue) + ' - ' + this.getTranslation(languageItem.TranslationKey);
            return new SelectableItem(languageItem.Value, displayItem, languageItem.TranslationKey);
        });
    }

    getLanguage(languageCode: string): LanguageModel {
        if (!languageCode) {
            return null;
        }
        return this._util.getLanguages().find((language) => {
            return language.Code2.toUpperCase() === languageCode.toUpperCase() ||
                language.Code3.toUpperCase() === languageCode.toUpperCase() ||
                language.Local.toUpperCase() === languageCode.toUpperCase();
        });
    }

    setLanguage(languageCode3: string, data) {
        this._currentLanguage = languageCode3;
        this._dicTranslations = data;

        let language = this.getLanguage(languageCode3);

        this.setLocale(language.Local);

        this.saveCurrentLanguage(); // Save current language to storage

        this.raiseLanguageChange(); // Update language for directive

    }

    isExistsTranslation(key: string): boolean {
        return this._dicTranslations && !!this._dicTranslations[key];
    }

    getCurrentLanguage() {
        return this._currentLanguage;
    }

    getDicTranslations() {
        return this._dicTranslations;
    }

    /**
     * Check language is support
     * @param langCode
     */
    isSupportLanguage(langCode: string) {
        return !!this.getLanguage(langCode);
    }

    onLanguageChange(): Observable<any> {
        return this.languageChange.asObservable();
    }

    raiseLanguageChange() {
        this.languageChange.next(this._currentLanguage);
    }

    convertLanguageCode2ToLanguageCode3(languageCode: string) {
        let language = this.getLanguage(languageCode);
        return language ? language.Code3 : languageCode;
    }

    getFileFromLanguageCode(languageCode: string) {
        let language = this.getLanguage(languageCode);
        if (language) {
            return language.FileName;
        }
    }

    /**
     * Save current language to local
     */
    private saveCurrentLanguage() {
        this._storageSvc.setLocalValue(StorageKeys.UserLanguage, this._currentLanguage);
    }

    changeLanguage(langCode: string): Observable<boolean> {
        return this.loadTranslations(langCode)
            .pipe(tap(() => {
                this.saveCurrentLanguage();

                this.raiseLanguageChange();
            }));
    }
}


