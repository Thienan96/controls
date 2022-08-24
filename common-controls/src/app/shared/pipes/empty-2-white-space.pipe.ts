import { Pipe, PipeTransform, Injector } from '@angular/core';

@Pipe({ name: 'empty2WhiteSpace' })
export class Empty2WhiteSpacePipe implements PipeTransform {
    transform(value: string, params: any): string {
        let result = value;
        if (!result) {
            return ' ';
        }
        
        return result;
    }
}
