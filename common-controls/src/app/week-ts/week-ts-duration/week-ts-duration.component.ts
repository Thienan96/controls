import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    Input,
    NgZone,
    OnInit,
    Output
} from '@angular/core';
import {WeekTsService} from '../shared/week-ts-service';
import {ESCAPE} from '@angular/cdk/keycodes';
import {NTK_WEEK_TS, WeekTsComponentInterface} from '../shared/week-ts.model';
import {UtilityService} from '../../core/services/utility.service';

/**
 * Drag item on column to create new event
 */
@Component({
    selector: 'ntk-week-timesheet-duration-component',
    templateUrl: './week-ts-duration.component.html',
    styleUrls: ['./week-ts-duration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekTsDurationComponent implements OnInit {
    @Input() startTime: number;
    @Input() endTime: number;
    @Input() distance = 7;

    @Input() allowDraging = true;
    @Output() dragingCompleted = new EventEmitter<{ startTime: number, endTime: number }>();
    private position: { left: number; width: number; } = {left: 0, width: 0};
    private startPoint: {
        pageX: number;
        left: number;
    };
    private dragging = false;
    private container: JQuery;
    private startTimeElement: JQuery;
    private endTimeElement: JQuery;
    private tooltipTextElement: JQuery;
    private durationElement: JQuery;

    constructor(private element: ElementRef<HTMLElement>,
                private weekTsService: WeekTsService,
                private zone: NgZone,
                @Inject(NTK_WEEK_TS) private weekTsComponent: WeekTsComponentInterface,
                private utilityService: UtilityService) {
    }

    ngOnInit() {
        this.container = $(this.element.nativeElement).find(`.timesheet-added-handle`);
        this.startTimeElement = $(this.element.nativeElement).find(`.start-time`);
        this.endTimeElement = $(this.element.nativeElement).find(`.end-time`);
        this.durationElement = $(this.element.nativeElement).find(`.duration-time`);
        this.tooltipTextElement = $(this.element.nativeElement).find(`.tooltip-content`);

        // @ts-ignore
        $(this.element.nativeElement).parent().on('mousedown.ntk-week-timesheet-duration-component', (event: MouseEvent) => {
            this.unBind();

            // Hide tooltip
            $(`.timesheet-added-handle`).hide();

            this.zone.runOutsideAngular(() => {
                this.mouseDown(event);
                // @ts-ignore
                $(window).on('mousemove.ntk-week-timesheet-duration-component', (ev: MouseEvent) => {
                    this.mouseMove(ev);
                });
                // @ts-ignore
                $(window).on('mouseup.ntk-week-timesheet-duration-component', () => {
                    this.unBind();
                    this.mouseUp();
                });
            });
        });
    }

    @HostListener('window:keydown', ['$event']) onKeyDown(ev: KeyboardEvent) {
        let key = ev['key'],
            keyCode = ev[`keyCode`],
            isEscape = key === 'Escape' || key === 'Esc' || keyCode === ESCAPE;
        if (isEscape) {
            this.cancel();
        }
    }

    private cancel() {
        this.unBind();
        this.updateDrag(false);
        this.dragging = false;
        this.container.hide();
    }

    private mouseDown(event: MouseEvent) {
        if (this.weekTsComponent.isResizing || !this.allowDraging) {
            this.cancel();
            return;
        }
        let left = event.pageX - $(this.element.nativeElement).offset().left;
        let percent = left / this.element.nativeElement.clientWidth;
        let duration = this.weekTsService.roundHour((this.endTime - this.startTime) * percent);
        let l = duration / (this.endTime - this.startTime) * this.element.nativeElement.clientWidth;
        this.startPoint = {
            pageX: event.pageX + (l - left),
            left: l
        };
    }

    private mouseMove(event: MouseEvent) {
        if (this.weekTsComponent.isResizing || !this.allowDraging) {
            this.cancel();
            return;
        }
        let width = event.pageX - this.startPoint.pageX;
        if (Math.abs(width) >= this.distance && !this.dragging) {
            this.dragging = true;
            this.updateDrag(true);
        }
        if (this.dragging) {
            this.position.left = this.startPoint.left;
            this.position.width = width;
            this.updateLayout();
        }
    }

    private mouseUp() {
        // Hide drag handle
        this.container.hide();
        if (this.dragging) {
            // Turn off flag dragging
            this.dragging = false;

            let time = this.getTime(),
                startTime = time.startTime,
                endTime = time.endTime;
            if (startTime !== endTime) {
                this.zone.run(() => {
                    this.dragingCompleted.emit({
                        startTime: startTime,
                        endTime: endTime
                    });
                });
                setTimeout(() => { // delay to prevent conflict event (click)
                    this.updateDrag(false);
                }, 200);
                return;
            }
        }
        this.updateDrag(false);

    }

    private getTime(): {
        startTime: number,
        endTime: number,
        duration: number,
        strDuration: string
    } {
        let percent = this.position.left / this.element.nativeElement.clientWidth,
            duration = this.weekTsService.roundHour((this.endTime - this.startTime) * percent);

        let percent2 = (this.position.left + this.position.width) / this.element.nativeElement.clientWidth;
        if (percent2 < 0) {
            percent2 = 0;
        }
        let duration2 = this.weekTsService.roundHour((this.endTime - this.startTime) * percent2);

        let startTime = this.startTime + duration,
            endTime = this.startTime + duration2,
            st = Math.min(startTime, endTime),
            et = Math.max(startTime, endTime);
        if (et > this.endTime) {
            et = this.endTime;
        }
        return {
            startTime: st,
            endTime: et,
            duration: et - st,
            strDuration: this.utilityService.transformDurationToString(et - st)
        };
    }

    private updateLayout() {
        this.tooltipTextElement.removeClass(`bottom`);

        let time = this.getTime();
        this.startTimeElement.html(this.utilityService.getHourFromTimestamp(time.startTime * 60 * 60 * 1000));
        this.endTimeElement.html(this.utilityService.getHourFromTimestamp(time.endTime * 60 * 60 * 1000));
        this.durationElement.html(time.strDuration);

        if (this.position.width > 0) {
            this.container.css({
                display: `block`,
                left: this.position.left,
                right: `auto`,
                width: this.position.width
            });
        } else {
            let p = 1 - (this.position.left / this.element.nativeElement.clientWidth);
            let d = this.weekTsService.roundHour((this.endTime - this.startTime) * p);
            let right = d / (this.endTime - this.startTime) * this.element.nativeElement.clientWidth;
            this.container.css({
                display: `block`,
                left: `auto`,
                right: right,
                width: Math.abs(this.position.width)
            });
        }
        let top = $(this.tooltipTextElement).offset().top;
        if (top < 0) {
            this.tooltipTextElement.addClass(`bottom`);
        }
    }

    private unBind() {
        $(window).off('mousemove.ntk-week-timesheet-duration-component');
        $(window).off('mouseup.ntk-week-timesheet-duration-component');
    }

    private updateDrag(disabled: boolean) {
        this.zone.run(() => {
            if (disabled) {
                $(`body`).addClass(`ntk-week-timesheet-duration-is-dragging`);
            } else {
                $(`body`).removeClass(`ntk-week-timesheet-duration-is-dragging`);
            }
            this.weekTsComponent.isDraggingToCreate = disabled;
        });
    }
}
