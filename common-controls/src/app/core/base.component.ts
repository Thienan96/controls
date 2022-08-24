import { Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './state';
import {HelperService} from './services/helper.service';
import {getChangeUILanguageState} from './state/app.reducer';


//----------------------------------------------------------------------
// should use BaseComponent for component to translate immediately (Action change UI language)
//----------------------------------------------------------------------
export abstract class BaseComponent {
    protected _helperService: HelperService;
    protected currentUILanguageCode: string;

    constructor(injector: Injector, protected _storeRxApp: Store<AppState>) {
        this._helperService = injector.get(HelperService);

        this.currentUILanguageCode = this._helperService.TranslationService.getDefaultLanguageCodeUI();
        this._storeRxApp.select(getChangeUILanguageState).subscribe(languageCode => {
            if (languageCode)
                this.currentUILanguageCode = languageCode;
        });
    }
}
