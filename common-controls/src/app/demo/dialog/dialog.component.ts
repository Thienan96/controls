import {Component} from '@angular/core';
import {DialogService} from '../../core/services/dialog.service';
import {SlideDialog1Dialog} from './slide-dialog-slide-1/slide-dialog-1.dialog';
import {SlideDialogBaseDialog} from './slide-dialog-base/slide-dialog-base.dialog';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';

@Component({
    selector: 'ntk-demo-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss']
})
export class DemoDialogComponent {
    constructor(private dialogService: DialogService) {
    }


    delayCloseDialog(count: number) {

        setTimeout(() => {
            
            // let e = new window.PopStateEvent('back');
            const event = new KeyboardEvent("keydown", <any>{               
                    keyCode: 27
                });

            console.log('send esc 1');
            
            document.body.dispatchEvent(event)
            // window.dispatchEvent(event);
            // document.body.s
            // history.pushState()
            // window.pu.onpopstate(e)
            // this.dialogService.closeOrSlideBackLastDialog().subscribe(x => {
            //     console.log('----dialog 1 closes ', x);                
            // });
        }, 5000);

        if (count === 2) {
            setTimeout(() => {
                const event2 = new KeyboardEvent("keydown",<any>{               
                    keyCode: 27
                });

                console.log('send esc 2');
                document.body.dispatchEvent(event2);
                // this.dialogService.closeOrSlideBackLastDialog().subscribe(x => {
                //     console.log('----dialog 2 closes ', x);                
                // });
            }, 7000);
        }

    }

    onOpenBasicDialog() {
        this.dialogService.openDialog(SlideDialogBaseDialog).subscribe((result) => {
            console.log('result', result);
        });

        // this.delayCloseDialog(2);
    }

    onOpenAdvanceDialog() {
        let dialogRef = this.dialogService.openDialogRef(SlideDialogBaseDialog);
        dialogRef.afterOpened().subscribe(() => {
            console.log('afterOpened');
        });
        dialogRef.afterClosed().subscribe((result) => {
            console.log('result', result);
        });

        // this.delayCloseDialog(2);
    }

    onOpenBasicSlideDialog() {
        this.dialogService.createSliderDialog(SlideDialogBaseDialog, null, null, null, false).subscribe((result) => {
            console.log('result', result);
        });

        // this.delayCloseDialog(2);
    }

    onOpenAdvanceSlideDialog() {
        let dialogRef = this.dialogService.createSliderDialogRef(SlideDialogBaseDialog);
        dialogRef.afterOpened().subscribe(() => {
            console.log('afterOpened');
        });
        dialogRef.afterClosed().subscribe((result) => {
            console.log('result', result);
        });

        // this.delayCloseDialog(2);
    }
}
