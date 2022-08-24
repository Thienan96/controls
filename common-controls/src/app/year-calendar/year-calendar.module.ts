import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YearCalendarComponent } from './year-calendar/year-calendar.component';
import { YearCalendarMonthComponent } from './year-calendar-month/year-calendar-month.component';
import { YearCalendarDayComponent } from './year-calendar-day/year-calendar-day.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../material.module';


@NgModule({
  declarations: [YearCalendarComponent, YearCalendarMonthComponent, YearCalendarDayComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MaterialModule
  ],
  exports: [
    YearCalendarComponent,
    YearCalendarMonthComponent,
    YearCalendarDayComponent
],
})
export class YearCalendarModule { }
