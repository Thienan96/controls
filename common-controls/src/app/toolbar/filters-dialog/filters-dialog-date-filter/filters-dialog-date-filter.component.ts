import {Component, ElementRef, Inject, OnInit} from '@angular/core';
import {DisplayItem, FilterDefinition, FilterOperator} from '../../../shared/models/common.info';
import {ToolbarService} from '../../shared/toolbar.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import moment from 'moment-es6';
import {FormControl, FormGroup} from '@angular/forms';
import {HelperService} from '../../../core/services/helper.service';
import {MatDatepicker, MatDatepickerInputEvent} from '@angular/material';
import {DateSelection, DateType, RelativeDateSelection} from '../../shared/toolbar.model';
import {DateValidatorsService} from '../../../core/services/date-validators.service';


@Component({
    selector: 'ntk-filters-dialog-date-filter',
    templateUrl: './filters-dialog-date-filter.component.html',
    styleUrls: ['./filters-dialog-date-filter.component.scss'],
    host: {
        '[class.ntk-toolbar-layout-column]': 'isSmallScreen'
    }
})
export class FiltersDialogDateFilterComponent implements OnInit {
    // ---------------Begin:Quick Date
    dateType: DateType;
    // ---------------End:Quick Date


    // ---------------Begin:Absolute Date

    // absoluteDateFrom
    private get absoluteDateFrom() {
        return this.controls.absoluteDateFrom.value;
    }

    private set absoluteDateFrom(value) {
        this.controls.absoluteDateFrom.setValue(value);
    }

    // absoluteDateTo
    private get absoluteDateTo() {
        return this.controls.absoluteDateTo.value;
    }

    private set absoluteDateTo(value) {
        this.controls.absoluteDateTo.setValue(value);
    }

    // ---------------End:Absolute Date

    // ---------Begin: Relative-Date From
    fromLastNext: string;
    fromPeriod: string;
    toLastNext: string;
    toPeriod: string;

    relative: any = {};

    // fromPeriodNumber
    private get fromPeriodNumber() {
        return this.controls.fromPeriodNumber.value;
    }

    private set fromPeriodNumber(value) {
        this.controls.fromPeriodNumber.setValue(value);
    }

    // toPeriodNumber
    private get toPeriodNumber() {
        return this.controls.toPeriodNumber.value;
    }

    private set toPeriodNumber(value) {
        this.controls.toPeriodNumber.setValue(value);
    }

    // ---------End: Relative-Date From


    // From - To
    from: moment.Moment;
    to: moment.Moment;
    title = '';
    preview: string; // Text preview on footer
    dateSelection: DateSelection;
    outDateFormat: string; // Date Format to display
    filter: FilterDefinition;
    form: FormGroup;
    isSmallScreen: boolean;

    constructor(private dialogRef: MatDialogRef<FiltersDialogDateFilterComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any,
                private toolbarService: ToolbarService,
                private helper: HelperService,
                private dateValidatorsService: DateValidatorsService,
                private elementRef: ElementRef) {
        if (data.outDateFormat) {
            this.outDateFormat = data.outDateFormat;
        }
        this.filter = data.filterDefinition;
        this.isSmallScreen = data.isSmallScreen;    

        this.form = new FormGroup({
            absoluteDateFrom: new FormControl(),
            absoluteDateTo: new FormControl('', {
                validators: (control: FormControl) => {
                    return this.validateAbsoluteDateTo(control);
                }
            }),
            fromPeriodNumber: new FormControl(),
            toPeriodNumber: new FormControl()
        }, {
            validators: () => {
                return this.validateForm();
            }
        });


        if (this.filter.Data) {
            this.restoreDataControl(this.filter.Data);
        }

    }

    get DateType() {
        return DateType;
    }

    get DateSelection() {
        return DateSelection;
    }

    get controls() {
        return this.form.controls;
    }

    ngOnInit() {
        this.updateHeight();
    }

    onCancel() {
        this.dialogRef.close(null);
    }

