import {Component, Injector} from '@angular/core';
import {AppConfig} from './core/app.config';
import {ModuleDefinition} from './module-bar/shared/model';
import {AppParams} from './core/app.params';
import moment from 'moment-es6';
import {AppBaseController} from './core/controllers/app-base-controller';
import {globalModulesDef} from './routing/modules-definitions';
import {CommonDocumentService} from './documents/shared/common-document.service';
import {TranslationService} from './core/services/translation.service';
import {ToolbarService} from './toolbar/shared/toolbar.service';

@Component({
    selector: 'ntk-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent extends AppBaseController {
    globalModulesDef = globalModulesDef;

    constructor(injector: Injector,
                appParams: AppParams,
                appConfig: AppConfig,
                private translationService: TranslationService,
                private _toolbarService: ToolbarService) {
        super(injector);


        appConfig.APP = 'ntk-commoncontrol';
        appConfig.APP_SESSION = 'ntk-commoncontrol-session';
        appConfig.API_APP = 'common';
        // appConfig.API_URL = appParams.apiUrl;
        // appConfig.API_APP_URL = appParams.apiUrl + 'cl/';
        appConfig.VERSION_BUILD = appParams.appVersion;
        appConfig.WITH_NG1 = false;
        appConfig.APP_TITLE = 'Common Control';
        let tokens = appParams.appVersion.split(' ');
        if (tokens.length > 1) {
            appConfig.VERSION = tokens[0];
            appConfig.VERSION_BUILD = tokens[tokens.length - 1];
        } else {
            appConfig.VERSION = appParams.appVersion;
            appConfig.VERSION_BUILD = appParams.appVersion;
        }
        if (appConfig.VERSION_BUILD) {
            appConfig.RELEASE_DATE = moment(appConfig.VERSION_BUILD, 'YYYYMMDD');
        }

        if (appParams.major_release_date) {
            appConfig.MAJOR_RELEASE_DATE = moment(appParams.major_release_date, 'YYYYMMDD');
        }

        appConfig.toolbarConfig = {
            // hideNotificationHistory: true,
            // hideNotificationSetting: true,
            userMenuConfig: {
                showUserProfileItem: true,
                showChangeLangualeItem: true,
                showUserSettingItem: true,
                showNotificationMenu: true,
                showReleaseNotesItem: true
            }
        };

        let documentService = injector.get(CommonDocumentService, null);

        if (documentService) {
            let svgMap: { [index: string]: string } = {
                xlsx: 'excelsvg',
                docx: 'wordsvg',
                eml: 'attach_emailsvg'
            };
            documentService.setSvgDictionary(svgMap);
        }


        let isFirstRun = true;
        this.translationService.onLanguageChange().subscribe(() => {
            if (isFirstRun && this._toolbarService.isShowNewReleaseAlert()) {
                this.toolbarService.showReleaseAlert();
            }
            isFirstRun = false;
        });
    }

    hasAccess(item: ModuleDefinition) {
        return true;
    }

    isModuleActive(item: ModuleDefinition, currentUrl: string) {
        // console.log('---isModuleActive ', item, ' of url ', currentUrl);

        return currentUrl.indexOf(item.routeName) >=0;      
        
    }

}
