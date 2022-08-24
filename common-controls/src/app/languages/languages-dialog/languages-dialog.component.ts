import {Component} from '@angular/core';
import {HelperService} from '../../core/services/helper.service';
import {tap} from 'rxjs/operators';
import {MatDialogRef} from '@angular/material';
import {SelectableItem} from '../../shared/models/common.info';

@Component({
    selector: 'ntk-languages-dialog',
    templateUrl: './languages-dialog.component.html',
    styleUrls: ['./languages-dialog.component.scss']
})
export class LanguagesDialogComponent {
    languages: SelectableItem[];
    languageSelected: string;

    constructor(private helper: HelperService, public dialogRef: MatDialogRef<any>) {
        this.languages = this.helper.TranslationService.getDisplayItemLanguages();
        this.languageSelected = this.helper.TranslationService.getCurrentLanguage().toUpperCase();
    }

    onOkClick() {
        if (this.languageSelected !== this.helper.TranslationService.getCurrentLanguage().toUpperCase()) {
            let language = this.helper.TranslationService.getLanguage(this.languageSelected);
            this.helper.TranslationService.changeLanguage(language.Code2)
                .pipe(tap(() => {
                    this.dialogRef.close(this.languageSelected);
                }))
                .subscribe();
        } else {
            this.dialogRef.close();
        }
    }

    onCancelClick() {
        this.dialogRef.close();
    }
}
