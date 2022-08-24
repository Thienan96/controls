import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewInit} from '@angular/core';
import {ToolbarService} from '../shared/toolbar.service';
import {HelperService} from '../../core/services/helper.service';
import {Subscription} from 'rxjs/Subscription';
import {AppConfig} from '../../core/app.config';

@Component({
    selector: 'ntk-toolbar-release-alert',
    templateUrl: './toolbar-release-alert.component.html',
    styleUrls: ['toolbar-release-alert.component.scss']
})
export class ToolbarReleaseAlertComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() showNewReleaseAlert = false;
    @Output() showNewReleaseAlertChange = new EventEmitter();

    private _eventFromNg1: Subscription;

    constructor(private _toolbarService: ToolbarService,
                private _helperService: HelperService,
                private _appConfig: AppConfig) {
        // NBSHD-3991: we should hide the button when user check the checkbox
        this._eventFromNg1 = this._helperService.UtilityService.onEventFromNg1().subscribe((param: any) => {
            if (param.name === 'releasenotes_dismiss') {
                this.showNewReleaseAlert = this._toolbarService.isShowNewReleaseAlert();
                this.showNewReleaseAlertChange.emit(this.showNewReleaseAlert);
            }
        });

        this._toolbarService.onReleasenotesDismiss().subscribe(() => {
            this.showNewReleaseAlert = this._toolbarService.isShowNewReleaseAlert();
            this.showNewReleaseAlertChange.emit(this.showNewReleaseAlert);
        });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this._eventFromNg1.unsubscribe();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.showNewReleaseAlert = this._toolbarService.isShowNewReleaseAlert();
            this.showNewReleaseAlertChange.emit(this.showNewReleaseAlert);
        }, 500);
    }

    /**
     * Click on release button
     */
    onNewReleaseClick() {
        this._toolbarService.raiseUserMenuClick('showReleaseNotes');
    }
}
