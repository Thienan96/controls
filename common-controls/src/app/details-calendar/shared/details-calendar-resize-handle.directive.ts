import {ResizeHandleDirective} from 'angular-resizable-element';
import {Directive, ElementRef, NgZone, Optional, Renderer2} from '@angular/core';
import {DetailsCalendarResizableDirective} from './details-calendar-resizable.directive';

@Directive({
    selector: '[detailsCalendarResizeHandle]'
})
export class DetailsCalendarResizeHandleDirective extends ResizeHandleDirective {
    constructor(renderer: Renderer2,
                element: ElementRef,
                zone: NgZone,
                @Optional()  resizable: DetailsCalendarResizableDirective) {
        super(renderer, element, zone, resizable);
    }
}
