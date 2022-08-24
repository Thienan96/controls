import {DropListRef} from '@angular/cdk/drag-drop';
import {ElementRef, Inject, NgZone} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {Observable} from 'rxjs';
import {NtkDragRef} from './drag-ref';
import {NtkDragDropRegistry} from './drag-drop-registry';
import {NtkDragDropParams} from './drag-drop.model';
import {NtkDropList} from './drop-list';
import {coerceElement} from '@angular/cdk/coercion';


export class NtkDropListRef<T = NtkDropList> extends DropListRef<NtkDropList> {
    constructor(element: ElementRef<HTMLElement> | HTMLElement,
                public dragDropRegistry: NtkDragDropRegistry<NtkDragRef, DropListRef>,
                @Inject(DOCUMENT) private document: any,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler) {
        super(element, dragDropRegistry, document, ngZone, viewportRuler);
    }

    get itemPositions() {
        return this['_itemPositions'];
    }

    get draggables(): NtkDragRef[] {
        return this['_draggables'];
    }


    get clientRect(): DOMRect {
        return this[`_clientRect`];
    }

    get isOverContainer() {
        return <any>this[`_isOverContainer`];
    }

    set isOverContainer(value) {
        this[`_isOverContainer`] = value;
    }

    get shadowRoot() {
        return this[`_shadowRoot`];
    }

    getElement(): HTMLElement {
        return coerceElement<HTMLElement>(this.element);
    }

    updateDragDrop(dragdrop: NtkDragDropParams): Observable<any> {
        return new Observable((subscriber) => {
            dragdrop.subscriber = subscriber;
            this.data.moveItem(dragdrop);
        });
    }

    reset() {
        this.itemPositions.forEach(((sibling) => {
            sibling.drag.data.reset();
        }));
    }

    getOldPositionSort(drag: NtkDragRef) {
        return this.draggables.findIndex((currentItem) => {
            return currentItem === drag;
        });
    }
}
