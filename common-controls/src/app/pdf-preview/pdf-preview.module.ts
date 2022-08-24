import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatButtonModule, MatIconModule, MatTooltipModule } from '@angular/material';
import { PdfPreviewComponent } from './pdf-preview.component';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    PdfPreviewComponent
  ],
  imports: [
    FlexLayoutModule,
    CommonControlsSharedModule,
    MatIconModule,
    MatButtonModule,
    PdfViewerModule,
    CommonModule,
    MatTooltipModule
  ],
  exports: [
    PdfPreviewComponent
  ]
})
export class PdfPreviewModule { }
