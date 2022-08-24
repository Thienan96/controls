import {VirtualScrollerComponent} from 'ngx-virtual-scroller';
import {Component} from '@angular/core';

@Component({
    selector: 'ntk-virtual-scroll',
    templateUrl: './virtual-scroll.component.html',
    styleUrls: ['./virtual-scroll.component.scss'],
    host: {
        '[class.horizontal]': 'horizontal',
        '[class.vertical]': '!horizontal',
        '[class.selfScroll]': '!parentScroll',
        '[class.rtl]': 'RTL'
    }
})
export class DatatableVirtualScrollComponent extends VirtualScrollerComponent {
    getViewPort() {
        return this.calculateViewport();
    }

    getZone() {
        return this.zone;
    }

    refreshScroll(itemsArrayModified: boolean, refreshCompletedCallback , maxRunTimes: number = 2) {
        this.refresh_internal(itemsArrayModified, refreshCompletedCallback, maxRunTimes);
    }
}
