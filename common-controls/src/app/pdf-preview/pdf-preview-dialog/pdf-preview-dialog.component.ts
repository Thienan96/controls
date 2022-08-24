import { Component, OnInit, Injector, Inject, AfterContentInit } from '@angular/core';
import { IDocumentWrapper, DialogData, Document } from '../../shared/models/common.info';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { AppConfig } from '../../core/app.config';
import { UtilityService } from '../../core/services/utility.service';
import { HelperService } from '../../core/services/helper.service';


@Component({
  selector: 'ntk-pdf-preview-dialog',
  templateUrl: './pdf-preview-dialog.component.html',
  styleUrls: ['./pdf-preview-dialog.component.scss']
})
export class PdfPreviewDialogComponent extends BaseDialog implements AfterContentInit {

  previewUrl: string;
  documentWrapper: IDocumentWrapper;
  showBackButton = false;
  _helper: any;

  constructor(
    private _appConfig: AppConfig,
    private _utility: UtilityService,
    injector: Injector,
    dialogRef: MatDialogRef<PdfPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
    super(injector, dialogRef, dialogData);
    this.showBackButton = this.dialogData.ShowBackButton;

    this._helper = injector.get(HelperService);

    if (dialogRef) {
    }
  }


  ngAfterContentInit(): void {
    if (this.dialogData.Data) {
      // need a timmer to besure the silde animation finish so that the view can compute the size correctly
      setTimeout(() => {
        this.documentWrapper = this.dialogData.Data.document;
        this.buildDocumentUrl(this.documentWrapper.Document);

        // This is use for slide context that it delay litle until the slide finish then we allow user to continue
        this._helper.isBusy = false;
      }, 800);
    }
  }

  // get full document url
  buildDocumentUrl(document: Document) {
    if (!document) {
      return '';
    }

    this.previewUrl = this._utility.addSlashIfNotExists(this._appConfig.API_URL) + `${document.DocumentUrl}.${document.Type}`;
  }
}
