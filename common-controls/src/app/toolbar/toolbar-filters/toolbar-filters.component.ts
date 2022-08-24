import {Component, ContentChildren, QueryList} from '@angular/core';
import {ToolbarFiltersItemComponent} from '../toolbar-filters-item/toolbar-filters-item.component';

@Component({
    selector: 'ntk-toolbar-filters',
    template: ''
})
export class ToolbarFiltersComponent {
    @ContentChildren(ToolbarFiltersItemComponent) public items: QueryList<ToolbarFiltersItemComponent>;
}
