import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output} from '@angular/core';

@Component({
    selector: 'ntk-table-editable-cell-selected',
    template: '',
    styleUrls: []
})
export class TableEditableCellSelectedComponent implements AfterViewInit, OnDestroy {
    @Output() destroy = new EventEmitter();
    @Output() load = new EventEmitter();
    private blured = false;

    constructor(private elementRef: ElementRef) {
    }

    ngAfterViewInit() {

        // Blur
        this.getCell().on('blurCell.cellSelected', () => {
            this.blured = true;
        });

        this.load.emit({
            element: this.elementRef.nativeElement
        });
    }

    ngOnDestroy() {
        this.getCell().off('blurCell.cellSelected');

        this.destroy.emit({
            blured: this.blured
        });
    }

    private getCell() {
        return $(this.elementRef.nativeElement).closest('datatable-body-cell');
    }
}
