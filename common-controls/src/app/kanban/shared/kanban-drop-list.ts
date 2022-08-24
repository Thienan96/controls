import {CdkDropList} from '@angular/cdk/drag-drop';
import {ContentChildren, Directive, EventEmitter, Input, Output, QueryList} from '@angular/core';
import {KanbanDrag} from './drag';
import {KanbanColumn, KanbanGroup} from './kanban.model';

@Directive({
    selector: '[kanbanDropList], kanban-drop-list',
    exportAs: 'kanbanDropList',
    host: {
        class: 'cdk-drop-list kanban-drop-list',
        '[id]': 'id',
        '[class.cdk-drop-list-disabled]': 'disabled',
        '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()', // current drop
        '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
        '[class.cdk-drop-list-disabled-drop]': '!canDrop',
        '[class.cdk-drop-list-disabled-sort]': '!canSort'
    }
})
export class KanbanDropList extends CdkDropList<KanbanColumn> {
    @Input('kanbanCanDrop') canDrop = true;
    @Input('kanbanCanSort') canSort = true;
    @Input('kanbanGroup') group: KanbanGroup;
    @Output() kanbanDropListMoved = new EventEmitter();
    @ContentChildren(KanbanDrag) _draggables: QueryList<KanbanDrag>; // overwrite _draggables
}
