import {AfterContentChecked, AfterViewInit, Component, OnInit} from '@angular/core';
import {TextTruncationComponent} from '../text-truncation/text-truncation.component';

@Component({
    selector: 'ntk-middle-truncation',
    templateUrl: '../text-truncation/text-truncation.component.html',
    styleUrls: ['./middle-truncation.component.scss']
})
export class MiddleTruncationComponent extends TextTruncationComponent implements AfterViewInit, AfterContentChecked, OnInit {

    public updateLayout() {
        let height = this.lineHeight * this.maxLines,
            contentHeight = height - this.lineHeight;


        // Reset
        this.renderer.setStyle(this.content.nativeElement, 'white-space', 'normal');
        $(this.container.nativeElement).height('auto');  // Reset height
        $(this.container.nativeElement).removeClass('show-ellipsis');

        $(this.content.nativeElement).height(height);
        if (this.content.nativeElement.scrollHeight - this.content.nativeElement.offsetHeight > 1) {
            this.showEllipsis = true;
            $(this.container.nativeElement).addClass('show-ellipsis');
            // Remove and reAdd last-line to fix element don't  re-render when change text because issue direction
            this.removeLastLine();
            this.createLastLine(this.getContent());

            if (this.maxLines > 1) {
                $(this.content.nativeElement).height(contentHeight);

                // Set top for lastLine
                $(this.container.nativeElement).height(height);
                $(this.lastLine).css('top', contentHeight);
            }
        } else {
            this.showEllipsis = false;

            this.removeLastLine();
            $(this.content.nativeElement).height('auto');
        }


        // Get text
        this.textContent = this.getContent();

        // Render, update for changes
        this.cd.detectChanges();
    }

    private createLastLine(text) {
        this.lastLine = this.renderer.createElement('span');
        this.lastLine.className = 'last-line-container';

        // Add three dot if fixingDirection
        if (this.fixingDirection) {
            let threeDotEl = this.renderer.createElement('div');
            threeDotEl.className = 'three-dot';
            threeDotEl.innerHTML = '...';
            this.renderer.appendChild(this.lastLine, threeDotEl);
        }

        if (this.showEllipsis) {
            // Create and add lastLine
            let lastLineEl = this.renderer.createElement('span');
            lastLineEl.className = 'last-line';
            lastLineEl.innerHTML = '<bdi>' + text + '</bdi>';
            this.renderer.appendChild(this.lastLine, lastLineEl);
        }


        this.renderer.appendChild(this.container.nativeElement, this.lastLine);
    }

    private removeLastLine() {
        if (this.lastLine) {
            this.renderer.removeChild(this.container.nativeElement, this.lastLine);
        }
    }
}
