import {Component, ViewChild} from '@angular/core';
import {NtkTooltipDirective} from '../../../shared/directives/ntk-tooltip.directive';
import {ConnectedPosition} from '@angular/cdk/overlay';


@Component({
    selector: 'ntk-demo-tooltip',
    templateUrl: './tooltip.component.html'
})
export class TooltipComponent {
    @ViewChild('customTooltip', { static: false }) customTooltip: NtkTooltipDirective;

    XSS = `<br>Test EJ4-2117:\r\nnewline <b>{Test_EJ4-2117}</b><br> <script>alert(\'Hello\');</script>`;

    // XSS= 'hello';
    public defaultPosition: ConnectedPosition[] = [
        {
            offsetX: 0,
            offsetY: 0,
            originX: 'end',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top'
        },
        {
            offsetX: 0,
            offsetY: 0,
            originX: 'end',
            originY: 'center',
            overlayX: 'start',
            overlayY: 'top'
        }
    ];

    hideTooltip() {
        if (this.customTooltip) {
            this.customTooltip.hide();
        }
    }
}
