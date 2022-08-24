import {Directive, ElementRef, Inject} from '@angular/core';
import {NTK_DRAG_PARENT} from './drag-drop.model';
import {CdkDragHandle} from '@angular/cdk/drag-drop';


@Directive({
    selector: '[ntkDragHandle]',
    host: {
        class: 'cdk-drag-handle ntk-drag-handle'
    }
})
export class NtkDragHandle extends CdkDragHandle {
    constructor(element: ElementRef, @Inject(NTK_DRAG_PARENT) parentDrag: any) {
        super(element, parentDrag);
    }
}
