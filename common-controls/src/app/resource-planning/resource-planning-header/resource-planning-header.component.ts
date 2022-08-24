import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IResourcePlanningHeaderColumn, ResourcePlanningViewMode} from '../shared/resource-planning.model';
import moment from 'moment-es6';
import {ResourcePlanningService} from '../shared/resource-planning.service';


@Component({
    selector: 'ntk-resource-planning-header',
    templateUrl: './resource-planning-header.component.html',
    styleUrls: ['./resource-planning-header.component.scss'],
    host: {
        '[class.ntk-resource-planning-header-view-mode-week]': 'viewMode === ViewMode.Week',
        '[class.ntk-resource-planning-header-view-mode-month]': 'viewMode === ViewMode.Month'
    }
})
export class ResourcePlanningHeaderComponent implements OnInit, OnChanges {
    @Input() dates: string[];
    @Input() viewMode: ResourcePlanningViewMode;
    @Input() daysOfWeek: number;
    @Input() resourcesCalendarWidth: number;

    isShowFullDate = false;
    isLineBreak = false;
    headerDates: IResourcePlanningHeaderColumn[];
    months: any[];
    weeks: any[];
    $element: JQuery;

    constructor(private elementRef: ElementRef, private resourcePlanningService: ResourcePlanningService) {
        this.$element = $(this.elementRef.nativeElement);
    }

    get ViewMode() {
        return ResourcePlanningViewMode;
    }

    ngOnInit() {
        this.headerDates = this.getColumns(this.dates);
        this.months = this.getMonths(this.headerDates);
        this.weeks = this.getWeeks(this.headerDates);
        if (this.viewMode === ResourcePlanningViewMode.Week) {
            this.computeHeaderText();
        }

        this.resourcePlanningService.getResize().subscribe(() => {
            if (this.viewMode === ResourcePlanningViewMode.Week) {
                this.computeHeaderText();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.dates && !changes.dates.isFirstChange()) {
            this.headerDates = this.getColumns(changes.dates.currentValue);
            this.months = this.getMonths(this.headerDates);
            this.weeks = this.getWeeks(this.headerDates);
            if (this.viewMode === ResourcePlanningViewMode.Week) {
                this.computeHeaderText();
            }
        }
    }

    /**
     * Compute text of header
     */
    private computeHeaderText() {
        let width = 0,
            dates = this.dates;
        if (dates.length > 0) {
            let percent = 100 / dates.length;
            if (this.viewMode === ResourcePlanningViewMode.Week) {
                percent = (100 - (dates.length / this.daysOfWeek) + 1) / dates.length;
            }
            width = (this.$element.width()) * percent / 100;
        }
        this.isShowFullDate = width >= 100;
        this.isLineBreak = width < 45;
    }

    /**
     * Get columns from dates
     * @param {string[]} dates
     * @returns {IResourcePlanningHeaderColumn[]}
     */
    private getColumns(dates: string[]): IResourcePlanningHeaderColumn[] {
        return this.resourcePlanningService.getDatesPosition(dates, this.viewMode, this.daysOfWeek);
    }

    /**
     * Get months by dates
     * @param {IResourcePlanningHeaderColumn[]} dates
     * @returns {any[]}
     */
    private getMonths(dates: IResourcePlanningHeaderColumn[]) {
        let months: any[] = [];
        dates.forEach((date: IResourcePlanningHeaderColumn) => {
            let month = moment(date.date).format('YYYY-MM');
            let monthObj = months.find((m) => {
                return m.month === month;
            });
            if (!monthObj) {
                months.push({
                    month: month,
                    monthTitle: moment(month, 'YYYY-MM').format('MMMM'),
                    dates: []
                });
            } else {
                monthObj.dates.push(date);
            }
        });
        return months;
    }

    /**
     * Get weeks from dates
     * @param {IResourcePlanningHeaderColumn[]} dates
     * @returns {any[]}
     */
    private getWeeks(dates: IResourcePlanningHeaderColumn[]) {
        let weeks = [];
        dates.forEach((dateObj) => {
            let date = dateObj.date;
            let weekOfYear = moment(date, 'YYYY-MM-DD').isoWeek();
            let week = weeks.find((w) => {
                return w.weekOfYear === weekOfYear;
            });
            if (!week) {
                weeks.push({
                    weekOfYear: weekOfYear,
                    dates: [date],
                    title: weekOfYear
                });
            } else {
                week.dates.push(date);
            }
        });
        let left = 0;
        weeks.forEach((week) => {
            let width = (week.dates.length / dates.length) * 100;
            week.width = width;
            week.left = left;
            left = left + width;
        });
        return weeks;

    }

}
