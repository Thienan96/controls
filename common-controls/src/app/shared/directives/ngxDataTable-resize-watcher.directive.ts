/**
 * from: https://github.com/swimlane/ngx-datatable/issues/193
 */
import {ChangeDetectorRef, Directive, Injector} from '@angular/core';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {ResizeSensorDirective} from './resize-sensor.directive';

@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'ngx-datatable[ngx-resize-watcher]'
})
export class NgxResizeWatcherDirective extends ResizeSensorDirective {
    constructor(public injector: Injector,
                private table: DatatableComponent,
                private cd: ChangeDetectorRef) {
        super(injector);
    }

    /**
     * Override onResize
     */
    onResize() {

        this.table.recalculate();
        this.table.recalculateColumns();

        // this call triggered alot of renders when resizing and cause the grid auto resize alot of times
        this.cd.markForCheck();
    }

}
