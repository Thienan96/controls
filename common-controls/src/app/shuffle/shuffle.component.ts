import {AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import Shuffle from 'shufflejs';


@Component({
    selector: 'ntk-shuffle',
    templateUrl: './shuffle.component.html',
    styleUrls: ['./shuffle.component.scss']
})
export class ShuffleComponent implements AfterViewInit, OnChanges {
    @Input() minWidth = 400;
    @Input() items = [];
    private shuffleInstance: Shuffle;
    private $element: JQuery;
    private itemsSelector = 'ntk-shuffle-item';

    constructor(element: ElementRef) {
        this.$element = $(element.nativeElement);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes.items.isFirstChange()) {
            setTimeout(() => {
                this.refresh();
            }, 10);
        }
    }

    ngAfterViewInit() {
        this.shuffleInstance = new Shuffle(this.$element.find('.shuffle-container')[0], {
            itemSelector: this.itemsSelector
        });
        // Prevent shuffle bind resize, we will manage resize
        window.removeEventListener('resize', this.shuffleInstance['_onResize']);


        this.resize();
    }


    onResize() {
        if (this.shuffleInstance) {
            let width = this.minWidth,
                containerWidth = this.$element.width(),
                cols = Math.floor(containerWidth / width),
                newWidth = Math.floor(containerWidth / cols);
            if (Math.abs(this.shuffleInstance.colWidth - newWidth) > 2) {
                this.resize();
            }
        }
    }

    refresh() {
        this.shuffleInstance.resetItems();
        this.resize();
    }

    private resize() {
        if (this.items.length === 1) {
            this.$element.find(this.itemsSelector).width('100%');
        } else {
            let width = this.minWidth,
                containerWidth = this.$element.width(),
                cols = Math.floor(containerWidth / width);
            if (cols === 0) {
                cols = 1;
            }
            let newWidth = Math.floor(containerWidth / cols);

            this.$element.find(this.itemsSelector).width(newWidth);
        }


        this.shuffleInstance.update();

    }


}
