import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberComponent } from './ntk-number-input.component';
import { InputPercentComponent } from './ntk-percent-input.component';


@NgModule({
  declarations: [InputNumberComponent, InputPercentComponent],
  exports: [InputNumberComponent, InputPercentComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class NtkNumberInputModule { }
