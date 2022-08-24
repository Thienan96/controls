import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { AttachmentData, UploadStatus, IDocumentWrapper } from '../../shared/models/common.info';
import { ImageThumbComponent } from '../image-thumb/image-thumb.component';
import { TranslationService } from '../../core/services/translation.service';
import { UtilityService } from '../../core/services/utility.service';
import { DialogService } from '../../core/services/dialog.service';
import { BackgroundService } from '../../background-tasks/shared/background.service';
import { Observable } from 'rxjs';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';

@Component({
    selector: 'ntk-attachment-box',
    templateUrl: './attachment-box.component.html',
    styleUrls: ['./attachment-box.component.scss']
})
export class AttachmentBoxComponent {
    @Output() drawingChanged = new EventEmitter<any>();

    @Input() autoCreateAttachment = true;

    // Default Extensions
    // In EJ4, allow also docx xlsx
    @Input() acceptExtensions = ".pdf,.png,.jpeg,.jpg";

    // Custom translation for the dropFilesGuide
    @Input() dropFilesGuideKey = "lbDropFilesGuide";

    // Custom translation message when drop not support files
    @Input() filesNotSupportedMessageKey = "msgSelectedFilesNotSupported";

    // issue NBSHD-4555: display image without title in lines on module inspection
    @Input() hideTittle: boolean;

    // Option of display the image fix to the VP
    // Default = false
    @Input() isFitImageToVp = false;

    // Custom width and height for the image
    @Input() imageWidth: number;
    @Input() imageHeight: number;

    // NBSHD-4558: show confirm message before delete document
    @Input() isConfirmDelete = false;
    // NBSHD-4558: attach files in a new popup
    @Input() uploadFilesInPopup = false;

    @Input() allowMultipleFile = true;

    @Input() forceHideRemoveImg = false;

    // need fire event from common document or only itseft
    /**
     * @needGlobalEvent
     * @Fixbug Can not display infor dialog in GF from tab ticket of intervention module
     * @Reasion Because of lazy loading, it create 2 instances of CommonDocumentService
     * Event show infor from CommonDocumentService of ticket tab can not catch by CommonDocumentService of Intervention
     */
    @Input() needGlobalEvent = true;

    @Output('onDownLoadDocument') onDownLoadDocument = new EventEmitter();
    @Output('onShowDocumentInfo') onShowDocumentInfo = new EventEmitter();


    @Input() isBackgroundMode = false;

    // for NF
    @Input('secureUrl') secureUrl = true;
    // for NF
    @Input('showMenu') showMenu = true;
    // NF-364
    @Input() additionalFileKey: string;
    @Output() additionalFileClicked = new EventEmitter();

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

