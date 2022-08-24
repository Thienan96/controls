import { Directive, ElementRef, Input, Injector } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../core/state';
import { getChangeUILanguageState } from '../../core/state/app.reducer';
import {TranslationService} from '../../core/services/translation.service';




@Directive({
    selector: '[ntk-translator]'
})
export class TranslatorDirective {

    @Input('ntk-translator-uppercase') _isUpperCase = false;

    private _tranSvc: TranslationService;
    private _value: string;

    constructor(private _elementRef: ElementRef, injector: Injector, private _storeRx: Store<AppState>) {
        this._tranSvc = injector.get(TranslationService);

        this._storeRx.select(getChangeUILanguageState).subscribe(languageCode => {
            if (languageCode && this._value) {
                this.translate(this._value);
            }
        });

        // Update text when the language is changed
        injector.get(TranslationService, null).onLanguageChange().subscribe(() => {
            this.translate(this._value);
        });

    }

    @Input('ntk-translator')
    set translator(value: string) {
        this._value = value;
        this.translate(value);
    }

    translate(value: string) {
        let translationKey: string = value;
        let sIdx: number = translationKey.indexOf(':');
        let paramKeys: Array<string> = [];
        if (sIdx > 0) {
            translationKey = value.substr(0, sIdx);

            let params = value.substr(sIdx + 1);
            paramKeys = params.split(',') || [];
        }

        let translationValue = this._tranSvc.getTranslation(translationKey);

        if (paramKeys && paramKeys.length > 0) {
            let paramsValues: Array<string> = []
            for (let _i = 0; _i < paramKeys.length; _i++) {
                paramsValues.push(this._tranSvc.getTranslation(paramKeys[_i]));
            }

            translationValue = translationValue.replace(/{(\d+)}/g, function (match, number) {
                return typeof paramsValues[number] != 'undefined' ? paramsValues[number] : match;
            });
        }

        if (this._isUpperCase) {
            translationValue = translationValue.toUpperCase();
        }

        this._elementRef.nativeElement.innerText = translationValue;
    }
}
