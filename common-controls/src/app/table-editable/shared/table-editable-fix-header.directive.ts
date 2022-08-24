import {AfterContentInit, Directive, Input, OnDestroy} from '@angular/core';
import {TableEditableService} from './table-editable.service';
import {TableEditableComponent} from '../table-editable/table-editable.component';

@Directive({
    selector: '[ntkTableEditableFixHeader]',
})
export class TableEditableFixHeaderDirective implements AfterContentInit, OnDestroy {
    isDestroy = false;
    @Input() datatable: TableEditableComponent;

    constructor(private tableEditableService: TableEditableService) {
    }

    ngAfterContentInit() {
        setTimeout(() => {
            if (!this.isDestroy) {
                this.tableEditableService.fixRightColumn(this.datatable);
            }
        }, 100);
    }

    ngOnDestroy() {
        this.isDestroy = true;


        setTimeout(() => {
            if (this.datatable) {
                this.tableEditableService.fixRightColumn(this.datatable);
            }
        }, 100);
    }

}
