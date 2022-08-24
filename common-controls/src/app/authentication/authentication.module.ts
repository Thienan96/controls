import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {EstimatePasswordStrengthComponent} from './estimate-password-strength/estimate-password-strength.component';
import {ChangePasswordDialogComponent} from './change-password-dialog/change-password-dialog.component';
import {LoginComponent} from './login/login.component';
import {LoginStepper} from './login-stepper/login-stepper.component';
import {UserProfileDialogComponent} from './user-profile-dialog/user-profile-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatToolbarModule
} from '@angular/material';
import {MatStepperModule} from '@angular/material/stepper';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {LanguagesModule} from '../languages/languages.module';
import {CoreModule} from '../core/core.module';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {DataFieldModule} from '../data-field/data-field.module';

@NgModule({
    declarations: [
        EstimatePasswordStrengthComponent,
        ChangePasswordDialogComponent,
        LoginComponent,
        LoginStepper,
        UserProfileDialogComponent
    ],
    exports: [LoginComponent],
    imports: [
        CommonModule,
        MatIconModule,
        MatFormFieldModule,
        MatStepperModule,
        MatCheckboxModule,
        MatListModule,
        MatButtonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        CdkStepperModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        CoreModule,
        LanguagesModule,
        CommonControlsSharedModule,
        DataFieldModule
    ],
    entryComponents: [ChangePasswordDialogComponent, UserProfileDialogComponent]
})
export class AuthenticationModule {
}
