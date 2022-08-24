import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatIconModule, MatButtonModule, MatToolbarModule } from '@angular/material';


import { FlexLayoutModule } from '@angular/flex-layout';
import { PdfPreviewModule } from '../pdf-preview.module';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog.component';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { TextTruncationModule } from '../../text-truncation/text-truncation.module';



@NgModule({
  declarations: [
    PdfPreviewDialogComponent
  ],
  imports: [
    FlexLayoutModule,
    CommonControlsSharedModule,
    MatIconModule,
    MatButtonModule,
    PdfViewerModule,
    CommonModule,
    MatToolbarModule,
    PdfPreviewModule,
    TextTruncationModule
  ],
  exports: [
    PdfPreviewDialogComponent
  ],
  entryComponents: [
    PdfPreviewDialogComponent
  ]
})
export class PdfPreviewDialogModule { }
