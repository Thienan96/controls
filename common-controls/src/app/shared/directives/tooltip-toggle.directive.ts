import {AfterViewInit, Directive, ElementRef, Renderer2} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';
import {UtilityService} from '../../core/services/utility.service';

@Directive({
    selector: '[matTooltip][ntk-tooltip-toggle]'
})
export class TooltipToggleDirective implements AfterViewInit {
    constructor(private elementRef: ElementRef<HTMLInputElement>,
                private matTip: MatTooltip,
                private renderer: Renderer2,
                private utilityService: UtilityService) {
    }

    ngAfterViewInit() {
        if (this.utilityService.isDevice) { // Disable tooltip if run on device
            this.matTip.disabled = true;
        } else {
            this.renderer.listen(this.elementRef.nativeElement, 'mouseover', () => {
                this.updateShowEllipsis();
            });
        }

    }

    private updateShowEllipsis() {
        if (this.matTip) {
            this.matTip.disabled = (this.elementRef.nativeElement.offsetWidth >= this.elementRef.nativeElement.scrollWidth);
        }
    }
}
