import {Injectable, NgZone, Type} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef, MatDialogState} from '@angular/material/dialog';
import { ToastrService} from 'ngx-toastr';
import {UtilityService} from './utility.service';
import {TranslationService} from './translation.service';
import {Observable, of} from 'rxjs';
import {SlideDialogService} from './slide.dialog.service';
import {DialogData} from '../../shared/models/common.info';
import {SliderRef} from '../../slides/SliderRef';
import {SlidesDialog} from '../../slides/slides-dialog/slides.dialog';
import {HttpErrorResponse} from '@angular/common/http';
import { MessageDialog } from '../dialogs/message-dialog/message.dialog';
import { SlideService } from '../../shared/common-controls-shared.module';
import { OverlayContainer } from '@angular/cdk/overlay';
import { filter } from 'rxjs/operators';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    constructor(private matDialog: MatDialog, private _util: UtilityService
        , private _translationSvc: TranslationService, private _toastrService: ToastrService
        , private slideDialogService: SlideDialogService
        , private _zone: NgZone
        , private overlayContainerService: OverlayContainer) {
    }

    showMessageDialog(title: string, message: string, button?: 'btOK' | 'btYesNo'
        , width?: any, height?: any, config?: MatDialogConfig, yesOkKey?: string, noKey?: string, focusNoButton?: boolean): Observable<any> | any {
        if (!config) {
            config = this.getDefaultMessageDialogConfig();
            config.autoFocus = false;
        }

        if (width) {
            config.width = width;
        }

        if (height) {
            config.height = height;
        }

        let bt: string = 'btOK';
        if (button && (button === 'btOK' || button === 'btYesNo')) {
            bt = button;
        }

        let confirmKey = 'btOk';
        let rejectKey = 'btNo';
        if (bt === 'btYesNo') {  confirmKey = 'btYes'; }

        if (yesOkKey) { confirmKey = yesOkKey; }
        if (noKey) { rejectKey =  noKey; }

        const dialogData: DialogData = new DialogData();
        dialogData.Data = { title: title, message: message, button: bt, confirmKey, rejectKey, focusNoButton: focusNoButton };
        dialogData.DefaultWidth = config.width;
        dialogData.DefaultHeight = config.height;

        config.data = dialogData;

        const dialogRef = this.matDialog.open(MessageDialog, config);

        return dialogRef.afterClosed();
    }


    openDialog(componentType: Type<any>, data?: any, width?: string, height?: string, disableClose?: boolean, isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string): Observable<any> {
        const dialogRef = this.openDialogRef(componentType, data, width, height, disableClose, isFullScreenInMobileMode, config, maxHeight);
        return dialogRef.afterClosed();
    }

    openDialogRef(componentType: Type<any>, data?: any, width?: string, height?: string, disableClose?: boolean
        , isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string): MatDialogRef<any> {
        if (!config) {
            config = this.getDefaultDialogConfig();
        }

        if (width) {
            config.width = width;
        }

        if (height) {
            config.height = height;
        }

        if (disableClose  !== undefined) {
            config.disableClose = disableClose;
        } else {
            config.disableClose = false;
        }

        const dialogData: DialogData = new DialogData();
        dialogData.Data = data;
        dialogData.DefaultWidth = config.width;
        dialogData.DefaultHeight = config.height;
        dialogData.IsFullScreenInMobileMode = isFullScreenInMobileMode;

        config.data = dialogData;
        config.maxWidth = '100%';
        config.maxHeight = '100%';

        if (maxHeight) {
            config.maxHeight = maxHeight;
        }
        // If screen is small (in mobile mode), we should overwrite width and height to 100%
        // it make popup display full screen
        if (!!isFullScreenInMobileMode && this._util.isSmallScreen) {
            config.width = '100%';
            config.height = '100%';
        }


        // console.log('config.disableClose ' , config.disableClose);
        return this.matDialog.open(componentType, config);
    }

    getDefaultMessageDialogConfig() {
        const config: MatDialogConfig = new MatDialogConfig();
        config.disableClose = true;
        config.minHeight = '180px;';
        return config;
    }

    getDefaultDialogConfig() {
        const config: MatDialogConfig = new MatDialogConfig();
        config.width = '800px';
        config.height = '900px';
        config.disableClose = true;
        config.autoFocus = false;

        return config;
    }

    setMatDialog(matDialog: MatDialog) {
        this.matDialog = matDialog;
    }

    // ----------------------------------------- Toast message-------------------------------------------
    showToastMessage(message: string) {
        this._toastrService.show(message, undefined, {
            timeOut: 5000, // delay 5s
            closeButton: true,
            toastClass: 'ngx-toastr hs-toast'
        });
    }

    showErrorToastMessageWithKey(translationKey: string) {
        let msg = this._translationSvc.getTranslation(translationKey);
        this.showErrorToastMessage(msg);
    }
    showErrorToastMessage(message: string) {

        // this.snackBar.open(message, 'Ok', {
        //     duration: 5000,
        //     horizontalPosition: 'right',
        //     verticalPosition: 'top'
        // });


        this._toastrService.error(message, undefined, {
            timeOut: 5000, // delay 5s
            closeButton: true,
            toastClass: 'ngx-toastr ntk-toast'
        });
    }
    showWarningToastMessageWithKey(translationKey: string) {
        let msg = this._translationSvc.getTranslation(translationKey);
        this.showWarningToastMessage(msg);
    }
    showWarningToastMessage(message: string) {
        this._toastrService.warning(message, undefined, {
            timeOut: 5000, // delay 5s
            closeButton: true,
            toastClass: 'ngx-toastr ntk-toast'
        });
    }

    showSessionExpiredMessage() {
        const message = this._translationSvc.getTranslation('msgSessionExpired');
        this._toastrService.error(message, undefined, {
            timeOut: 3000, // delay 3s
            closeButton: true,
            toastClass: 'ngx-toastr ntk-toast'
        });
    }

    showApiErrorMessage(errorCode: string, errorMessage?: string, messageParams?: Array<string>) {
        let message = '';
        if (errorCode && this._translationSvc.isExistsTranslation(errorCode)) {
            //let key = 'ApiErrorCode_' + errorCode;
            let key = errorCode;
            message = this._translationSvc.getTranslation(key);
            if (messageParams && messageParams.length > 0) {
                message = this._util.formatText(message, messageParams); // HS/CL style
            } else if (errorMessage) {
                message = this._util.formatText(message, errorMessage); // EJ4 style
            }
        }  
        else if (errorMessage) {  
            message = errorMessage;
        } 
        else if (errorCode) {
            message = errorCode; // EJ4-1639: In case the api throw code but we have not translated, we should show this code
        }
        else {
            message = this._translationSvc.getTranslation("UnexpectedError");
        }
        this.showErrorToastMessage(message);
    }

    showApiError(res: HttpErrorResponse, responseError?: any) {
        const httpCodeNumber: number = res.status;
        const errorCode: string = responseError ? responseError.code : res.error ? res.error.code : null;
        const errorMessage: string = responseError ? responseError.message : res.error ? res.error.message: null;
        const messageParams = responseError ? responseError.messageParams : res.error ? res.error.messageParams: null;

        if (errorCode) {
            this.showApiErrorMessage(errorCode, errorMessage, messageParams);
        } else if (errorMessage) {
            this.showErrorToastMessage(errorMessage);
        } else {
            // In the case the error 401 throw without code, message 
            if (httpCodeNumber === 401 || httpCodeNumber == 401) {
                this.showApiErrorMessage("msgUnauthorized");                
                return;
            }
            else if (httpCodeNumber !== 0) {
                //this.showErrorToastMessage('Unknow error from server: code=' + httpCodeNumber);
                this.showErrorToastMessage('Unknow error from server: ' + res.statusText + '/' + res.message);
                return;
            }
        }

        // console.error('Unknow error from server: ', res);
        //this.showErrorToastMessage('Unknow error from server: ' + res.statusText + '/' + res.message);
    }

    getDialogConfig(data?: any, width?: string, height?: string, disableClose?: boolean
        , isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string) {
        if (!config) {
            config = this.getDefaultDialogConfig();
        }

        if (width) {
            config.width = width;
        }

        if (height) {
            config.height = height;
        }

        if (disableClose !== undefined) {
            config.disableClose = disableClose;
        }

        const dialogData: DialogData = new DialogData();
        dialogData.Data = data;
        dialogData.DefaultWidth = config.width;
        dialogData.DefaultHeight = config.height;
        dialogData.IsFullScreenInMobileMode = isFullScreenInMobileMode;

        config.data = dialogData;
        config.maxWidth = '100%';
        config.maxHeight = '100%';

        if (maxHeight) {
            config.maxHeight = maxHeight;
        }
        // If screen is small (in mobile mode), we should overwrite width and height to 100%
        // it make popup display full screen
        if (!!isFullScreenInMobileMode && this._util.isSmallScreen) {
            config.width = '100%';
            config.height = '100%';
        }
        return config;
    }


    openSlideDialog(dialogRef: MatDialogRef<any>, component: Type<any>, data?: any, width?: string, height?: string, disableClose?: boolean, isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string): Observable<any> {
        return this.openSlideDialogRef(dialogRef, component, data, width, height, disableClose, isFullScreenInMobileMode, config, maxHeight).afterClosed();
    }

    openSlideDialogRef(dialogRef: MatDialogRef<any>, component: Type<any>, data?: any, width?: string, height?: string, disableClose?: boolean, isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string) {

        // disableClose is always tru so that we will mamage manually
        if (dialogRef && dialogRef['className'] === 'SliderRef') {
            const dialogConfig = this.getDialogConfig(data, width, height, true, isFullScreenInMobileMode, config, maxHeight);
            //Show backbutton
            dialogConfig.data.ShowBackButton = true;
            // Prevent resize when dialog in slide mode
            component.prototype.onResizeWindow = () => {
            };
            const sliderRef: SliderRef = <any>dialogRef;
            return this.slideDialogService.open(component, dialogConfig, sliderRef.getDialogRef());
        } else {
            return this.openDialogRef(component, data, width, height, disableClose, isFullScreenInMobileMode, config, maxHeight);
        }
    }

    createSliderDialog(component: Type<any>, data?: any, width?: string, height?: string, disableClose?: boolean, isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string) {
        return this.createSliderDialogRef(component, data, width, height, disableClose, isFullScreenInMobileMode, config, maxHeight).afterClosed();
    }

    createSliderDialogRef(component: Type<any>, data?: any, width?: string, 
        height?: string, disableClose?: boolean, isFullScreenInMobileMode = true, config?: MatDialogConfig, maxHeight?: string) {
        // Open dialog

        // for slide back by esc key, we have to handle it manually
        const dialogConfig = this.getDialogConfig(data, width, height, true, isFullScreenInMobileMode, config, maxHeight);
        const dialogRef = this.matDialog.open(SlidesDialog, dialogConfig);

        // with slide dialog we managed slide back by esc key manualy
        dialogRef.keydownEvents()
        .pipe(filter(event => {
          return event.keyCode === ESCAPE && !hasModifierKey(event);
        }))
        .subscribe(event => {
            event.preventDefault();
            this.slideBackLastDialog();
        });            

        // Prevent resize when dialog in slide mode
        component.prototype.onResizeWindow = () => {
        };
        dialogConfig.data.ShowBackButton = false;
        let slideRef: SliderRef;
        // fix bug lazy loading module show blank dialog first
        this._zone.run(() => {
            slideRef = this.slideDialogService.open(component, dialogConfig, dialogRef);
        });
        dialogRef.beforeClosed().subscribe((value) => {
            let slidesDialog = dialogRef.componentInstance.slides,
                selectedSlide = slidesDialog.slides[slidesDialog.selectedIndex];
            if (slideRef !== selectedSlide.slideRef) {
                selectedSlide.slideRef.afterClosed().next(value);
            }
            slideRef.afterClosed().next(value);
        });
        return slideRef;
    }

    getOpenDialogs() {
        return this.matDialog.openDialogs;
    }

    slideBackLastDialog(): void {       

        let dialogsCount = this.matDialog.openDialogs.length;

        if (dialogsCount === 0) {
            return;
        }
        
        let dlgRef = this.matDialog.openDialogs[dialogsCount - 1];
        if (dlgRef.componentInstance) {
            // slider dialog
            if (dlgRef.componentInstance.slideService) {
                let sliderService: SlideService = dlgRef.componentInstance.slideService;
                let currentSlide =  sliderService.getCurrentDialogSubject(dlgRef);

                if (currentSlide && currentSlide.dialogRef) {
                    let currnetSlideRef = currentSlide.slideRefs[currentSlide.slideRefs.length - 1];

                    if (currnetSlideRef) {
                        currnetSlideRef.close(null, true);
                    }
                }
            } 
        }
    }
}
