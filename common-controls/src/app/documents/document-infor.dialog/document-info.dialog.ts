import { Component, Inject, Injector  } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData, IDocumentWrapper } from '../../shared/models/common.info';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { CommonDocumentService } from '../shared/common-document.service';

@Component({
    selector: 'ntk-document-info-dialog',
    templateUrl: './document-info.dialog.html'
})

// tslint:disable-next-line: component-class-suffix
export class DocumentInfoDialog extends BaseDialog {
    model;
    fileSize = '';

    private _dococumentSvc: CommonDocumentService;

    constructor(injector: Injector, dialogRef: MatDialogRef<DocumentInfoDialog>, @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);
        this._dococumentSvc = injector.get(CommonDocumentService);
        const issueAttachment: IDocumentWrapper = dialogData.Data;
        this.model = issueAttachment.Document;
        this.initializeData(issueAttachment.Document.Id);
    }

    initializeData(docId: string) {
        this._dococumentSvc.getDocumentInfo(docId).subscribe(r => {
            this.model = r;
        });
    }

    
    formatbytesToKb(bytes: number): string {
        return Math.ceil((bytes || 0) / 1024) + " KB";
    }
}
