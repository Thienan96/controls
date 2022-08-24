import {DragDropRegistry} from '@angular/cdk/drag-drop';
import {Injectable} from '@angular/core';
import {NtkDragRef} from './drag-ref';


@Injectable({
    providedIn: 'root'
})
export class NtkDragDropRegistry<I, C extends {
    id: string;
}> extends DragDropRegistry<I, C> {
    clearGlobalListeners() {
        this['_clearGlobalListeners']();
    }

    /**
     * Drag item instances that are currently being dragged.
     */
    getActiveDragInstance(): NtkDragRef | null {
        let ref: NtkDragRef = null;
        this[`_activeDragInstances`].forEach((item) => {
            ref = item;
        });
        return ref;
    }
}
