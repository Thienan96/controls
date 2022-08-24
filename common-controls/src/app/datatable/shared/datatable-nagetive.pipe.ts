import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'datatableNegative',
    pure: false
})

export class DatatableNagetivePipe implements PipeTransform {
    transform(items: any[], negative: any[]): any {
        return items.filter((item) => {
            let pos = negative.findIndex((n) => {
                return n.property === item.property;
            });
            return pos === -1;
        });

    }
}
