import {Component, Input} from '@angular/core';
import {IExpandableDropPosition, ExpandableItemWrapper} from '../shared/expandable.model';

@Component({
    selector: 'ntk-expandable-drop-zone',
    templateUrl: './expandable-drop-zone.component.html',
    styleUrls: ['./expandable-drop-zone.component.scss']
})
export class ExpandableDropZoneComponent {
    @Input() itemWrapper: ExpandableItemWrapper;
    @Input() level: number;
    @Input() indent: number;

    get DropPosition() {
        return IExpandableDropPosition;
    }
}
