import { Component, OnInit, Input, OnChanges } from '@angular/core';
import moment from 'moment-es6';
import { CalendarDate, ExistingInsertionsPerDate } from '../../shared/models/common.info';

@Component({
  selector: 'ntk-year-calendar-day',
  templateUrl: './year-calendar-day.component.html',
  styleUrls: ['../year-calendar/year-calendar.component.css']
})
export class YearCalendarDayComponent implements OnInit, OnChanges {
  @Input() year: number;
  @Input() month: number;
  @Input() day: number;
  @Input() selectedInsertionsDates: Date[];
  @Input() existingInsertionsPerDate: ExistingInsertionsPerDate[];
  @Input() selectedDates: CalendarDate[];
  @Input() highlightDateRange;
  @Input() selectedDateRange;
  date: Date;
  isWeekend = false;
  isSelectedDate = false;
  isSelectedInsertions = false;
  isExistingInsertions = false;
  dateString: string;
  dayName: string;
  isHighlight = false;
  selectedCount = 0;
  existingInsertionsCount = 0;
  tooltip: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges() {
    this.isWeekend = false;
    this.isSelectedDate = false;
    this.isSelectedInsertions = false;
    this.isExistingInsertions = false;
    this.isHighlight = false;
    this.dateString = '';
    this.dayName = '';

    if (this.day > 0) {
      this.date = moment(this.year + '/' + this.month + '/' + this.day, 'YYYY/M/D').toDate();
      this.dateString = moment(this.date).format('DD/MM/YYYY');
      this.dayName = moment(this.date).format('dddd');
      let daysOfWeek = moment(this.date).weekday();
      this.isWeekend = daysOfWeek === 6 || daysOfWeek === 0;
      this.tooltip = this.dayName + ' ' + this.dateString;

      // check existing date and selected dates
      if (this.selectedInsertionsDates && this.selectedInsertionsDates.length > 0) {
        this.isSelectedInsertions = !!this.selectedInsertionsDates.find((d) => moment(d).format('DD/MM/YYYY') === this.dateString);
      }

      if (this.existingInsertionsPerDate && this.existingInsertionsPerDate.length > 0) {
        let found = this.existingInsertionsPerDate.find((d) => moment(d.Date).format('DD/MM/YYYY') === this.dateString);
        if (found) {
          this.isExistingInsertions = true;
          this.existingInsertionsCount = found.NbrInsertions;

          // display the number of existing insertions per title in the tooltip
          found.DetailPerTitle.forEach(item => {
            this.tooltip += '\n' + item.Title + ': ' + item.NbrInsertions.toString();
          });
        }

      }

      if (this.selectedDates && this.selectedDates.length > 0) {
        let found = this.selectedDates.find((d) => moment(d.Date).format('DD/MM/YYYY') === this.dateString);
        if (found) {
          this.isSelectedDate = true;
          this.selectedCount = found.Count;
        }
      }

      // set highlight date (when drag the grid)
      if (this.highlightDateRange) {
        let start = this.highlightDateRange.StartDate;
        let end = this.highlightDateRange.EndDate;
        if (start && end) {
          if (moment(this.date).isSameOrAfter(start) && moment(this.date).isSameOrBefore(end)) {
            this.isHighlight = true;
          }
        }
      }

      // set selected date range (when drag the grid)
      if (this.selectedDateRange) {
        let start = this.selectedDateRange.StartDate;
        let end = this.selectedDateRange.EndDate;
        if (start && end) {
          if (moment(this.date).isSameOrAfter(start) && moment(this.date).isSameOrBefore(end)) {
            if (this.isSelectedDate)
              this.removeSelectedDate(true);
            else
              this.addSelectedDate();
          }
        }
        // reset
        this.selectedDateRange = undefined;
      }
    }
  }

  getClass() {
    if (this.day === 0 || this.day === -1) {
      return 'invalid-day';
    }

    let className = '';
    if (this.isSelectedInsertions) {
      className = 'selected-insertions ';
    }
    else if (this.isExistingInsertions) {
      className = 'existing-insertions ';
    }

    if (this.isSelectedDate) {
      className += 'selected-day';
    }
    else if (this.isHighlight) {
      className += 'highlight';
    }
    else if (this.isWeekend) {
      className += 'weekend-day';
    }
    else if (this.day > 0) {
      className += 'normal-day';
    }

    return className;
  }

  onClick(event: MouseEvent) {
    // media-32:
    // a click on a cell = set 1 new insertion on that date if none currently, or else reset to 0 the new insertion(s) on that date;
    // a [cltr]+click = add 1 new insertion on that date;
    // a [shift]+click = remove 1 new insertion on that date (if at least 1 new on that date).
    if (this.day <= 0) { return; }

    // if at least 1 new on that date
    if (this.isSelectedDate) {
      if (event.ctrlKey && !event.shiftKey) { // [cltr]+click
        this.addSelectedDate();
      }
      else if (event.shiftKey && !event.ctrlKey) { // [shift]+click
        this.removeSelectedDate(false);
      }
      else { // click
        this.removeSelectedDate(true);
      }

    }
    else {
      if (!event.shiftKey || event.ctrlKey) { // [cltr]+click
        this.addSelectedDate();
      }
    }
  }

  private removeSelectedDate(isReset: boolean) {
    // find the index of the date in array of selected dates
    let index = this.selectedDates.findIndex((d) => moment(d.Date).format('DD/MM/YYYY') === this.dateString);
    if (index >= 0) {
      if (isReset) { // click
        this.isSelectedDate = false;
        this.selectedCount = 0;
        this.selectedDates.splice(index, 1);
      }
      else { // [shift]+click
        this.selectedCount--;
        this.selectedDates[index].Count = this.selectedCount;
        if (this.selectedCount === 0) {
          this.isSelectedDate = false;
          this.selectedDates.splice(index, 1);
        }
      }
    }
  }

  private addSelectedDate() {
    // find the date in array of selected dates
    let found = this.selectedDates.find((d) => moment(d.Date).format('DD/MM/YYYY') === this.dateString);
    if (found) {
      this.selectedCount++;
      found.Count = this.selectedCount;
    }
    else {
      this.isSelectedDate = true;
      this.selectedCount = 1;
      this.selectedDates.push({ Date: this.date, Count: this.selectedCount });
    }
  }

}
