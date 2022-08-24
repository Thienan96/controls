import {Component, Input, OnChanges, QueryList, SimpleChanges, ViewChildren} from '@angular/core';
import {SlideComponent} from './slide/slide.component';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import { MatDialogRef } from '@angular/material/dialog';
import {SlideBodyComponent} from './slide-body/slide-body.component';
import { Slide } from '../shared/models/common.info';


@Component({
    selector: 'ntk-slides',
    templateUrl: './slides.component.html',
    styleUrls: ['./slides.component.css'],
    entryComponents: [SlideComponent]
})
export class SlidesComponent implements OnChanges {
    @Input() selectedIndex = 0;
    @Input() animationDuration = '500ms';
    @ViewChildren(SlideBodyComponent) slideBodyComponents: QueryList<SlideBodyComponent>;
    slides: Slide[] = [];
    private slideCreated = new Subject();

    constructor(private dialogRef: MatDialogRef<any>) {
    }


    gotoSlide(slideIndex: number, animation = true) {
        return new Observable((ob) => {
            if (!animation) {
                // Set 0 to disable animation
                this.slideBodyComponents.forEach((slideBodyComponent) => {
                    slideBodyComponent.setAnimationDuration('0ms');
                });
            }

            let oldSelectedIndex = this.selectedIndex;

            this.selectedIndex = slideIndex;
            this.slides.forEach((s, index) => {
                s.isActive = index === slideIndex;
                s.position = index - slideIndex;
            });
            this.slideCreated = new Subject();
            this.slideCreated.subscribe((result) => {
                this.slideCreated.unsubscribe();

                // Reset animation to default
                this.slideBodyComponents.forEach((slideBodyComponent) => {
                    slideBodyComponent.setAnimationDuration(this.animationDuration);
                });

                // remove last slide
                if (slideIndex < oldSelectedIndex) {
                    this.slides.splice(slideIndex + 1, oldSelectedIndex - slideIndex);
                }

                ob.next(result);
            });

        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.selectedIndex && !changes.selectedIndex.firstChange) {
            this.gotoSlide(changes.selectedIndex.currentValue);
        }
    }

    createSlide(slide: Slide) {
        return new Observable((ob) => {
            Object.assign(slide, {
                position: this.slides.length - this.selectedIndex,
                loaded: ob,
                isActive: true,
            });
            this.slides.push(slide);
        });
    }


    closeDialog(data) {
        return new Observable(() => {
            this.dialogRef.close(data);
        });
    }


    onTranslateCompleted(data) {
        if (data.event.toState === 'center') {
            this.slideCreated.next(data.slide);
        }
    }

    onLoaded(slide: Slide) {
        slide.loaded.next();
    }
}
