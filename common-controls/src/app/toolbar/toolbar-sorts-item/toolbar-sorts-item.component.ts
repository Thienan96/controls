import {Component, Input} from '@angular/core';

@Component({
    selector: 'ntk-toolbar-sorts-item',
    template: ''
})
export class ToolbarSortsItemComponent {
    @Input() public columnName: string;
    @Input('selected') public isSelected = false;
    @Input() public translateKey: string;
    @Input() public order: string;

    constructor() {
    }
}
