import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatatableColumn, DatatableGroup} from '../shared/datatable.model';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
    selector: 'ntk-datatable-groupby',
    templateUrl: './datatable-groupby.component.html',
    styleUrls: ['./datatable-groupby.component.scss']
})
export class DatatableGroupbyComponent {
    @Input() groups: DatatableGroup[] = [];
    @Input() columns: DatatableColumn[] = [];
    @Input() canRemoveFirstItem = false;
    @Output() groupChanged = new EventEmitter();

    onButtonClear(g: DatatableGroup) {
        let pos = this.groups.findIndex((group) => {
            return group.property === g.property;
        });
        if (pos !== -1) {
            this.groups.splice(pos, 1);
        }

        this.groupChanged.emit(this.groups);


    }

    onGroupClick(column: DatatableColumn, group: DatatableGroup) {
        let newGroup = new DatatableGroup({
            name: column.displayValue,
            property: column.property
        });
        if (group) {
            let groupIndex = this.groups.indexOf(group);
            this.groups.splice(groupIndex, 1, newGroup);
        } else {
            this.groups.push(newGroup);
        }
        this.groupChanged.emit(this.groups);
    }

    drop(event: CdkDragDrop<string[]>) {
        let group = this.groups[event.currentIndex];
        if (group && !group.readOnly) {
            if (event.previousIndex !== event.currentIndex) {
                moveItemInArray(this.groups, event.previousIndex, event.currentIndex);
                this.groupChanged.emit(this.groups);
            }

        }
    }
}
