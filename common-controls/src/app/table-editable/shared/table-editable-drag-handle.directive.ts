import {AfterContentInit, Directive, ElementRef, Input, NgZone} from '@angular/core';
import {TableEditableComponent} from '../table-editable/table-editable.component';
import {TableEditableControlType} from './table-editable.model';

@Directive({
    selector: '[ntkTableEditableDragHandle]',
})
export class TableEditableDragHandleDirective implements AfterContentInit {
    @Input() drag = 'datatable-row-wrapper';
    @Input() datatable: TableEditableComponent;
    @Input() columnIndex: number;
    @Input() rowIndex: number;
    dragOptions: any;
    elDatatable: JQuery;
    revert = false;
    id: string;

    constructor(private elementRef: ElementRef,
                private zone: NgZone) {
        this.dragOptions = {
            handle: this.elementRef.nativeElement,
            appendTo: 'body',
            classes: {
                'ui-draggable-dragging': 'table-editable-draggable-dragging'
            },
            helper: () => {
                let $el = $(this.elementRef.nativeElement).closest('datatable-row-wrapper').clone(),
                    value = this.datatable.getCell(this.rowIndex, this.columnIndex),
                    width = this.datatable.getDataTableElement().width(),
                    columnName = this.datatable.getColumnName(this.columnIndex),
                    controlType = this.datatable.getControlType(columnName),
                    content = '';
                if (controlType === TableEditableControlType.Select) {
                    content = value.Name;
                } else {
                    content = value;
                }
                content = '<div class="hs-block-ellipsis">' + content + '</div>';
                $el.css('transform', 'translate(0px, 0px)');
                $el.find('.datatable-row-group').css('transform', 'translate(0px, 0px)');
                $el.find('datatable-body-row').css('width', 'auto');
                $el.find('.datatable-row-left').remove();
                $el.find('.datatable-row-right').remove();
                $el.find('.datatable-row-center datatable-body-cell:not(:first-child)').remove();
                $el.find('.datatable-row-center datatable-body-cell .cell-value').html(content);
                $el.find('.datatable-row-center datatable-body-cell').css({
                    width: width,
                    'min-width': width
                });
                // Remove control on cell
                $el.find('.cell-editable').removeClass('actived selected invalid');
                $el.find('.cell-control').parent().remove();

                return $el;
            },
            axis: 'y',
            scrollParent: 'datatable-body',
            cursorAt: {right: 20},
            start: () => {
                this.elDatatable = $(this.elementRef.nativeElement).closest('ngx-datatable');
                this.id = this.getIdFromElement($(this.elementRef.nativeElement).closest('datatable-body-row'));

                // Cancel drag when press Escape
                $(window).on('keydown.ntkTableEditableDragHandle', (ev) => {
                    if (ev.key === 'Escape') {
                        this.revert = true;
                        let instance = this.getDraggableElement()['draggable']('instance');
                        instance._mouseUp(new $.Event('mouseup', {target: instance.element[0]}));
                    }
                });

                // Un-Select
                this.datatable.unSelectedCell();
                this.datatable.safeApply();


            },
            drag: (ev, ui) => {
                let rows = this.elDatatable.find('datatable-row-wrapper'),
                    pos = this.getDropPosition(rows, ui.offset.top);
                rows.removeClass('table-editable-draggable-hover table-editable-draggable-hover-bottom');
                if (pos === this.datatable.getRowCount()) {
                    $(rows[pos - 1]).addClass('table-editable-draggable-hover-bottom');
                } else {
                    $(rows[pos]).addClass('table-editable-draggable-hover');
                }
            },
            stop: (ev, ui) => {
                // Turn off event keydown
                $(window).off('keydown.ntkTableEditableDragHandle');

                let rows = this.elDatatable.find('datatable-row-wrapper');
                rows.removeClass('table-editable-draggable-hover table-editable-draggable-hover-bottom');
                if (!this.revert) {
                    let rowIndex = this.getDropPosition(rows, ui.offset.top),
                        dragId = this.id,
                        rowElement = null,
                        isEnded = false;
                    if (rowIndex === this.datatable.getRowCount()) {
                        rowElement = $(rows[rowIndex - 1]);
                        isEnded = true;
                    } else {
                        if (rowIndex >= rows.length) {
                            rowIndex = rows.length - 1;
                            isEnded = true;
                        }
                        rowElement = $(rows[rowIndex]);
                    }
                    let dropId = this.getIdFromElement(rowElement.find('datatable-body-row'));


                    this.datatable.moveRow(dragId, dropId, isEnded);
                    this.datatable.selectRowById(this.id);
                    this.datatable.safeApply();


                }

                this.revert = false;
            }
        };
    }

    ngAfterContentInit() {
        setTimeout(() => {
            this.zone.runOutsideAngular(() => { // Setup drag outside angular cycle to optimize the memory
                // Setup drag
                this.getDraggableElement()['draggable'](this.dragOptions);
            });
        }, 100);
    }

    /**
     * Get element need drag
     * @returns {JQuery<HTMLElement>}
     */
    private getDraggableElement() {
        return $(this.elementRef.nativeElement).closest('datatable-row-wrapper');
    }

    /**
     * Get position in rows from top
     * @param {JQuery} rows
     * @param {number} top
     * @returns {number}
     */
    private getDropPosition(rows: JQuery, top: number): number {
        let distance = 99999,
            pos = -1;
        rows.each((i: number, row: Element) => {
            let rowTop: number = $(row).offset().top;
            let d = Math['abs'](rowTop - top);
            if (d < distance) {
                distance = d;
                pos = i;
            }
        });
        if (pos === rows.length - 1) {
            let row = rows[pos];
            let rowTop: number = $(row).offset().top + this.datatable.rowHeight;
            let d = Math['abs'](rowTop - top);
            if (d < distance) {
                pos = rows.length;
            }
        }
        return pos;
    }

    /**
     * Get id of element
     * @param {JQuery} $el
     * @returns {string}
     */
    private getIdFromElement($el: JQuery): string {
        let id = null,
            classNames = $el.attr('class').split(' ');
        classNames.forEach((className: string) => {
            let pos: number = className.indexOf('datatable-body-row-id-');
            if (pos > -1) {
                id = className.split('datatable-body-row-id-')[1];
            }
        });
        return id;
    }


}
