import {Component, Inject, Injector} from '@angular/core';
import {BaseDialog} from '../../core/dialogs/base.dialog';
import {MAT_DIALOG_DATA, MatCheckboxChange} from '@angular/material';
import {MatDialogRef} from '@angular/material/dialog';
import {DialogData} from '../../shared/models/common.info';
import {AppConfig} from '../../core/app.config';
import {UtilityService} from '../../core/services/utility.service';
import {TranslationService} from '../../core/services/translation.service';

@Component({
    selector: 'ntk-toolbar-release-alert-dialog',
    templateUrl: './toolbar-release-alert.dialog.html',
    styleUrls: ['./toolbar-release-alert.dialog.scss']
})
export class ToolbarReleaseAlertDialog extends BaseDialog {
    isDontShowAnymore = false;
    releaseAlertOnDate: string;
    raiseUserMenuClick: any;
    doNotShowAnymore: string;

    constructor(injector: Injector,
                _dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA)  _dialogData: DialogData,
                private appConfig: AppConfig,
                private utilityService: UtilityService,
                private translationService: TranslationService) {
        super(injector, _dialogRef, _dialogData);

        this.raiseUserMenuClick = _dialogData.Data.raiseUserMenuClick;


        this.updateLanguage();
        this.translationService.onLanguageChange().subscribe(() => {
            this.updateLanguage();
        });
    }

    updateLanguage() {
        let releaseDate = this.appConfig.RELEASE_DATE.format('LL');
        this.releaseAlertOnDate = this.utilityService.formatText(this.translationService.getTranslation('lbReleaseAlertOnDate'), this.appConfig.VERSION, this.appConfig.APP_TITLE, releaseDate);
        this.doNotShowAnymore = this.translationService.getTranslation('lbDoNotShowAnymore');
    }

    onReleaseClicked() {
        this.raiseUserMenuClick('showReleaseNotes');
    }

    onChangeShow(event: MatCheckboxChange) {
        this.isDontShowAnymore = event.checked;
    }

    onClose() {
        this.close(this.isDontShowAnymore ? this.appConfig.VERSION : false);
    }
}
