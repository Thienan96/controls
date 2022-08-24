import { Pipe, PipeTransform, Injector } from '@angular/core';
import { SafeHtmlPipe } from './safe-html.pipe';

@Pipe({ name: 'carriageReturn2HtmlBr' })
export class CarriageReturn2HtmlBrPipe implements PipeTransform {
    transform(value: string, params?: any): string {
        let result = value;
        
        if (result) {
            // EJ4-2117: \n sometime has been replace by '&#10;' by the code of SafeHtmlPipe
            return result.replace(/\r\n/g, '<br/>').replace(/\r/g, '<br/>').replace(/\n/g, '<br/>').replace(/&#10;/g, '<br/>');
        }

        return result;
    }
}
