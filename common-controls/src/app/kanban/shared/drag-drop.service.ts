import {ElementRef, Inject, Injectable, NgZone} from '@angular/core';
import {DragDrop, DragRefConfig} from '@angular/cdk/drag-drop';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {KanbanDragDropRegistry} from './drag-drop.registry';
import {KanbanDropListRef} from './drop-list-ref';
import {KanbanDragRef} from './drag-ref';
import {KanbanService} from './kanban.service';

@Injectable({
    providedIn: 'root'
})
export class DragDropService extends DragDrop {
    constructor(@Inject(DOCUMENT) private document: any,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler,
                private dragDropRegistry: KanbanDragDropRegistry,
                private kanbanService: KanbanService) {
        super(document, ngZone, viewportRuler, dragDropRegistry);
    }

    createDrag<T = any>(element: ElementRef, config?: DragRefConfig): any {
        if ($(element.nativeElement).hasClass('kanban-drag')) {
            return new KanbanDragRef(element, config, this.document, this.ngZone, this.viewportRuler, this.dragDropRegistry, this.kanbanService);
        } else {
            return super.createDrag(element, config);
        }
    }

    createDropList(element): any {
        if ($(element.nativeElement).hasClass('kanban-drop-list')) {
            return new KanbanDropListRef(element, this.dragDropRegistry, this.document, this.ngZone, this.viewportRuler);
        } else {
            return super.createDropList(element);
        }
    }
}

