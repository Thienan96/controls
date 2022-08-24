import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {ToolbarComponent} from '../toolbar.component';

@Component({
    selector: 'ntk-history-toolbar',
    templateUrl: './history-toolbar.component.html',
    styleUrls: ['./history-toolbar.component.scss']
})

export class HistoryToolbarComponent extends ToolbarComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() showCopy = true;
    @Input() canCopy = true;

    @Output('onCopyDataClick') onCopyDataClick: EventEmitter<void> = new EventEmitter();
    @Output('onCloseClick') onCloseClick: EventEmitter<void> = new EventEmitter();


}
