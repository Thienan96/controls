import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ContentChildren,
    ElementRef,
    Inject,
    Input,
    QueryList
} from '@angular/core';
import {
    IEvent,
    IOptions,
    NTK_DETAILS_CALENDARDAY,
    NTK_DETAILS_CALENDARDAY_COLUMN
} from '../shared/models/details-calendar.model';
import {DetailsCalendarService} from '../shared/details-calendar.service';
import {DetailsCalendarDayEventComponent} from '../details-calendar-day-event/details-calendar-day-event.component';
import {startWith} from 'rxjs/operators';

@Component({
    selector: 'ntk-details-calendar-day-column',
    templateUrl: './details-calendar-day-column.component.html',
    styleUrls: ['./details-calendar-day-column.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.is-small-screen]': 'isSmallScreen'
    },
    providers: [{provide: NTK_DETAILS_CALENDARDAY_COLUMN, useExisting: DetailsCalendarDayColumnComponent}]
})
export class DetailsCalendarDayColumnComponent implements AfterViewInit {
    @ContentChildren(DetailsCalendarDayEventComponent) eventComponents: QueryList<DetailsCalendarDayEventComponent>;
    @Input() events: IEvent[] = [];
    isSmallScreen = false;
    ready = false;

    constructor(private detailsCalendarService: DetailsCalendarService,
                public elementRef: ElementRef,
                @Inject(NTK_DETAILS_CALENDARDAY) private detailsCalendarComponent: any) {
    }

    get options(): IOptions {
        return this.detailsCalendarComponent.options;
    }

    ngAfterViewInit() {
        this.eventComponents.changes.pipe(startWith(this.eventComponents)).subscribe(() => {
            this.updateLayout();
        });
    }

    onResize() {
        this.updateLayout();
    }

    updateLayout() {
        this.detailsCalendarService.formatEvents(this.events, this.options);
        this.checkScreen();
        if (this.eventComponents) {
            this.eventComponents.forEach((eventComponent) => {
                eventComponent.updateLayout();
            });
        }
    }

    private checkScreen() {
        if (this.events) {
            let columnTotal = 0;
            this.events.forEach((event) => {
                if (columnTotal <= event.columnTotal) {
                    columnTotal = event.columnTotal;
                }
            });
            this.isSmallScreen = ($(this.elementRef.nativeElement).width() / columnTotal) < 15;
        }
    }
}
