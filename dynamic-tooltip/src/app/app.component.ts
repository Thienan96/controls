import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, ViewChild } from '@angular/core';
import { TooltipDirective } from './tooltip/tooltip.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dynamic-tooltip';
  @ViewChild('customTooltip', { static: false }) customTooltip!: TooltipDirective;

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
