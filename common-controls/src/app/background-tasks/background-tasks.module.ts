import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundUploadDialog } from './background-upload.dialog/background-upload.dialog';
import { MatToolbarModule, MatProgressBarModule, MatIconModule, MatButtonModule } from '@angular/material';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
  declarations: [
    BackgroundUploadDialog
  ],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
    CommonControlsSharedModule
  ],
  exports:[
    BackgroundUploadDialog
  ],
  entryComponents: [
    BackgroundUploadDialog
  ]
})
export class BackgroundTasksModule { }
