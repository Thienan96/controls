import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, Output, TemplateRef, ViewChild } from '@angular/core';
import { UtilityService } from '../../services/utility.service';
import { speedDialFabAnimations } from '../../../speed-dial-fab/speed-dial-fab.animations';
import { AttachmentBoxMobileComponent } from '../../../documents/attachment-box-mobile/attachment-box-mobile.component';
import { Observable } from 'rxjs';
import * as _ from 'underscore';
import { String } from 'typescript-string-operations';
import { AttachmentData, UploadStatus } from '../../../shared/models/common.info';
import { TranslationService } from '../../services/translation.service';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { throwIfEmpty } from 'rxjs/operators';
import { CameraService } from '../../services/camera.service';

@Component({
  selector: 'ntk-add-comment-mobile',
  templateUrl: './add-comment-mobile.component.html',
  styleUrls: ['./add-comment-mobile.component.scss'],
  animations: speedDialFabAnimations
})
export class AddCommentMobileComponent {
  @ViewChild('inputBrowseFiles', { static: false }) inputBrowseFiles: ElementRef;
  @ViewChild('attachmentsBox', { static: false }) _attachmentsBox: AttachmentBoxMobileComponent;
  @ViewChild('inputCameraFile', { static: false }) inputCameraFile: ElementRef;

  @ViewChild('textArea', { static: true }) _textAreaEl: ElementRef;
  @ViewChild('showActions', { static: false }) _showActionsEl: ElementRef;

  @Input() siteId: string;
  @Input() canDraw = true;
  @Input() shouldShowPrivate = true;
  @Input() autoCreateAttachment = true;
  @Input() getData: Observable<any>;
  @Input() mentionTemplate: TemplateRef<any>;
  @Input() canRemove: boolean = true;
  @Input() mentionConfig = {
    triggerChar: '@',
    labelKey: 'Name',
    dropUp: 'true',
    mentionSelect: this.onMentionSelect,
    mentionFilter: this.onMentionFilter,
    disableSort: true
  };
  @Input() acceptExtensions = '.pdf,.png,.jpeg,.jpg';
  @Input() descriptionkey = 'lbTypeMessage';
  @Input() dropFilesGuideKey = 'lbDropFilesGuide';
  @Input() minRows = 1;
  @Input() isOffline: boolean; // NBSHD-4627: conditions: no internet access and already downloaded for offline

  @Output() commentChanged = new EventEmitter();
  @Output() onSaveComment = new EventEmitter();
  initialDocuments = [];
  commentText: string;
  isPrivateMode: boolean = false;
  isSmallScreen: Observable<boolean>;
  isDevice: boolean;
  hasInvalidFiles: boolean;
  canAddDocuments: boolean = true;
  contacts: any[];
  commentDescription: string;
  isAndroid: boolean;
  // list dial button
  speedDialFabButtons = []

  // show button private, folder and camera
  showAction: boolean = true;
  // To avoi the use double lick to send button
  private _isSaving: boolean = false;
  private isDocProcessing = false;
  private statusTimeout: any;

  constructor(private _translationService: TranslationService,
    private _cd: ChangeDetectorRef,
    private _utl: UtilityService,
    private _zone: NgZone,
    private _cameraService: CameraService,
    private fm: FocusMonitor) {
    this.isSmallScreen = this._utl.screenResizeToSmall();
    this.isDevice = this._utl.isDevice;
    this.isAndroid = this._utl.isAndroid;



  }
  get canSaveComment(): boolean {
    return !String.IsNullOrWhiteSpace(this.commentText) && !this.isDocProcessing && !this._isSaving && !this.hasInvalidFiles;
  }

  ngOnInit() {
    // NBSHD-4127 (1.57.0): [HS] Allow users to notify other users in comments
    // Update the sentence of HELPSITES/CHECKLISTS by using the same sentence:
    // "Write your comment here (You can notify other users by using the "@").""
    this.commentDescription = this._translationService.getTranslation(this.descriptionkey);
  }

  // GF-537: fix problem on android
  // soft key board auto resizing the browser => not enough space to show dialog mention
  opened() {
    if (this.isAndroid) {
      setTimeout(() => {
        $('.scrollable-menu').css('max-height', '100px');
      }, 100);
    }
  }

  beginAddComment($event) {
    this.showAction = false;
    // issue NBSHD-4554: do not reset Private Flag
    // this.isPrivateMode = false;
    if (this.getData && !this.contacts) {
      this.getData.subscribe(r => {
        this.contacts = r;
      });
    }
  }

