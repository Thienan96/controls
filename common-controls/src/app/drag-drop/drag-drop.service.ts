import {ElementRef, Inject, Injectable, NgZone} from '@angular/core';
import {DragDrop, DragRefConfig} from '@angular/cdk/drag-drop';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {NtkDropListRef} from './drop-list-ref';
import {NtkDragRef} from './drag-ref';
import {NtkDragDropRegistry} from './drag-drop-registry';

@Injectable({
    providedIn: 'root'
})
export class NtkDragDrop extends DragDrop {
    constructor(@Inject(DOCUMENT) private document: any,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler,
                private dragDropRegistry: NtkDragDropRegistry<NtkDragRef, NtkDropListRef>) {
        super(document, ngZone, viewportRuler, dragDropRegistry);
    }

    createDrag<T = any>(element: ElementRef, config?: DragRefConfig): any {
        return new NtkDragRef(element, config, this.document, this.ngZone, this.viewportRuler, this.dragDropRegistry);
    }

    createDropList(element): any {
        return new NtkDropListRef(element, this.dragDropRegistry, this.document, this.ngZone, this.viewportRuler);
    }
}

