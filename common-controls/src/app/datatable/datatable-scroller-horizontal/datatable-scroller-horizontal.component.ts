import {
    AfterContentInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import {DatatableColumn, DatatableColumnPin, DatatableColumnsByPin} from '../shared/datatable.model';
import {DatatableService} from '../shared/datatable.service';
import {timer} from 'rxjs';

@Component({
    selector: 'ntk-datatable-scroller-horizontal',
    templateUrl: './datatable-scroller-horizontal.component.html',
    styleUrls: ['./datatable-scroller-horizontal.component.scss'],
    host: {
        '[class.is-float]': 'isFloat'
    }
})
export class DatatableScrollerHorizontalComponent implements AfterContentInit, OnChanges {
    @Input() columns: DatatableColumn[];
    @Input() datatable: any;
    @Input() scrollLeft = 0;
    columnsByPin: DatatableColumnsByPin = new DatatableColumnsByPin();
    scrollerContainerWidth: number;
    scrollerWidth: number;
    scroller: JQuery;
    originScrollLeft = 0;
    scrollerTimer: any;
    $element: JQuery;
    scrollerWrapper: JQuery;

    // EJ4-2001: Show scrollbar (horizontal) when scroll content if options is `show scrolling`
    isFloat = false; // Scrollbar will float on content if client computer are MacOs, Show scrollbar: When Scrolling
    private scrollingTimer: any; // manage time to set is-scrolling when scrolling
    private timerMouseEnter: any; // manage time when mouseenter

    constructor(private elementRef: ElementRef,
                private cd: ChangeDetectorRef,
                private datatableService: DatatableService) {
        this.$element = $(this.elementRef.nativeElement);
    }

    @HostListener('mouseleave')
    mouseLeave() {
        if (this.isFloat) {
            this.timerMouseEnter = timer(500).subscribe(() => {
                this.$element.removeClass(`mouseenter`);
            });
        }
    }

    @HostListener('mouseenter')
    mouseEnter() {
        if (this.isFloat) {
            if (this.timerMouseEnter) {
                this.timerMouseEnter.unsubscribe();
            }
            this.$element.addClass(`mouseenter`);
        }
    }

    ngAfterContentInit() {
        this.updateColumns();

        // Get scroller
        this.scrollerWrapper = this.$element.find('.aside-center');
        this.scroller = this.$element.find('.fixed-table-horizontal-thumb');

        // Scroll content when scroll
        this.scrollerWrapper[0].addEventListener('scroll', this.onScroll.bind(this), {
            capture: true,
            passive: true
        });


        setTimeout(() => {
            //  float if option is when scrolling
            let scrollBarWidth = this.datatableService.getScrollBarWidth(),
                isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if (isMac && scrollBarWidth === 0) {
                this.isFloat = true;
            }


            this.scrollTo(this.scrollLeft);
        }, 1000);

    }

    updateColumns() {
        this.columnsByPin.reset();
        this.columns.forEach((column) => {
            if (column.show) {
                switch (column.pin) {
                    case DatatableColumnPin.left:
                        this.columnsByPin.left.push(column);
                        break;
                    case DatatableColumnPin.right:
                        this.columnsByPin.right.push(column);
                        break;
                    default:
                        this.columnsByPin.center.push(column);
                }
            }

        });
    }

    updateSize() {
        this.scrollerContainerWidth = this.scrollerWrapper.width();
        this.scrollerWidth = this.scroller.width();
    }

    onDrag(ev) {
        let eventType = ev.eventType;

        if (eventType === 'dragStart') {
            this.originScrollLeft = this.scrollLeft;
            this.updateSize();
        }

        let left = this.makeRound(this.originScrollLeft - ev.left);
        this.scrollTo(left);
    }


    onWheel(ev) {
        let distance = this.getMouseWheelDistance(ev);
        if (distance !== 0) {
            // Prevent event fire to parent
            ev.stopImmediatePropagation();
            ev.preventDefault();

            // Update size
            this.updateSize();

            let left: number = this.makeRound(this.scrollLeft + distance);
            this.scrollTo(left);
        }
    }


    private onScroll() {
        let left = this.scrollerWrapper.scrollLeft();
        this.scrollLeft = left;
        this.datatable.setScrollLeft(left); // Update Horizontal scroll
        clearTimeout(this.scrollerTimer);
        this.scrollerTimer = setTimeout(() => {
            this.safeApply();
        }, 50);


        // Set is-scrolling class if scrolling
        if (this.isFloat) {
            this.$element.addClass(`is-scrolling`);
        }
        clearTimeout(this.scrollingTimer);
        this.scrollingTimer = setTimeout(() => {
            if (this.isFloat) {
                this.$element.removeClass(`is-scrolling`);
            }
        }, 800);
    }

    private safeApply() {
        this.cd.detectChanges();
    }

    private getMouseWheelDistance(ev: WheelEvent) {
        let deltaX = Math.abs(ev.deltaX),
            deltaY = Math.abs(ev.deltaY);
        if (deltaY > deltaX) {
            return 0;
        }
        let distance = 0;
        switch (ev.deltaMode) {
            case undefined:
            case 0:
                distance = ev.deltaX;
                break;
            case 1:
                distance = ev.deltaX * 16;
                break;
            case 2:
                distance = ev.deltaX * $(ev.currentTarget).height();
                break;
        }
        return distance;
    }

    private makeRound(left: number) {
        if (left <= 0) {
            left = 0;
        }
        if (left >= this.scrollerWidth - this.scrollerContainerWidth) {
            left = this.scrollerWidth - this.scrollerContainerWidth;
        }
        return left;
    }


     scrollTo(left: number) {
        this.scrollLeft = left;
        this.scrollerWrapper.scrollLeft(left);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columns']) {
            // console.log('--H-scroll bar detect columns chamnged to', this.columns);
            setTimeout(() => {
                this.updateColumns();
            }, 200);
        }
    }
}
