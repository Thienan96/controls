import {Directive, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {DatatableComponent} from '../datatable/datatable.component';

@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[ntk-datatable-drag]'
})
export class DatatableDragDirective implements OnInit, OnDestroy {
    @Input() datatable: DatatableComponent;
    threshold = 5;

    constructor(private elementRef: ElementRef) {
    }

    ngOnInit() {
        let $window = $(window);
        let element = $(this.elementRef.nativeElement);
        element.on('touchstart.ntkDrag', (startEvent: any) => {
            startEvent = startEvent.originalEvent.touches[0];
            let direction: string,
                distanceX = 0,
                distanceY = 0,
                dragging = false,
                $event;
            $window.on('touchmove.ntkDrag', (moveEvent: any) => {
                moveEvent = moveEvent.originalEvent.touches[0];
                distanceX = moveEvent.clientX - startEvent.clientX;
                distanceY = moveEvent.clientY - startEvent.clientY;
                if (!direction) {
                    if (Math.abs(distanceX) >= this.threshold || Math.abs(distanceY) >= this.threshold) {
                        if (Math.abs(distanceX) > Math.abs(distanceY)) {
                            direction = 'left-right';
                        } else {
                            direction = 'top-bottom';
                        }
                    }
                }
                if (direction === 'left-right') {
                    if (!dragging) { // Drag start
                        dragging = true;
                        $event = {
                            left: distanceX,
                            eventType: 'dragStart'
                        };
                    } else { // Drag move
                        $event = {
                            left: distanceX,
                            eventType: 'dragMove'
                        };
                    }

                    this.onDrag($event);


                }
            });
            $window.on('touchend.ntkDrag', () => {
                if (direction === 'left-right') {
                    let ev = {
                        left: distanceX,
                        eventType: 'dragEnd'
                    };
                    this.onDrag(ev);
                }
                $window.off('touchmove.ntkDrag');
                $window.off('touchend.ntkDrag');
            });
        });

    }

    ngOnDestroy() {
        $(this.elementRef.nativeElement).off('touchstart.ntkDrag');
    }

    onDrag(ev) {
        this.datatable.onDrag(ev);
    }
}
