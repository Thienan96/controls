import {Component, ContentChildren, QueryList} from '@angular/core';
import {ToolbarSortsItemComponent} from '../toolbar-sorts-item/toolbar-sorts-item.component';

@Component({
    selector: 'ntk-toolbar-sorts',
    template: ''
})
export class ToolbarSortsComponent {
    @ContentChildren(ToolbarSortsItemComponent) items: QueryList<ToolbarSortsItemComponent>;
}
