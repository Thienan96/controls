import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SlidesComponent} from './slides.component';
import {SlideComponent} from './slide/slide.component';
import {PortalModule} from '@angular/cdk/portal';
import {SlideBodyComponent} from './slide-body/slide-body.component';
import {SlidesDialog} from './slides-dialog/slides.dialog';
import { MaterialModule } from '../material.module';


export {SlidesDialog} from './slides-dialog/slides.dialog';
export {SlidesComponent} from './slides.component';
export {SlideComponent} from './slide/slide.component';
export * from './SliderRef';

@NgModule({
    declarations: [
        SlidesComponent,
        SlideComponent,
        SlideBodyComponent,
        SlidesDialog
    ],
    imports: [
        CommonModule,
        MaterialModule,
        PortalModule
    ],
    exports: [
        SlidesComponent,
        SlideComponent,
        SlideBodyComponent,
        SlidesDialog
    ],
    entryComponents: [
        SlidesDialog
    ]
})
export class SlidesModule {
}
