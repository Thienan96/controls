import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DatatableService {

    private subExpandCollapseChanged = new Subject<void>();
    private cellSelectedChanged = new Subject<void>();

    getPaddingRight(container: JQuery) {
        let datatable = container.closest('ntk-datatable');
        if (datatable.length > 0) {
            let body = datatable.find('ntk-datatable-body'),
                content = datatable.find('.scrollable-content');
            return body.width() - content.width();
        } else {
            return 0;
        }
    }

    /**
     * Get scroll-bar width
     */
    getScrollBarWidth() {
        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        // @ts-ignore
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

    raisExpandCollapseChanged() {
        this.subExpandCollapseChanged.next();
    }

    onExpandCollapseChanged(): Observable<void> {
        return this.subExpandCollapseChanged.asObservable();
    }

    raiseCellSelectedChanged() {
        this.cellSelectedChanged.next();
    }

    onRaiseCellSelectedChanged() {
        return this.cellSelectedChanged.asObservable();
    }
}
