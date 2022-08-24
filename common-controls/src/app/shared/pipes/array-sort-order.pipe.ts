import { Pipe, PipeTransform, Injector } from '@angular/core';


@Pipe({ name: 'arraySortOrder' })
export class ArraySortOrderPipe implements PipeTransform {
    
    constructor(private injector: Injector) {
        
    }

    transform(list: Array<any>, args?: any): any {
        return list.sort(function(a, b){
            if(a[args.property] < b[args.property]){
                return -1 * args.direction;
            }
            else if( a[args.property] > b[args.property]){
                return 1 * args.direction;
            }
            else{
                return 0;
            }
        });
    }
}
