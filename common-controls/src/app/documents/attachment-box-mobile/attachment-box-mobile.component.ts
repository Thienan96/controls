import { Component, ElementRef, EventEmitter, forwardRef, Input, OnInit, Output, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { AttachmentData, DrawingShape, IDocumentWrapper, UploadStatus } from '../../shared/models/common.info';
import { BackgroundService } from '../../background-tasks/shared/background.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslationService } from '../../core/services/translation.service';
import { UtilityService } from '../../core/services/utility.service';
import { ImageThumbComponent } from '../image-thumb/image-thumb.component';

@Component({
  selector: 'ntk-attachment-box-mobile',
  templateUrl: './attachment-box-mobile.component.html',
  styleUrls: ['../attachment-box/attachment-box.component.scss', './attachment-box-mobile.component.scss']
})
// can not override AttachmentBoxComponent because AttachmentBoxComponent related to ngx-file-drop which can not build for mobile
export class AttachmentBoxMobileComponent {
  @ViewChild('panelBrowseFiles', { static: false }) panelBrowseFiles: ElementRef;
  @ViewChild('inputCloudFiles', { static: false }) inputCloudFiles: ElementRef;
  @ViewChild('inputBrowseFiles', { static: false }) inputBrowseFiles: ElementRef;
  @ViewChildren(forwardRef(() => ImageThumbComponent)) imageThumbs: QueryList<ImageThumbComponent>;

  @Input() autoCreateAttachment = true;
  // Default Extensions
  // In EJ4, allow also docx xlsx
  @Input() acceptExtensions = '.pdf,.png,.jpeg,.jpg';
  // Custom translation message when drop not support files
  @Input() filesNotSupportedMessageKey = 'msgSelectedFilesNotSupported';
  // Custom width and height for the image
  @Input() imageWidth: number;
  @Input() imageHeight: number;
  // NBSHD-4558: show confirm message before delete document
  @Input() isConfirmDelete = false;
  // NBSHD-4558: attach files in a new popup
  @Input() uploadFilesInPopup = false;
  @Input() allowMultipleFile = true;
  @Input() forceHideRemoveImg = false;
  @Input() isBackgroundMode = false;

  @Input() disabled: boolean;
  @Input() canDraw: boolean;
  @Input() canRemove: boolean;

  @Input() siteId: string;
  @Input() canSelect: boolean;
  @Input() isOffline: boolean; // NBSHD-4627: conditions: no internet access and already downloaded for offline
  @Input() get attachments(): Array<IDocumentWrapper> {
    return this._attachments;
  }

  set attachments(listDocumentWrapper: Array<IDocumentWrapper>) {
    this._attachments = listDocumentWrapper;
    this.attachmentsChange.emit(this._attachments);

    const atts: Array<AttachmentData> = [];
    if (this._attachments && this._attachments.length > 0) {
      this._attachments.forEach(dAtt => {
        const att: AttachmentData = new AttachmentData();
        att.DocumentWrapper = dAtt;
        if (!dAtt.CantRemove) { // property CantRemove doesn't set or CantRemove = false => possiable remove image
          att.CantRemove = false;
        } else { // set CantRemove = true => impossiable remove image
          att.CantRemove = true;
        }
        atts.push(att);
      });
    }

    this.attachmentData = atts;
  }

  @Input() get issueId(): string | undefined {
    return this._issueId;
  }
  set issueId(value: string | undefined) {
    this._issueId = value;
    this.issueIdChange.emit(this._issueId);
  }

  @Input() get maxHeight(): string | undefined {
    return this._maxHeight;
  }
  set maxHeight(value: string | undefined) {
    this._maxHeight = value;
    this.maxHeightChange.emit(this._maxHeight);

    if (this._maxHeight) {
      this._renderer.setStyle(this.panelBrowseFiles.nativeElement, 'max-height', this._maxHeight);
      this._renderer.setStyle(this.panelBrowseFiles.nativeElement, 'overflow', 'auto');
    } else {
      this._renderer.removeStyle(this.panelBrowseFiles.nativeElement, 'max-height');
      this._renderer.removeStyle(this.panelBrowseFiles.nativeElement, 'overflow');
    }
  }

  get isProcessing(): boolean {
    if (this.attachmentData) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < this.attachmentData.length; i++) {
        const ad = this.attachmentData[i];
        if (ad && (ad.Status === UploadStatus.Uploading || ad.Status === UploadStatus.Saving)) {
          return true;
        }
      }
    }

    return false;
  }

  @Output() drawingChanged = new EventEmitter<any>();
  @Output() imageLoaded = new EventEmitter();
  @Output('image-thumb-status-changed') imageThumbStatusChanged = new EventEmitter<ImageThumbComponent>();
  @Output('collection-changed') collectionChanged = new EventEmitter<{ action: string, items: any[] }>();
  @Output() selectedChanged = new EventEmitter<any>();
  @Output() attachmentBoxChanged = new EventEmitter<any>();
  @Output() showedDocument = new EventEmitter<any>();

  @Output() onThumbClicked = new EventEmitter();
  @Output() filesDropped = new EventEmitter();

  // Property attachments for binding 2 ways
  @Output() attachmentsChange: EventEmitter<any> = new EventEmitter<any>();
  // Property issueId for binding 2 ways
  @Output() issueIdChange: EventEmitter<any> = new EventEmitter<any>();
  // Property maxHeight for binding 2 ways
  @Output() maxHeightChange: EventEmitter<string> = new EventEmitter<string>();
  attachmentData: Array<AttachmentData> = [];

  @Input() viewMode = 'horizontal'; // vertical|horizontal

  private _attachments: Array<IDocumentWrapper>;
  private _issueId: string | undefined;
  private _maxHeight: string | undefined;

  constructor(protected _renderer: Renderer2, protected _utilityService: UtilityService,
    protected _translationService: TranslationService,
    protected _dialogService: DialogService,
    protected _backgroundService: BackgroundService,
    protected _utl: UtilityService) {
    this.canDraw = true;
  }

  // add file from outside control
  addAttachFile(listDocumentWrapper: Array<IDocumentWrapper>) {
    if (listDocumentWrapper && listDocumentWrapper.length > 0) {
      listDocumentWrapper.forEach(dAtt => {
        const att: AttachmentData = new AttachmentData();
        att.DocumentWrapper = dAtt;
        att.CantRemove = true;
        att.isNewFileAttach = true;
        this.attachmentData.push(att);
      });
    }
  }

  attachFile(file: File, shapes?: Array<DrawingShape>): AttachmentData | null {
    let errorMsg: string;

    if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
      errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
    } else {
      // In the case accept : docx and xlsx
      if (this.acceptExtensions && this.acceptExtensions.toLowerCase().indexOf('docx') >= 0
        && this.acceptExtensions.toLowerCase().indexOf('xlsx') >= 0) {
        if (!(/(\.|\/)(pdf|jpg|jpeg|png|docx|xlsx)$/i).test(file.name)) {
          errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
        }
      } else if (this.acceptExtensions && this.acceptExtensions.includes('image')) { // NF-357: accept image files only (image/*)
        if (!file.type.includes('image')) {
          errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
        }
      } else if (!(/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) { // only allow upload pdf, jpg, jpeg, png  (old code pdf|jpg|jpeg|png|docx|xlsx)
        errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
      }
    }


    if (errorMsg) {
      // file is over size or extension is not supported
      this._dialogService.showToastMessage(errorMsg);
    } else {
      let item: AttachmentData = new AttachmentData();
      item.File = file;
      if (shapes) {
        item = <AttachmentData>{
          ...item,
          DocumentWrapper: <IDocumentWrapper>{
            Shapes: shapes,
            DrawingPageIndex: 0,
            HasDrawing: true
          }
        };
        // item.DocumentWrapper.Shapes = shapes;
      }
      if (this.isBackgroundMode) {
        console.log('----- add backgroup task with this.issueId = ', this.issueId);
        this._backgroundService.backgroundUpload(this.issueId, this.siteId, item);
      }

      if (this.allowMultipleFile) {
        this.attachmentData.push(item);
      } else {
        this.attachmentData[0] = item;
        this.attachmentData.length = 1;
      }

      return item;
    }

    return null;
  }

  onSelectFiles(fileList: FileList) {
    if (!!this.disabled) { return; }

    if (!fileList || fileList.length <= 0) { return; }

    if (this.uploadFilesInPopup) { // NBSHD-4558: attach files in a new popup
      let values = Object.keys(fileList).map(e => fileList[e]);
      this.filesDropped.emit(values.map(f => this.invalidateFile(f)));
    } else {
      const addedItems = [];
      for (let i = 0; i < fileList.length; i++) {
        const file: File = fileList.item(i);
        const newItem = this.attachFile(file);
        if (newItem) {
          addedItems.push(newItem);
        }
      }

      // reset input, make sure user can re-select file which he remove before
      if (this.inputCloudFiles) {
        this.inputCloudFiles.nativeElement.value = '';
      }
      if (this.inputBrowseFiles) {
        this.inputBrowseFiles.nativeElement.value = '';
      }

      // raise event collectionChanged
      this.collectionChanged.emit({ action: 'add', items: addedItems });
    }
    // console.log('attachmentData', this.attachmentData)
  }

  // using when take picture from mobile
  onSelectPicture(file: File, shapes?: Array<DrawingShape>) {
    if (!!this.disabled) { return; }
    if (!file) { return; }
    const addedItems = [this.attachFile(file, shapes)];
    // raise event collectionChanged
    this.collectionChanged.emit({ action: 'add', items: addedItems });
  }

  onRemoveImageThumb(event: ImageThumbComponent) {
    const index: number = this.attachmentData.indexOf(event.model);
    if (index >= 0) {
      // NBSHD-4558: show confirm message before delete document
      if (this.isConfirmDelete && event.model.DocumentWrapper && event.model.DocumentWrapper.Id) {
        this._dialogService.showMessageDialog(
          '',
          this._translationService.getTranslation('msgConfirmToDeleteSelectedDocuments'),
          'btYesNo', null, null, null, 'btOk', 'btCancel').subscribe(res => {
            if (res) {
              const removed = this.attachmentData.splice(index, 1);

              // raise event collectionChanged
              this.collectionChanged.emit({ action: 'delete', items: removed });
            }
          });
      } else {
        const removed = this.attachmentData.splice(index, 1);

        // raise event collectionChanged
        this.collectionChanged.emit({ action: 'delete', items: removed });
      }
    }
  }

  onImageThumbLoaded(event: ImageThumbComponent) {
    if (!this.isBackgroundMode) {
      this.attachmentBoxChanged.emit();
      event.startUpload(this.siteId, this.autoCreateAttachment);
    }
  }

  onImageThumbStatusChanged(event: ImageThumbComponent) {
    this.imageThumbStatusChanged.emit(event);
  }

  invalidateFile(file: File): File | undefined {
    let errorMsg: string;

    if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
      errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
    } else {
      // In the case accept : docx and xlsx
      if (this.acceptExtensions && this.acceptExtensions.toLowerCase().indexOf('docx') >= 0
        && this.acceptExtensions.toLowerCase().indexOf('xlsx') >= 0) {
        if (!(/(\.|\/)(pdf|jpg|jpeg|png|docx|xlsx)$/i).test(file.name)) {
          errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
        }
      } else if (this.acceptExtensions && this.acceptExtensions.includes('image')) { // NF-357: accept image files only (image/*)
        if (!file.type.includes('image')) {
          errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
        }
      } else if (!(/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) { // only allow upload pdf, jpg, jpeg, png  (old code pdf|jpg|jpeg|png|docx|xlsx)
        errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
      }
    }

    if (errorMsg) {
      // file is over size or extension is not supported
      this._dialogService.showToastMessage(errorMsg);
      return undefined;
    } else {
      return file;
    }
  }

  onSelectedChanged(event: any) {
    this.selectedChanged.emit(event);
  }

  onShowDocument(event: any) {
    this.showedDocument.emit(event);
  }

  onDrawingChanged($event: any) {
    // console.log('---attach box onDrawingChanged=', $event);
    this.drawingChanged.emit($event.data);
  }

  restorePendingUpload(restoreId?: string) {
    if (this.isBackgroundMode) {
      if (restoreId) { this.issueId = restoreId; }

      if (this.issueId) {
        let myFiles = this._backgroundService.getPenddingUploadTasks(this.issueId);
        if (myFiles) {
          myFiles.forEach(f => {
            this.attachmentData.push(f.data);
          });
        }
      } else {
        console.log('There is not issue Id to restore.');
      }
    }
  }

  // The component reinit with already uploaded files
  restoreUploadedFiles(files: AttachmentData[]) {
    if (files) {
      files.forEach(f => {
        this.attachmentData.push(f);
      });
    }
  }

  onImageClick($event) {
    this.onThumbClicked.emit($event);
  }

  loadedImg(ev) {
    this.imageLoaded.emit(ev);
  }

}
