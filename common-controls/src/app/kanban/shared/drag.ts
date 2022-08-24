import {Directive, Input} from '@angular/core';
import {CdkDrag} from '@angular/cdk/drag-drop';
import {KanbanItem} from './kanban.model';
import {KanbanDragRef} from './drag-ref';

@Directive({
    selector: '[kanbanDrag]',
    exportAs: 'kanbanDrag',
    host: {
        class: 'cdk-drag kanban-drag',
        '[class.cdk-drag-disabled]': 'disabled',
        '[class.cdk-drag-dragging]': 'dragRef.isDragging()'
    }
})
export class KanbanDrag extends CdkDrag<KanbanItem> {
    @Input() dragStart;

    get dragRef(): KanbanDragRef {
        return <KanbanDragRef> this['_dragRef'];
    }
}
