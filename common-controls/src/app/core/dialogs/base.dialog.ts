import { HostListener, Inject, Injector, NgZone } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { UtilityService } from '../services/utility.service';
import { TranslationService } from '../services/translation.service';
import { SliderRef } from '../../slides/SliderRef';
import { DialogData } from '../../shared/models/common.info';
import { MAT_DIALOG_DATA } from '@angular/material';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';


export abstract class BaseDialog {
    protected _util: UtilityService;
    protected _translationSvc: TranslationService;

    constructor(injector: Injector, protected _dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) private _dialogData: DialogData) {

        if (injector) {
            this._util = injector.get(UtilityService);
            this._translationSvc = injector.get(TranslationService);           
        }


        // Try to remove the focus state of the button to invoke open the dialog after closed
        if (this._dialogRef) {
            this._dialogRef.afterClosed().subscribe(result => {
                $('.cdk-program-focused').removeClass('cdk-program-focused');
                // document.body.removeEventListener('keydown', this._keydownListener);
            });          
        }
    }   

    @HostListener('window:resize')
    onResizeWindow() {
        if (!this._dialogData || !this._dialogRef) return;

        if (this._util.isSmallScreen) {
            if (!!this._dialogData.IsFullScreenInMobileMode) {
                // it make popup display full screen in mobile mode
                this._dialogRef.updateSize('100%', '100%');
            }
        }
        else {
            let defaultHeight: string = this._dialogData.DefaultHeight;
            if (defaultHeight) {
                // we dont check the width, because MatDialog calculates auto for width of dialog
                let defaultWidth: string = this._dialogData.DefaultWidth;

                let strHeight = defaultHeight.substr(0, defaultHeight.length - 2);
                let maxHeight: number = parseInt(strHeight);

                if (maxHeight > window.innerHeight)
                    this._dialogRef.updateSize(defaultWidth, window.innerHeight + 'px');
                else
                    this._dialogRef.updateSize(defaultWidth, defaultHeight);
            }
        }
    }

    ngOnInit() {
        this.onResizeWindow();       
    }

    /**
     * Close normal dialog, Goback or close if is slide dialog
     * @param result
     * @param {boolean} animation
     */
    close(result?: any, animation = true) {
        // console.log('---close ref', this._dialogRef);

        if (this._dialogRef['className'] === 'SliderRef') { // Slide dialog
            // Goback or close
            (<SliderRef>(<any>this._dialogRef)).close(result, animation);
        } else { // normal dialog
            // Close dialog
            this._dialogRef.close(result);
        }

    }

    /**
     * Close dialog
     * @param result
     */
    forceCloseDialog(result?: any) {
        if (this._dialogRef['className'] === 'SliderRef') {
            (<SliderRef>(<any>this._dialogRef)).forceCloseDialog(result);
        } else {
            this._dialogRef.close(result);
        }
    }
}
