import {Component, Input} from '@angular/core';
import {ExpandableItemWrapper} from '../shared/expandable.model';


@Component({
    selector: 'ntk-expandable-item',
    templateUrl: './expandable-item.component.html',
    styleUrls: ['./expandable-item.component.scss'],
    host: {
        class: 'ntk-expandable-item'
    }
})
export class ExpandableItemComponent {
    @Input() level = 0;
    @Input() itemWrapper: ExpandableItemWrapper;
    @Input() isSelected = false;
    @Input() indent = 32;
    @Input() draggableDisabled;
    @Input() itemHeight;
}


@Component({
    selector: 'ntk-expandable-item-header',
    template: '<ng-content></ng-content>'
})
export class ExpandableItemHeaderComponent {
}


@Component({
    selector: 'ntk-expandable-item-content',
    template: '<ng-content></ng-content>'
})
export class ExpandableItemContentComponent {
}
