import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KanbanItem } from './kanban.model';

@Injectable({
    providedIn: 'root'
})
export class KanbanService {
    private readonly _selectItem = new BehaviorSubject<any>(null);

    selectItem$ = this._selectItem.asObservable();

    getselectItem(): KanbanItem {
        return this._selectItem.getValue();
    }

    setSelectItem(item: KanbanItem): void {
        this._selectItem.next(item);
    }

    getScrollbarWidth(element: Element) {
        let datatable = $(element).closest('ntk-kanban');
        if (datatable.length > 0) {
            let body = datatable.find('.scroll-viewport'),
                content = datatable.find('.scroll-content-wrapper');
            return body.width() - content.width();
        } else {
            return 0;
        }
    }

    unlockApp(element: HTMLElement | ElementRef<HTMLElement>) {
        $(element).closest('ntk-kanban').find('.blocked-content').hide();
    }

    lockApp(element: HTMLElement | ElementRef<HTMLElement>) {
        $(element).closest('ntk-kanban').find('.blocked-content').show();
    }

}
