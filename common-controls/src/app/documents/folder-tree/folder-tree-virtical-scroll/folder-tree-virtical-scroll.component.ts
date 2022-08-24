import { Component, OnInit } from '@angular/core';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';


@Component({
  selector: 'ntk-folder-tree-virtical-scroll',
  templateUrl: './folder-tree-virtical-scroll.component.html',
  styleUrls: ['./folder-tree-virtical-scroll.component.scss'],
  host: {
    '[class.horizontal]': 'horizontal',
    '[class.vertical]': '!horizontal',
    '[class.selfScroll]': '!parentScroll',
    '[class.rtl]': 'RTL'
  }
})
export class FolderTreeVirticalScrollComponent extends VirtualScrollerComponent implements OnInit {
  getViewPort() {
      return this.calculateViewport();
  }

  getZone() {
      return this.zone;
  }
}
