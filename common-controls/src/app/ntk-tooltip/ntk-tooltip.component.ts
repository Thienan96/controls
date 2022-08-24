import { Component, Input, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'ntk-tooltip',
  templateUrl: './ntk-tooltip.component.html',
  styleUrls: ['./ntk-tooltip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(300, style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate(300, style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class NtkTooltipComponent {
  @Input() template: TemplateRef<any>;
  @Input() text = '';

}
