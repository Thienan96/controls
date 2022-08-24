import {Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import * as _ from 'underscore';
import {Subject} from 'rxjs/Subject';
import {IResourcePlanningDroppableEventUIParam} from '../shared/resource-planning.model';

@Component({
    selector: 'ntk-resource-planning-droppable',
    template: '<ng-content></ng-content>'
})
export class ResourcePlanningDroppableComponent implements OnInit, OnChanges {
    @Input() disabled = false;
    @Input() data;
    @Input() options;
    @Output() drop = new EventEmitter();
    @Output() sort = new EventEmitter();

    private readonly $element: JQuery;
    private readonly id: string;
    private config = {
        tolerance: 'pointer',
        items: '> *',
        sortable: false,
        placeholder: '',
        fitness: false,
        create: this.onCreate.bind(this),
        drop: (ev, ui) => {
            return this.onDrop(ui);
        },
        over: (ev, ui) => {
            return this.onOver(ui);
        },
        out: (ev, ui) => {
            return this.onOut(ui);
        },
        drag: (ev, ui) => {
            return this.onDrag(ui);
        }

    };
    private resizableData = {
        events: [],
        handle: {
            height: 0,
            offset: {
                left: 0,
                top: 0
            }
        }
    };

    constructor(elementRef: ElementRef, private zone: NgZone) {
        this.$element = $(elementRef.nativeElement);
        this.id = _.uniqueId('droppable-');
    }

    ngOnInit() {
        Object.assign(this.config, this.options);

        this.zone.runOutsideAngular(() => {
            // Create droppable
            this.$element['droppable'](this.config);
            this.$element['droppable']('option', 'disabled', this.disabled);
        });

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.disabled && !changes.disabled.isFirstChange()) {
            this.getInstance().option('disabled', changes.disabled.currentValue);
        }
    }

    /**
     * Setup data when create droppable
     */
    private onCreate() {
        this.$element.data('droppable-data', this.data);
        this.$element.data('droppable-options', this.config);
    }

    private onDrop(ui: IResourcePlanningDroppableEventUIParam) {
        ui.helper.data('dropped', true);

        let subject = new Subject();
        subject.subscribe(() => {
            if (ui.helper.data('draggableOnStop')) {
                ui.helper.data('draggableOnStop')();
            }
        }, () => {
            // Revert if error
            ui.helper.data('revert')();
        });
        let data = ui.helper.data('data');
        this.drop.emit({
            data: data,
            observer: subject,
            ui: ui
        });
    }


    private onOver(ui: IResourcePlanningDroppableEventUIParam) {
        // Resize width when drag over
        if (this.config.fitness) {
            // Have to get instance of draggable from ddmanager
            let instanceDraggable = $['ui'].ddmanager.current;
            if (ui.helper.attr('resized') !== '1') {
                ui.helper.attr('resized', '1');
                ui.helper.data('click', {
                    left: instanceDraggable.offset.click.left / ui.helper.width(),
                    top: instanceDraggable.offset.click.top / ui.helper.height()
                });
            }
            let width = this.$element.width();
            ui.helper.css({
                width: width
            });
            if (ui.helper.attr('height')) {
                ui.helper.css({
                    height: ui.helper.attr('height')
                });
            }
            instanceDraggable.offset.click.left = ui.helper.data('click').left * width;
            // reset width height
            instanceDraggable._cacheHelperProportions();
        }

        if (this.config.sortable || this.config.placeholder) {
            ui.helper.data('droppable-id', this.id);
            ui.helper.data(this.id, this.$element);
        }

        // hide placeholder
        if (this.config.placeholder) {
            $(this.config.placeholder).hide();
        }

        // Prepare data to drag/drop faster
        this.resizableData.handle = {
            offset: ui.helper.offset(),
            height: ui.helper.height()
        };
        this.resizableData.events = [];
        this.getChildren().each((i, el: Element) => {
            let $el = $(el);
            this.resizableData.events.push({
                $el: $el,
                offset: $el.offset(),
                height: $el.height()
            });
        });
    }

    /**
     * Remove data, direction line when drag out droppable
     * @param {IResourcePlanningDroppableEventUIParam} ui
     */
    private onOut(ui: IResourcePlanningDroppableEventUIParam) {
        // remove data
        if (this.config.sortable || this.config.placeholder) {
            ui.helper.removeData(this.id);
        }

        // Remove line if is sortable
        if (this.config.sortable) {
            this.removeDirectionLine();
        }

        // hide placeholder
        if (this.config.placeholder) {
            $(this.config.placeholder).hide();
        }


        // Reset resizableData.events
        this.resizableData.events = [];
    }

    /**
     * Show direction line when dragging event
     * @param {IResourcePlanningDroppableEventUIParam} ui
     */
    private onDrag(ui: IResourcePlanningDroppableEventUIParam) {
        // Don't run if drop is disabled
        if (this.disabled) {
            return;
        }
        if (this.config.sortable) {
            let top = ui.offset.top + this.resizableData.handle.height / 2;
            this.showDirectionLine(top, this.resizableData.events);
        }
    }

    /**
     * Revert draggable
     * @param ui
     */
    private revert(ui) {
        ui.helper.data('revert')();
    }

    private getChildren() {
        return this.$element.find(this.config.items);
    }

    /**
     * Get index in els
     * @param {number} top
     * @param {any[]} events
     * @returns {number}
     */
    private getIndexInEls(top: number, events: any[]) {
        let index = -1;
        events.forEach((event, i) => {
            let os = event.offset,
                height = event.height,
                mid = os.top + height / 2;
            if (top >= os.top && top <= os.top + height) {
                if (top <= mid) {
                    index = i;
                } else {
                    index = i + 1;
                }
            }
        });
        if (index === -1) {
            if (events.length === 0) {
                index = 0;
            } else {
                let last = events[events.length - 1],
                    first = events[0];
                if (top >= last.offset.top) {
                    index = events.length;
                }
                if (top <= first.offset.top) {
                    index = 0;
                }
            }
        }
        return index;
    }

    /**
     * Show direction line
     * @param {number} top
     * @param items
     */
    private showDirectionLine(top: number, items) {
        if (items.length === 0) {
            return;
        }

        let index = this.getIndexInEls(top, items);

        // Remove all lines
        items.forEach((item: any) => {
            item.$el.removeClass('ui-draggable-line-top ui-draggable-line-bottom');
        });

        // Add line
        if (0 <= index && index <= items.length - 1) {
            items[index].$el.addClass('ui-draggable-line-top');
        }

        if (index >= items.length) {
            items[items.length - 1].$el.addClass('ui-draggable-line-bottom');
        }
    }

    /**
     * Remove direction line
     */
    private removeDirectionLine() {
        this.getChildren().removeClass('ui-draggable-line-top ui-draggable-line-bottom');
    }

    private draggableOnStop(ui) {
        if (ui.helper.data('draggableOnStop')) {
            ui.helper.data('draggableOnStop')();
        }
    }

    /**
     * Get droppable instance
     * @returns {any}
     */
    private getInstance() {
        return this.$element['droppable']('instance');
    }
}
