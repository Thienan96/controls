import { Component, OnInit, Input, OnChanges } from '@angular/core';
import moment from 'moment-es6';
import { CalendarDate, ExistingInsertionsPerDate } from '../../shared/models/common.info';

@Component({
  selector: 'ntk-year-calendar-month',
  templateUrl: './year-calendar-month.component.html',
  styleUrls: ['../year-calendar/year-calendar.component.css']
})
export class YearCalendarMonthComponent implements OnInit, OnChanges {
  @Input() year: number;
  @Input() month: number;
  @Input() selectedInsertionsDates: Date[];
  @Input() existingInsertionsPerDate: ExistingInsertionsPerDate[];
  @Input() selectedDates: CalendarDate[];
  @Input() highlightDateRange;
  @Input() selectedDateRange;
  monthName: string;
  days: number[];

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.monthName = moment(this.month + '', 'MM').format('MMMM');
    this.days = [];
    let firstDay = moment(this.year + '/' + this.month + '/1', 'YYYY/M/D');
    let numDays = firstDay.daysInMonth();
    // first day of week
    let daysOfWeek = firstDay.weekday();
    if (daysOfWeek === 0) {
      daysOfWeek = 7;
    }
    // fill blank days before the first day (value = 0)
    for (let i = 1; i < daysOfWeek; i++) {
      this.days.push(0);
    }

    for (let i = 1; i <= numDays; i++) {
      this.days.push(i);
    }

    // fill remaining days (value = -1)
    let remainDays = 37 - this.days.length;
    for (let i = 0; i < remainDays; i++) {
      this.days.push(-1);
    }

  }

}
