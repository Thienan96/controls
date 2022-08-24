import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    TemplateRef
} from '@angular/core';
import {KanbanColumn, KanbanGroup} from '../shared/kanban.model';

@Component({
    selector: 'ntk-kanban-group',
    templateUrl: './kanban-group.component.html',
    styleUrls: ['./kanban-group.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanGroupComponent implements OnChanges {
    @Input() group: KanbanGroup;
    @Input() columns: KanbanColumn[];
    @Input() itemClick;
    @Input() moved;
    @Input() scrollContainer: HTMLElement;
    @Input() dragStart;
    @Input() dragEnd;
    @Input() showGroupTitle = true;
    @Input() availableDropColumns: KanbanColumn[];
    itemTemplate: TemplateRef<any>;

    constructor(private elementRef: ElementRef) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.group) {
            $(this.elementRef.nativeElement).data('group', changes.group.currentValue);
        }
    }

    trackByColumn(index: number, column: KanbanColumn) {
        let uniq = column.Id + column.Name;
        return uniq ? uniq : index;
    }
}
