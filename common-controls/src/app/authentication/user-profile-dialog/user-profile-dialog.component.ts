import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { AuthenticationService } from '../../core/services/authentication.service';
import { DialogData } from '../../shared/models/common.info';


@Component({
    selector: 'gf-user-profile-dialog',
    templateUrl: './user-profile-dialog.component.html',
    styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent {
    emptyDataIcon = 'src/assets/images/contact.png';

    userName: string;
    login: string;
    role: string;
    companyName: string;
    logoUrl: string;

    constructor(private _dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
        private authenticationService: AuthenticationService,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        this.initData();
    }


    private initData() {
        let user = this.authenticationService.getAuthUser();

        if (user) {
            this.userName = user.Contact.Name;
            this.login = user.UserLogin;
            this.role = user['ApplicationRole'];
            this.logoUrl = user['LogoUrl'] || this.emptyDataIcon;
            if (user.ManagedCompany) {
                this.companyName = user.ManagedCompany.Name;
            }
        }

    }


    closeDialog(result?: any): void {
        this._dialogRef.close(result);
    }


}
