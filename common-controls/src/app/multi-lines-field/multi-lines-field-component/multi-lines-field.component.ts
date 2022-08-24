import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ntk-multi-lines-field',
  templateUrl: './multi-lines-field.component.html',
  styleUrls: ['./multi-lines-field.component.css']
})
export class MultiLinesFieldComponent implements OnInit {

  @Input() captionKey: string;

  @Input() value: string;

  @Input() skipTranslation: boolean = false;

  @Input() textFieldClass: string = '';

  constructor() { }

  ngOnInit() {
  }

}
