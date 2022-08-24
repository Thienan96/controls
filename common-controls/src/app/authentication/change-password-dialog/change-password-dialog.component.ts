import {Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {debounce, finalize, map, switchMap} from 'rxjs/operators';
import {timer} from 'rxjs';
import {PasswordStrength} from '../shared/authentication.model';
import {AuthenticationService} from '../../core/services/authentication.service';
import {BlockUIService} from '../../core/services/blockUI.service';
import {TranslationService} from '../../core/services/translation.service';


@Component({
    selector: 'ntk-change-password-dialog',
    templateUrl: './change-password-dialog.component.html',
    styleUrls: ['./change-password-dialog.component.scss'],
})
export class ChangePasswordDialogComponent implements OnInit, OnDestroy {
    frmPassword: FormGroup;
    errorMessage: string;
    passwordStrength: PasswordStrength;
    loading = false;
    userName: string;
    private isChangedNow = false;

    get PasswordStrength() {
        return PasswordStrength;
    }

    request: any;

    constructor(private _dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
                private _fb: FormBuilder,
                protected injector: Injector,
                private authenticationService: AuthenticationService,
                private blockUIService: BlockUIService,
                private translationService: TranslationService) {
        this.userName = this.authenticationService.getAuthUser().UserLogin;
        this.frmPassword = this._fb.group({
            OldPassword: ['', [Validators.required]],
            NewPassword: ['', [Validators.required, this.validPasswordStrength.bind(this)]]
        });
    }

    get canSave(): boolean {
        return this.frmPassword.valid && !this.loading;
    }

    ngOnInit() {
        this.frmPassword.get('NewPassword').valueChanges.pipe(debounce(() => {
            this.loading = true;
            if (!this.isChangedNow) { // delay 500
                return timer(500);
            } else { // don't delay
                this.isChangedNow = false;
                return timer(0);
            }
        })).subscribe((password) => {
            if (this.request) {
                this.request.unsubscribe();
            }
            if (!!!password) {
                this.passwordStrength = PasswordStrength.None;
                this.frmPassword.get('NewPassword').setErrors({required: true});
                this.loading = false;
            } else {
                this.request = this.newPasswordIsTooWeakValidator(password).pipe(finalize(() => {
                    this.loading = false;
                    this.blockUIService.stop();
                })).subscribe((value) => {
                    this.frmPassword.get('NewPassword').setErrors(value);
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.request) {
            this.request.unsubscribe();
        }
    }


    private validPasswordStrength() {
        if (this.passwordStrength === PasswordStrength.Weak) {
            return {PasswordStrengthIsWeak: true};
        } else {
            return null;
        }
    }

    private newPasswordIsTooWeakValidator(value: string, time = 1000) {
        return timer(time).pipe(
            switchMap(() => this.authenticationService.estimatePasswordStrength(value)),
            map((res) => {
                this.passwordStrength = res['PasswordStrength'];
                return this.validPasswordStrength();
            })
        );
    }


    closeDialog(result?: any): void {
        this._dialogRef.close(result);
    }

    onSave() {
        let oldPassword = this.frmPassword.value.OldPassword,
            newPassword = this.frmPassword.value.NewPassword;
        this.blockUIService.start();
        this.authenticationService.changePassword(oldPassword, newPassword).pipe(finalize(() => {
            this.blockUIService.stop();
        })).subscribe(() => {
                // change password OK
                this.closeDialog(true);
            }, (response) => {
                let responseError: any = response.error;
                this.errorMessage = this.translationService.getTranslation('msg' + responseError.code);
                this.frmPassword.controls['OldPassword'].setErrors({invalidPassword: true});
            }
        );
    }

    generate() {
        this.blockUIService.start();
        this.authenticationService.generatePassword().subscribe((result: string) => {
            this.isChangedNow = true;
            this.frmPassword.get('NewPassword').setValue(result);
        });
    }
}
