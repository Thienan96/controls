import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { AttachmentBoxComponent } from './attachment-box.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { ImageThumbModule } from '../image-thumb/image-thumb.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        AttachmentBoxComponent
    ],
    imports: [
        CommonModule,
        NgxFileDropModule,
        MatIconModule,
        CommonControlsSharedModule,
        ImageThumbModule,
        FlexLayoutModule,
        MatButtonModule,
        FormsModule
    ],
    exports: [
        AttachmentBoxComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class AttachmentBoxModule {
}
