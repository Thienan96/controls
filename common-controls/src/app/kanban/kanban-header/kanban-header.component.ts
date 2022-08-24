import {Component, Input} from '@angular/core';
import {KanbanColumn, KanbanGroup} from '../shared/kanban.model';

@Component({
    selector: 'ntk-kanban-header',
    templateUrl: './kanban-header.component.html',
    styleUrls: ['./kanban-header.component.scss']
})
export class KanbanHeaderComponent {
    @Input() columns: KanbanColumn[] = [];
    @Input() showGroupTitle: boolean;
    @Input() currentGroup: KanbanGroup;

    trackByColumn(index: number, column: KanbanColumn) {
        let uniq = column.Id + column.Name;
        return uniq ? uniq : index;
    }
}
