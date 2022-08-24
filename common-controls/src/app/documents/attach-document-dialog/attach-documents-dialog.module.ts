import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { AttachDocumentsDialog } from './attach-documents.dialog';
import { MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { DocumentsListModule } from '../documents-list/documents-list.module';
import { PdfPreviewModule } from '../../pdf-preview/pdf-preview.module';
import { DocumentViewModule } from '../document-view/document-view.module';
import {UploadFilesDialogModule} from '../upload-files-dialog/upload-files-dialog.module';


@NgModule({
    declarations: [
        AttachDocumentsDialog
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        CommonControlsSharedModule,
        MatToolbarModule,
        FormsModule,
        MatDividerModule,
        DocumentsListModule,
        PdfPreviewModule,
        DocumentViewModule,
        MatButtonModule,
        MatDialogModule,
        UploadFilesDialogModule
    ],
    exports: [
        AttachDocumentsDialog
    ],
    entryComponents: [
        AttachDocumentsDialog
    ],
    providers: []
})
export class AttachDocumentsDialogModule {
}
