import {Component, ElementRef, Inject, Injector, Input, OnInit} from '@angular/core';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {NTK_DETAILS_CALENDARDAY} from '../shared/models/details-calendar.model';

@Component({
    selector: 'ntk-details-calendar-day-header',
    templateUrl: './details-calendar-day-header.component.html',
    styleUrls: ['./details-calendar-day-header.component.scss'],
    host: {
        '[style.paddingRight.px]': 'paddingRight',
        '[class.is-small-screen]': 'isSmallScreen'
    }
})
export class DetailsCalendarDayHeaderComponent implements OnInit {
    @Input() index: number;
    paddingRight: number;
    isSmallScreen: boolean;

    constructor(private elementRef: ElementRef,
                private injector: Injector,
                private detailsCalendarService: DetailsCalendarService,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    ngOnInit() {
        this.updateLayout();
    }

    onResize() {
        this.updateLayout();
    }

    updateLayout() {
        this.paddingRight = this.detailsCalendarService.getDaySpacing(this.detailsCalendarComponent.daysLength, this.detailsCalendarComponent.isSplit, this.index);
        this.isSmallScreen = $(this.elementRef.nativeElement).width() < 160; // the same old version
    }
}
