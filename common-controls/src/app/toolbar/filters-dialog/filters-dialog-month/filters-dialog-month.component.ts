import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DateAdapter, MatCalendar, MatDateFormats, MatDatepicker, MatDialogRef, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_DIALOG_DATA } from '@angular/material';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment-es6';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilterDefinition } from '../../../shared/models/common.info';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MMM YYYY',
  },
  display: {
    dateInput: 'MMM YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMM YYYY',
  },
};

@Component({
  selector: 'ntk-filters-dialog-month',
  templateUrl: './filters-dialog-month.component.html',
  styleUrls: ['./filters-dialog-month.component.css'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class FiltersDialogMonthComponent implements OnInit, AfterViewInit {
  @ViewChild('datePicker', { static: true }) datePicker: MatDatepicker<moment.Moment>;
  filter: FilterDefinition;
  isSmallScreen: boolean;
  date: any;
  calendarHeader = FilterMonthCalendarHeader;

  constructor(private dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) data: any) {
    this.filter = data.filterDefinition;
    this.isSmallScreen = data.isSmallScreen;
  }

  ngOnInit() {
    this.restoreData();
  }

  ngAfterViewInit() {
    this.datePicker.open();
  }

  public onSubmit() {
    this.onOk();
  }

  public onOk() {
    if (this.date) {
      this.dialogRef.close({Value: [moment(this.date).format('YYYY-MM')]});
    }
  }

  public onCancel() {
    this.dialogRef.close(null);
  }

  private restoreData() {
    // Restore data
    if (this.filter.Value && this.filter.Value.length > 0) {
      let value = this.filter.Value[0];
      this.date = moment(value, 'YYYY-MM').toDate();
    } else {
      this.date = '';
    }
  }

  monthSelected(normalizedMonth: moment.Moment) {
    this.date = moment(normalizedMonth).toDate();
    this.datePicker.close();
    this.onOk();
  }

}

/** Custom header component for datepicker. */
@Component({
  selector: 'month-calendar-header',
  styles: [`
    .calendar-header {
      display: flex;
      align-items: center;
      padding: 0.5em;
    }
  `],
  template: `
    <div class="calendar-header">
      <button mat-icon-button (click)="previousClicked()">
        <mat-icon>keyboard_arrow_left</mat-icon>
      </button>
      <button mat-button fxFlex (click)="titleClicked()">
        {{periodLabel}}
      </button>
      <button mat-icon-button (click)="nextClicked()">
        <mat-icon>keyboard_arrow_right</mat-icon>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterMonthCalendarHeader<D> implements OnDestroy {
  private _destroyed = new Subject<void>();
  periodLabel: string;

  constructor(
      private _calendar: MatCalendar<D>, private _dateAdapter: DateAdapter<D>,
      @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats, private cdr: ChangeDetectorRef) {
    _calendar.stateChanges
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => {
          this.updatePeriodLabel();
          cdr.markForCheck();
        });
        this.getPeriodLabel();
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  getPeriodLabel() {
    if (this._calendar.currentView === 'year') {
      this.periodLabel = moment(this._calendar.activeDate).year().toString();
    }
    else if (this._calendar.currentView === 'multi-year'){
      let view = this._calendar.multiYearView;
      if (view && view._years && view._years.length > 0) {
        let start = view._years[0];
        let end = view._years[view._years.length - 1];
        let startValue = start[0].value;
        let endValue = end[end.length - 1].value;
        this.periodLabel = startValue + ' - ' + endValue;
      }
      else {
        this.periodLabel = moment(this._calendar.activeDate).year().toString();
      }
    }
    return this.periodLabel;
  }

  updatePeriodLabel() {
    setTimeout(() => {
      this.getPeriodLabel();
      this.cdr.detectChanges();
    });
  }

  previousClicked() {
    this._calendar.activeDate = this._dateAdapter.addCalendarYears(this._calendar.activeDate, this._calendar.currentView === 'year' ? -1 : -24);
    this.updatePeriodLabel();
  }

  nextClicked() {
    this._calendar.activeDate = this._dateAdapter.addCalendarYears(this._calendar.activeDate, this._calendar.currentView === 'year' ? 1 : 24);
    this.updatePeriodLabel();
  }

  titleClicked() {
    if (this._calendar.currentView === 'year' ) {
      this._calendar.currentView = 'multi-year';
      this.updatePeriodLabel();
    }
  }

}