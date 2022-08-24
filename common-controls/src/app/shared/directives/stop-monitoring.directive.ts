import {Directive, ElementRef} from '@angular/core';
import {FocusMonitor} from '@angular/cdk/a11y';

@Directive({
    selector: '[ntk-stop-monitoring]'
})
export class StopMonitoringDirective {
    public constructor(focusMonitor: FocusMonitor,
                       elementRef: ElementRef) {
        focusMonitor.stopMonitoring(elementRef.nativeElement);
    }
}
