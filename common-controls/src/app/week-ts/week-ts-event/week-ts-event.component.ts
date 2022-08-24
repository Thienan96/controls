import {
    AfterContentInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    Input,
    Output
} from '@angular/core';
import {
    IWeekTSEvent,
    IWeekTsPosition,
    NTK_WEEK_TS,
    NTK_WEEK_TS_DAY_PLANNING,
    WeekTsComponentInterface,
    WeekTsDayPlanningComponentInterface
} from '../shared/week-ts.model';
import {WeekTsService} from '../shared/week-ts-service';

@Component({
    selector: 'ntk-week-timesheet-event',
    templateUrl: './week-ts-event.component.html',
    styleUrls: ['./week-ts-event.component.scss'],
    host: {
        '[class.selected]': 'event.Id === weekTs.selected?.Id',
        '[class.hasNeighbour]': 'hasNeighbour',
        '[style.left.%]': 'position.left',
        '[style.width.%]': 'position.width',
        '[style.top.px]': 'position.top',
        '[style.bottom.px]': 'position.bottom',
        '[style.zIndex]': 'zIndex',
        '[class.outside]': '(position.left>=100) || (position.left + position.width< 0.0003)'
    }
})
export class WeekTsEventComponent implements AfterContentInit {
    @Input() event: IWeekTSEvent;
    @Input() canResize = false;
    @Output() dblClick = new EventEmitter<IWeekTSEvent>();
    @Output() remove = new EventEmitter();
    @Output() select = new EventEmitter();
    position: IWeekTsPosition = {
        left: 0,
        width: 0,
        top: 0,
        bottom: 0
    };
    zIndex = 0;
    hasNeighbour = false;

    constructor(private elementRef: ElementRef,
                private weekTsService: WeekTsService,
                @Inject(NTK_WEEK_TS) public weekTs: WeekTsComponentInterface,
                @Inject(NTK_WEEK_TS_DAY_PLANNING) private weekTsDayPlanningComponent: WeekTsDayPlanningComponentInterface) {
    }

    get options() {
        return this.weekTs.options;
    }

    ngAfterContentInit() {
        // Focus event if event is selected
        if (this.weekTs.selected && this.event.Id === this.weekTs.selected.Id) {
            this.setFocus();
        }
        this.updateLayout();

    }

    updateLayout() {
        let event = this.weekTsDayPlanningComponent.getEvent(this.event);
        if (event) {
            this.zIndex = event.zIndex;
            this.hasNeighbour = event.hasNeighbour;
            this.position = this.weekTsService.getPosition(this.event, this.options, event.column);
        }
    }

    @HostListener('click', [`$event`]) onClick(ev: MouseEvent) {
        if (!this.weekTs.isDraggingToCreate) {
            ev.stopPropagation();
            this.weekTs.setSelected(this.event);
            this.select.emit(this.event);
        }
    }

    setFocus() {
        this.elementRef.nativeElement.focus();
    }

    getDayPlanningComponent(): WeekTsDayPlanningComponentInterface {
        return this.weekTsDayPlanningComponent;
    }
}
