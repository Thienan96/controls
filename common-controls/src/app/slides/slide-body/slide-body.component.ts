import {Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Optional, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CdkPortalOutlet, TemplatePortal} from '@angular/cdk/portal';
import { MatTabBodyPositionState } from '@angular/material/tabs';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {SlideAnimations} from '../animation';
import { Slide } from '../../shared/models/common.info';


@Component({
    selector: 'ntk-slide-body',
    templateUrl: './slide-body.component.html',
    styleUrls: ['./slide-body.component.css'],
    animations: [SlideAnimations.translateSlide],
})
export class SlideBodyComponent implements OnInit, OnChanges {
// tslint:disable-next-line: no-input-rename
    @Input('slide') slide: Slide;
    @Input('isActive') isActive: boolean;
    @Output('translateCompleted') translateCompleted = new EventEmitter();
    @Output('loaded') loaded = new EventEmitter();
    @ViewChild(CdkPortalOutlet, {static: true}) private portal: CdkPortalOutlet;


    /** Current position of the tab-body in the tab-group. Zero means that the tab is visible. */
    private _positionIndex: number;


    /** Tab body position state. Used by the animation trigger for the current state. */
    _position: MatTabBodyPositionState;


    /** The tab body content to display. */
    @Input('content') _content: TemplatePortal;

    /** Position that will be used when the tab is immediately becoming visible after creation. */
    @Input() origin: number;

    // Note that the default value will always be overwritten by `MatTabBody`, but we need one
    // anyway to prevent the animations module from throwing an error if the body is used on its own.
    /** Duration for the tab's animation. */
    @Input('animationDuration') animationDuration = '500ms';

    /** The shifted index position of the tab body, where zero represents the active center tab. */
    @Input()
    set position(position: number) {
        this._positionIndex = position;
        this._computePositionAnimationState();
    }

    constructor(private elementRef: ElementRef<HTMLElement>,
                @Optional() private _dir: Directionality) {
    }

    /**
     * After initialized, check if the content is centered and has an origin. If so, set the
     * special position states that transition the tab from the left or right before centering.
     */
    ngOnInit() {
        if (this._position === 'center' && this.origin != null) {
            this._position = this._computePositionFromOrigin();
        }
        if (this.slide.isActive) {
            let componentRef = this.portal.attach(this.slide.content);
            let componentInstance = componentRef.instance;
            if (this.slide.slideRef) {
                this.slide.slideRef.componentInstance = componentInstance;
                this.slide.slideRef.afterOpened().next();
            }
        }
        this.loaded.emit(this.slide);
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.isActive && !changes.isActive.isFirstChange()) {
            if (!this.portal.portal && changes.isActive.currentValue) {
                this.portal.attach(this.slide.content);
            }
        }
    }


    /** The text direction of the containing app. */
    _getLayoutDirection(): Direction {
        return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
    }

    /** Whether the provided position state is considered center, regardless of origin. */
    _isCenterPosition(position: MatTabBodyPositionState | string): boolean {
        return position === 'center' ||
            position === 'left-origin-center' ||
            position === 'right-origin-center';
    }

    /** Computes the position state that will be used for the tab-body animation trigger. */
    private _computePositionAnimationState(dir: Direction = this._getLayoutDirection()) {
        if (this._positionIndex < 0) {
            this._position = dir === 'ltr' ? 'left' : 'right';
        } else if (this._positionIndex > 0) {
            this._position = dir === 'ltr' ? 'right' : 'left';
        } else {
            this._position = 'center';
        }
    }

    /**
     * Computes the position state based on the specified origin position. This is used if the
     * tab is becoming visible immediately after creation.
     */
    private _computePositionFromOrigin(): MatTabBodyPositionState {
        const dir = this._getLayoutDirection();

        if ((dir === 'ltr' && this.origin <= 0) || (dir === 'rtl' && this.origin > 0)) {
            return 'left-origin-center';
        }

        return 'right-origin-center';
    }

    onTranslateTabStarted(event: any) {
        if (event.toState === 'center' || event.fromState === 'center') {
            $(this.elementRef.nativeElement).css('visibility', 'visible');
        } else {
            $(this.elementRef.nativeElement).css('visibility', 'hidden');
        }
    }

    onTranslateCompleted(event: any) {
        if (event.toState === 'center') {
            $(this.elementRef.nativeElement).css('visibility', 'visible');
        } else {
            $(this.elementRef.nativeElement).css('visibility', 'hidden');
        }
        this.translateCompleted.emit({
            slide: this.slide,
            event: event
        });

    }

    setAnimationDuration(animationDuration) {
        this.animationDuration = animationDuration;
    }
}
