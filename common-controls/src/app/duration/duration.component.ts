import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import moment from 'moment-es6';

@Component({
    selector: 'ntk-duration',
    templateUrl: './duration.component.html',
    styleUrls: ['./duration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DurationComponent implements OnInit, OnChanges {
    @Input() start: string;
    @Input() end: string;
    @Input() height = 40;
    @Input() disabled = false;


    @Output() startChange = new EventEmitter();
    @Output() endChange = new EventEmitter();
    @Output() dataUpdated = new EventEmitter();

    hours: any[] = [];
    durationStr: string;
    startTimeStr: string;
    endTimeStr: string;
    rect: {
        top: number;
        height: number;
    };
    private $element = $(this.elementRef.nativeElement);


    constructor(private elementRef: ElementRef,
                private zone: NgZone,
                private cd: ChangeDetectorRef) {

        this.hours = this.getHours();
    }

    _endTime: number;

    get endTime() {
        return this._endTime;
    }

    set endTime(value) {
        this._endTime = value;

        this.end = this.convertTimestampToStr(value);
        this.endChange.emit(this.end);
        this.refresh();
    }

    private _startTime: number;

    private get startTime() {
        return this._startTime;
    }

    private set startTime(value) {
        this._startTime = value;

        this.start = this.convertTimestampToStr(value);
        this.startChange.emit(this.start);
        this.refresh();
    }

    private finishUpdateData() {
        if (this.dataUpdated) 
            this.dataUpdated.emit();
    }


    ngOnInit() {
        this.startTime = this.getTimestamp(this.start);
        this.endTime = this.getTimestamp(this.end);

        // render
        this.cd.detectChanges();

        // Scroll to view
        let top = (this.startTime / (60 * 60 * 1000)) * this.height;
        this.$element.find('.duration-scroller').scrollTop(top);

        this.bindEvents();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.disabled && !changes.disabled.isFirstChange()) {
            $('.handle', this.$element)
                ['draggable']('option', 'disabled', changes.disabled.currentValue)
                ['resizable']('option', 'disabled', changes.disabled.currentValue);
        }

        if ((changes.start && !changes.start.isFirstChange()) || (changes.end && !changes.end.isFirstChange())) {
            this.startTime = this.getTimestamp(this.start);
            this.endTime = this.getTimestamp(this.end);
            this.updateHtml();
        }
    }

    bindEvents() {
        this.zone.runOutsideAngular(() => {
            let handle = $('.handle', this.$element);
            handle['draggable']({
                axis: 'y',
                handle: '.btn-drag',
                containment: 'parent',
                disabled: this.disabled,
                scrollParent: $('.duration-scroller', this.$element),
                start: () => {
                    this.showTooltip();
                },
                drag: (event, ui) => {
                    this.zone.runOutsideAngular(() => {
                        this.onDrag(ui);
                        this.updateHtml();
                        this.showTooltip();
                    });

                },
                stop: (event, ui) => {
                    this.zone.run(() => {
                        this.onDragStop(ui);
                        this.hideTooltip();
                        this.forceUpdateHtml();

                        this.finishUpdateData();
                    });
                }
            });
            handle['resizable']({
                containment: 'parent',
                disabled: this.disabled,
                start: () => {
                    this.showTooltip();
                },
                resize: (event, ui) => {
                    this.onResize(event, ui);
                    this.updateHtml();
                    this.showTooltip();
                },
                stop: (event, ui) => {
                    this.zone.run(() => {
                        this.onResizeStop(event, ui);
                        this.hideTooltip();
                        this.forceUpdateHtml();
                        this.cd.detectChanges();

                        this.finishUpdateData();
                    });
                },
                handles: {
                    's': '.ui-resizable-s',
                    'n': '.ui-resizable-n'
                }
            });
            handle.on('resize', (e) => {
                e.stopPropagation();
            });
        });

        this.$element.find('.handle').on('mousewheel', (event) => {
            if (this.disabled)
                return;

            // cross-browser wheel delta
            let eventArgs: any = window['event'] || event; // old IE support
            let delta = Math.max(-1, Math.min(1, (eventArgs.wheelDelta || -eventArgs.detail)));
            if (delta > 0) {
                //scroll down
                let newEnd = this.endTime - 15 * 60 * 1000;
                if (newEnd - this.startTime > 0) {
                    this.endTime = newEnd;
                }

            } else {
                this.endTime = this.endTime + 15 * 60 * 1000;
                if (this.endTime > 24 * 3600000) {
                    this.endTime = 24 * 3600000;
                }
            }
            this.showTooltip();

            this.finishUpdateData();

            return false;
        });

        this.$element.find('.handle').on('mouseleave', () => {
            this.hideTooltip();
        });

    }

    //BtDown
    changeBottom(ui) {
        let top = ui.position.top + ui.size.height;
        let hour = top / this.height;
        if (hour > 24)
            hour = 24;
        if (hour != 24) {
            let durationEnd: any = moment.duration(hour, 'hours');
            this.endTime = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(durationEnd.hours() + ':' + durationEnd.minutes(), 'HH:mm').toDate())).format('HH:mm'));
        } else {
            this.endTime = 24 * 3600000;
        }

    }

    onDragStop(ui) {
        let top = ui.position.top;
        let duration = moment.duration(top / this.height, 'hours');
        let start = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate())).format('HH:mm'));
        this.endTime = start + (this.endTime - this.startTime);
        this.startTime = start;
    }

    onResizeStop(event, ui) {
        if (ui.originalPosition.top != ui.position.top) {//change top
            this.changeTop(ui);
        } else {
            if (ui.originalSize.height != ui.size.height) {//bottom
                this.changeBottom(ui);
            }
        }
    }

    onResize(event, ui) {
        if (ui.originalPosition.top != ui.position.top) {
            let duration = moment.duration(ui.position.top / this.height, 'hours');
            this.startTime = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate())).format('HH:mm'));
        } else {
            if (ui.originalSize.height != ui.size.height) {
                let bottom = ui.position.top + ui.size.height;
                let hour = bottom / this.height;
                if (hour >= 24) {
                    this.endTime = 24 * 3600000;
                } else {
                    let bottomDuration = moment.duration(hour, 'hours');
                    this.endTime = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(bottomDuration.hours() + ':' + bottomDuration.minutes(), 'HH:mm').toDate())).format('HH:mm'));
                    if (this.endTime <= 0)
                        this.endTime = 24 * 3600000;
                }
            }
        }

    }


    private refresh() {
        this.rect = this.getPositionByHour(this.startTime, this.endTime);
        this.durationStr = this.msToTime(this.endTime - this.startTime);
        this.startTimeStr = this.msToTime(this.startTime);
        this.endTimeStr = this.msToTime(this.endTime);

    }

    private onDrag(ui) {
        let duration = moment.duration(ui.position.top / this.height, 'hours'),
            start = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate())).format('HH:mm'));
        this.endTime = start + (this.endTime - this.startTime);
        this.startTime = start;
    }

    //BtUp
    private changeTop(ui) {
        let top = ui.position.top;
        let duration = moment.duration(top / this.height, 'hours');
        this.startTime = this.getTimestamp(moment(this.roundTimeQuarterHour(moment(duration.hours() + ':' + duration.minutes(), 'HH:mm').toDate())).format('HH:mm'));
    }

    private getPositionByHour(startTime, endTime) {
        let top = this.getTop(startTime),
            height = this.getHeight(startTime, endTime);
        return {
            top: top,
            height: height
        }
    }

    private getTop(hour: number): number {
        let diffH = hour / (60 * 60 * 1000);
        return this.height * diffH;
    }

    private getHeight(startHour: number, endHours: number): number {
        return this.height * (endHours - startHour) / (60 * 60 * 1000);
    }

    private getTimestamp(hour: string): number {
        if (!hour)
            return 0;
        let res = hour.split(':');
        return parseInt(res[0]) * 60 * 60 * 1000 + parseInt(res[1]) * 60 * 1000;
    }

    private getDurationStr(startTime, endTime) {
        let duration = endTime - startTime;
        return this.msToTime(duration);
    }

    private getHours() {
        let durations = [];
        for (let i = 0; i < 24; i++) {
            durations.push({
                value: i,
                text: i >= 10 ? i : '0' + i
            });
        }
        durations.push({
            value: 24,
            text: 24
        });
        return durations;
    }

    private updateHtml() {
        let durationStr = this.getDurationStr(this.startTime, this.endTime),
            startTimeStr: string = this.msToTime(this.startTime),
            endTimeStr: string = this.msToTime(this.endTime);
        $('.durationStr', this.$element).html(durationStr);
        $('.startTimeStr', this.$element).html(startTimeStr);
        $('.endTimeStr', this.$element).html(endTimeStr);
    }

    private forceUpdateHtml() {
        let rect = this.getPositionByHour(this.startTime, this.endTime);
        $('.handle', this.$element).css({
            top: rect.top,
            height: rect.height
        });
        this.updateHtml();
    }

    private hideTooltip() {
        $('.tooltip-container', this.$element).hide();


        //EJ4-709, Remove class when hide tooltip
        this.$element.removeClass('showing-tooltip');
    }

    private showTooltip() {
        $('.tooltip-container', this.$element).show();
        let h = this.startTime / (60 * 60 * 1000);
        if (h >= 20) {
            $('.tooltip-container', this.$element).removeClass('position-top').addClass('position-bottom');
        } else {
            $('.tooltip-container', this.$element).removeClass('position-bottom').addClass('position-top');
        }


        //EJ4-709, Add class when show tooltip
        this.$element.addClass('showing-tooltip');
    }

    private convertTimestampToStr(time) {
        let duration = moment.duration(time, 'ms'),
            h: any = duration.days() * 24 + duration.hours(),
            m: any = duration.minutes();
        if (h < 10)
            h = '0' + h;
        if (m < 10)
            m = '0' + m;
        return h + ':' + m;
    }


    private msToTime(hourMs: number): string {
        let hour = hourMs / (60 * 60 * 1000);
        return this.convertTimeToString(hour);
    }

    private convertTimeToString(hour: number) {
        let duration: any = moment.duration(hour, 'hours'),
            h: any = duration.days() * 24 + duration.hours(),
            m: any = duration.minutes();
        if (h < 10)
            h = '0' + h;
        if (m < 10)
            m = '0' + m;
        return h + 'h' + m;
    }

    private roundTimeQuarterHour(time) {
        let dateTime = new Date(time);
        dateTime.setMilliseconds(Math.round(time.getMilliseconds() / 1000) * 1000);
        dateTime.setSeconds(Math.round(dateTime.getSeconds() / 60) * 60);
        dateTime.setMinutes(Math.round(dateTime.getMinutes() / 15) * 15);
        return dateTime;
    }
}