    private getFilterValues() {
        let filterOperator: FilterOperator;

        if (this.from) {
            filterOperator = FilterOperator.GreaterOrEqual;
        }
        if (this.to) {
            filterOperator = FilterOperator.LessOrEqual;
        }
        if (this.from && this.to) {
            filterOperator = FilterOperator.Between;
        }
        if (this.from === this.to) {
            filterOperator = FilterOperator.Equals;
        }
        if (!this.from && !this.to) {
            return {
                CheckedAll: true,
                SelectedItems: [],
                Value: [],
                FilterOperator: filterOperator
            };
        }

        let selectedItems: DisplayItem[] = this.toolbarService.getSelectedItemsFromDateFilter({
            filterOperator: filterOperator,
            from: this.from,
            to: this.to
        });

        let values = selectedItems.map((item) => {
            return item.Value;
        });
        return {
            SelectedItems: selectedItems,
            Value: values,
            FilterOperator: filterOperator,
            Relative: this.relative,
            DateSelection: this.dateSelection,
            DateType: this.dateType
        };
    }

    private now() {
        return window['moment'] ? window['moment']() : moment();
    }

    private toString(date: moment.Moment) {
        return date.format(this.outDateFormat.toUpperCase());
    }

    private buildPreview() {
        let html = this.helper.TranslationService.getTranslation('lbPreview') + ': ',
            preview,
            periodWeek = 'week';
        if (this.from && !this.to) {
            preview = this.helper.TranslationService.getTranslation('lbSince');
            if (this.dateSelection === DateSelection.RelativeDate && this.relative.from.period === periodWeek) {
                preview = preview + ' ' + this.from.format('dddd');
            }
            preview = preview + ' ' + this.toString(this.from);
        }
        if (!this.from && this.to) {
            preview = this.helper.TranslationService.getTranslation('lbUntil');
            if (this.dateSelection === DateSelection.RelativeDate && this.relative.to.period === periodWeek) {
                preview = preview + ' ' + this.to.format('dddd');
            }
            preview = preview + ' ' + this.toString(this.to);
        }
        if (this.from && this.to) {
            let strFrom = this.toString(this.from),
                strTo = this.toString(this.to);
            if (this.dateSelection === DateSelection.RelativeDate) {
                if (this.relative.from.period === periodWeek) {
                    strFrom = this.from.format('dddd') + ' ' + strFrom;
                }
                if (this.relative.to.period === periodWeek) {
                    strTo = this.to.format('dddd') + ' ' + strTo;
                }
            }

            preview = this.helper.UtilityService.formatText(this.helper.TranslationService.getTranslation('lbFromTo'), strFrom, strTo);
        }

        this.preview = preview ? html + preview : '';
    }


    /**
     * Restore date control
     * @param  data
     */
    private restoreDataControl(data) {
        this.dateSelection = data.DateSelection;
        this.relative = data.Relative;

        // Build Title
        this.title = this.toolbarService.getDisplayValue(this.filter, this.outDateFormat);

        // Quick Date
        if (data.DateSelection === DateSelection.QuickDate) {
            this.dateType = data.DateType;
            let dateRange = this.toolbarService.getDateRangeFromDateType(this.dateType);
            this.from = dateRange.from;
            this.to = dateRange.to;
        }

        // Absolute Date
        if (data.DateSelection === DateSelection.AbsoluteDate) {
            if (data.Relative.from) {
                this.from = moment(data.Relative.from, 'YYYY-MM-DD');
                this.absoluteDateFrom = this.from.toDate();
            }
            if (data.Relative.to) {
                this.to = moment(data.Relative.to, 'YYYY-MM-DD');
                this.absoluteDateTo = this.to.toDate();
            }
        }

        // Relative Date
        if (data.DateSelection === DateSelection.RelativeDate) {
            let date = this.now(),
                from: RelativeDateSelection = data.Relative.from,
                to: RelativeDateSelection = data.Relative.to;
            if (from) {
                this.from = this.toolbarService.getFromRelativeDate(date, from);
                this.fromLastNext = from.lastNext;
                this.fromPeriodNumber = from.periodNumber;
                this.fromPeriod = from.period;
            }
            if (to) {
                this.to = this.toolbarService.getToRelativeDate(date, to);
                this.toLastNext = to.lastNext;
                this.toPeriodNumber = to.periodNumber;
                this.toPeriod = to.period;
            }
        }
        this.buildPreview();
    }

    /*----------Begin: Quick date ---------*/
    onYesterdayButtonClicked() {
        this.dateType = this.dateType !== DateType.isYesterday ? DateType.isYesterday : null;
        this.buildQuickDate();
    }

