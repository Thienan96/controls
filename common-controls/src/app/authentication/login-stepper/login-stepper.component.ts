import {AfterContentInit, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CdkStepper, StepContentPositionState} from '@angular/cdk/stepper';
import {matStepperAnimations} from '@angular/material';
import {Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {AnimationEvent} from '@angular/animations';

@Component({
    selector: 'ntk-login-stepper',
    templateUrl: './login-stepper.component.html',
    styleUrls: ['./login-stepper.component.scss'],
    providers: [{provide: CdkStepper, useExisting: LoginStepper}],
    animations: [matStepperAnimations.horizontalStepTransition]
})
export class LoginStepper extends CdkStepper implements OnInit, AfterContentInit {

    _animationDone = new Subject<AnimationEvent>();
    @Output() readonly animationDone: EventEmitter<void> = new EventEmitter<void>();

    ngOnInit() {
        this.selectedIndex = 0;
    }

    ngAfterContentInit() {

        // Mark the component for change detection whenever the content children query changes
        this._steps.changes.pipe(takeUntil(this._destroyed)).subscribe(() => {
            this._stateChanged();
        });

        this._animationDone.pipe(
            // This needs a `distinctUntilChanged` in order to avoid emitting the same event twice due
            // to a bug in animations where the `.done` callback gets invoked twice on some browsers.
            // See https://github.com/angular/angular/issues/24084
            distinctUntilChanged((x, y) => x.fromState === y.fromState && x.toState === y.toState),
            takeUntil(this._destroyed)
        ).subscribe(event => {
            if ((event.toState as StepContentPositionState) === 'current') {
                this.animationDone.emit();
            }
        });
    }
}
