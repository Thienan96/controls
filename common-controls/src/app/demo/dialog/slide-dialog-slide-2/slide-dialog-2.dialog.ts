import {Component, Inject, Injector} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BaseDialog} from '../../../core/dialogs/base.dialog';
import {DialogData} from '../../../shared/models/common.info';


@Component({
    selector: 'ntk-demo-slide-dialog-2',
    templateUrl: './slide-dialog-2.dialog.html'
})
export class SlideDialog2Dialog extends BaseDialog {

    constructor(injector: Injector,
                _dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, _dialogRef, dialogData);

    }

    onClose() {
        this.close();
    }

    onBack() {
        this.close();
    }

    onSave() {
        this.close('Saved slide 2');
    }

    onSaveAndClose() {
        this.forceCloseDialog('Saved and close slide 2');
    }


}