    onTodayButtonClicked() {
        this.dateType = this.dateType !== DateType.isToday ? DateType.isToday : null;
        this.buildQuickDate();
    }

    onTomorrowButtonClicked() {
        this.dateType = this.dateType !== DateType.isTomorrow ? DateType.isTomorrow : null;
        this.buildQuickDate();
    }

    onLastWeekButtonClicked() {
        this.dateType = this.dateType !== DateType.isLastWeek ? DateType.isLastWeek : null;
        this.buildQuickDate();
    }

    onThisWeekButtonClicked() {
        this.dateType = this.dateType !== DateType.isThisWeek ? DateType.isThisWeek : null;
        this.buildQuickDate();
    }

    onNextWeekButtonClicked() {
        this.dateType = this.dateType !== DateType.isNextWeek ? DateType.isNextWeek : null;
        this.buildQuickDate();
    }

    onThisQuarterButtonClicked() {
        this.dateType = this.dateType !== DateType.isThisQuarter ? DateType.isThisQuarter : null;
        this.buildQuickDate();
    }

    onLastMonthButtonClicked() {
        this.dateType = this.dateType !== DateType.isLastMonth ? DateType.isLastMonth : null;
        this.buildQuickDate();
    }

    onThisMonthButtonClicked() {
        this.dateType = this.dateType !== DateType.isThisMonth ? DateType.isThisMonth : null;
        this.buildQuickDate();
    }

    onNextMonthButtonClicked() {
        this.dateType = this.dateType !== DateType.isNextMonth ? DateType.isNextMonth : null;
        this.buildQuickDate();
    }

    onThisYearButtonClicked() {
        this.dateType = this.dateType !== DateType.isThisYear ? DateType.isThisYear : null;
        this.buildQuickDate();
    }

    private buildQuickDate() {
        // Clear, update date
        this.clearAbsoluteDate();
        this.clearRelativeDate();

        let dateRange = this.toolbarService.getDateRangeFromDateType(this.dateType);
        this.from = dateRange.from;
        this.to = dateRange.to;
        this.relative = {};
        this.dateSelection = DateSelection.QuickDate;
        this.buildPreview();
    }

    private clearQuickDate() {
        this.dateType = null;
    }

    /*----------End: Quick date ---------*/


    /*----------Begin: Absolute date ---------*/
    onFromAbsoluteDateChange(ev: MatDatepickerInputEvent<any>) {
        if (ev.value) {
            this.from = moment(ev.value);
        } else {
            this.from = null;
        }
        if (this.absoluteDateTo) {
            this.to = moment(this.absoluteDateTo);
        } else {
            this.to = null;
        }

        this.buildAbsoluteDate();

    }

    onToAbsoluteDateChange(ev: MatDatepickerInputEvent<any>) {
        if (this.absoluteDateFrom) {
            this.from = moment(this.absoluteDateFrom);
        } else {
            this.from = null;
        }
        if (ev.value) {
            this.to = moment(ev.value);
        } else {
            this.to = null;
        }

        this.buildAbsoluteDate();
    }

    onClearAbsoluteDateFromButtonClicked(ev: MouseEvent) {
        ev.stopImmediatePropagation();

        this.absoluteDateFrom = null;
        this.from = null;
        this.relative.from = null;
        this.buildAbsoluteDate();
    }

    onClearAbsoluteDateToButtonClicked(ev: MouseEvent) {
        ev.stopImmediatePropagation();

        this.absoluteDateTo = null;
        this.to = null;
        this.relative.to = null;
        this.buildAbsoluteDate();
    }

    onOpenDateButtonClicked(datePicker: MatDatepicker<any>, $event: MouseEvent) {
        $event.stopImmediatePropagation();
        datePicker.open();
    }

    private buildAbsoluteDate() {
        this.clearQuickDate();
        this.clearRelativeDate();

        if (!this.from && !this.to) {
            this.dateSelection = null; // Reset dateSelection if from, to is null
        } else {
            this.dateSelection = DateSelection.AbsoluteDate;
        }


        // Build relative
        let from = this.from ? this.from.format('YYYY-MM-DD') : null,
            to = this.to ? this.to.format('YYYY-MM-DD') : null;
        this.relative = {
            from: from,
            to: to
        };


        // Validate absoluteDateTo
        this.form.controls.absoluteDateTo.markAsTouched(); // Set Touch to can show error
        this.form.controls.absoluteDateTo.updateValueAndValidity(); // Trigger validate absoluteDateTo

        this.buildPreview();
    }

