import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataFieldComponent } from './data-field.component';
import { TextTruncationModule } from '../text-truncation/text-truncation.module';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { MatIconModule, MatButtonModule, MatTooltipModule } from '@angular/material';
import { FlexModule } from '@angular/flex-layout';
import { OverlayModule } from '@angular/cdk/overlay';



@NgModule({
  declarations: [
    DataFieldComponent
  ],
  imports: [
    CommonModule,
    CommonControlsSharedModule,
    TextTruncationModule,
    MatIconModule,
    MatButtonModule,
    FlexModule,
    MatTooltipModule,
    OverlayModule
  ],
  exports: [
    DataFieldComponent
  ]
})
export class DataFieldModule { }
