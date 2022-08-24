import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { NgxFileDropModule } from 'ngx-file-drop';
import { MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { ImageThumbComponent } from './image-thumb.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        ImageThumbComponent
    ],
    imports: [
        CommonModule,
        NgxFileDropModule,
        MatProgressBarModule,
        CommonControlsSharedModule,
        MatIconModule,
        MatMenuModule,
        FlexLayoutModule,
        MatButtonModule
    ],
    exports: [
        ImageThumbComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class ImageThumbModule {
}
