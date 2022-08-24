import {
    AfterContentInit,
    Directive,
    ElementRef,
    EventEmitter,
    HostListener,
    Injector,
    Input,
    NgZone,
    OnDestroy,
    Output
} from '@angular/core';
import {interval} from 'rxjs';

@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[ntk-resize-sensor]'
})
export class ResizeSensorDirective implements OnDestroy, AfterContentInit {
    @Input() resizeDelay = 500;
    @Output() onResizeSensor = new EventEmitter();
    _oldWidth = 0;
    _oldHeight = 0;
    element: ElementRef;
    zone: NgZone;
    orientationchangeTimer; // Timer for orientationchange
    disabledResize = false; // Check control is resize
    private ob: any;

    constructor(public injector: Injector) {
        this.element = injector.get(ElementRef, null);
        this.zone = injector.get(NgZone);
    }

    @HostListener('window:orientationchange', []) onOrientationChange() {
        this.disabledResize = true;
        clearTimeout(this.orientationchangeTimer);
        this.orientationchangeTimer = setTimeout(() => {
            this.forceResize();
            this.disabledResize = false;
        }, 200);
    }

    ngAfterContentInit() {
        this.zone.runOutsideAngular(() => {
            // Init width, height
            this._oldWidth = this.element.nativeElement.offsetWidth;
            this._oldHeight = this.element.nativeElement.offsetHeight;

            this.ob = interval(this.resizeDelay).subscribe(() => {
                this.resize();
            });
        });
    }

    ngOnDestroy() {
        if (this.ob) {
            this.ob.unsubscribe();
        }
    }

    onResize() {
    }

    private resize() {
        if (this.checkResize() && !this.disabledResize) {
            // Trigger resize
            this.raiseResize();
        }
    }


    /**
     * Is element resize
     * @returns {boolean}
     */
    private checkResize(): boolean {
        let newWidth = this.element.nativeElement.offsetWidth,
            newHeight = this.element.nativeElement.offsetHeight,
            isResize = this._oldWidth !== newWidth || this._oldHeight !== newHeight;
        this._oldWidth = newWidth;
        this._oldHeight = newHeight;
        return isResize;
    }

    private raiseResize() {
        this.zone.run(() => {
            this.onResize();
            this.onResizeSensor.emit();
        });
    }

    private forceResize() {
        this._oldWidth = this.element.nativeElement.offsetWidth;
        this._oldHeight = this.element.nativeElement.offsetHeight;

        // Trigger resize
        this.raiseResize();
    }
}
