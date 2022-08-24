import { Pipe, PipeTransform, Injector } from '@angular/core';

@Pipe({ name: 'hsFilterText' })
export class FilterTextPipe implements PipeTransform {
    transform(items: any[], filters: string[]): any[] {
        if (!items || !filters || filters.length < 2 || !filters[0] || !filters[1]) {
            return items;
        }
        // filter items array, items which match and return true will be
        // kept, false will be filtered out
        let filterValue: string = filters[0].toLowerCase();
        let filterPropertyName: string = filters[1];

        if (!!filterPropertyName) {
            return items.filter(item => {
                let strValue: string = item[filterPropertyName];

                if (strValue && strValue.toLowerCase().indexOf(filterValue) >= 0)
                    return true;

                return false;
            });
        } else {
            throw new Error('The filter property has been not defined in the pipe.');
        }
    }
}
