import {DropListRef} from '@angular/cdk/drag-drop';
import {ElementRef, Inject, NgZone} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {KanbanDragDropRegistry} from './drag-drop.registry';
import {KanbanDragRef} from './drag-ref';
import {Observable} from 'rxjs';
import {KanbanDropList} from './kanban-drop-list';
import {KanbanDragDrop} from './drag-drop';


export class KanbanDropListRef extends DropListRef<KanbanDropList> {
    constructor(element: ElementRef<HTMLElement> | HTMLElement,
                private dragDropRegistry: KanbanDragDropRegistry,
                @Inject(DOCUMENT) private document: any,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler) {
        super(element, dragDropRegistry, document, ngZone, viewportRuler);
    }

    get itemPositions() {
        return this['_itemPositions'];
    }

    get draggables(): KanbanDragRef[] {
        return this['_draggables'];
    }

    checkDragDrop(dragdrop: KanbanDragDrop): Observable<any> {
        return new Observable((subscriber) => {
            dragdrop.subscriber = subscriber;
            this.data.kanbanDropListMoved.emit(dragdrop);
        });
    }

    reset() {
        this.itemPositions.forEach(((sibling) => {
            sibling.drag.data.reset();
        }));
    }

    getOldPositionSort(drag: KanbanDragRef) {
        return this.draggables.findIndex((currentItem) => {
            return currentItem === drag;
        });
    }
}
