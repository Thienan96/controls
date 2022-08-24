import {
    AfterContentChecked,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    Input,
    OnInit,
    Renderer2,
    ViewChild
} from '@angular/core';
import moment from 'moment-es6';
import {UtilityService} from '../../core/services/utility.service';

@Component({
    selector: 'ntk-text-truncation',
    templateUrl: './text-truncation.component.html',
    styleUrls: ['./text-truncation.component.scss'],
    host: {
        '[class.marquee]': 'marquee && showEllipsis'
    }
})
export class TextTruncationComponent implements AfterViewInit, AfterContentChecked, OnInit {
    @ViewChild('content', {static: true}) content: ElementRef;
    @ViewChild('container', {static: true}) container: ElementRef;

    @Input() lineHeight?: number;
    @Input() maxLines?: number;
    @Input() autoTooltip = false; // true: Tooltip will display if showEllipsis is true, false: don`t show tooltip
    @Input() autoResize = true;
    @Input() marquee = false;


    textContent: string;
    showEllipsis = false;
    maxHeight = '18px';
    fixingDirection = false;
    protected $element: JQuery;
    protected lastLine: Element;
    protected _lastWidth = -1;

    private _lastCheckContent: moment.Moment;
    protected cd: ChangeDetectorRef;
    protected renderer: Renderer2;


    constructor(protected injector: Injector) {
        this.renderer = injector.get(Renderer2);
        let utilityService = injector.get(UtilityService);
        this.fixingDirection = utilityService.isSafari || utilityService.isIE;
        this.cd = injector.get(ChangeDetectorRef);
    }

    ngAfterContentChecked(): void {
        if (!this._lastCheckContent || moment().diff(this._lastCheckContent, 'ms') >= 500) {
            // https://stackoverflow.com/questions/40776351/what-is-the-best-way-to-listen-for-component-resize-events-within-an-angular2-co            
            if (this.$element && this.autoResize && this.textContent) {
                let thisWidth = this.$element.width(),
                    diff = Math.abs(thisWidth - this._lastWidth);
                // not first time

                // console.log('thisWidth = ', thisWidth);
                // console.log('this._lastWidth = ', this._lastWidth);

                if (diff >= 1 && this._lastWidth !== -1) {
                    this._lastWidth = thisWidth;
                    this.onResize();
                }
            }

            this._lastCheckContent = moment();
        }
    }

    ngOnInit(): void {
        if (!this.maxLines) {
            this.maxLines = 1;
        }

        // Convert string to number
        if (typeof this.maxLines === 'string') {
            this.maxLines = parseInt(this.maxLines, 10);
        }


        // tempory calculation to avoid flashing on load
        this.lineHeight = this.getDefaultLineHeight();
        this.maxHeight = (this.maxLines * this.lineHeight) + 'px';
    }

    ngAfterViewInit() {
        this.lineHeight = this.getDefaultLineHeight();
        this.maxHeight = (this.maxLines * this.lineHeight) + 'px';

        // Set class
        if (this.maxLines === 1) {
            this.renderer.addClass(this.container.nativeElement, 'middle-truncate-one-line');
        } else {
            this.renderer.addClass(this.container.nativeElement, 'middle-truncate-n-lines');
        }

        // +2 to avoid the scrollHeight often = 20
        if (this.maxLines === 1) {
            this.renderer.setStyle(this.content.nativeElement, 'height', this.lineHeight + 'px');
        }

        // Set line-height
        this.renderer.setStyle(this.container.nativeElement, 'line-height', this.lineHeight + 'px');


        // Update layout when content change
        this.renderer.listen(this.content.nativeElement, 'DOMSubtreeModified', () => {
            // Update content for tooltip
            let textContent = this.getContent();
            if (this.textContent !== textContent) {
                this.textContent = textContent;
                // Update
                this.updateLayout();
            }
        });

        this.$element = jQuery(this.container.nativeElement);

        // Update _lastWidth after updateLayout
        this._lastWidth = this.$element.width();

        this.updateLayout();

    }


    public updateLayout() {
        let height = this.lineHeight * this.maxLines;

        // Reset
        this.renderer.setStyle(this.content.nativeElement, 'white-space', 'normal');

        $(this.content.nativeElement).height(height);
        if (this.content.nativeElement.offsetHeight < this.content.nativeElement.scrollHeight) {
            this.showEllipsis = true;
            this.renderer.setStyle(this.content.nativeElement, 'white-space', 'nowrap');
        } else {
            this.showEllipsis = false;

            $(this.content.nativeElement).height('auto');
        }

        // Get text
        this.textContent = this.getContent();

        // Render, update for changes
        this.cd.detectChanges();
    }

    private onResize() {
        this.updateLayout();
    }

    protected getContent() {
        return $(this.content.nativeElement).text();
    }

    private getLineHeight(element: any) {
        let temp = this.renderer.createElement(element.nodeName);

        // tslint:disable-next-line:max-line-length
        this.renderer.setAttribute(temp, 'style', 'margin:0px;padding:0px;');
        temp.innerHTML = 'L';
        this.renderer.appendChild(element.parentNode, temp);
        let ret = temp.offsetHeight;
        this.renderer.removeChild(temp.parentNode, temp);
        return ret;
    }

    private getDefaultLineHeight() {
        let tmpLineHeight = this.lineHeight;
        if (!tmpLineHeight) {
            tmpLineHeight = parseInt(this.content.nativeElement.style['line-height'], 10);
        }
        if (!tmpLineHeight) {
            tmpLineHeight = this.getLineHeight(this.content.nativeElement);
        }
        if (!tmpLineHeight) {
            tmpLineHeight = 20;
        }
        return tmpLineHeight;
    }


}



