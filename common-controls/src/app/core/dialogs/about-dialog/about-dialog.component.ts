import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AppConfig} from '../../app.config';
import {DialogData} from '../../../shared/models/common.info';

export interface IAboutSettings {
    websiteUrl?: string;
    privacyUrl?: string;
    supportSite?: string;
    logo?: string;
    companyName?: string;
}

@Component({
    selector: 'ntk-about-dialog',
    templateUrl: './about-dialog.component.html',
    styleUrls: ['./about-dialog.component.scss'],
    host: {
        'class': 'ntk-about-box'
    }    
})
export class AboutDialogComponent {
    websiteUrl: string;
    privacyUrl: string;
    supportSite: string;
    logo: string;
    appVersion: string;
    companyName: string;

    constructor(private dialogRef: MatDialogRef<AboutDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public dialogData: DialogData,
                private appConfig: AppConfig) {
        this.websiteUrl = dialogData.Data.websiteUrl;
        this.privacyUrl = dialogData.Data.privacyUrl;
        this.supportSite = dialogData.Data.supportSite;
        this.logo = dialogData.Data.logo;
        this.appVersion = this.getAppVersion();
        this.companyName = dialogData.Data.companyName;
    }

    private getAppVersion(): string {
        let appVersion = this.appConfig.VERSION;
        if (this.appConfig.VERSION_BUILD) {
            appVersion = appVersion + ' (' + this.appConfig.VERSION_BUILD + ')';
        }
        return appVersion;
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

}
