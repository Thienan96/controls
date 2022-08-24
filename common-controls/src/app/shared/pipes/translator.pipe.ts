import { Pipe, PipeTransform, Injector } from '@angular/core';
import { String } from 'typescript-string-operations';
import {TranslationService} from '../../core/services/translation.service';

@Pipe({ name: 'translator' })
export class TranslatorPipe implements PipeTransform {
    private tranSvc: TranslationService;
    constructor(private injector: Injector) {
        this.tranSvc = injector.get(TranslationService);
    }

    transform(value: string, param1?: any, param2?: any, needTranslateParam = true): string {
        let result = value;
        result = this.tranSvc.getTranslation(result);
        let params = [];

        if (param1) {
            param1 = needTranslateParam ? this.tranSvc.getTranslation(param1) : param1;
            params.push(param1);
        }

        if (param2) {
            param2 = needTranslateParam ? this.tranSvc.getTranslation(param2) : param2;
            params.push(param2);
        }

        if (params.length > 0) {
            return String.Format(result, ...params);
        }
        return result;
    }
}
