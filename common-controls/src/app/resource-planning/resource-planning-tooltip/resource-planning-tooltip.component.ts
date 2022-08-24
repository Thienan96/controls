import {
    Component,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from '@angular/core';

@Component({
    selector: 'ntk-resource-planning-tooltip',
    templateUrl: './resource-planning-tooltip.component.html',
    styleUrls: ['./resource-planning-tooltip.component.scss']
})
export class ResourcePlanningTooltipComponent implements OnInit, OnDestroy {
    @Input() content: string;
    @Input() options: any;
    @Input() canMouseEnterContent = false;
    @Input() getContent: any;
    @Input() handle: string;
    @Output() contentButtonClicked = new EventEmitter();
    @ViewChild('tooltipTemplate', {static: false}) tooltipTemplate: TemplateRef<any>;

    tooltipContent: string;
    config = {
        direction: 'current',
        container: 'parent',
        showDelay: 0,
        className: 'resource-planning-tooltip-container',
        hideDelay: 500,
        autoRun: false,
        $element: null,
        scroller: ''
    };
    private $element: JQuery;
    private container: JQuery;
    private tip: JQuery;
    private timer: any;
    private mouseTimer: any;
    private $event: any;

    constructor(private elementRef: ElementRef,
                private render2: Renderer2,
                private _viewContainerRef: ViewContainerRef) {

    }

    ngOnInit() {
        // Merge config
        Object.assign(this.config, this.options);

        // Setup $element
        if (this.config.$element) {
            this.$element = this.config.$element;
        }

        if (this.handle) {
            if (this.handle === 'parent') {
                this.$element = $(this.elementRef.nativeElement).parent();
            } else {
                this.$element = $(this.elementRef.nativeElement).parent().find(this.handle);
            }
        }

        if (!this.$element) {
            this.$element = $(this.elementRef.nativeElement);
        }


        this.bindEvents();

        // Show tooltip after 1000ms if autoRun is on
        if (this.config.autoRun) {
            this.start();
        }
    }

    ngOnDestroy() {
        this.destroy();
    }


    /**
     * Unbind listeners
     */
    unBindEvents() {
        let $element = this.$element;
        $element.off('mousemove');
        $element.off('mouseenter');
        $element.off('mouseleave');
        $element.off('hidetooltip');
    }

    /**
     * Clean tooltip
     */
    destroy() {
        clearTimeout(this.timer);
        clearTimeout(this.mouseTimer);
        this.unBindEvents();
        this.removeTooltip();
    }

    /**
     * Show tooltip: Create tooltip, compute position, show tooltip
     */
    show() {
        this.$element.addClass('tooltip-showing');
        // Create tooltip if is not exist
        if (!this.tip) {
            this.tip = this.createTooltip();
        }
        // Pause show tooltip if tip is removed
        if (!this.tip) {
            return;
        }

        // Fix flicker on IE
        this.tip.css({
            display: 'block',
            visibility: 'hidden'
        });

        let position = this.getPosition(this.$event);
        this.tip.offset(position);


        // Add scroller if height != auto
        this.tip.removeClass('hasScroll');
        if (position.height !== 'auto') {
            this.tip.addClass('hasScroll');

            this.tip.find('.tooltip-content').css({
                height: position.height
            });

            // Add event for tooltip
            this.tip.off('mouseenter').on('mouseenter', () => {
                clearTimeout(this.mouseTimer);
            });
            this.tip.off('mouseleave').on('mouseleave', () => {
                this.mouseTimer = setTimeout(() => {
                    this.hide();
                }, this.config.hideDelay);
            });
        }
        this.tip.find('.arrow').offset({left: position.rect.left + (position.rect.width / 2) - 5, top: null});

        this.tip.css({
            visibility: 'visible'
        });

        if (this.canMouseEnterContent) {
            // Add event for tooltip
            this.tip.off('mouseenter').on('mouseenter', () => {
                clearTimeout(this.mouseTimer);
            });
            this.tip.off('mouseleave').on('mouseleave', () => {
                this.mouseTimer = setTimeout(() => {
                    this.hide();
                }, this.config.hideDelay);
            });
        }
    }

    /**
     * Hide tooltip: Remove class, Clean timer, Remove element of tooltip
     */
    hide() {
        this.$element.removeClass('tooltip-showing');
        this.$element.removeClass('tooltip-run-start');
        clearTimeout(this.timer);
        clearTimeout(this.mouseTimer);
        this.removeTooltip();
    }

    /**
     * Bind event
     */
    private bindEvents() {
        let $element = this.$element;
        if (this.config.direction === 'current') {
            $element.on('mousemove', (ev) => {
                this.$event = ev;
            });
        }
        $element.on('mouseenter', (ev) => {
            this.mouseenter(ev);
        });
        $element.on('mouseleave', () => {
            this.mouseleave();
        });

        $element.on('hidetooltip', () => {
            this.hide();
        });
    }

    /**
     * Leave control: hide tooltip
     */
    private mouseleave() {
        if (this.tip) {
            if (this.tip.hasClass('hasScroll') || this.canMouseEnterContent) {
                this.mouseTimer = setTimeout(() => {
                    this.hide();
                }, this.config.hideDelay);
                return;
            }
        }
        this.hide();
    }

    /**
     * Enter control to show tooltip
     * @param ev
     */
    private mouseenter(ev) {
        this.$event = ev;
        clearTimeout(this.timer);
        clearTimeout(this.mouseTimer);
        if (!this.tip) {
            this.hideAllTooltip();
            this.start();
        }
    }

    /**
     * Hide all tooltip
     */
    private hideAllTooltip() {
        // Fire hide tooltips which displaying and in cycle of setTimeout
        $('.tooltip-run-start').triggerHandler('hidetooltip');

        // Remove other tooltip outside dom
        let container = this.config.container === 'parent' ? this.$element : $(this.config.container);
        container.find('.' + this.config.className).remove();
    }

    /**
     * Get content of tooltip
     * @param args
     * @returns {any}
     */
    private getTooltipContent(...args): any {
        let content;
        if (this.getContent) {
            content = <string> this.getContent(args);
        } else {
            content = this.content;
        }
        return content;
    }

    /**
     * Create tooltip
     * @returns {any}
     */
    private createTooltip() {
        // Get Tooltip content
        this.tooltipContent = this.getTooltipContent();

        if (!this.tooltipContent) {
            return null;
        }


        // Get container
        this.container = this.config.container === 'parent' ? this.$element : $(this.config.container);


        // Render template-ref
        let viewRef: EmbeddedViewRef<any> = this._viewContainerRef.createEmbeddedView(this.tooltipTemplate);
        viewRef.detectChanges();


        // attach the view to the DOM element that matches our selector
        viewRef.rootNodes.forEach(rootNode => this.container.append(rootNode));

        return $(viewRef.rootNodes[0]);
    }

    private start() {
        this.$element.addClass('tooltip-run-start');
        this.timer = setTimeout(() => {
            this.show();
        }, this.config.showDelay);

    }

    /**
     * Get direction will display tooltip
     * @param rect
     * @param offset
     * @returns {string}
     */
    private getDirection(rect, offset) {
        let elTop = rect.top,
            elHeight = rect.height,
            tooltipHeight = this.tip.height() + Math.max(offset.top, offset.bottom),
            containerHeight = this.container.height(),
            containerTop = this.container.offset().top,
            aboveHeight = elTop - containerTop,
            belowHeight = containerHeight + containerTop - (elTop + elHeight);
        if (belowHeight >= tooltipHeight) {
            return 'bottom';
        }
        if (aboveHeight >= tooltipHeight) {
            return 'top';
        }
        return aboveHeight > belowHeight ? 'top1' : 'bottom1';
    }

    /**
     * Get position from area
     * @param rect
     * @param offset
     * @returns {{left: number, top: number, height: string, width: *, direction: *|string, rect: *}}
     */
    private getPositionByArea(rect, offset) {
        let toolMargin = 8;
        let tooltipHeight = this.tip.height(),
            tooltipWidth = this.tip.width(),
            containerTop = this.container.offset().top,
            containerLeft = this.container.offset().left,
            containerHeight = this.container.height(),
            containerWidth = this.container.width(),
            elTop = rect.top,
            elHeight = rect.height,
            top = 0,
            height: string | number = 'auto',
            direction = this.getDirection(rect, offset);
        switch (direction) {
            case 'top':
                top = elTop - tooltipHeight - offset.top;
                break;
            case 'bottom':
                top = elTop + elHeight + offset.bottom;
                break;
            case 'top1':
                top = toolMargin;
                height = (elTop - containerTop) - top - 16 - offset.top;
                top = top + containerTop;
                break;
            case 'bottom1':
                top = elTop + elHeight + offset.bottom;
                height = containerTop + containerHeight - top - 16 - toolMargin;
                break;
        }

        // addClass
        this.tip.removeClass('tooltip-down');
        this.tip.removeClass('tooltip-up');
        switch (direction) {
            case 'top':
            case 'top1':
                this.tip.addClass('tooltip-up');
                break;
            case 'bottom':
            case 'bottom1':
                this.tip.addClass('tooltip-down');
                break;
        }


        let left = rect.left - (tooltipWidth / 2) + rect.width / 2;
        if (rect.left + (tooltipWidth / 2) > containerLeft + containerWidth - toolMargin) {
            left = containerLeft + containerWidth - tooltipWidth - toolMargin;
        }
        if (left < toolMargin) {
            left = toolMargin;
        }

        return {
            left: left,
            top: top,
            height: height,
            width: tooltipWidth,
            direction: direction,
            rect: rect
        };
    }

    /**
     * Get position of tooltip
     * @param ev
     * @returns {*|{left: number, top: number, height: number}}
     */
    private getPosition(ev) {
        let rect, offset;
        if (this.config.direction === 'bottom') {
            let top = this.$element.offset().top;
            if (this.config.scroller) {
                let scrollerTop = $(this.config.scroller).offset().top;
                top = Math.max(top, scrollerTop);
            }
            rect = {
                top: top,
                left: this.$element.offset().left,
                height: this.$element.offset().top + this.$element.height() - top,
                width: this.$element.width()
            };
            offset = {
                top: 5,
                bottom: 5
            };
            return this.getPositionByArea(rect, offset);
        }
        if (this.config.direction === 'current') {
            rect = {
                top: ev.clientY,
                left: ev.clientX,
                height: 0,
                width: 0
            };
            offset = {
                top: 6,
                bottom: 20
            };
            return this.getPositionByArea(rect, offset);
        }
    }

    /**
     * Remove element of tooltip
     */
    private removeTooltip() {
        if (this.tip) {
            this.tip.remove();
            this.tip = null;
        }
    }


}
