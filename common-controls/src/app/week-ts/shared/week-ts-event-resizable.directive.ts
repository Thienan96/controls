import {ResizableDirective, ResizeEvent} from 'angular-resizable-element';
import {
    Directive,
    ElementRef,
    EventEmitter,
    Inject,
    NgZone,
    OnInit,
    Output,
    PLATFORM_ID,
    Renderer2
} from '@angular/core';
import {WeekTsDayPlanningComponent} from '../week-ts-day-planning/week-ts-day-planning.component';
import {WeekTsComponent} from '../week-ts.component';
import {WeekTsService} from './week-ts-service';
import {WeekTsEventComponent} from '../week-ts-event/week-ts-event.component';
import {UtilityService} from '../../core/services/utility.service';

@Directive({
    selector: '[ntkWeekTsEventResizable]',
    host: {}
})
export class WeekTsEventResizableDirective extends ResizableDirective implements OnInit {
    @Output() resize = new EventEmitter();
    ghostElementPositioning: any = 'absolute';
    enableGhostResize = true; // Clone item when resize
    constructor(@Inject(PLATFORM_ID) platformId: any,
                renderer: Renderer2,
                elm: ElementRef,
                public _zone: NgZone,
                private weekTsDayPlanningComponent: WeekTsDayPlanningComponent,
                private weekTsComponent: WeekTsComponent,
                private weekTsService: WeekTsService,
                private weekTsEventComponent: WeekTsEventComponent,
                private utilityService: UtilityService) {
        super(platformId, renderer, elm, _zone);
    }

    get options() {
        return this.weekTsComponent.options;
    }

    get dayPlanningContainer() {
        return $(this.elm.nativeElement).parent();
    }

    ngOnInit() {
        super.ngOnInit();

        this.resizeStart.subscribe(this.onResizeStart.bind(this));
        this.resizeEnd.subscribe(this.onResizeEnd.bind(this));
    }


    onResizeEnd(ev: ResizeEvent) {
        let event = this.weekTsEventComponent.event;
        let data = {
            StartTime: event.StartTime,
            EndTime: event.EndTime
        };
        if (ev.edges.left) {
            let left = ev.rectangle.left / this.dayPlanningContainer.width(),
                startTime = this.weekTsService.roundHour(this.options.startTime + (this.options.endTime - this.options.startTime) * left);
            data.StartTime = this.utilityService.getHourFromTimestamp(startTime * 60 * 60 * 1000);
        }
        if (ev.edges.right) { // resize endTime
            let left = ev.rectangle.right / this.dayPlanningContainer.width();
            let endTime = this.weekTsService.roundHour(this.options.startTime + (this.options.endTime - this.options.startTime) * left);
            data.EndTime = this.utilityService.getHourFromTimestamp(endTime * 60 * 60 * 1000);
        }


        this._zone.run(() => {
            // Focus event
            setTimeout(() => {
                this.weekTsComponent.setSelected(event);
            }, 100);

            this.resize.emit({
                event: event,
                data: data
            });


        });
        setTimeout(() => { // delay to prevent conflict event (click)
            this.weekTsComponent.isResizing = false;
        }, 200);
    }

    onResizeStart() {
        this.weekTsComponent.isResizing = true;
    }
}