    private clearAbsoluteDate() {
        this.absoluteDateFrom = null;
        this.absoluteDateTo = null;
    }

    private validateAbsoluteDateTo(control: FormControl) {
        if (this.dateSelection === DateSelection.AbsoluteDate) {
            let from = this.from ? this.from.toDate() : null;
            return this.dateValidatorsService.min(from)(control);
        }
    }

    /*----------End: Absolute date ---------*/


    /*----------Begin: Relative date ---------*/
    onFromLastNextChange() {
        this.buildRelativeDate();
    }

    onFromNumberChange() {
        this.buildRelativeDate();
    }

    onFromDateChange() {
        this.buildRelativeDate();
    }

    onToLastNextChange() {
        this.buildRelativeDate();
    }

    onToNumberChange() {
        this.buildRelativeDate();
    }

    onToDateChange() {
        this.buildRelativeDate();
    }

    onClearRelativeDateClicked() {
        this.clearQuickDate();
        this.clearAbsoluteDate();
        this.clearRelativeDate();

        // Clear dateSelection to reset primary color
        this.dateSelection = null;

        this.from = this.to = null;

        this.form.updateValueAndValidity();

        this.buildPreview();
    }

    private buildRelativeDate() {
        this.clearQuickDate();
        this.clearAbsoluteDate();

        let date: moment.Moment = this.now();
        // From
        if (this.fromLastNext && this.fromPeriodNumber && this.fromPeriod) {
            this.from = this.toolbarService.getFromRelativeDate(date, <RelativeDateSelection>{
                lastNext: this.fromLastNext,
                periodNumber: this.fromPeriodNumber,
                period: this.fromPeriod
            });
        } else {
            this.from = null;
        }

        // To
        if (this.toLastNext && this.toPeriodNumber && this.toPeriod) {
            this.to = this.toolbarService.getToRelativeDate(date, <RelativeDateSelection>{
                lastNext: this.toLastNext,
                periodNumber: this.toPeriodNumber,
                period: this.toPeriod
            });
        } else {
            this.to = null;
        }

        this.dateSelection = DateSelection.RelativeDate;

        // Set Relative
        let from: RelativeDateSelection, to: RelativeDateSelection;
        if (this.fromLastNext && this.fromPeriodNumber && this.fromPeriod) {
            from = <RelativeDateSelection>{
                lastNext: this.fromLastNext,
                periodNumber: this.fromPeriodNumber,
                period: this.fromPeriod
            };
        }
        if (this.toLastNext && this.toPeriodNumber && this.toPeriod) {
            to = <RelativeDateSelection>{
                lastNext: this.toLastNext,
                periodNumber: this.toPeriodNumber,
                period: this.toPeriod
            };
        }
        this.relative = {
            from: from,
            to: to
        };

        this.form.updateValueAndValidity();

        this.buildPreview();
    }

    /**
     * Clean relative date
     */
    private clearRelativeDate() {
        this.fromLastNext = null;
        this.fromPeriodNumber = null;
        this.fromPeriod = null;

        this.toLastNext = null;
        this.toPeriodNumber = null;
        this.toPeriod = null;
    }

    /*----------End: Relative date ---------*/

    private validateForm() {
        if (this.dateSelection === DateSelection.RelativeDate) {
            let from = this.from && this.from.toDate(),
                to = this.to && this.to.toDate();
            if (!this.dateValidatorsService.validateMin(from, to)) {
                return {'relative-min': true};
            }
        }

    }

    onSubmit() {
        if (this.form.valid) { // submit
            this.dialogRef.close(this.getFilterValues());
        }
    }

    onDatePickerOpened() {
        setTimeout(() => {
            $('.ntk-filters-dialog-date-filter-panel').closest('mat-dialog-container').addClass('ntk-filters-dialog-date-filter-dialog-container');
        }, 100);
    }

    updateHeight() {
        let offsetTop = $(this.elementRef.nativeElement).offset().top + 48;
        let dialogContent = $(this.elementRef.nativeElement).find('mat-dialog-content');
        let maxHeight = 'calc(95vh  - 52px - ' + offsetTop + 'px' + ')';
        dialogContent.css('max-height', maxHeight);
    }
}
