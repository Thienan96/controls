import {Directive, ElementRef, Injector, Input, Optional} from '@angular/core';
import {Store} from '@ngrx/store';

import {AppState} from '../../core/state';
import {getChangeUILanguageState} from '../../core/state/app.reducer';
import {TranslationService} from '../../core/services/translation.service';
import {MatInput} from '@angular/material';
import {MatFormField} from '@angular/material/form-field';


@Directive({
    selector: '[ntk-translator-attribute]'
})
export class TranslatorAttributeDirective {

    private _tranSvc: TranslationService;
    private _value: string | object;

    @Input('ntk-translator-attribute') set translator(value: string | object) {
        this._value = value;
        this.translate(value);
    }

    constructor(private _elementRef: ElementRef<Element>, injector: Injector, private _storeRx: Store<AppState>,
                @Optional() private matInput: MatInput,
                @Optional() public parentFormField: MatFormField) {
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


    translate(value: string | object) {
        let attributes = {};
        if (typeof value === 'object') {
            attributes = value;
        }
        if (typeof value === 'string') {
            let segs = value.split(':');
            attributes[segs[0]] = segs[1];
        }
        // tslint:disable-next-line:forin
        for (const attributesKey in attributes) {
            let translationValue = this._tranSvc.getTranslation(attributes[attributesKey]);

            // Set attribute
            this._elementRef.nativeElement.setAttribute(attributesKey, translationValue);

            // Update placeholder for matInput
            if (attributesKey === 'placeholder') {
                this.matInput.placeholder = translationValue;
            }

            // Force Render mat-form-field
            this.parentFormField['_changeDetectorRef'].markForCheck();
        }
    }
}
