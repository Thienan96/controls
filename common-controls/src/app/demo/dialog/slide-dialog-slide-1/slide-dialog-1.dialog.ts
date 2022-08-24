import {Component, Inject, Injector} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BaseDialog} from '../../../core/dialogs/base.dialog';
import {DialogData} from '../../../shared/models/common.info';
import {DialogService} from '../../../core/services/dialog.service';
import {SlideDialog2Dialog} from '../slide-dialog-slide-2/slide-dialog-2.dialog';
import {IDropdownGetDataEvent} from '../../../dropdown/shared/dropdown.model';



@Component({
    selector: 'ntk-demo-slide-dialog-1',
    templateUrl: './slide-dialog-1.dialog.html'
})
export class SlideDialog1Dialog extends BaseDialog {

    fixedDate: Date;
    dropdownValue: any;
    constructor(private dialogService: DialogService,
                injector: Injector,
                protected _dialogRef: MatDialogRef<any>,
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
        this.close('Saved slide 1');
    }

    onSaveAndClose() {
        this.forceCloseDialog('Saved and close slide 1');
    }

    onNextDialog() {
        this.dialogService.openSlideDialog(this._dialogRef, SlideDialog2Dialog).subscribe((result) => {
            console.log('SLIDE 1 : ', result);
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
