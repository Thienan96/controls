import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiLinesFieldComponent } from './multi-lines-field-component/multi-lines-field.component';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { FlexModule } from '@angular/flex-layout';



@NgModule({
  declarations: [MultiLinesFieldComponent],
  imports: [
    CommonModule,
    CommonControlsSharedModule,    
    FlexModule    
  ],
  exports:[
    MultiLinesFieldComponent
  ]
})
export class MultiLinesFieldModule { }
