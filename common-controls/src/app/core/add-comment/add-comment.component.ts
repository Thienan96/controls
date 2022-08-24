import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, TemplateRef, OnInit, HostBinding, Renderer2 } from '@angular/core';
import { String } from 'typescript-string-operations';
import * as _ from 'underscore';
import { HelperService } from '../services/helper.service';
import { AttachmentBoxComponent } from '../../documents/attachment-box/attachment-box.component';
import { AttachmentData, UploadStatus } from '../../shared/models/common.info';
import { Observable } from 'rxjs';
import { UtilityService } from '../services/utility.service';
import { getCaretCoordinates } from './caret-coords';
@Component({
    selector: 'ntk-add-comment',
    templateUrl: './add-comment.component.html',
    styleUrls: ['./add-comment.component.scss'],
    host: { 'class': 'ntk-add-comment' }
})

export class AddCommentComponent implements OnInit {
    @Input() siteId: string;
    @Input() canDraw = true;
    @Input() shouldShowPrivate = true;
    @Input() autoCreateAttachment = true;
    @Input() getData: Observable<any>;
    @Input() mentionTemplate: TemplateRef<any>;
    @Input() mentionConfig = {
        triggerChar: "@",
        labelKey: "Name",
        dropUp: true, // dropUp: false can not set possition correctly, because class textarea-comment
        mentionSelect: this.onMentionSelect,
        mentionFilter: this.onMentionFilter,
        disableSort: true
    };
    @Input() acceptExtensions = ".pdf,.png,.jpeg,.jpg";
    @Input() descriptionkey = 'lbTypeMessage';
    @Input() dropFilesGuideKey = 'lbDropFilesGuide';
    @Input() filesNotSupportedMessageKey = "msgSelectedFilesNotSupported";

    @Output() commentChanged = new EventEmitter();
    @Output() onSaveComment = new EventEmitter();
    @Output() changePrivateComment = new EventEmitter();

    // NF-364
    @Input() additionalFileKey: string;
    @Output() additionalFileClicked = new EventEmitter();
    // for NF
    @Input('secureUrl') secureUrl = true;
    @Input('showMenu') showMenu = true;

    @ViewChild('inputBrowseFiles', { static: false }) inputBrowseFiles: ElementRef;
    @ViewChild('textarea', { static: false }) textarea: ElementRef;
    @ViewChild('commentArea', { static: false }) commentArea: ElementRef;

    initialDocuments = [];
    @ViewChild('attachmentsBox', { static: false }) _attachmentsBox: AttachmentBoxComponent;
    commentText: string;
    isPrivateMode: boolean = false;
    isSmallScreen: Observable<boolean>;
    isDevice: boolean;
    hasInvalidFiles: boolean;
    canAddDocuments: boolean = true;
    contacts: any[];
    commentDescription: string;
    isAndroid: boolean;

    // To avoi the use double lick to send button
    private _isSaving: boolean = false;
    private isDocProcessing = false;
    private statusTimeout: any;

    // NBSHD-4712
    // isExpanded = false;

    @HostBinding('class.ntk-add-comment-expanded') isExpanded: boolean = false;

    // @HostBinding('class.ntk-add-comment') deraul: boolean = true;


    constructor(private _helperService: HelperService,
        private elem: ElementRef<HTMLElement>,
        private _render: Renderer2,
        private _utl: UtilityService) {
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
        this.commentDescription = this._helperService.TranslationService.getTranslation(this.descriptionkey);
    }

    ngAfterViewInit(): void {
        // EJ4-1605: fix bug 2
        // Bao moved the code to Comments component in orderto fix for all popups
        let matDialog = document.querySelector('mat-dialog-container');
        if (matDialog) {
            matDialog.removeAttribute('tabindex');
        }

    }

    opened() {
        // GF-537: fix problem on android
        // soft key board auto resizing the browser => not enough space to show dialog mention
        if (this.isAndroid) {
            setTimeout(() => {
                $('.scrollable-menu').css('max-height', '100px');
            }, 100);
        }


        // JUST WORKAROUNG CAN NOT FIX FOR ALL CASE
        // PROPOSE: Comment component always at the end of screen/parent component
        if (this.mentionConfig.dropUp) {
            setTimeout(() => {
                this.adjustposition();
            }, 100);
        }
    }

    adjustposition() {
        const { top, left } = getCaretCoordinates(this.textarea.nativeElement, this.textarea.nativeElement.selectionStart, null);
        const clientReactMentionDialog = this.elem.nativeElement.querySelector('.mention-menu').getBoundingClientRect();
        const clientReactTextarea = this.textarea.nativeElement.getBoundingClientRect();
        const clientReactComment = this.commentArea.nativeElement.getBoundingClientRect();
        // ensure mention dialog not out of the comment area
        if (clientReactTextarea.height > clientReactMentionDialog.height && this.isExpanded) { // 292 is max height of mention dialog
            if (clientReactTextarea.height - top > clientReactMentionDialog.height) {
                if ($('.mention-dropdown')) { // only exit if dropUp = true
                    $('.mention-dropdown').css('bottom', 'auto');
                    $('.mention-dropdown').css('top', '15px');
                }
            } else {
                if ($('.mention-dropdown')) {
                    $('.mention-dropdown').css('bottom', '100%');
                    $('.mention-dropdown').css('top', 'auto');
                }
            }
        } else {
            // return to default css
            if ($('.mention-dropdown')) {
                $('.mention-dropdown').css('bottom', '100%');
                $('.mention-dropdown').css('top', 'auto');
            }
        }
        if (clientReactMentionDialog.right > clientReactComment.right) {
            // jquery sometime not apply styling
            if (this.elem.nativeElement.querySelector('.dropup')) {
                this._render.setStyle(this.elem.nativeElement.querySelector('.dropup'), 'left', `${clientReactComment.width - clientReactMentionDialog.width}px`);
            }
        }
    }

    beginAddComment($event) {
        console.log('---beginAddComment - get alias----');

        // issue NBSHD-4554: do not reset Private Flag
        // this.isPrivateMode = false;
        if (this.getData && !this.contacts) {
            this.getData.subscribe(r => {
                this.contacts = r;
            });
        }
    }

    onMentionSelect(item: any): string {
        if (item.Code && item.Id)
            return '[~' + item.Code + ']';
        return "";
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
        this.commentText = "";
        this.initialDocuments = [];
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

    saveComment() {
        if (this._isSaving) return;
        this.processSave(this.isPrivateMode);
    }

    openBrowser() {
        this.inputBrowseFiles.nativeElement.click();
    }

    onSelectFiles(event) {
        this._attachmentsBox.onSelectFiles(event);
    }

    onAdditionalFileClicked() {
        if (this.additionalFileClicked) {
            this.additionalFileClicked.emit();
        }
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

    onClickPrivateComment() {
        this.isPrivateMode = !this.isPrivateMode;
        this.changePrivateComment.emit(this.isPrivateMode);
    }
}

