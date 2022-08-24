import { ChangeDetectorRef, Component, Injector, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';
import { ImageThumbComponent } from '../../image-thumb/image-thumb.component';
import { UploadStatus } from '../../../shared/models/common.info';


@Component({
    selector: 'ntk-file-item',
    templateUrl: './file-item.component.html',
    styleUrls: ['./file-item.component.css']
})
export class FileItemComponent extends ImageThumbComponent {

    constructor(injector: Injector, _sanitizer: DomSanitizer, _renderer: Renderer2, _cd: ChangeDetectorRef) {
        super(injector, _sanitizer, _renderer, _cd);
    }

    /**
     * This method overide big thumb class to allow upload
     * @param siterId: not use at the moment
     */
    startUpload(siterId: string) {
        if (!this.model.File) { return; }

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

                    this.model.Status = UploadStatus.Uploaded;
                    this.model.Id = data;
                    this.statusChanged.emit(this);
                }

                this.computeUrlImage();
            });
    }
}
