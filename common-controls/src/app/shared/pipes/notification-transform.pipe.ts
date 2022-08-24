import {Pipe, PipeTransform} from '@angular/core';
import {TranslationService} from '../../core/services/translation.service';


@Pipe({
    name: 'notificationTransform'
})
export class NotificationTransformPipe implements PipeTransform {

    constructor(private _tran: TranslationService) {

    }

    transform(value: any, args?: any): any {
        if (!value) {
            return '';
        }
        let params = JSON.parse(args),
            result = this._tran.getTranslation(value);
        if (result && params) {
            Object.keys(params).forEach(k => {
                // special case need to translate status
                if (k === 'InterventionStatus') {
                    let statusText =  params[k] ? this._tran.getTranslation('IssueStatus_' + params[k]) : '';
                    result = result.replace('{' + k + '}', statusText);
                } else {
                    result = result.replace('{' + k + '}', params[k] || '');
                }
            });
        }
        return result;
    }
}
