import {Directive, OnInit} from '@angular/core';
import {DragScrollDirective} from '../../shared/directives/drag-scroll.directive';
import {NTK_DETAILS_CALENDARDAY} from './models/details-calendar.model';
import {NtkDrag} from '../../drag-drop/drag';

@Directive({
    selector: '[detailsCalendarDragScroll]',
    exportAs: 'detailsCalendarDragScroll'
})
export class DetailsCalendarDragScrollDirective extends DragScrollDirective implements OnInit {
    ngOnInit() {
        let detailsCalendarComponent: any = this.injector.get(NTK_DETAILS_CALENDARDAY, null);
        if (detailsCalendarComponent) {
            this.scrollContainer = detailsCalendarComponent.scroller;
        }
        this.drag = this.injector.get(NtkDrag, null);
        super.ngOnInit();
    }
}
