import {Component, ContentChildren, QueryList} from '@angular/core';
import {ToolbarLayoutsItemComponent} from '../toolbar-layouts-item/toolbar-layouts-item.component';

@Component({
    selector: 'ntk-toolbar-layouts',
    template: ''
})
export class ToolbarLayoutsComponent {
    @ContentChildren(ToolbarLayoutsItemComponent) public items: QueryList<ToolbarLayoutsItemComponent>;
}