  onBlur($event: Event) {
    this.showAction = true;
  }

  onShowActionsClick($event: Event) {
    this.showAction = true;
    $event.preventDefault();
  }

  focusTextArea() {
    this.fm.focusVia(this._textAreaEl.nativeElement, 'program');
  }

  onMentionSelect(item: any): string {
    if (item.Code) {
      return '[~' + item.Code + ']';
    }
    return '';
  }

  textAreaTouchStart($event) {
    this.showAction = false;
  }
  onMentionFilter(searchString, items: any[]) {
    items = items.filter((item: any) => !item.Id || item.Name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1);
    items = items.reduceRight((prev, curr) => {
      if (curr.Id || (!curr.Id && prev.length > 0 && prev[0].Id)) {
        prev.unshift(curr);
      }
      return prev;
    }, []);
    return items;
  }

  cancelAddComment() {
    this.commentText = '';
    this.initialDocuments = [];
    this.isDocProcessing = false;
    this.commentChanged.emit('');
  }

  saveCommentCompleted() {
    this._isSaving = false;
  }

  onFileStatusChanged($event) {
    if ($event.model.Status === UploadStatus.UploadFailed) {
      this.hasInvalidFiles = true;
    }
    if (!this.isDocProcessing && this._attachmentsBox.isProcessing) {
      setTimeout(() => {
        this.isDocProcessing = true;
      });
    } else {
      this.updateDocProcessingStatus();
    }
  }

  private updateDocProcessingStatus() {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    this.statusTimeout = setTimeout(() => {
      this.isDocProcessing = this._attachmentsBox.isProcessing;
      this._cd.markForCheck(); // dectect change component, using for Onpush
    }, 500);
  }

  onCommentChanged($event) {
    this.commentChanged.emit($event);
  }
  onAttachmentsChanged($event) {
    if ($event.action === 'delete') {
      this.checkHasInvalidFiles();
    }
  }

  saveComment($event: Event) {
    if (this._isSaving || !this.canSaveComment) { return; }
    this.processSave(this.isPrivateMode);
    $event.preventDefault();
  }

  openBrowser($event: Event) {
    if (window['cordova']) {
      window['chooser'].getFile()
      .then(file => {
        if (file) {
          const blob = new Blob([file.data], { type: file.mediaType});
          blob['name'] = file.name;
          this._attachmentsBox.onSelectPicture(<File> blob);
          this._cd.detectChanges();
        }
      })
      .catch((error: any) => console.error(error));
    } else {
      this.inputBrowseFiles.nativeElement.click();
    }
    $event.preventDefault();
  }

  onSelectFiles(event) {
    this._attachmentsBox.onSelectFiles(event);
  }

  get cordovaReady() {
    return !!window['cordova'];
  }

  private processSave(isPrivate: boolean) {
    this._isSaving = true;
    let uploadedDocs: any[] = [];
    if (this._attachmentsBox.attachmentData && this._attachmentsBox.attachmentData.length > 0) {
      _.forEach(this._attachmentsBox.attachmentData, (d: AttachmentData) => {
        if (d.DocumentWrapper) {
          uploadedDocs.push(d.DocumentWrapper);
        } else {
          uploadedDocs.push({ Id: d.Id, Name: d.File.name }); // NBSHD-4351: api upload only return Id
        }
      })
    }

    this.onSaveComment.emit({ commentText: this.commentText, isPrivate: isPrivate, uploadedDocs: uploadedDocs });
  }

  checkHasInvalidFiles() {
    if (this._attachmentsBox.attachmentData && this._attachmentsBox.attachmentData.length > 0) {
      this._attachmentsBox.attachmentData.findIndex(item => item.Status === UploadStatus.UploadFailed) !== -1 ? this.hasInvalidFiles = true : this.hasInvalidFiles = false;
    } else {
      this.hasInvalidFiles = false;
    }
  }

  openCamera($event: Event) {
    if (window['cordova']) {
      this.useCordovaCamera('CAMERA');
    } else {
      this.inputCameraFile.nativeElement.click();
    }
    $event.preventDefault();
  }

  useCordovaCamera(source: 'CAMERA' | 'PHOTOLIBRARY') {
    this._cameraService.takeFile(source).subscribe(file => {
      if (file) {
        this._zone.run(() => {
          this._attachmentsBox.onSelectPicture(file);
          this._cd.detectChanges();
        });
      }
    });
  }
}
