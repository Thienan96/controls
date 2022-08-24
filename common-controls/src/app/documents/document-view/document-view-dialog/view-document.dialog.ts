import {AfterContentInit, Component, Inject, Injector, ViewChild} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BaseDialog} from '../../../core/dialogs/base.dialog';
import { HelperService } from '../../../shared/common-controls-shared.module';
import {DialogData, IDocumentWrapper} from '../../../shared/models/common.info';
import { DocumentViewComponent } from '../document-view.component';

@Component({
    selector: 'ntk-view-document-dialog',
    templateUrl: './view-document.dialog.html'
})

export class ViewDocumentDialog extends BaseDialog implements AfterContentInit {

    private _helper: HelperService;
    @ViewChild('documentViewer', {static: false}) documentViewer: DocumentViewComponent;
    documentWrapper: IDocumentWrapper;
    canDraw = false;
    showBackButton = false;
    showDownload = false;
    isOffline: boolean;

    constructor(injector: Injector,
        dialogRef: MatDialogRef<ViewDocumentDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);
        this.showBackButton = this.dialogData.ShowBackButton;
        this.isOffline = this.dialogData.Data.isOffline;
        if (this.dialogData.Data && this.dialogData.Data.ShowDownload) {
            this.showDownload = this.dialogData.Data.ShowDownload;
        }        

        this._helper = injector.get(HelperService);

        if (dialogRef) {
            dialogRef.afterClosed().subscribe(x => {
                if (this.documentViewer['Shapes']) {
                    this.documentViewer.saveCurrentDrawing();
                }
            });
        }
    }

    ngAfterContentInit(): void {
        if (this.dialogData.Data) {
            // need a timmer to besure the silde animation finish so that the view can compute the size correctly
            setTimeout(() => {
                this.documentWrapper = this.dialogData.Data.document;
                this.canDraw = this.dialogData.Data.canDraw;

                // This is use for slide context that it delay litle until the slide finish then we allow user to continue
                this._helper.isBusy = false;
            }, 800);
        }
    }
}
