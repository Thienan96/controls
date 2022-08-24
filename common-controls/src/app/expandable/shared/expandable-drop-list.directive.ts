import {Directive, ElementRef, Inject, Input, OnInit} from '@angular/core';
import * as _ from 'underscore';
import {ExpandableItemWrapper, IExpandableDropPosition, CheckListItemWrapper, NTK_EXPANDABLE} from './expandable.model';
import {ExpandableComponent} from '../expandable/expandable.component';


@Directive({
    selector: '[expandableDropList]'
})
export class ExpandableDropListDirective implements OnInit {
    options = {
        tolerance: 'pointer',
        items: '> *',
        sortable: true,
        placeholder: false,
        disabled: false,
        drop: (event, ui) => {
            // Hide on indicate lines
            $(event.target).find('.indicate-line').hide();


            // cancel if esc key is pressed
            if (ui.helper.data('canceled') === 1) {
                this.revert(ui);
                return;
            }

            // Drag is dropped
            ui.helper.data('dropped', 1);

            let currentDragging: CheckListItemWrapper = ui.helper.data('draggable-data'),
                target = this.droppableData,
                dropZone = this.expandableComponent.checkCanDropTo(currentDragging, target),
                dropPosition: IExpandableDropPosition = this.position;

            if (dropZone.indexOf(dropPosition) === -1) {
                this.animateBack(ui);
                event.preventDefault();
                return;
            } else {
                this.expandableComponent.moveItem(currentDragging, target, dropPosition);
                setTimeout(() => {
                    this.draggableOnStop(ui);
                }, 100);
            }
        },
        // Show indicate line
        over: (event, ui) => {
            let currentDragging: ExpandableItemWrapper = ui.helper.data('draggable-data'),
                target: ExpandableItemWrapper = this.droppableData,
                dropZone = this.expandableComponent.checkCanDropTo(currentDragging, target),
                dropPosition = this.position;
            if (dropZone.indexOf(dropPosition) === -1) {
                event.preventDefault();
                return;
            } else {
                $(event.target).find('.indicate-line').show();
            }
        },
        // Hide indicate line
        out: (event) => {
            $(event.target).find('.indicate-line').hide();
        }
    };
    @Input() droppableOnDrop;
    @Input() droppableData: CheckListItemWrapper;
    @Input() position;
    $element: JQuery;
    controlId: string;

    constructor(private elementRef: ElementRef,
                @Inject(NTK_EXPANDABLE) protected expandableComponent: ExpandableComponent) {
        this.$element = $(elementRef.nativeElement);
        this.controlId = _.uniqueId('droppable-');
    }

    ngOnInit() {
        this.$element[`droppable`](this.options);
    }

    private revert(ui) {
        ui.helper.data('revert')();
    }

    private draggableOnStop(ui) {
        if (ui.helper.data('draggableOnStop')) {
            ui.helper.data('draggableOnStop')();
        }
    }


    private animateBack(ui: any) {
        // animation to go back when fail
        let originalPosition = ui.draggable.data('uiDraggable').originalPosition;

        ui.helper.animate({
            left: originalPosition.left,
            top: originalPosition.top,
            zIndex: 200
        }, 500, () => {
            this.draggableOnStop(ui);
        });
    }
}
