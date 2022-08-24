import {Component, Inject, Injector} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {DialogService} from '../../../core/services/dialog.service';
import {SlideDialog1Dialog} from '../slide-dialog-slide-1/slide-dialog-1.dialog';
import {BaseDialog} from '../../../core/dialogs/base.dialog';
import {DialogData} from '../../../shared/models/common.info';
import {IDropdownGetDataEvent} from '../../../dropdown/shared/dropdown.model';

@Component({
    selector: 'ntk-demo-slide-dialog-base',
    templateUrl: './slide-dialog-base.dialog.html'
})
export class SlideDialogBaseDialog extends BaseDialog {

    fixedDate: Date;
    dropdownValue: any;

    constructor(private dialogService: DialogService,
                protected _dialogRef: MatDialogRef<any>,
                injector: Injector,
                @Inject(MAT_DIALOG_DATA) dialogData: DialogData) {
        super(injector, _dialogRef, dialogData);
    }

    onClose() {
        this.close();
    }

    onSave() {
        this.close('Saved base dialog');
    }

    onNextDialog() {
        this.dialogService.openSlideDialog(this._dialogRef, SlideDialog1Dialog).subscribe((result) => {
            console.log('Base dialog: ', result);
        });
    }

    onGetDropdownData(event: IDropdownGetDataEvent) {

       console.log('onGetDropdownData --- ', event.startIndex);

       let data = [
           {Id: '1', Name: 'Item 1'},
           {Id: '1', Name: 'Item 2'},
       ]

       
            event.callBack.next({ ListItems: data, Count: 2});
            event.callBack.complete();

        // this._getDropdownData(event.startIndex, event.pageSize, event.searchText).subscribe(x => {
        //     // console.log('onGetDropdownData result: ', x);

        //     event.callBack.next(x);
        //     event.callBack.complete();
        // }, (err) => {
        //     event.callBack.error(err);
        //     event.callBack.complete();
        // });
    }
}
