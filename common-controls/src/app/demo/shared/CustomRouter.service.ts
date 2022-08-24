import {RouterService} from '../../core/services/router.service';
import {Injectable, Injector} from '@angular/core';
import {NavigationExtras} from '@angular/router';
import {TranslationService} from '../../core/services/translation.service';
import {UtilityService} from '../../core/services/utility.service';

@Injectable({
    providedIn: 'root'
})
export class CustomRouterService extends RouterService {
    constructor(protected injector: Injector,
                private _translationService: TranslationService,
                private _utilityService: UtilityService) {
        super(injector);
    }

    navigateTo(commands: any[], extras?: NavigationExtras) {
        let paths = <string[]>commands[0].split('/');
        if (paths[0] === '') {
            paths.splice(0, 1);
        }
        if (!this._translationService.isSupportLanguage(paths[0])) {
            let languageCode3 = this._translationService.getCurrentLanguage() || this._translationService.getDefaultLanguageCodeUI(),
                currentLanguage = this._utilityService.convertLanguageCodeToPossibleSupportLanguageCode2(languageCode3);
            commands[0] = currentLanguage + '/' + commands[0];
        }
        return this._router.navigate(commands, extras);
    }

    getState(url: string): string {
        if (!url) {
            return '';
        }
        return this.getUrlWithoutLanguage(url);
    }

    private trimUrl(url: string): string {
        let tokens: string[] = url.split('/');
        if (tokens[0] === '') {
            tokens.splice(0, 1);
        }
        if (tokens[tokens.length - 1] === '') {
            tokens.splice(tokens.length - 1, 1);
        }
        return tokens.join('/');
    }

    private getUrlWithoutLanguage(url: string) {
        let newUrl = this.trimUrl(url);
        let tokens: string[] = newUrl.split('/');
        let translationService = this.injector.get(TranslationService);
        let matched = translationService.getLanguage(tokens[0]);
        if (matched) {
            tokens.splice(0, 1);
            return tokens.join('/');
        } else {
            return newUrl;
        }
    }
}
