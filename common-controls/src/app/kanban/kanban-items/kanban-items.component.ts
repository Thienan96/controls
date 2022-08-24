import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, TemplateRef} from '@angular/core';
import {KanbanColumn, KanbanGroup, KanbanItem} from '../shared/kanban.model';
import {CdkDragStart, DragDrop, DragDropRegistry, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {KanbanDragDrop} from '../shared/drag-drop';
import {KanbanDragDropRegistry} from '../shared/drag-drop.registry';
import {DragDropService} from '../shared/drag-drop.service';

@Component({
    selector: 'ntk-kanban-items',
    templateUrl: './kanban-items.component.html',
    styleUrls: ['./kanban-items.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: DragDropRegistry,
            useExisting: KanbanDragDropRegistry
        },
        {
            provide: DragDrop,
            useExisting: DragDropService
        }
    ]
})
export class KanbanItemsComponent implements OnChanges {
    @Input() itemTemplate: TemplateRef<any>;
    @Input() itemClick;
    @Input() column: KanbanColumn;
    @Input() moved;
    @Input() scrollContainer: HTMLElement;
    @Input() dragStart;
    @Input() dragEnd;
    @Input() group: KanbanGroup;
    @Input() availableDropColumns: KanbanColumn[];
    canSort: boolean;
    canDrop: boolean;


    ngOnChanges(changes: SimpleChanges) {
        if (changes.availableDropColumns) {
            this.updateStates();
        }
    }

    onDropListEnterPredicate() {
        return this.canDrop;
    }

    onMove(event: KanbanDragDrop) {
        if (this.moved) {
            this.moved(event);
        } else {
            if (event.previousContainer.id === event.container.id) {
                moveItemInArray(event.container.items, event.previousIndex, event.currentIndex);
            } else {
                transferArrayItem(event.previousContainer.items, event.container.items, event.previousIndex, event.currentIndex);
            }
            event.subscriber.next();
            event.subscriber.complete();
        }
    }

    trackByItem(index, item: KanbanItem) {
        return item.Id ? item.Id : index;
    }


    onDragEnd(ev: CdkDragStart) {
        this.dragEnd(ev);
    }

    private updateStates() {
        this.canSort = this.checkSort();
        this.canDrop = this.checkDrop();
    }

    private checkSort() {
        return this.availableDropColumns.indexOf(this.column) !== -1;
    }

    private checkDrop() {
        return this.availableDropColumns.indexOf(this.column) !== -1;
    }
}
