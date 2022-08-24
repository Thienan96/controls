import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { UploadFilesDialog } from './upload-files-dialog.component';
import { MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatProgressBarModule, MatToolbarModule } from '@angular/material';
import { FileItemComponent } from './file-item/file-item.component';
import { FileDropModule } from '../file-drop/file-drop.module';
import { TextTruncationModule } from '../../text-truncation/text-truncation.module';


@NgModule({
    declarations: [
        UploadFilesDialog,
        FileItemComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        FlexLayoutModule,
        MatToolbarModule,
        CommonControlsSharedModule,
        FileDropModule,
        TextTruncationModule,
        MatProgressBarModule,
        MatDividerModule,
        MatDialogModule,
        MatButtonModule
    ],
    exports: [
        UploadFilesDialog
    ],
    entryComponents: [
        UploadFilesDialog
    ],
    providers: []
})
export class UploadFilesDialogModule {
}
