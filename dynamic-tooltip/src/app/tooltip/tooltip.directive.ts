import { AfterViewInit, ComponentRef, Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2, SimpleChanges, TemplateRef } from '@angular/core';
import { Subject, Subscription, switchMap, Observable, delay, map } from 'rxjs';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[appTooltip]',
  exportAs: 'appTooltip'
})
// check github for sure https://github.com/angular/components/issues/10306
export class TooltipDirective implements OnDestroy, AfterViewInit, OnInit {
  @Input() forceShowToolTip = false;

  // Still opening when mouse leave the target
  @Input() keepOpenWhenMouseLeave = false;

  // Keep the default position like now
  @Input() defaultPosition: ConnectedPosition[] = [
      {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
      },
      {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
      }
  ];

  @Input() disable = false;
  @Input() delay = 0;
  @Input() template!: TemplateRef<any>;
  @Input('appTooltip') text = '';
  @Input() isCheckText = true; // true: Show tooltip if text is truncated, false: don't check text
  @Input() sliding = false;; // show tooltip at mouse position
  private overlayRef!: OverlayRef;
  private listener = new Subject<any>();
  private listenSub = new Subscription();
  private hovering$ = false;

  constructor(private overlay: Overlay,
      private elementRef: ElementRef,
      private zone: NgZone,
      private renderer: Renderer2) {
  }

  ngOnInit() {
      this.listenSub = this.listener
          .pipe(
              switchMap(() => {
                  return new Observable((ob => {
                      return ob.next();
                  })).pipe(delay(this.delay));
              }
              )
          )
          .pipe(map(() => this.hovering$))
          .subscribe(r => {
              if (r) {
                  this.show();
              }
          });

  }

  ngAfterViewInit() {
      this.renderer.listen(this.elementRef.nativeElement, 'mouseenter', (event: any) => {
          this.hovering$ = true;
          this.listener.next(null);
      });
      this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', (event: any) => {
          // this._destroyed$.next(true);
          this.hovering$ = false;
          if (!this.keepOpenWhenMouseLeave) {
              this.hide();
          }
      });
      if (this.sliding) {
          this.renderer.listen(this.elementRef.nativeElement, 'mousemove', (event: MouseEvent) => {

              if (this.overlayRef) {
                  const clonePosition = this.defaultPosition.map(r => {
                      r.offsetX = event.offsetX;
                      r.originX = 'start';
                      return r;
                  });
                  this.overlay.position()
                      .flexibleConnectedTo(this.elementRef)
                      .withPositions(clonePosition);
                  this.overlayRef.updatePosition();
              }

          });
      }
  }

  ngOnDestroy() {
      if (this.elementRef && this.overlayRef) {
          this.overlayRef.detach();
          this.overlayRef.dispose();
      }
      if (this.listenSub) {
          this.listenSub.unsubscribe();
      }
  }

  private initToolTip() {

      let position = this.overlay.position()
          .flexibleConnectedTo(this.elementRef)
          .withPositions(this.defaultPosition);

      if (!this.overlayRef) {
          this.overlayRef = this.overlay.create({
              positionStrategy: position,
              hasBackdrop: this.keepOpenWhenMouseLeave,
              backdropClass: 'cdk-overlay-transparent-backdrop',
          });

          if (this.keepOpenWhenMouseLeave) {
              this.overlayRef.backdropClick().subscribe(() => this.hide());
          }
      }
      else {
          this.overlayRef.updatePosition();
      }
  }

  show() {
      if (this.disable) { return; }
      let canShow = true;
      if (this.isCheckText && !(this.elementRef.nativeElement.offsetWidth < this.elementRef.nativeElement.scrollWidth)) {
          canShow = false;
      }
      if ((canShow || this.forceShowToolTip) && (this.text || this.template)) {
          this.zone.runTask(() => {
              this.initToolTip();
              if (this.overlayRef && !this.overlayRef.hasAttached()) {
                  let tooltipRef: ComponentRef<TooltipComponent>
                      = this.overlayRef.attach(new ComponentPortal(TooltipComponent));
                  tooltipRef.instance.text = this.text;
                  tooltipRef.instance.template = this.template;
              }
          });
      }
  }

  hide() {
      if (this.overlayRef && this.overlayRef.hasAttached()) {
          this.overlayRef.detach();
      }
  }
}
