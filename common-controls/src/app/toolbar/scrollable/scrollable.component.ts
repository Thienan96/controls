import {AfterContentInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {UtilityService} from '../../core/services/utility.service';

@Component({
    selector: 'ntk-scrollable',
    templateUrl: './scrollable.component.html',
    styleUrls: ['./scrollable.component.scss']
})
export class ScrollableComponent implements OnInit, AfterContentInit, OnDestroy {
    @Input() scrollStep = 200;
    isShowNavigationButton = true;

    private readonly $element: JQuery;
    private container: JQuery;
    private content: JQuery;
    private contentWidth = 0;
    private containerWidth = 0;
    private scrollX = 0;

    @Output() onResized = new EventEmitter();

    constructor(elementRef: ElementRef,
                utilityService: UtilityService) {
        this.$element = $(elementRef.nativeElement);
        if (utilityService.isDevice) {
            this.isShowNavigationButton = false;
        }
    }

    public get isAtFirst() {
        return this.scrollX >= 0;
    }

    public get isAtLast() {
        return this.containerWidth - this.contentWidth - this.scrollX >= -0.1;
    }

    ngOnInit() {
        this.container = this.$element.find('.ntk-scrollable-container');
        this.content = this.$element.find('.ntk-scrollable-wrapper');

        this.container.on('scroll', () => {
            if (!this.isShowNavigationButton) { // show ScrollBar
                this.scrollX = -this.container.scrollLeft();
            }
        });
    }

    ngAfterContentInit() {
        this.update();
    }

    ngOnDestroy() {
        this.container.off('scroll');
    }

    onResize() {
        this.update();
        this.onResized.emit();
    }

    private update() {
        // Update width

        if (this.content) {
            this.contentWidth = this.getContentWidth();
            this.containerWidth = this.getContainerWidth();

            // Update scroll
            let scrollX = this.scrollX;
            if (scrollX < this.containerWidth - this.contentWidth) {
                scrollX = -(this.contentWidth - this.containerWidth);
            }
            if (scrollX > 0) {
                scrollX = 0;
            }

            this.scrollX = scrollX;
            this.content.css({width: this.contentWidth});
            this.container[0].scrollLeft = -this.scrollX;
        }
    }

    public gotoNext() {
        let x = this.scrollX - this.scrollStep;
        this.goto(x);
    }

    public gotoPrev() {
        let x = this.scrollX + this.scrollStep;
        this.goto(x);
    }

    public goto(scrollX) {
        this.scrollX = scrollX;
        this.update();
    }

    public gotoElement(el: Element) {
        let $el = $(el),
            itemPosition = this.getPositionOfItem(el),
            scrollX = this.scrollX;
        if (itemPosition === 3) { // In-In
            return;
        }
        if (itemPosition === 4 || itemPosition === 5) { // item on the right side
            scrollX = this.scrollX - ($el.offset().left - this.content.offset().left + $el.width()) + (Math.abs(this.scrollX) + this.container.width());
        }
        if ((itemPosition === 4 || itemPosition === 5) && $el.width() > this.container.width()) {
            itemPosition = 1;
        }
        if (itemPosition === 1 || itemPosition === 2) { // item on the left side
            scrollX = this.scrollX + Math.abs(this.scrollX) - ($el.offset().left - this.content.offset().left);
        }
        this.goto(scrollX);
    }


    private getContainerWidth() {
        return this.container ? this.container.width() : 0;
    }

    private getContentWidth() {
        let width = 0;
        this.$element.find('.ntk-scrollable-item').each((index, el) => {
            width = width + $(el).width();
        });
        return width;
    }

    private getPositionOfItem(el: Element): number {
        const $el = $(el);
        let off1 = $el.offset();
        let rect1 = {
            left: off1.left,
            right: off1.left + $el.width()
        };

        let off2 = this.container.offset();
        let rect2 = {
            left: off2.left,
            right: off2.left + this.container.width()
        };
        if (rect1.right < rect2.left) {// Out-Out (left)
            return 1;
        }
        if (rect1.left < rect2.left && rect1.right >= rect2.left) { // Out-In
            return 2;
        }
        if (rect1.left >= rect2.left && rect1.right <= rect2.right) { // In-In
            return 3;
        }
        if (rect1.left >= rect2.left && rect1.right >= rect2.right) { // In-Out
            return 4;
        }
        if (rect1.left > rect2.right) { // Out-Out (right)
            return 5;
        }
    }

    updateScroller() {
        this.update();
    }
}
