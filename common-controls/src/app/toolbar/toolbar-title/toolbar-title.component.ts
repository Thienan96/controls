import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'ntk-toolbar-title',
    templateUrl: './toolbar-title.component.html',
    styleUrls: ['./toolbar-title.component.css'],
    host: {
        class: 'ntk-toolbar-title'
    }
})
export class ToolbarTitleComponent {
    @Input() title: string;
    @Input() titlePrefixKey: string;
    @Input() titleMinWidth: number;
    @Output() titleClicked = new EventEmitter();


    onTitleClicked() {
        this.titleClicked.emit();
    }

}
