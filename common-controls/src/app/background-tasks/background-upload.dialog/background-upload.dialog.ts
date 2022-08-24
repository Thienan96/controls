import { Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { DialogData } from '../../shared/models/common.info';
import { IBackgroundUploadTask } from '../shared/models';


@Component({
    selector: 'hs-background-upload-dialog',
    templateUrl: './background-upload.dialog.html'
})

export class BackgroundUploadDialog extends BaseDialog {

    uploadingFiles: IBackgroundUploadTask[];
    
    constructor(injector: Injector, dialogRef: MatDialogRef<BackgroundUploadDialog>, @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);

        this.uploadingFiles = dialogData.Data;

        // this._backgroundService = injector.get(BackgroundService);

        // this._backgroundService.onPenddingCountChanged().subscribe((c) => {
        //     if (c <= 0) {
        //         dialogRef.close(true);
        //     }
        // });
    }

    
    formatSize(file: File): string {
        return Math.ceil((file.size || 0) / 1024) + " KB";
    }
}
