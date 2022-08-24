import { Component, OnInit, Input } from '@angular/core';
import moment from 'moment-es6';
import { CalendarDate, ExistingInsertionsPerDate } from '../../shared/models/common.info';

@Component({
  selector: 'ntk-year-calendar',
  templateUrl: './year-calendar.component.html',
  styleUrls: ['./year-calendar.component.css']
})
export class YearCalendarComponent implements OnInit {
  @Input() year: number;
  @Input() selectedInsertionsDates: Date[];
  @Input() existingInsertionsPerDate: ExistingInsertionsPerDate[];
  @Input() selectedDates: CalendarDate[];
  highlightDateRange: any;
  selectedDateRange: any;

  months: number[];
  headers: string[];
  MAX_COLS = 37; // total columns in calendar

  constructor() {

  }

  ngOnInit() {
    // add header
    this.headers = [];
    let daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < this.MAX_COLS; i++) {
      this.headers.push(daysOfWeek[i % 7]);
    }

    // add months
    this.months = [];
    for (let i = 1; i <= 12; i++) {
      this.months.push(i);
    }

    this.bindDragable();
  }

  goPrevYear() {
    this.year--;
  }

  goNextYear() {
    this.year++;
  }

  bindDragable() {
    let isSelecting = false;
    let startDate: any;
    let endDate: any;
    let _self = this;

    $(document).keyup(function (e) {
      if (e.key === 'Escape') {
        // cancel selection if press Esc key
        if (isSelecting) {
          isSelecting = false;
          _self.highlightDateRange = {};

        }
      }
    });

    // select a range of dates by dragging the cells in calendar
    $(document)
      .mousedown(function (e) {
        startDate = undefined;
        endDate = undefined;

        // find day container
        let startElement;
        if (e.target['id'] === 'day-container') {
          startElement = e.target;
        }
        else if (e.target['id'] === 'day-number' || e.target['id'] === 'day-count') {
          startElement = e.target.parentElement;
        }

        if (startElement) {
          let month = _self.findMonth(startElement);
          let day = _self.findDay(startElement);

          // if found, update selected start date
          if (month > 0 && day > 0) {
            startDate = moment(_self.year + '/' + month + '/' + day, 'YYYY/M/D').toDate();
            isSelecting = true;
          }
          else {
            isSelecting = false;
          }
          return false; // prevent text selection
        }
      })
      .mouseover(function (e) {
        // drag only if the user select a valid start date and do not press Esc key
        if (isSelecting) {
          // find element YearCalendarDayComponent
          let endElement;
          if (e.target['id'] === 'day-container') {
            endElement = e.target;
          }
          else if (e.target['id'] === 'day-number' || e.target['id'] === 'day-count') {
            endElement = e.target.parentElement;
          }

          if (endElement) {
            let month = _self.findMonth(endElement);
            let day = _self.findDay(endElement);

            // if found, update selected end date
            if (month > 0 && day > 0) {
              // if the end cell is valid date, end date is the date in that cell
              endDate = moment(_self.year + '/' + month + '/' + day, 'YYYY/M/D').toDate();
            }
            else if (month > 0) {
              if (day === 0 || day === undefined) {
                // if the end cell is before the first date of a month
                // - if month of start date < month of end cell: the end date is the last date of the previous month of end cell
                // - if month of start date >= month of end cell: the end date is the first date of month of end cell
                if (moment(startDate).month() + 1 < (month)) {
                  let lastDay = moment(_self.year + '/' + (month - 1) + '/' + 1, 'YYYY/M/D').daysInMonth();
                  endDate = moment(_self.year + '/' + (month - 1) + '/' + lastDay, 'YYYY/M/D').toDate();
                }
                else {
                  endDate = moment(_self.year + '/' + month + '/' + 1, 'YYYY/M/D').toDate();
                }
              }
              else if (day === -1) {
                // if the end cell is after the last date of a month
                // - if month of start date <= month of end cell: the end date is the last date of month of end cell
                // - if month of start date > month of end cell: the end date is the first date of the next month of end cell
                if (moment(startDate).month() + 1 <= month) {
                  let lastDay = moment(_self.year + '/' + month + '/' + 1, 'YYYY/M/D').daysInMonth();
                  endDate = moment(_self.year + '/' + month + '/' + lastDay, 'YYYY/M/D').toDate();
                }
                else {
                  endDate = moment(_self.year + '/' + (month + 1) + '/' + 1, 'YYYY/M/D').toDate();
                }
              }
            }

            // make sure StartDate < EndDate before highlight the selected date
            if (moment(startDate).isSameOrBefore(endDate)) {
              _self.highlightDateRange = { StartDate: startDate, EndDate: endDate };
            }
            else if (moment(startDate).isSameOrAfter(endDate)) {
              _self.highlightDateRange = { StartDate: endDate, EndDate: startDate };
            }
            return false; // prevent text selection
          }
        }
      })
      .mouseup(function (e) {
        // drag only if the user select a valid start date and do not press Esc key
        if (isSelecting) {
          isSelecting = false;

          // make sure StartDate < EndDate before updating selected dates
          if (moment(startDate).isSameOrBefore(endDate)) {
            _self.selectedDateRange = { StartDate: startDate, EndDate: endDate };
          }
          else if (moment(startDate).isSameOrAfter(endDate)) {
            _self.selectedDateRange = { StartDate: endDate, EndDate: startDate };
          }
          else {
            _self.selectedDateRange = {};
          }
          _self.highlightDateRange = {};

        }
      });

  }

  // find the month from clicked element
  findMonth(element: any) {
    let month = 0;
    let parent = document.getElementById('calendar-detail');
    if (parent) {
      month = Math.floor((element.offsetTop - parent.offsetTop) / element.offsetHeight) + 1;
    }
    return month;
  }

  // find the day from clicked element
  findDay(element: any) {
    let day = 0;
    let dayElement;
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i]['id'] === 'day-number') {
        dayElement = element.children[i];
        break;
      }
    }
    if (dayElement) {
      day = +dayElement.innerText;
    }
    return day;
  }
}
