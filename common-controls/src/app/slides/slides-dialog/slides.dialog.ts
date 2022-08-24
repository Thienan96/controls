import {Component, Inject, Injector, OnDestroy, ViewChild} from '@angular/core';
import {SlidesComponent} from '../slides.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';
import {SliderRef} from '../SliderRef';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { DialogData, Slide } from '../../shared/models/common.info';
import { SlideService } from '../../core/services/slide.service';


@Component({
    selector: 'ntk-slides-dialog',
    templateUrl: './slides.dialog.html',
    styleUrls: ['./slides.dialog.css']
})
export class SlidesDialog extends BaseDialog implements OnDestroy {
    @ViewChild('slides', {static: true}) slides: SlidesComponent;

    constructor(protected injector: Injector,
                protected dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA) protected dialogData: DialogData,
                protected slideService: SlideService) {
        super(injector, dialogRef, dialogData);
        this.bindEvents();
    }


    ngOnDestroy() {
        this.slideService.unsubscribe(this.dialogRef);
    }

    private bindEvents() {
        this.slideService.subscribe(this.dialogRef, (options) => {
            if (options.action === 'createSlide') {
                let slide = options.slide;
                this.createSlide(slide).subscribe(() => {
                    setTimeout(() => {
                        this.gotoSlide(this.slides.slides.length - 1).subscribe(options.ob);
                    }, 100);
                });
            }
            if (options.action === 'closeRef') {
                let slideIndex = this.getSlideIndex(options.ref);
                if (slideIndex <= 0) {
                    this.slides.closeDialog(options.data).subscribe(options.ob);
                } else {
                    this.gotoSlide(slideIndex - 1, options.animation).subscribe(() => {
                        options.ob.next(options.data);
                    });
                }

            }
            if (options.action === 'forceCloseDialog') {
                this.slides.closeDialog(options.data).subscribe(options.ob);
            }
        });
    }

    private createInjector(data: DialogData, slideRef: SliderRef): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(MAT_DIALOG_DATA, data);
        injectorTokens.set(MatDialogRef, slideRef);
        return new PortalInjector(this.injector, injectorTokens);
    }

    protected createSlide(slide: Slide) {
        let component = slide.component,
            data = slide.data,
            slideRef = slide.slideRef;
        slide.content = new ComponentPortal(component, null, this.createInjector(data, slideRef));
        return this.slides.createSlide(slide);
    }

    public gotoSlide(slideIndex: number, animation = true) {
        return this.slides.gotoSlide(slideIndex, animation);
    }

    private getSlideIndex(ref: SliderRef): number {
        return this.slides.slides.findIndex((slide) => {
            return ref === slide.slideRef;
        });
    }
}
