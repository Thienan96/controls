import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DurationInputComponent } from './ntk-duration-input.component';


@NgModule({
  declarations: [DurationInputComponent],
  exports: [DurationInputComponent],
  imports: [
    CommonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class NtkDurationInputModule { }
