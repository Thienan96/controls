import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatIconModule, MatButtonModule } from '@angular/material';
import { BackgroundTasksModule } from '../../background-tasks/background-tasks.module';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { ImageThumbModule } from '../image-thumb/image-thumb.module';
import { AttachmentBoxMobileComponent } from './attachment-box-mobile.component';

@NgModule({
    declarations: [
        AttachmentBoxMobileComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        CommonControlsSharedModule,
        ImageThumbModule,
        FlexLayoutModule,
        MatButtonModule,
        FormsModule,
        BackgroundTasksModule
    ],
    exports: [
        AttachmentBoxMobileComponent
    ],
})
export class AttachmentBoxMobileModule {
}
