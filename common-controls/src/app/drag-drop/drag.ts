import {ContentChildren, Directive, Input, QueryList} from '@angular/core';
import {CdkDrag} from '@angular/cdk/drag-drop';
import {NtkDragRef} from './drag-ref';
import {NtkDragHandle} from './drag-handle';
import {NTK_DRAG_PARENT} from './drag-drop.model';

@Directive({
    selector: '[ntkDrag]',
    exportAs: 'ntkDrag',
    host: {
        class: 'cdk-drag ntk-drag',
        '[class.cdk-drag-disabled]': 'disabled',
        '[class.cdk-drag-dragging]': 'dragRef.isDragging()'
    },
    providers: [{provide: NTK_DRAG_PARENT, useExisting: NtkDrag}]
})
export class NtkDrag<T = any> extends CdkDrag<T> {
    @Input() dragStart;
    @ContentChildren(NtkDragHandle) _handles: QueryList<NtkDragHandle>;

    get dragRef(): NtkDragRef {
        return <any>this['_dragRef'];
    }

    get preview(): HTMLElement {
        return $('.cdk-drag-preview')[0];
    }
}
