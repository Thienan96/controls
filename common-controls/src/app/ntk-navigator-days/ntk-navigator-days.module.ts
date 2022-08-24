import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NtkNavigatorDaysComponent } from './ntk-navigator-days.component';
import { MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule } from '@angular/material';
import { WeekNumberPipe } from './week-number.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
    declarations: [NtkNavigatorDaysComponent, WeekNumberPipe],
    exports: [NtkNavigatorDaysComponent],
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatDatepickerModule,
        FormsModule,
        ReactiveFormsModule,
    ]
})
export class NtkNavigatorDaysModule { }
