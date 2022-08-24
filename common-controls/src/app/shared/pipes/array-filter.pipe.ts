import { Pipe, PipeTransform, Injector } from '@angular/core';


@Pipe({ name: 'arrayFilter' })
export class ArrayFilterPipe implements PipeTransform {

    constructor(private injector: Injector) {
    }

    transform(items: any[], existings: any[]): any {
        if (!items || !existings) {
            return items;
        }

        return items.filter(item => existings.findIndex(x => x === item) < 0);
    }
}
