import {Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {IResourcePlanningDraggableEventUIParam} from '../shared/resource-planning.model';

@Component({
    selector: 'ntk-resource-planning-draggable',
    template: '<ng-content></ng-content>'
})
export class ResourcePlanningDraggableComponent implements OnInit, OnDestroy, OnChanges {
    @Input() options;
    @Input() data;
    @Input() canDragStart: any;
    @Input() disabled = false;
    @Output() dragStart: EventEmitter<any> = new EventEmitter();
    @Output() dragStop: EventEmitter<any> = new EventEmitter();
    events = {
        keydown: 'keydown.ntkResDraggable',
        keyup: 'keyup.ntkResDraggable'
    };
    private $element: JQuery;
    private instance: any;
    private config = {
        zIndex: 100,
        reversionZIndex: true,
        revert: false,
        helper: 'clone',
        appendTo: 'body',
        refreshPositions: true,
        draggingHelperClass: 'resource-planning-draggable-helper',
        ctrlKeyClass: 'hasCtrlKey',
        altKeyClass: 'hasAltKey',
        centerHandle: true, // cursor be center when drag
        scroll: false,
        revertDuration: 500,
        $element: null,
        xCenterHandle: false,
        fitness: false,
        start: this.onDragStart.bind(this),
        stop: (ev, ui) => {
            return this.onDragStop(ui);
        },
        drag: this.onDrag.bind(this)
    };

    constructor(elementRef: ElementRef, private zone: NgZone) {
        this.$element = $(elementRef.nativeElement);
    }

    ngOnInit() {
        // Setup option
        Object.assign(this.config, this.options);

        this.$element = this.config.$element || this.$element;

        this.zone.runOutsideAngular(() => {
            // Setup draggable
            this.$element['draggable'](this.config);
            this.instance = this.getInstance();
            this.instance.option('disabled', this.disabled);
        });


    }

    ngOnDestroy() {
        if (this.$element.data('ui-draggable')) {
            this.$element['draggable']('destroy');
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.disabled && !changes.disabled.isFirstChange()) {
            this.getInstance().option('disabled', changes.disabled.currentValue);
        }
    }

    /**
     * Start drag
     * @param {MouseEvent} ev
     * @param {IResourcePlanningDraggableEventUIParam} ui
     * @returns {boolean}
     */
    private onDragStart(ev: MouseEvent, ui: IResourcePlanningDraggableEventUIParam) {
        ui.helper.data('dropped', false);
        if (this.data) {
            ui.helper.data('data', this.data);
        }


        ui.helper.data('draggableOnStop', this.draggableOnStop.bind(this));

        // Revert
        ui.helper.data('revert', () => {
            this.revert(() => {
                this.draggableOnStop();
            });
        });

        if (this.canDragStart) {
            let result = this.canDragStart({event: ev, ui: ui, data: this.data});
            if (!result) {
                return false;
            }
        }

        this.dragStart.emit({
            event: ev,
            ui: ui,
            data: this.data
        });

        this.onStart(ev, ui);

        if (this.config.centerHandle) {
            this.instance.offset.click = {
                left: Math.floor(ui.helper.width() / 2),
                top: Math.floor(ui.helper.height() / 2)
            };
        }
        if (this.config.xCenterHandle) {
            this.instance.offset.click.left = Math.floor(ui.helper.width() / 2);
        }
    }

    /**
     * Stop drag
     * @param {IResourcePlanningDraggableEventUIParam} ui
     * @returns {boolean}
     */
    private onDragStop(ui: IResourcePlanningDraggableEventUIParam) {
        if (ui.helper && !ui.helper.data('dropped')) {
            this.revert(() => {
                this.draggableOnStop();
            });
        }
        return false;
    }

    /**
     * When drag
     * @param {MouseEvent} event
     * @param {IResourcePlanningDraggableEventUIParam} ui
     * @returns {any}
     */
    private onDrag(event: MouseEvent, ui: IResourcePlanningDraggableEventUIParam) {
        let key = ui.helper.data('droppable-id'),
            elDroppable = ui.helper.data(key);
        if (key && elDroppable) {
            let droppableOptions = elDroppable.data('droppable-options');
            if (droppableOptions) {
                if (droppableOptions.drag) {
                    return droppableOptions.drag(event, ui);
                }
            }
        }
    }

    /**
     * Set CtrlKey
     * @param {boolean} ctrlKey
     * @param ui
     */
    private setCtrlKey(ctrlKey: boolean, ui) {
        // Save key
        ui.helper.data('ctrlKey', ctrlKey);

        // Add|Remove class
        let ctrlKeyClass = this.config.ctrlKeyClass;
        if (ctrlKey) {
            ui.helper.addClass(ctrlKeyClass);
            this.$element.addClass(ctrlKeyClass);
        } else {
            ui.helper.removeClass(ctrlKeyClass);
            this.$element.removeClass(ctrlKeyClass);
        }
    }

    private setAltKey(altKey: boolean, ui) {
        // Save key
        ui.helper.data('altKey', altKey);

        // Add|Remove class
        let altKeyClass = this.config.altKeyClass;
        if (altKey) {
            ui.helper.addClass(altKeyClass);
            this.$element.addClass(altKeyClass);
        } else {
            ui.helper.removeClass(altKeyClass);
            this.$element.removeClass(altKeyClass);
        }
    }

    private onStart(event: MouseEvent, ui) {
        this.setCtrlKey(event.ctrlKey || event.metaKey, ui);
        this.setAltKey(event.altKey, ui);


        $(window).off(this.events.keydown).on(this.events.keydown, (ev) => {
            this.setCtrlKey(ev.ctrlKey || ev.metaKey, ui);
            this.setAltKey(ev.altKey, ui);

            if (ev['keyCode'] === 27) {
                if (this.instance.helper) {
                    let key = this.instance.helper.data('droppable-id');
                    let elDroppable = this.instance.helper.data(key);
                    if (elDroppable && key) {
                        elDroppable.removeClass('ui-droppable-hover');
                        $('.ui-draggable-line-top,.ui-draggable-line-bottom', elDroppable).removeClass('ui-draggable-line-top ui-draggable-line-bottom');

                        // hide holder for ts-summary
                        elDroppable.find('.draggable-placeholder').hide();
                    }
                    this.instance.helper.data('canceled', 1);
                }
                // Cancel Drag
                if (ui.helper.is('.ui-draggable-dragging')) {
                    this.instance._mouseUp(new $.Event('mouseup', {target: this.instance.element[0]}));
                } else {
                    this.revert(() => {
                        this.instance._clear();
                    });
                }
            }
        });
        $(window).off(this.events.keyup).on(this.events.keyup, (ev) => {
            this.setCtrlKey(ev.ctrlKey || ev.metaKey, ui);
            this.setAltKey(ev.altKey, ui);
        });
        this.instance.helper.addClass(this.config.draggingHelperClass);

    }

    /**
     * Revert helper
     * @param callback
     * @returns {boolean}
     */
    private revert(callback) {
        if (this.instance._trigger('revertOnStart') === false) {
            callback();
            return false;
        }


        let $element = this.$element,
            originalPosition = $element.offset(),
            options = this.config,
            helper = this.instance.helper;

        // Only hide if origin element is not exist
        if (!$element.data('uiDraggable')) {
            helper.fadeOut(options.revertDuration, () => {
                this.instance._trigger('revertOnStop');
                if (callback) {
                    callback();
                }
            });
        } else {
            let aniProperties = {
                left: originalPosition.left,
                top: originalPosition.top
            };
            if (this.config.fitness) {
                if ($element.width() > 0) {
                    aniProperties['width'] = $element.width();
                }
            }
            helper.animate(aniProperties, options.revertDuration, () => {
                this.instance._trigger('revertOnStop');
                if (callback) {
                    callback();
                }

            });
        }
    }

    /**
     * Reset control
     */
    private reset() {
        $(window).off(this.events.keydown);
        $(window).off(this.events.keyup);

        // remove class if keys is pressed
        this.$element.removeClass(this.config.ctrlKeyClass);
        this.$element.removeClass(this.config.altKeyClass);

        if (this.instance.helper) {
            this.instance.helper.removeClass(this.config.draggingHelperClass);
        }
    }

    private draggableOnStop() {
        this.reset();

        // call draggableOnStop
        this.dragStop.emit({
            helper: this.instance.helper,
            data: this.data
        });

        this.instance._trigger('draggableOnStop');

        // clear helper of draggable
        this.instance._clear();
    }

    private getInstance() {
        return this.$element['draggable']('instance');
    }
}
