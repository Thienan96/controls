import { AfterViewInit, Component, Inject, Injector, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseDialog } from '../base.dialog';

@Component({
    selector: 'ntk-message-dialog',
    templateUrl: './message.dialog.html'
})
export class MessageDialog extends BaseDialog implements AfterViewInit {
    
    @ViewChild('okButton', {static: false}) okButton: MatButton;
    @ViewChild('yesButton', {static: false}) yesButton: MatButton;
    @ViewChild('noButton', {static: false}) noButton: MatButton;
    
    constructor(injector: Injector, dialogRef: MatDialogRef<MessageDialog>, @Inject(MAT_DIALOG_DATA) public dialogData: any) {
        super(injector, dialogRef, dialogData);
    }

    ngAfterViewInit() {
        setTimeout(() => {
            if (this.noButton && this.dialogData && this.dialogData.Data.focusNoButton) {
                this.noButton.focus();
            }
            else if (this.yesButton) {
                this.yesButton.focus();
            }
            else if (this.okButton) {
                this.okButton.focus();
            }


        }, 200);
    }

}
