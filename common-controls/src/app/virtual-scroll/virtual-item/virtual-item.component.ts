import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ntk-virtual-item',
  templateUrl: './virtual-item.component.html'
})
export class VirtualItemComponent implements OnInit {
  @Input() sticky: boolean;
  constructor() { }

  ngOnInit() {
  }
}
