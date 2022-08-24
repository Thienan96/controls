import {Component, Input} from '@angular/core';

@Component({
    selector: 'ntk-toolbar-layouts-item',
    template: ''
})
export class ToolbarLayoutsItemComponent {
    @Input() public value: string;
    @Input() public translateKey: string;
}
