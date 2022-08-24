import { Injector } from '@angular/core';
import { DialogService } from './dialog.service';
import { TranslationService } from './translation.service';
import { UtilityService } from './utility.service';

export class NtkServiceBase {

    private __dlgSvc: DialogService;
    private __trans: TranslationService;

    private __util: UtilityService;
    constructor(private injector: Injector) {
        this.__dlgSvc = injector.get(DialogService);
        this.__trans = injector.get(TranslationService);
        this.__util = injector.get(UtilityService);
    }

    validateNumberProperty(ojb: any, property: string): boolean {
        if (!!ojb[property] && !this.__util.isNumber(ojb[property])) {
            let msg = this.__trans.getTranslation('msgInvalidNumber');
            this.__dlgSvc.showErrorToastMessage(msg + ' (' + ojb[property] + ')');
            return false;
        }

        return true;
    }
}
