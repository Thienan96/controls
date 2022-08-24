import { Injector, OnDestroy, AfterContentInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Subscription } from 'rxjs/Subscription';
import { HelperService } from './services/helper.service';




// ----------------------------------------------------------------------
// should use BaseMasterComponent for component to check "Keep Signed In"
// ----------------------------------------------------------------------
export abstract class BaseMasterComponent implements AfterContentInit, OnDestroy {
    protected _helperService: HelperService;
    protected subscriptionTimer: Subscription;

    constructor(injector: Injector) {
        this._helperService = injector.get(HelperService);

        // use in intervention Module, to set owner MatDialog for each module when it loaded
        const matDialog: MatDialog = injector.get(MatDialog);
        this._helperService.DialogService.setMatDialog(matDialog);
    }

    // ensure we dont make duplidated when un OnInit in Master Component
    ngAfterContentInit() {
        // console.log('Component OnInit');

        // ensure AuthenticationService load with existing sharing data
        TimerObservable.create(3000) // delay 3s
            .subscribe(() => {
                // console.log('TimerObservable running: ' + this._helperService.AuthenticationService.isAuthenticated + ' - ' + this._helperService.AuthenticationService.isKeepSignedInMode);
                if (!!this._helperService.AuthenticationService.isAuthenticated && !!this._helperService.AuthenticationService.isKeepSignedInMode)
                    this.startScheduleToKeepSingedIn();
            });
    }

    ngOnDestroy() {
        // console.log('Component OnDestroy');
        if (this.subscriptionTimer)
            this.subscriptionTimer.unsubscribe(); // stop IntervalObservable
    }

    protected startScheduleToKeepSingedIn() {
        // The keep session alive is scheduled to execute next 10 mins
        const obs = IntervalObservable.create(600000);

        this.subscriptionTimer = obs.subscribe(() => {
            // console.log('running keep alive...');
            this._helperService.AuthenticationService.keepSessionAlive().subscribe(bValue => {
                if (!bValue) {
                    this._helperService.AuthenticationService.processSessionExpired(autoLogonSuccess => {
                        if (!autoLogonSuccess) {
                            // show expire toast message
                            this._helperService.DialogService.showSessionExpiredMessage();
                        }
                    });
                }
            });
        });
    }
}
