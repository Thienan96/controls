import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpEventType} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';


import { Subject } from 'rxjs';
import { CommonDocumentService } from '../../documents/shared/common-document.service';
import { IBackgroundUploadTask } from './models';
import { DialogService } from '../../core/services/dialog.service';
import { TranslationService } from '../../core/services/translation.service';
import { HelperService } from '../../core/services/helper.service';
import { AttachmentData, UploadStatus } from '../../shared/models/common.info';
import { BackgroundUploadDialog } from '../background-upload.dialog/background-upload.dialog';
import { MatDialogRef } from '@angular/material';


@Injectable(
    {
        providedIn: 'root'
    }
)
export class BackgroundService {

    private _penddingUploadFiles: IBackgroundUploadTask[] = [];
    private _docSvc: CommonDocumentService;
    protected _dialogService: DialogService;
    protected _translationService: TranslationService;

    private _statusChanged = new Subject<IBackgroundUploadTask>();
    private _progressChanged = new Subject<IBackgroundUploadTask>();

    private _penddingCountChanged = new Subject<number>();

    private _showingPenddingUpload = false;

    private _penddingTasksDlg: MatDialogRef<any>;

    constructor(private _http: HttpClient, private _helperService: HelperService, private _injector: Injector) {
        this._docSvc = _injector.get(CommonDocumentService);
        this._dialogService = _injector.get(DialogService);
        this._translationService = _injector.get(TranslationService);
    }

    backgroundUpload(restoreId: string, siteId: string, attachment: AttachmentData) {

        let newId = this._helperService.UtilityService.createGuid();
        attachment.clientId = newId; // this is a kind of tracking id for each uploading file

        let requestUpload = this._docSvc.uploadFile(attachment.File,
            (event: HttpEventType, progress: number) => {
                //console.info('File: ', attachment.File.name);
                // console.log(HttpEventType[event] + " - Progress: " + progress);
                attachment.progress = progress;
                this.raiseProgressChanged(newId);
            },
            () => {
                // console.info("Start uploaded: " + this.model.File.name + ' --- ' + this.model.File.size);

                // console.log('Start uploaded');

                attachment.Status = UploadStatus.Uploading;
                //this.statusChanged.emit(attachment);
                this.raiseStatusChanged(newId);
            },
            (httpCode: number, code: string, message: string) => {
                // console.info('File Uploaded failed --> ' + code + ' : ' + message);
                attachment.Status = UploadStatus.UploadFailed;
                // this.statusChanged.emit(attachment);
                this.raiseStatusChanged(newId);

                if (code === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
                        .replace('{0}', attachment.File.name);
                    this._dialogService.showWarningToastMessage(_message);
                }
            })
            .subscribe(data => {
                if (data) {
                    // if (process.env.NODE_ENV === 'dev') {
                    //     // tslint:disable-next-line:no-console
                    //     console.info('File "' + attachment.File.name + '" Uploaded completed: ' + document);
                    // }

                    // attachment.Status = UploadStatus.Uploaded;
                    attachment.Id = data;

                    //this.startCheckDocumentProcessed();
                    //this.statusChanged.emit(attachment);
                    //this.raiseStatusChanged(newId);
                    //this.discardPenddingTask(newId);

                    this.createAttachment(newId);
                }

                //this.computeUrlImage();
            }, (err) => {
                attachment.Status = UploadStatus.UploadFailed;
                // this.statusChanged.emit(attachment);
                this.raiseStatusChanged(newId);
                //this.discardPenddingTask(newId);
                console.warn('File upload fail: ', attachment.File.name, ' Error: ', err);

                if (err === 'InvalidFile') {
                    let _message: string = this._translationService.getTranslation('msgSelectedFilesInvalidFormat')
                        .replace('{0}', attachment.File.name);
                    this._dialogService.showWarningToastMessage(_message);
                }
            });

        // console.info('Add background uploading for restoreId: ', restoreId);
        this._penddingUploadFiles.push({
            restoreId: restoreId,
            siteId: siteId,
            data: attachment,
            subscribtion: requestUpload
        });
        
        this.raisePenddingCountChanged();
    }
    public raiseStatusChanged(clientId: string) {
        let task = this._penddingUploadFiles.find((t) => t.data.clientId === clientId);
        if (task) {
            // console.info('background service raise StatusChanged: ', task);
            //this.statusChanged.emit(task);
            this._statusChanged.next(task);
        }
    }

    public createAttachment(clientId: string) {
        let task = this._penddingUploadFiles.find((t) => t.data.clientId === clientId);
        if (task) {
            // console.info('background service raise StatusChanged: ', task);
            // this.statusChanged.emit(task);
            this._docSvc.createDocumentsFromFiles(task.siteId, [{Id: task.data.Id, Name: task.data.File.name }]).subscribe(docs => {
                task.data.Status = UploadStatus.Uploaded;
                this.raiseStatusChanged(clientId);
            });
        }
    }

    public onStatusChanged(): Observable<IBackgroundUploadTask> {
        return this._statusChanged.asObservable();
    }

    private raiseProgressChanged(clientId: string) {
        let task = this._penddingUploadFiles.find((t) => t.data.clientId === clientId);
        if (task) {
            // console.info('background service raise progressChanged: ', task);
            // this.progressChanged.emit(task);
            this._progressChanged.next(task);
        }
    }

    

    public onProgressChanged(): Observable<IBackgroundUploadTask> {
        return this._progressChanged.asObservable();
    }

    public discardPenddingTask(clientId: string) {
        let idx = this._penddingUploadFiles.findIndex(t => t.data.clientId === clientId);

        if (idx >= 0) {
            this._penddingUploadFiles.splice(idx, 1);

            this.raisePenddingCountChanged();
        }
    }

    public cancelUpload(clientId: string) {
        let task = this._penddingUploadFiles.find((t) => t.data.clientId === clientId);
        if (task) {
            // console.info('cancelUpload: ', task);
            task.subscribtion.unsubscribe();
            this.discardPenddingTask(clientId);
        }
    }

    private raisePenddingCountChanged() {
        this._penddingCountChanged.next(this._penddingUploadFiles.length);

        if (this._penddingUploadFiles.length === 0 && this._showingPenddingUpload) {
            if (this._penddingTasksDlg) { this._penddingTasksDlg.close(); }
            this._showingPenddingUpload = false;
        }
    }

    onPenddingCountChanged(): Observable<number> {
        return this._penddingCountChanged.asObservable();
    }
    getPenddingUploadTasks(restoreId?: string): IBackgroundUploadTask[] {
        if (restoreId) {
            return this._penddingUploadFiles.filter((t) => {
                if (t.restoreId === restoreId) { return t; }

                return null;
            })
        } else {
            return this._penddingUploadFiles;
        }
    }


    showPenddingTasks() {
        if (!this._showingPenddingUpload) {
            this._showingPenddingUpload = true;
            this._penddingTasksDlg = this._dialogService.openDialogRef(BackgroundUploadDialog, this._penddingUploadFiles, '500px', '600px');

            this._penddingTasksDlg.afterClosed().subscribe(x =>  {
                this._showingPenddingUpload = false;
            });
        }
    }
}
