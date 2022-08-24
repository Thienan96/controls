import {ResizeHandleDirective} from 'angular-resizable-element';
import {Directive, ElementRef, NgZone, Optional, Renderer2} from '@angular/core';
import {WeekTsEventResizableDirective} from './week-ts-event-resizable.directive';

@Directive({
    selector: '[ntkWeekTsResizeHandle]'
})
export class WeekTsResizeHandleDirective extends ResizeHandleDirective {
    constructor(renderer: Renderer2,
                element: ElementRef,
                zone: NgZone,
                @Optional()  resizable: WeekTsEventResizableDirective) {
        super(renderer, element, zone, resizable);
    }
}
