import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ntk-tree-indent',
  templateUrl: './tree-indent.component.html',
  styleUrls: ['./tree-indent.component.scss']
})
export class TreeIndentComponent implements OnInit {

  @Input('offset-height') offsetHeight = 0;
  

  // @Input('level-offset') offset = 20;

  @Input('indent-lines') middleLines: boolean[] = [];

  @Input() height = 30;

  // use for change default padding left of indent
  @Input() buffer = 0;


  constructor() { }

  ngOnInit() {
  }

}
