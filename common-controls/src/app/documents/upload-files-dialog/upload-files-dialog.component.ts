import { Component, OnInit, Injector, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AttachDocumentsDialog } from '../attach-document-dialog/attach-documents.dialog';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { AttachmentData, DialogData, BaseItem, UploadStatus } from '../../shared/models/common.info';
import {ImageThumbComponent} from '../image-thumb/image-thumb.component';
import { CommonDocumentService } from '../shared/common-document.service';

@Component({
  selector: 'ntk-upload-files-dialog',
  templateUrl: './upload-files-dialog.component.html',
  styleUrls: ['./upload-files-dialog.component.css']
})
export class UploadFilesDialog extends BaseDialog implements OnInit {

  private _docService: CommonDocumentService;
  attachmentData: Array<AttachmentData> = [];
  private _folderId: string;
  private _source: string;

  canSave = false;
  _siteId: any;
  constructor(injector: Injector, private dialogRef: MatDialogRef<AttachDocumentsDialog>
    , @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
      super(injector, dialogRef, dialogData);

      this.attachmentData = dialogData.Data.initFiles;
      this._folderId = dialogData.Data.folderId;
      this._siteId = dialogData.Data.siteId;
      this._source = dialogData.Data.source;

      this._docService = injector.get(CommonDocumentService);
    }

  ngOnInit() {
  }

  onImageThumbLoaded(event: ImageThumbComponent) {
    event.startUpload(this._siteId);

    if (event.model && event.model.File) {
      event.fileType = event.model.File.name.split('.').pop();
      event.fileSize = Math.ceil(event.model.File.size / 1024) + ' KB'
    }
  }

  onRemoveImageThumb(event: ImageThumbComponent) {
    let index: number = this.attachmentData.indexOf(event.model);
    if (index >= 0) {
        this.attachmentData.splice(index, 1);
    }

    this.updateCansave();
  }

  onImageThumbStatusChanged(event: ImageThumbComponent) {
    // console.log('onImageThumbStatusChanged: ', event);
    this.updateCansave();
  }

  onSaveClick() {
    if (!this.canSave) {
      return;
    }

    let docs = this.attachmentData.map<BaseItem>(f => { return {Id: f.Id, Name: f.File.name}; });
    this.canSave = false;
    // NBSHD-4558: use this popup to attach files in Follow-up tab if Inspection module
    if (!!this._source) {
      this._docService.createDocumentsFromFiles(this._siteId, docs).subscribe(x => {
        this.canSave = true;
        this.close(x);
      }, (err) => {
        this.canSave = true;
      });
    }
    else {
      this._docService.createDocumentsFromUploadFiles(this._folderId, docs).subscribe(x => {
        this.canSave = true;
        this.close(x);
      }, (err) => {
        this.canSave = true;
      });
    }
  }

  onFilesAdded(files: File[]) {
    // console.log('onFilesAdded: ', JSON.stringify(files));

    files.forEach(f => {
      let fileData = <AttachmentData>{
        Id: undefined,
        Status: UploadStatus.None,
        File: f
      }

      this.attachmentData.splice(0, 0, fileData);
    });

    this.updateCansave();
  }

  private updateCansave() {
    this.canSave = false;
    if (this.attachmentData.length > 0) {
      this.canSave = true;
      this.attachmentData.forEach(d => {
          if (d.Status !== UploadStatus.Uploaded) {
            this.canSave = false;
          }
        });
    }
  }
}
