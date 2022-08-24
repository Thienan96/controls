import { Component, Input } from '@angular/core';

@Component({
  selector: 'ntk-folder-tree-indent',
  templateUrl: './folder-tree-indent.component.html',
  styleUrls: ['./folder-tree-indent.component.scss']
})
export class FolderTreeIndentComponent {

  @Input('offset-height') offsetHeight = 0;
  @Input('level-folder') levelFolder = 1;
  ruleMiddleLine: any;


  // @Input('level-offset') offset = 20;

  @Input('indent-lines') middleLines: any[] = [false];

  @Input() height;
  constructor() { }
}
