import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { AttachmentData, IDocumentWrapper, UploadStatus } from '../../shared/models/common.info';
import { ImageThumbComponent } from '../image-thumb/image-thumb.component';
import { TranslationService } from '../../core/services/translation.service';
import { UtilityService } from '../../core/services/utility.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
    selector: 'ntk-upload-logo',
    templateUrl: './upload-logo.component.html',
    styleUrls: ['./upload-logo.component.scss']
})
export class UploadLogoComponent {
    logoId;
    // set attachments(listDocumentWrapper: Array<IDocumentWrapper>) {
    //     this._attachments = listDocumentWrapper;
    //     this.attachmentsChange.emit(this._attachments);

    //     let atts: Array<AttachmentData> = [];
    //     if (this._attachments && this._attachments.length > 0) {
    //         this._attachments.forEach(dAtt => {
    //             let att: AttachmentData = new AttachmentData();
    //             att.DocumentWrapper = dAtt;
    //             atts.push(att);
    //         });
    //     }
    //     this.attachmentData = atts;
    // }
    // @Input() get attachments(): Array<IDocumentWrapper> {
    //     return this._attachments;
    // }

    get isProcessing(): boolean {
        if (this.attachmentData) {
            for (let i = 0; i < this.attachmentData.length; i++) {
                let ad = this.attachmentData[i];
                if (ad && (ad.Status === UploadStatus.Uploading || ad.Status === UploadStatus.Saving)) {
                    return true;
                }
            }
        }

        return false;
    }
    @ViewChild('panelBrowseFiles', { static: false }) panelBrowseFiles: ElementRef;
    @ViewChild('inputBrowseFiles', { static: false }) inputBrowseFiles: ElementRef;
    @ViewChild('changeLogo', { static: false }) changeLogo: ElementRef;
    @ViewChildren(forwardRef(() => ImageThumbComponent)) imageThumbs: QueryList<ImageThumbComponent>;

    @Output('image-thumb-status-changed') imageThumbStatusChanged = new EventEmitter<ImageThumbComponent>();
    @Output('collection-changed') collectionChanged = new EventEmitter<{ action: string, items: any[] }>();
    @Input() disabled: boolean;
    @Input() canDraw: boolean;
    @Input() hiddenButtons: boolean; // upload logo of managed company

    @Output() selectedChanged = new EventEmitter<any>();
    @Output() attachmentBoxChanged = new EventEmitter<any>();


    @Input() attachmentData: Array<AttachmentData> = [];

    // Property attachments for binding 2 ways
    @Output() attachmentsChange: EventEmitter<any> = new EventEmitter<any>();

    constructor(private _utilityService: UtilityService,
        private _translationService: TranslationService, private _dialogService: DialogService) {
    }

    browseFiles() {
        // In IE text Browse doesn't work, so we have to trigger in event click
        if (this._utilityService.isIE) {
            this.inputBrowseFiles.nativeElement.click();
        }
    }

    private attachFile(file: File): AttachmentData | null {
        let errorMsg: string;

        if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
            errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
        } else if (!(/(\.|\/)(jpg|jpeg)$/i).test(file.name)) {
            errorMsg = this._translationService.getTranslation('msgLogoFileNotSupported');
        }

        if (errorMsg) {
            // file is over size or extension is not supported
            this._dialogService.showToastMessage(errorMsg);
        } else {
            let item: AttachmentData = new AttachmentData();
            item.File = file;

            this.attachmentData[0] = item;

            return item;
        }

        return null;
    }
    onSelectFiles(fileList: FileList) {

        if (!fileList || fileList.length <= 0) { return; }
        this.attachmentData = [];
        let addedItems = [];
        for (let i = 0; i < fileList.length; i++) {
            let file: File = fileList.item(i);
            let newItem = this.attachFile(file);
            if (newItem) {
                addedItems.push(newItem);
            }
        }

        // reset input, make sure user can re-select file which he remove before
        // this.inputBrowseFiles.nativeElement.value = '';

        // raise event collectionChanged
        this.collectionChanged.emit({ action: 'add', items: addedItems });
    }
    public dropped(files: NgxFileDropEntry[]) {
        for (const droppedFile of files) {
            // Is it a file?
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;

                fileEntry.file((file: File) => {
                    // Here you can access the real file
                    console.log(droppedFile.relativePath, file);

                    this.attachFile(file);

                });
            }
        }
    }

    getStyleLogo() {
        return this.attachmentData.length === 0 ? 'show-border-drop-zone' : 'disabled-drop-zone';
    }
    removeLogo() {
        this.logoId = '';
        this.attachmentData = [];
        this.imageThumbs.forEach(t => {
            t.onRemoveImageThumb();
        });
    }

    onImageThumbLoaded(event: ImageThumbComponent) {
        this.attachmentBoxChanged.emit();
        event.startUploadLogo();
    }

    getLogoUploaded(event) {
        this.logoId = event;
    }

    onImageThumbStatusChanged(event: ImageThumbComponent) {
        this.imageThumbStatusChanged.emit(event);
    }
}