    @Input() get attachments(): Array<IDocumentWrapper> {
        return this._attachments;
    }
    set issueId(value: string | undefined) {
        this._issueId = value;
        this.issueIdChange.emit(this._issueId);
    }
    @Input() get issueId(): string | undefined {
        return this._issueId;
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
    @Input() get maxHeight(): string | undefined {
        return this._maxHeight;
    }

    get isProcessing(): boolean {
        if (this.attachmentData) {
            for (let i = 0; i < this.attachmentData.length; i++) {
                const ad = this.attachmentData[i];
                if (ad && (ad.Status === UploadStatus.Uploading || ad.Status === UploadStatus.Saving)) {
                    return true;
                }
            }
        }

        return false;
    }
    @ViewChild('panelBrowseFiles', { static: false }) panelBrowseFiles: ElementRef;
    @ViewChild('inputCloudFiles', { static: false }) inputCloudFiles: ElementRef;
    @ViewChild('inputBrowseFiles', { static: false }) inputBrowseFiles: ElementRef;
    @ViewChildren(forwardRef(() => ImageThumbComponent)) imageThumbs: QueryList<ImageThumbComponent>;

    @Output('image-thumb-status-changed') imageThumbStatusChanged = new EventEmitter<ImageThumbComponent>();
    @Output('collection-changed') collectionChanged = new EventEmitter<{ action: string, items: any[] }>();
    @Input() disabled: boolean;
    @Input() canDraw: boolean;

    @Input() siteId: string;
    @Input() canSelect: boolean;
    @Input() hideButtonAdd: boolean;
    @Output() selectedChanged = new EventEmitter<any>();
    @Output() attachmentBoxChanged = new EventEmitter<any>();
    @Output() showedDocument = new EventEmitter<any>();

    @Output() onThumbClicked = new EventEmitter();
    @Output() filesDropped = new EventEmitter();

    attachmentData: Array<AttachmentData> = [];
    isSmallScreen: Observable<boolean>;
    isDevice: boolean;
    private _attachments: Array<IDocumentWrapper>;
    private _issueId: string | undefined;
    private _maxHeight: string | undefined;

    // Property attachments for binding 2 ways
    @Output() attachmentsChange: EventEmitter<any> = new EventEmitter<any>();

    // Property issueId for binding 2 ways
    @Output() issueIdChange: EventEmitter<any> = new EventEmitter<any>();

    // Property maxHeight for binding 2 ways
    @Output() maxHeightChange: EventEmitter<string> = new EventEmitter<string>();

    // in NF we will hanlde image click by special logic
    @Input() autoHandleThumbClick: boolean = true;

    constructor(protected _renderer: Renderer2, protected _utilityService: UtilityService,
        protected _translationService: TranslationService,
        protected _dialogService: DialogService,
        protected _backgroundService: BackgroundService,
        protected _utl: UtilityService) {
        this.canDraw = true;
        this.isSmallScreen = this._utl.screenResizeToSmall();
        this.isDevice = this._utl.isDevice;
    }

    onDragOver(event: any) {
        if (!!this.disabled) { return; }

        event.preventDefault();
        event.stopPropagation();

        this._renderer.setStyle(this.panelBrowseFiles.nativeElement, 'border-color', '#3498DB');
    }

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

    onDragLeave(event: any) {
        if (!!this.disabled) { return; }

        event.preventDefault();
        event.stopPropagation();

        this._renderer.setStyle(this.panelBrowseFiles.nativeElement, 'border-color', 'rgba(0,0,0,0.28)');
    }

    onDrop(event: any) {
        if (!!this.disabled) { return; }

        event.preventDefault();
        event.stopPropagation();

        this._renderer.setStyle(this.panelBrowseFiles.nativeElement, 'border-color', 'rgba(0,0,0,0.28)');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.onSelectFiles(files);
        }
    }

    trggerFromOutside() {
        this.inputBrowseFiles.nativeElement.click();
    }

    browseFiles() {
        // In IE text Browse doesn't work, so we have to trigger in event click
        if (this._utilityService.isIE) {
            this.inputBrowseFiles.nativeElement.click();
        }
    }

    additionalFileClick() {
        if (this.additionalFileClicked) {
            this.additionalFileClicked.emit();
        }
    }

