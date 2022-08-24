import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { MatDialogRef } from '@angular/material/dialog';
import { AttachmentData, UploadStatus, BaseItem, Document } from '../../shared/models/common.info';
import { DialogService } from '../../core/services/dialog.service';
import { TranslationService } from '../../core/services/translation.service';
import { HelperService } from '../../core/services/helper.service';
import { CommonDocumentService } from '../shared/common-document.service';
import * as _ from 'underscore';
import { ViewDocumentDialog } from '../document-view/document-view-dialog/view-document.dialog';

@Component({
    selector: 'ntk-image-thumb',
    templateUrl: './image-thumb.component.html',
    styleUrls: ['./image-thumb.component.scss']
})

export class ImageThumbComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input('showMenu') showMenu = true;
    @Input('canDraw') canDraw: boolean;

    // in mobile mode, we reduce some alig code to run faster.
    @Input() isMobile = false;

    @Input() isLogo = false;
    @Input() hideTittle = false;

    @Output('onShowDocumentInfo') onShowDocumentInfo = new EventEmitter();
    @Output('onDownLoadDocument') onDownLoadDocument = new EventEmitter();

    @Input() handlerClickOnImage: boolean = false;
    @Input() isSelectToDisplay: boolean = false;
    // need fire event from common document or only itseft
    @Input() needGlobalEvent = true;

    @Output() onImageClicked = new EventEmitter();

    @Input('secureUrl') secureUrl = true;    
    @Input() isOffline: boolean; // NBSHD-4627: conditions: no internet access and already download for offline


    private static readonly INTERVAL_DETECT_DOCUMENT_PROCESSED: number = 5000;
    @Output() removeImageThumb: EventEmitter<ImageThumbComponent> = new EventEmitter<ImageThumbComponent>();
    @Output() imageThumbLoaded: EventEmitter<ImageThumbComponent> = new EventEmitter<ImageThumbComponent>();
    @Output() statusChanged: EventEmitter<ImageThumbComponent> = new EventEmitter<ImageThumbComponent>();
    @Output() selectedChanged = new EventEmitter<any>();
    @Output() showedDocument = new EventEmitter<any>();
    @Output() drawingChanged = new EventEmitter<any>();
    @Output() logoUploaded = new EventEmitter();
    @Output() imageRatioLoaded = new EventEmitter();


    @ViewChild('hsImageContainer', { static: false }) hsImageContainer: ElementRef;
    @ViewChild('imageThumb', { static: false }) imageThumb: ElementRef; // this is for secure url
    
    @Input() model: AttachmentData;
    @Input() canSelect: boolean;
    @Input() isSelected: boolean;

    @Input() canRemove: boolean;

    @Input() containerWidth: number = 150;
    @Input() containerHeight: number = 180;

    // Move back from AngularJs version
    @Input() isFitImageToVp: boolean = false;    
    // using for mobile
    @Input() showRemoveBtnAtTopLeft: boolean;
 
    @Input() showBothCheckSelectedAndTitle: boolean;

    // In the case isFitImageToVp, the mat-progress-bar have the width = with of the image (displaying in the UI)
    // So that we need to compute the realImageWidth and set the with of the mat-progress-bar = realImageWidth
    realImageWidth: number = 0;    

    protected _documentService: CommonDocumentService;
    protected _dialogService: DialogService;
    protected _translationService: TranslationService;
    protected _requestUpload: Subscription;
    private _isDetectingDocumentProcessed: boolean;

    private _filePreviewPath: SafeUrl;
    private _imageUrlPath: string;

    protected _helper: HelperService;

    fileType = 'unknow';
    fileSize = '0 KB';

    private _timmerAlive = false;
    private _isThumbImageError = false;

    constructor(private injector: Injector, private _sanitizer: DomSanitizer, private _renderer: Renderer2, private _cd: ChangeDetectorRef) {
        this._documentService = injector.get(CommonDocumentService);
        this._dialogService = injector.get(DialogService);
        this._translationService = injector.get(TranslationService);
        this._helper = injector.get(HelperService);
    }

    ngOnInit() {
        this.imageThumbLoaded.emit(this);
        if (this.isLogo) {
            this.computeUrlLogo();
        } else {
            this.computeUrlImage();
        }
    }

    ngAfterViewInit() {
        if (this.isLogo) {
            this.computeUrlLogo();
        } else {
            this.startCheckDocumentProcessed();
            this.computeUrlImage();
        }
    }

    ngOnDestroy() {
        // reject request upload file
        if (this._requestUpload) {
            this._requestUpload.unsubscribe();
        }

        // console.log('image thumb destroy: ', this.model);
        this._timmerAlive = false;
    }


    get isUploading(): boolean {
        if (this.model) {
            return this.model.Status === UploadStatus.Uploading;
        }

        return false;
    }

    get isUploaded(): boolean {
        if (this.model) {
            return this.model.Status === UploadStatus.Uploaded;
        }

        return false;
    }

    get isUploadFailed(): boolean {
        if (this.model) {
            return this.model.Status === UploadStatus.UploadFailed;
        }

        return false;
    }

    get isSaveFailed(): boolean {
        if (this.model) {
            return this.model.Status === UploadStatus.SaveFailed;
        }

        return false;
    }

    get name(): string {
        if (this.model && this.model.DocumentWrapper && this.model.DocumentWrapper.Document) {
            return this.model.DocumentWrapper.Document.Name;
        } else if (this.model && this.model.File) {
            return this.model.File.name;
        }

        return '';
    }

    public get isImage(): boolean {
        return this.model && this.model.File
            && !((/(\.|\/)(pdf)$/i).test(this.model.File.name))
            && !((/(\.|\/)(docx)$/i).test(this.model.File.name))
            && !((/(\.|\/)(xlsx)$/i).test(this.model.File.name))
    }


    public get svgFileTypeKey() {
        if (!this.model) return '';
        let fileExt: string;
        if (this.model.File) {
            // For PDF, return empty to display the mat-icon 'picture_as_pdf'
            if ((/(\.|\/)(pdf)$/i).test(this.model.File.name)) return '';
            fileExt = this.model.File.name.split('.').pop();
        }
        else if (this.model.DocumentWrapper && this.model.DocumentWrapper.Document) {
            fileExt = this.model.DocumentWrapper.Document.Type;
        }
        if (!fileExt) return '';
        // For other file type, depend on the appication
        return this._documentService.getFileTypeSvgIconKey(fileExt.toLocaleLowerCase());
    }

    public get isDocumentUploaded(): boolean {
        if (this.model && this.model.DocumentWrapper &&
            this.model.DocumentWrapper.Document &&
            this.model.DocumentWrapper.Document.Status === 'Uploaded')
            return true;
        return false;
    }

    private _urlImage: any;
    get urlImage(): any {
        return this._urlImage;
    }

    protected computeUrlImage(): any {
        if (this.model && this.model.DocumentWrapper && this.model.DocumentWrapper.Document
            && this.model.DocumentWrapper.Document.Status === 'Processed') {
            // from Server
            if (!this._imageUrlPath) {
                if(this.model.DocumentWrapper.ThumbnailUrl){
                    this._imageUrlPath = this.model.DocumentWrapper.ThumbnailUrl;
                } else {
                    this._imageUrlPath = this._documentService.buildDocumentThumbUrl(this.model.DocumentWrapper.Document);
                }
            }

            this._isThumbImageError = false;
            this._urlImage = this._imageUrlPath;
            this._cd.detectChanges(); // render ui when upload pdf done
            
            return;
        } else if (this.model && this.model.File && this.isImage) {
            // From selected file
            // https://github.com/valor-software/ng2-file-upload/issues/158
            if (!this._filePreviewPath) {
                if (window.URL) {
                    this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl((window.URL.createObjectURL(this.model.File)));
                } else {
                    this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl(((window as any).webkitURL.createObjectURL(this.model.File)));
                }
            }
            this._isThumbImageError = false;
            this._urlImage = this._filePreviewPath;
            return;
        } else if (this.model && this.model.DocumentWrapper && this.model.DocumentWrapper.Document
            && this.model.DocumentWrapper.Document.Status === 'Offline') {
                if (this.model.DocumentWrapper.Document 
                    && ((this.model.DocumentWrapper.Document.Type && this.model.DocumentWrapper.Document.Type.indexOf('pdf') > -1)
                    || this.model.DocumentWrapper.Document.File && this.model.DocumentWrapper.Document.File.type.indexOf('pdf') > -1)) {
                    this._isThumbImageError = false;
                    this._urlImage = this._filePreviewPath;
                    return;
                }
                if (!this._filePreviewPath) {
                    if (window.URL) {
                        this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl((window.URL.createObjectURL(this.model.DocumentWrapper.Document.File)));
                    } else {
                        this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl(((window as any).webkitURL.createObjectURL(this.model.DocumentWrapper.Document.File)));
                    }
                }
                this._isThumbImageError = false;
                this._urlImage = this._filePreviewPath;
                return;
        }

        this._urlImage = '';
    }

    /**Allow to call from outside to allow recompute display url in case model changed */
    reComputeUrlImage() {
        this._imageUrlPath = null;
        this._filePreviewPath = null;
        this.computeUrlImage();
    }

    computeUrlLogo(): any {
        if (this.model && this.model.LogoURL) {
            this._isThumbImageError = false;
            this._urlImage = this.model.LogoURL;
        } else if (this.model && this.model.File) {
            // From selected file
            // https://github.com/valor-software/ng2-file-upload/issues/158
            if (!this._filePreviewPath) {
                if (window.URL) {
                    this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl((window.URL.createObjectURL(this.model.File)));
                } else {
                    this._filePreviewPath = this._sanitizer.bypassSecurityTrustUrl(((window as any).webkitURL.createObjectURL(this.model.File)));
                }
            }
            this._isThumbImageError = false;
            this._urlImage = this._filePreviewPath;
            return;
        }
    }

    get canViewDocument() {
        if (this.model 
            && this.model.DocumentWrapper
            && this.model.DocumentWrapper.Document
            && (this.model.DocumentWrapper.Document.Status === 'Processed' || 
            (this.model.DocumentWrapper.Document.Status === 'Offline')
            // not allow view pdf on offline
            && ((this.model.DocumentWrapper.Document.Type && this.model.DocumentWrapper.Document.Type.indexOf('pdf') === -1 )
            || this.model.DocumentWrapper.Document.File && this.model.DocumentWrapper.Document.File.type.indexOf('pdf') === -1))) {
            return true;
        }
        return false;
    }

    // default is 5 seconds (Unit as milisecond)
    

    get isNew(): boolean {
        return !this.model.DocumentWrapper || !this.model.DocumentWrapper.Id || this.model.isNewFileAttach;
    }

    revertSelectState() {
        this.isSelected = !this.isSelected;

        this.selectedChanged.emit({ 'id': this.model.DocumentWrapper.Id, 'isSelected': this.isSelected });
    }

    startUpload(siteId: string, autoCreateDocument = true, restoreId?: string) {
        // console.log('-----------------startUpload');
        if (!this.model.File) { return; }
        if (this.isOffline) {
            this.model.Status = UploadStatus.Offline;
            const d = new Document();
            this.model.DocumentWrapper = {
                Id: undefined,
                EntityVersion: 1,
                Document: {
                ...d, Status: 'Offline', Name: this.model.File.name, File: this.model.File
                },
                Shapes: [],
            };
            this.statusChanged.emit(this);
            this.computeUrlImage();
        } else {
            // Do not upload again the file already uploaded
            if (this.model.Status === UploadStatus.Uploaded) return;

            this._requestUpload = this._documentService.uploadFile(
                this.model.File,
                (event: HttpEventType, progress: number) => {
                    // console.info(HttpEventType[event] + " - Progress: " + progress);

                    this.model.progress = progress;
                },
                () => {
                    // console.info("Start uploaded: " + this.model.File.name + ' --- ' + this.model.File.size);
                    this.model.Status = UploadStatus.Uploading;
                    this.statusChanged.emit(this);
                },
                (httpCode: number, code: string, message: string) => {
                    // console.info('File Uploaded failed --> ' + code + ' : ' + message);
                    this.model.Status = UploadStatus.UploadFailed;
                    this.statusChanged.emit(this);

                if (code === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
                        .replace('{0}', this.model.File.name);
                    this._dialogService.showWarningToastMessage(_message);
                }
            }).subscribe(data => {
                if (data) {
                    // if (process.env.NODE_ENV === 'dev') {
                    //     // tslint:disable-next-line:no-console
                    //     console.info('File "' + this.model.File.name + '" Uploaded completed: ' + data);
                    // }

                    if (autoCreateDocument) {
                        this.createDocumentFromFile(siteId, <BaseItem>{ Id: data, Name: this.model.File.name });
                    } else {
                        this.model.Status = UploadStatus.Uploaded;
                        this.model.Id = (<any>data).Id || data; // some api only return string
                        this.statusChanged.emit(this);
                    }
                }

                this.computeUrlImage();
            }, (err) => {
                this.model.Status = UploadStatus.UploadFailed;
                this.statusChanged.emit(this);

                if (err === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
                        .replace('{0}', this.model.File.name);
                    this._dialogService.showWarningToastMessage(_message);
                }
            });
        }

        // console.log('[AttachmentBoxComponent]Selected file: ' + this.model.File.name);
        // console.info("==============================================================================");

        // this._requestUpload = this._documentService.uploadFileAndCreate(
        //     this.model.File,
        //     siteId,
        //     (event: HttpEventType, progress: number) => {
        //         // console.info(HttpEventType[event] + " - Progress: " + progress);
        //         this.progress = progress;
        //     },
        //     () => {
        //         // console.info("Start uploaded: " + this.model.File.name + ' --- ' + this.model.File.size);
        //         this.model.Status = UploadStatus.Uploading;
        //         this.statusChanged.emit(this);
        //     },
        //     (httpCode: number, code: string, message: string) => {
        //         // console.info('File Uploaded failed --> ' + code + ' : ' + message);
        //         this.model.Status = UploadStatus.UploadFailed;
        //         this.statusChanged.emit(this);

        //         if (code === 'InvalidFile') {
        //             let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
        //             .replace('{0}', this.model.File.name);
        //             this._dialogService.showWarningToastMessage(_message);
        //         }
        //     })
        //     .subscribe(document => {
        //         if (document) {
        //             // if (process.env.NODE_ENV === 'dev') {
        //             //     // tslint:disable-next-line:no-console
        //             //     console.info('File "' + this.model.File.name + '" Uploaded completed: ' + document);
        //             // }

        //             this.model.Status = UploadStatus.Uploaded;

        //             this.model.DocumentWrapper = {
        //                 Id: undefined,
        //                 EntityVersion: 1,
        //                 Document: document
        //             }

        //             this.startCheckDocumentProcessed();
        //             this.statusChanged.emit(this);
        //         }

        //         this.computeUrlImage();
        //     }, (err) => {
        //         this.model.Status = UploadStatus.UploadFailed;
        //         this.statusChanged.emit(this);

        //         if (err === 'InvalidFile') {
        //             let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
        //             .replace('{0}', this.model.File.name);
        //             this._dialogService.showWarningToastMessage(_message);
        //         }
        //     });
    }
    startUploadLogo() {
        // console.log('-----------------startUpload');
        if (!this.model.File) { return; }

        this._requestUpload = this._documentService.uploadLogo(
            this.model.File,
            (event: HttpEventType, progress: number) => {
                // console.info(HttpEventType[event] + " - Progress: " + progress);
                this.model.progress = progress;
            },
            () => {
                // console.info("Start uploaded: " + this.model.File.name + ' --- ' + this.model.File.size);
                this.model.Status = UploadStatus.Uploading;
                this.statusChanged.emit(this);
            },
            (httpCode: number, code: string, message: string) => {
                // console.info('File Uploaded failed --> ' + code + ' : ' + message);
                this.model.Status = UploadStatus.UploadFailed;
                this.statusChanged.emit(this);

                if (code === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgLogoFileNotSupported');
                    this._dialogService.showWarningToastMessage(_message);
                }
            }).subscribe(data => {
                if (data) {
                    this.logoUploaded.emit(data);
                    this.model.Status = UploadStatus.Uploaded;
                    this.statusChanged.emit(this);
                }

                this.computeUrlLogo();
            }, (err) => {
                this.model.Status = UploadStatus.UploadFailed;
                this.statusChanged.emit(this);

                if (err === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgLogoFileNotSupported');
                    this._dialogService.showWarningToastMessage(_message);
                }
            });
    }
    private createDocumentFromFile(siteId: string, file: BaseItem) {
        this._documentService.createDocumentsFromFiles(siteId, [file]).subscribe(docs => {
            this.model.Status = UploadStatus.Uploaded;
            this.model.DocumentWrapper = {
                ...this.model.DocumentWrapper,
                Id: undefined,
                EntityVersion: 1,
                Document: docs[0],
            };

            this.startCheckDocumentProcessed();
            this.statusChanged.emit(this);
        });
    }
    startCheckDocumentProcessed() {
        // console.log('startCheckDocumentProcessed: ', this.model);
        // We only check status when show document status
        if (this.model && this.model.DocumentWrapper &&
            this.model.DocumentWrapper.Document &&
            this.model.DocumentWrapper.Document.Status === 'Uploaded') {

            this._timmerAlive = true;

            interval(5000).pipe(
                takeWhile(() => this._timmerAlive)
            ).subscribe(() => {
                if (this._isDetectingDocumentProcessed) { return; }
                this._isDetectingDocumentProcessed = true;

                // console.log('interval startCheckDocumentProcessed: ', this.model);

                this._documentService.getDocumentDetails(this.model.DocumentWrapper.Document.Id).subscribe(data => {
                    // console.info('getDocumentDetail: Id= ' + data.Id + ' -> ' + data.Status);
                    this._isDetectingDocumentProcessed = false;
                    if (data.Status === 'Processed') {
                        // data.Folder.Site = this.model.DocumentWrapper.Document.Folder.Site;
                        this._timmerAlive = false;

                        this.model.File = null;
                        this.model.DocumentWrapper.Document = data;
                        this.computeUrlImage();
                    } else if (data.Status === 'ProcessingFailed') {
                        this.model.DocumentWrapper.Document.Status = 'ProcessingFailed';
                        this._timmerAlive = false;
                        this.computeUrlImage();
                    } else {
                        // status is in "Uploaded"
                        // nothing to do
                    }
                }, error => {
                    this._timmerAlive = false;
                    this.computeUrlImage();
                });
            });
        }
    }

    // called to raise event removeImageThumb
    onRemoveImageThumb() {
        this.removeImageThumb.emit(this);
        this.computeUrlImage();
        if (this.model.Status === UploadStatus.Uploading) { // raise event when remove image while uploading
            this.model.Status = UploadStatus.UploadFailed;
            this.statusChanged.emit(this);
        }
        // this.model.DocumentWrapper.Document.Status = 'ProcessingFailed';
    }

    downloadDocument() {
        
        this._documentService.onDownloadDocument.emit(this.model.DocumentWrapper);

        this.onDownLoadDocument.emit(this.model);
        
    }

    onImageClick() {
        if(this.canSelect){
            this.revertSelectState();
            return;
        }

        if (!this.handlerClickOnImage) {
            this.showDocument();
        }
        else {
            this.onImageClicked.emit(this.model);
        }
    }

    showDocument() {
        if (!this.canViewDocument) {
            return;
        }
        let matDialogRef = this.injector.get(MatDialogRef, null);

        // dialogRef['className']
        this._helper.isBusy = true; // ViewDocumentDialog will stop the busy when it finish render
        let shapesBefore = JSON.stringify(this.model.DocumentWrapper.Shapes);

        if (!shapesBefore) { shapesBefore = '[]'; }
        
        // we only show download button in mobile mode becasue there is no download button on thumbnail
        this._dialogService.openSlideDialog(matDialogRef, ViewDocumentDialog, 
            { document: this.model.DocumentWrapper, canDraw: this.canDraw, ShowDownload: this.isMobile, isOffline: this.isOffline }
            , '800px', '90vh', false).subscribe(x => {
                this.model.DocumentWrapper.HasDrawing = this.model.DocumentWrapper.Shapes && this.model.DocumentWrapper.Shapes.length > 0;
                let shapesNow = JSON.stringify(this.model.DocumentWrapper.Shapes);
                if (!shapesNow) { shapesNow = '[]'; }
                if (shapesNow !== shapesBefore) {
                    // console.log('shapesBefore=', shapesBefore);
                    // console.log('shapesBefore=', JSON.parse(shapesBefore));
                    // console.log('shapesAfter=', shapesNow);
                    // console.log('shapesAfter=', JSON.parse(shapesNow));
                    this.drawingChanged.emit({ data: this.model, before: JSON.parse(shapesBefore), after: JSON.parse(shapesNow) });
                }
            });

        this.showedDocument.emit(this.model);
    }

    showDocumentInfo() {
        if (!this.model || !this.model.DocumentWrapper) {
            return;
        }

        // Fire the event 
        this.onShowDocumentInfo.emit(this.model);
        if (this.needGlobalEvent) {
            this._documentService.onShowDocumentInfo.emit(this.model.DocumentWrapper);
        }
        
    }


    onImageLoaded() {
        this.alignImage();
    }

    onImageError() {
        this._isThumbImageError = true;
        if (this._documentService.getDefaultIamgePlaceHolderPath()) {
            this._urlImage = this._documentService.getDefaultIamgePlaceHolderPath();
        } else {
            this.alignImage();
        }
    }

    private currentImangeThumb(): ElementRef {
        return this.imageThumb;
    }

    alignImage() {    

        // in mobile mode, we use css to fix the conent of box so this is not neccessary.
        if (this.isMobile) {
            return;
        }
        
        let cssStylesToChange: { [index: string]: string } = {};

        let imageRef = this.currentImangeThumb();

        // when the image cannot load or the load is finish by place holder, we dont need to calculate retio...
        // just simple scale to fit and fire ratio = 1
        if (this._isThumbImageError) {
            this._renderer.setStyle(imageRef.nativeElement, 'width', '100%');
            this._renderer.setStyle(imageRef.nativeElement, 'height', '100%');
            this._renderer.removeStyle(imageRef.nativeElement, 'transform');

            if (this.imageRatioLoaded) {
                this.imageRatioLoaded.emit({ source: this.model, ratio: 1, thumbError: true });
            }

            return;
        }
        // Move the Align image from AngularJS (work seem correct) to here


        let imageActualWidth: number = imageRef.nativeElement.clientWidth;
        let imageActualHeight: number = imageRef.nativeElement.clientHeight;

        //correct the width when the source is a blob
        if (imageActualWidth === 0 && imageActualHeight === 0) {
            imageActualWidth = imageRef.nativeElement.naturalWidth;
            imageActualHeight = imageRef.nativeElement.naturalHeight;
        }
        if (imageActualWidth === 0 && imageActualHeight === 0) return;
        
        let ratio = imageActualWidth / imageActualHeight;
        if (this.imageRatioLoaded)
            this.imageRatioLoaded.emit({ source: this.model, ratio: ratio });

        let viewPortRectWidth: number = this.hsImageContainer.nativeElement.clientWidth;
        let viewPortRectHeight: number = this.hsImageContainer.nativeElement.clientHeight;
        
        if (!this.isFitImageToVp) {
            let imageWidthAfterScaling: number = 0;
            let imageHeightAfterScaling: number = 0;
            let isImageInsideTheViewPort: boolean = (imageActualWidth <= viewPortRectWidth && imageActualHeight <= viewPortRectHeight);
            let isViewPortInsideTheImage: boolean = (viewPortRectWidth <= imageActualWidth && viewPortRectHeight <= imageActualHeight);
            if (isImageInsideTheViewPort || isViewPortInsideTheImage) {  // ViewPort inside the Image
                // try to scale image by width to fill the view port
                imageHeightAfterScaling = (viewPortRectWidth * imageActualHeight) / imageActualWidth;
                if (imageHeightAfterScaling >= viewPortRectHeight) {
                    // if the new imageHeight is fit the ViewPort, we use this value and recalculate the width of image by the new height
                    imageWidthAfterScaling = viewPortRectWidth;
                    // set styles for the image with the width is a fit value (equal the width of the ViewPort)
                    cssStylesToChange['width'] = imageWidthAfterScaling + 'px';
                    cssStylesToChange['height'] = 'auto';
                    if (imageHeightAfterScaling > viewPortRectHeight) {
                        let offsetY = (imageHeightAfterScaling - viewPortRectHeight) / 2;
                        cssStylesToChange['transform'] = 'translateY(-' + offsetY + 'px)';
                    }
                }
                else {
                    // if scale the image by the width of the ViewPort, the image still not fit the ViewPort,
                    // we will scale the image by the height of the ViewPort
                    imageWidthAfterScaling = (viewPortRectHeight * imageActualWidth) / imageActualHeight;
                    imageHeightAfterScaling = viewPortRectHeight;
                    cssStylesToChange['height'] = imageHeightAfterScaling + 'px';
                    cssStylesToChange['width'] = 'auto';
                    if (imageWidthAfterScaling > viewPortRectWidth) {
                        let offsetX = (imageWidthAfterScaling - viewPortRectWidth) / 2;
                        cssStylesToChange['transform'] = 'translateX(-' + offsetX + 'px)';
                    }
                }
            }
            else {
                // if one of size of the image greater then the coresponding size of the view port
                if (imageActualWidth < viewPortRectWidth) {
                    //  this._servicePortal.UtilitiesService.logDebug("Increase the width of the image to fit the viewport, the height of image is auto");
                    // scale the image by the width of the ViewPort
                    imageWidthAfterScaling = viewPortRectWidth;
                    imageHeightAfterScaling = (viewPortRectWidth * imageActualHeight) / imageActualWidth;

                    cssStylesToChange['height'] = 'auto';
                    if (imageWidthAfterScaling > 0) {
                        cssStylesToChange['width'] = imageWidthAfterScaling + 'px';    
                    } else {
                        cssStylesToChange['width'] = '100%';
                    }
                    
                    cssStylesToChange['min-width'] = '100%';

                    if (imageHeightAfterScaling > viewPortRectHeight) {
                        let offsetY = (imageHeightAfterScaling - viewPortRectHeight) / 2;
                        cssStylesToChange['transform'] = 'translateY(-' + offsetY + 'px)';
                    }

                } else {
                    // this._servicePortal.UtilitiesService.logDebug("Increase the height of the image to fit the viewport, the width of image is auto");
                    // scale the image the height of the ViewPort
                    imageHeightAfterScaling = viewPortRectHeight;
                    imageWidthAfterScaling = (viewPortRectHeight * imageActualWidth) / imageActualHeight;

                    cssStylesToChange['width'] = 'auto';
                    cssStylesToChange['height'] = imageHeightAfterScaling + 'px';
                    cssStylesToChange['min-height'] = '100%';

                    if (imageWidthAfterScaling > viewPortRectWidth) {
                        let offsetX = (imageWidthAfterScaling - viewPortRectWidth) / 2;
                        cssStylesToChange['transform'] = 'translateX(-' + offsetX + 'px)';
                    }
                }
            }
        }
        else {

            cssStylesToChange['max-width'] = '100%';
            cssStylesToChange['max-height'] = '100%';

            let realImageWidth: number = 0;

            if (imageActualWidth > imageActualHeight) {

                realImageWidth = Math.min(imageActualWidth, viewPortRectWidth);

                cssStylesToChange['height'] = 'auto';
                cssStylesToChange['margin-top'] = 'auto';
                cssStylesToChange['margin-bottom'] = 'auto';
                if (imageActualWidth < viewPortRectWidth) {
                    cssStylesToChange['margin-left'] = 'auto';
                    cssStylesToChange['margin-right'] = 'auto';
                }
            } else {

                realImageWidth = Math.min(imageActualHeight, viewPortRectHeight) * ratio;

                cssStylesToChange['width'] = 'auto';
                cssStylesToChange['margin-left'] = 'auto';
                cssStylesToChange['margin-right'] = 'auto';
                if (imageActualHeight < viewPortRectHeight) {
                    cssStylesToChange['margin-top'] = 'auto';
                    cssStylesToChange['margin-bottom'] = 'auto';
                }
            }

            this.realImageWidth = realImageWidth;
        }



        if (cssStylesToChange) {            
            _.forEach(cssStylesToChange, (val, key) => {
                this._renderer.setStyle(imageRef.nativeElement, key, val);
            });
        }
        // NBSHD-4079: upload site logo
        // fix bug white space when nativeElement.height/nativeElement.width (size of image after computed) smaller than
        // containerHeight/containerWidth
        if (this.isLogo) {
            this.containerHeight = imageRef.nativeElement.height === 1 ? this.containerHeight : imageRef.nativeElement.height;
            this.containerWidth = imageRef.nativeElement.width === 1 ? this.containerWidth : imageRef.nativeElement.width;
        }
    }
}
