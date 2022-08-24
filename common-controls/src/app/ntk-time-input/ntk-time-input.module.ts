import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeInputComponent } from './ntk-time-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [TimeInputComponent],
  exports: [TimeInputComponent],
  imports: [
    CommonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class NtkTimeInputModule { }