    attachFile(file: File): AttachmentData | null {
        let errorMsg: string;

        if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
            errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
        }
        else {
            // In the case accept : docx and xlsx
            if (this.acceptExtensions && this.acceptExtensions.toLowerCase().indexOf("docx") >= 0
                && this.acceptExtensions.toLowerCase().indexOf("xlsx") >= 0) {
                if (!(/(\.|\/)(pdf|jpg|jpeg|png|docx|xlsx)$/i).test(file.name))
                    errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
            }
            else if (this.acceptExtensions && this.acceptExtensions.includes('image')) { // NF-357: accept image files only (image/*)
                if (!file.type.includes('image'))
                    errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
            }
            else if (this.acceptExtensions !== '*.*' && !(/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) { // only allow upload pdf, jpg, jpeg, png  (old code pdf|jpg|jpeg|png|docx|xlsx)
                errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
            }
        }


        if (errorMsg) {
            // file is over size or extension is not supported
            this._dialogService.showToastMessage(errorMsg);
        } else {
            const item: AttachmentData = new AttachmentData();
            item.File = file;

            if (this.isBackgroundMode) {
                console.log('----- add backgroup task with this.issueId = ', this.issueId);
                this._backgroundService.backgroundUpload(this.issueId, this.siteId, item);
            }

            if (this.allowMultipleFile) {
                this.attachmentData.push(item);
            }
            else {
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
        }
        else {
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
            }
            else {
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

        // console.log('onImageThumbStatusChanged: ', event);

        // if (!this._issueId) { throw new Error('The issueId is undefined.'); }

        // if (!!this.autoCreateAttachment && event.model.Status === UploadStatus.Uploaded) {

        //     this.doc
        //     event.model.DocumentWrapper = {
        //         Document: {
        //             Id: event.model.Id,
        //             Name: event.model.File.name
        //         }
        //     }
        //     // create IssueAttachment after file is uploaded successfully
        //     //event.createAttachment(this.issueId);
        // }
        // else if (event.model.Status === UploadStatus.Saved) {
        //     // after attachment is created, try to fill property "Site", ensure the use click on thumbnail to open full view image
        //     event.model.DocumentWrapper.Document.Folder.Site = <ISite>{ Id: this.siteId };
        // }

        this.imageThumbStatusChanged.emit(event);
    }

    invalidateFile(file: File): File | undefined {
        let errorMsg: string;

        if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
            errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
        }
        else {
            // In the case accept : docx and xlsx
            if (this.acceptExtensions && this.acceptExtensions.toLowerCase().indexOf("docx") >= 0
                && this.acceptExtensions.toLowerCase().indexOf("xlsx") >= 0) {
                if (!(/(\.|\/)(pdf|jpg|jpeg|png|docx|xlsx)$/i).test(file.name))
                    errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
            }
            else if (this.acceptExtensions && this.acceptExtensions.includes('image')) { // NF-357: accept image files only (image/*)
                if (!file.type.includes('image'))
                    errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
            }
            else if (this.acceptExtensions !== '*.*' && !(/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) { // only allow upload pdf, jpg, jpeg, png  (old code pdf|jpg|jpeg|png|docx|xlsx)
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

    public dropped(files: NgxFileDropEntry[]) {
        let dropFiles = [];

        let totalFiles = files.length;
        let completed = 0;
        let error = false;

        for (const droppedFile of files) {
            // Is it a file?
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;

                fileEntry.file((file: File) => {
                    // Here you can access the real file
                    console.log(droppedFile.relativePath, file);

                    if (this.uploadFilesInPopup) {
                        let f = this.invalidateFile(file);

                        if (f) {
                            dropFiles.push(f);
                        } else {
                            error = true;
                        }

                        completed++;
                    }
                    else {
                        let att = this.attachFile(file);

                        if (att) {
                            dropFiles.push(att);
                        } else {
                            error = true;
                        }

                        completed++;
                    }

                    /**
                    // You could upload it like this:
                    const formData = new FormData()
                    formData.append('logo', file, relativePath)
      
                    // Headers
                    const headers = new HttpHeaders({
                      'security-token': 'mytoken'
                    })
      
                    this.http.post('https://mybackend.com/api/upload/sanitize-and-save-logo', formData, { headers: headers, responseType: 'blob' })
                    .subscribe(data => {
                      // Sanitized logo returned from backend
                    })
                    **/

                });
            }
        }

        let interval = IntervalObservable.create(100);
        let timmer = interval.subscribe(() => {
            if (error) {
                timmer.unsubscribe();
            } else if (completed === totalFiles) {
                // console.log('dropFiles: ', dropFiles);
                this.filesDropped.emit(dropFiles);
                timmer.unsubscribe();
            }
        });
    }

    public fileOver(event) {
        console.log(event);
    }

    public fileLeave(event) {
        console.log(event);
    }

    onSelectedChanged(event: any) {
        this.selectedChanged.emit(event);
    }

    onShowDocument(event: any) {
        this.showedDocument.emit(event);
    }
    getStyle() {
        return this.disabled ? 'disabled-drop-zone' : 'enable-drop-zone';
    }

    onDrawingChanged($event: any) {
        // console.log('---attach box onDrawingChanged=', $event);
        this.drawingChanged.emit($event.data);
    }

    onImageThumbDownload($event) {
        this.onDownLoadDocument.emit($event);
    }

    onImageThumbShowDocumentInfo($event) {
        this.onShowDocumentInfo.emit($event);
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
    @Output() imageLoaded = new EventEmitter();

    loadedImg(ev) {
        this.imageLoaded.emit(ev);
    }

}
