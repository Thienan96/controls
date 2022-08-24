import {Injectable} from '@angular/core';
import {TableEditableComponent} from '../table-editable/table-editable.component';

@Injectable({
    providedIn: 'root'
})
export class TableEditableService {


    /**
     * Get scroll-bar width
     * @returns {number}
     */
    getScrollbarWidth() {

        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);

        // Creating inner element and placing it in the container
        const inner = document.createElement('div');
        outer.appendChild(inner);

        // Calculating difference between container's full width and the child width
        let scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

        // Removing temporary elements from the DOM
        outer.parentNode.removeChild(outer);

        return scrollbarWidth;

    }

    /**
     * Check the control has vertical
     * @param {JQuery} $el
     * @returns {boolean}
     */
    hasVertical($el: JQuery) {
        let datatable = $el.closest('ngx-datatable');
        if (datatable.length > 0) {
            let body = datatable.find('datatable-body'),
                datatableSelection = datatable.find('datatable-selection');
            return body.width() - datatableSelection.width() > 3;
        }
    }

    hasHorizontal($el: JQuery) {
        let datatable = $el.closest('ngx-datatable');
        if (datatable.length > 0) {
            let body = datatable.find('datatable-body'),
                datatableSelection = datatable.find('datatable-selection');
            return body.height() - datatableSelection.height() > 3;
        }
    }

    isHorizontal($el: JQuery){
        let datatable = $el.closest('ngx-datatable');
        if (datatable.length > 0) {
            let datatableScroller = datatable.find(`datatable-scroller`);
            return datatableScroller.width() - datatable.width() > 3;
        }
    }

    resetFixRighColumn(datatable: TableEditableComponent) {
        let datatableEl = datatable.getDataTableElement();


        // Remove css
        datatableEl.removeClass('has-horizontal no-horizontal has-vertical no-vertical');

        // Fix scroll
        datatableEl.find('datatable-scroller, .datatable-header-inner').css({
            'min-width': 'initial',
            'max-width': 'initial'
        });

        // No scroll
        datatableEl.find('.datatable-row-center datatable-header-cell:last-child .resize-handle').css({
            right: 0
        });
        datatableEl.find('.datatable-row-center datatable-body-cell:last-child .datatable-body-cell-label, .datatable-row-center datatable-header-cell:last-child .datatable-header-cell-template-wrap').each((i, el: any) => {
            el.style.setProperty('width', '100%', 'important');
        });


        // Horizontal
        datatableEl.find('datatable-body .datatable-row-right').css({
            right: 0
        });


        // Vertical
        datatableEl.find('datatable-header .datatable-row-right').css({
            right: 0,
            'padding-right': 0
        });
    }

    fixRightColumn(datatable: TableEditableComponent) {
        this.resetFixRighColumn(datatable);


        let datatableEl = datatable.getDataTableElement();


        let hasVertical = datatable.hasVertical(),
            hasHorizontal = datatable.isHorizontal(),
            scrollbatWidth = this.getScrollbarWidth();


        let innerWidth = 0;
        datatable.getGidComponent().bodyComponent.columns.forEach((column) => {
            innerWidth = innerWidth + column.width;
        });
        datatableEl.find('datatable-scroller, .datatable-header-inner').css({
            'min-width': innerWidth,
            'max-width': innerWidth
        });


        if (hasHorizontal) {
            datatableEl.addClass('has-horizontal');
        } else {
            datatableEl.addClass('no-horizontal');
        }
        if (hasVertical) {
            datatableEl.addClass('has-vertical');
        } else {
            datatableEl.addClass('no-vertical');
        }

        // No scroll
        if (!hasHorizontal && !hasVertical) {
            datatableEl.find('.datatable-row-center datatable-header-cell:last-child .resize-handle').css({
                right: -scrollbatWidth + 'px'
            });

            let width = 'calc(100% + ' + scrollbatWidth + 'px)';
            datatableEl.find('.datatable-row-center datatable-body-cell:last-child .datatable-body-cell-label, .datatable-row-center datatable-header-cell:last-child .datatable-header-cell-template-wrap').each((i, el: any) => {
                el.style.setProperty('width', width, 'important');
            });
        }

        // Horizontal
        if (hasHorizontal && !hasVertical) {
            if (datatableEl.hasClass('has-horizontal') && datatableEl.hasClass('no-vertical')) {
                datatableEl.find('datatable-body .datatable-row-right').css({
                    right: -scrollbatWidth + 'px'
                });
            }
        }

        // Vertical
        if (hasVertical) {
            if (datatableEl.hasClass('has-vertical')) {
                datatableEl.find('datatable-header .datatable-row-right').css({
                    right: scrollbatWidth + 'px',
                    'padding-right': scrollbatWidth + 'px'
                });
            }
        }
    }


}
