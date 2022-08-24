import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ContentChild, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef } from '@angular/core';

@Component({
  selector: 'ntk-expansion-item',
  templateUrl: './expansion-item.component.html',
  styleUrls: ['./expansion-item.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('show', style({
        overflow: 'hidden',
        height: '*',
      })),
      state('hide', style({
        overflow: 'hidden',
        height: '0px',
      })),
      transition('show => hide', animate('400ms ease-in-out')),
      transition('hide => show', animate('400ms ease-in-out'))
    ])
  ]
})
export class ExpansionItemComponent {
  @ContentChild('headerPanelTemplate', { static: false }) headerPanelTemplate: TemplateRef<any>;
  @ContentChild('panelTemplate', { static: false }) panelTemplate: TemplateRef<any>;
  @Input() expansionPanel = 'hide';
  @Input() line: any;
  @Output() headerClick = new EventEmitter();
  @Input() preventExpand = false;

  constructor() {
  }

  onHeaderClick() {
    if (!this.preventExpand) {
      this.headerClick.emit(this.line);
      this.expansionPanel = this.expansionPanel === 'hide' ? 'show' : 'hide';
    }
  }

  showPanel() {
    this.expansionPanel = this.expansionPanel === 'hide' ? 'show' : 'hide';
  }
}
