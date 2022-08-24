import {Directive, ElementRef, Inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ExpandableComponent} from '../expandable/expandable.component';
import {NTK_EXPANDABLE} from './expandable.model';


interface IDragOptions {
    zIndex: number;
    revert: boolean;
    helper: string;
    appendTo: string;
    refreshPositions?: boolean;
    draggingClass?: string;
    draggingHelperClass?: string;
    scroll: boolean;
    revertDuration: number;
    start: any;
    stop: any;
    scrollParent?: any;
}

@Directive({
    selector: '[expandableDrag]'
})
export class ExpandableDragDirective implements OnInit, OnChanges {
    @Input() draggableData;
    @Input() draggableDisabled;
    private $element: JQuery;
    private options: IDragOptions = {
        zIndex: 100,
        revert: false,
        helper: 'clone',
        appendTo: 'body',
        scroll: false,
        revertDuration: 500,
        start: this.onDragStart.bind(this),
        stop: this.onDragStop.bind(this)
    };

    constructor(private elementRef: ElementRef,
                @Inject(NTK_EXPANDABLE) protected expandableComponent: ExpandableComponent) {
    }

    ngOnInit() {
        // Setup element to bind draggable
        this.$element = $(this.elementRef.nativeElement);
        this.options.scrollParent = this.expandableComponent.$element.find(`.scrollbar`)[0];
        this.$element[`draggable`](this.options);
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.draggableDisabled && !changes.draggableDisabled.isFirstChange()) {
            this.draggableInstance.option(`disabled`, changes.draggableDisabled.currentValue);
        }
    }

    private onDragStart(event, ui) {
        this.expandableComponent.currentDragItem = ui.helper;
        // Remove dragging class
        this.$element.addClass(this.options.draggingClass);

        // Remove helper class
        this.draggableInstance.helper.addClass(this.options.draggingHelperClass);


        let helpHelper = ui.helper;
        helpHelper.data('draggable-data', this.draggableData); // Data of draggable
        helpHelper.data('draggable-options', this.options); // options of draggable
        helpHelper.data('dropped', 0); // Indicate not yet dropped to cancel drag if user drag outsize zone
        helpHelper.data('draggableOnStop', () => {
            this._draggableOnStop();
        });
        helpHelper.data('revert', () => {
            this.revert(() => {
                this._draggableOnStop();
            });
        });
    }

    private onDragStop(event, ui) {
        // Remove dragging class
        this.$element.removeClass(this.options.draggingClass);

        // Remove helper class
        if (this.draggableInstance && this.draggableInstance.helper) {
            this.draggableInstance.helper.removeClass(this.options.draggingHelperClass);
        }

        let helpHelper = ui.helper;
        if (helpHelper.data('dropped') === 0) {
            this.revert(() => {
                this._draggableOnStop();
            });
        }
        return false;
    }


    get draggableInstance() {
        return this.$element[`draggable`]('instance');
    }


    /**
     * Revert drag
     * @param callback
     */
    private revert(callback) {
        if (!this.draggableInstance._trigger('revertOnStart')) {
            return false;
        }
        let $element = this.$element,
            originalPosition = $element.offset(),
            options = this.options,
            helper = this.draggableInstance.helper;

        // Only hide if origin element is not exist
        if (!$element.data('uiDraggable')) {
            helper.fadeOut(options.revertDuration, () => {
                this.draggableInstance._trigger('revertOnStop');
                if (callback) {
                    callback();
                }
            });
        } else {
            let aniProperties: any = {
                left: originalPosition.left,
                top: originalPosition.top
            };
            helper.animate(aniProperties, options.revertDuration, () => {
                this.draggableInstance._trigger('revertOnStop');
                if (callback) {
                    callback();
                }
            });
        }
    }

    private _draggableOnStop() {
        this.draggableInstance._trigger('draggableOnStop');

        // clear helper of draggable
        this.draggableInstance._clear();
    }
}
