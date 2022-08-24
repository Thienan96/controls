import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material';
import * as moment_ from 'moment';
const moment = moment_;

@Component({
  selector: 'ntk-navigator-days',
  templateUrl: './ntk-navigator-days.component.html',
  styleUrls: ['./ntk-navigator-days.component.scss']
})
export class NtkNavigatorDaysComponent implements OnChanges {
  @Input() duration: [number, 'days' | 'weeks'] = [1, 'days'];
  @Input() showNavigator = true;
  @Input() showWeek = true;
  @Input() fromDate: Date; // UTC date
  @Output() navigatorChange = new EventEmitter();
  toDate: Date;
  toDay = new Date();
  constructor() { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['duration'] && this.duration) {
      this.computeFromDate();
    }
  }

  computeFromDate(date?: Date) {
    const d = date ? date : this.toDay;
    if (this.duration[1] === 'days') {
      this.fromDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    } else if (this.duration[1] === 'weeks') {
      const mondayOfWeek = moment(d).startOf('isoWeek').toDate();
      this.fromDate = new Date(Date.UTC(mondayOfWeek.getFullYear(), mondayOfWeek.getMonth(), mondayOfWeek.getDate()));
    }
    this.computeToDate();
  }

  goToFuture() {
    this.fromDate = this.getDate(this.fromDate, this.duration);
    this.computeToDate();
  }

  goToToday() {
    this.computeFromDate();
  }

  goToPast() {
    this.fromDate = this.getDate(this.fromDate, [-this.duration[0], this.duration[1]]);
    this.computeToDate();
  }

  computeToDate() {
    this.toDate = this.getDate(this.fromDate, this.duration, true);
    this.navigatorChange.emit([this.fromDate, this.toDate]);
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    this.computeFromDate(event.value);
  }

  getDate(date: Date, duration: [number, 'days' | 'weeks'], shouldMinusOneDay?: boolean): Date {
    const [increment, unit] = duration;
    let newDate = moment(date);
    let result = !shouldMinusOneDay ? newDate.add(increment, unit) : newDate.add(increment, unit).add(-1, 'day');
    return result.toDate();
  }
}
