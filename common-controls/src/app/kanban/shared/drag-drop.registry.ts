import {DragDropRegistry, DropListRef} from '@angular/cdk/drag-drop';
import {Inject, Injectable, NgZone} from '@angular/core';
import {KanbanDragRef} from './drag-ref';
import {DOCUMENT} from '@angular/common';


@Injectable({
    providedIn: 'root'
})
export class KanbanDragDropRegistry extends DragDropRegistry<KanbanDragRef, DropListRef> {
    constructor(private ngZone: NgZone,
                @Inject(DOCUMENT) private document: any) {
        super(ngZone, document);
    }


    clearGlobalListeners() {
        this['_clearGlobalListeners']();
    }
}
