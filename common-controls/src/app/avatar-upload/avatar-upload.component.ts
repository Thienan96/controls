import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../core/services/translation.service';
import { DialogService } from '../core/services/dialog.service';
import { CameraService } from '../core/services/camera.service';

@Component({
  selector: 'ntk-avatar-upload',
  templateUrl: './avatar-upload.component.html',
  styleUrls: ['./avatar-upload.component.css']
})
export class AvatarUploadComponent implements OnInit {
  @ViewChild('inputBrowseFiles', { static: true }) inputBrowseFiles: ElementRef;
  @Input() logoUrl;
  @Input() emptyDataIcon;
  @Input() canUpload = true;
  @Output() logoChanged = new EventEmitter();

  // This is stupid code to compatiple with the current code when it use in contact module.
  @Input() uploadUrl = 'Supplier/UploadLogo';

  // Custom translation message when drop not support files
  @Input() filesNotSupportedMessageKey = "msgSelectedFilesNotSupportedForLogo";

  uploading = false;
  previewUrl: string;

  constructor(private http: HttpClient,
    private _translationService: TranslationService,
    private _cameraService: CameraService,
    private _cd: ChangeDetectorRef,
    private _zone: NgZone, // need zone when using cordova to load gallery
    private _dialogService: DialogService) {
    // this.emptyDataIcon = this.emptyDataIcon ? this.emptyDataIcon : 'cloud_upload';
  }

  ngOnInit() {
  }

  get isIamge() {
    return (/\.(jpg|jpeg|png)$/i).test(this.emptyDataIcon);
  }

  onSelectFiles(fileList: FileList) {
    if (fileList.length > 0) {
      let file: File = fileList[0];
      //NF-357: check if file is valid
      let errorMsg: string;
      if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
        errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
      }
      else if (!(/(\.|\/)(jpg|jpeg|png)$/i).test(file.name)) { // only allow upload jpg, jpeg, png
        errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
      }

      if (errorMsg) {
        // file is over size or extension is not supported
        this._dialogService.showToastMessage(errorMsg);
      } else {
        this.buildPreview(file);
        this.uploadLogo(file);
      }
      this.inputBrowseFiles.nativeElement.value = ''; // to save same file twice
    }
  }

  buildPreview(file: File) {
    // Show preview 
    let mimeType = file.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.previewUrl = <string>reader.result;
      this._zone.run(() => {
        this._cd.detectChanges();
      });
    };
  }

  uploadLogo(file: File) {
    this.uploading = true;

    let url = `${this.uploadUrl}?filename=${file.name}&length=${file.size}`;
    return this.http.post(url, file).subscribe(x => {
      // console.log('upload logo finish with =', x);
      this.logoUrl = undefined;
      this.logoChanged.emit(x);
      this.uploading = false;
      this._zone.run(() => {
        this._cd.detectChanges();
      });
    });
  }

  removeLogo() {
    this.previewUrl = undefined;
    this.logoUrl = undefined;
    this.logoChanged.emit(null);
  }

  openBrowser($event: Event) {
    if (window['cordova']) {
      this.useCordovaCamera();
    } else {
      this.inputBrowseFiles.nativeElement.click();
    }
    $event.preventDefault();
  }

  useCordovaCamera() {
    this._cameraService.takeFile('PHOTOLIBRARY', true).subscribe(file => {
      if (file) {
        //NF-357: check if file is valid
        let errorMsg: string;
        if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
          errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
        } else if (!(/(\.|\/)(jpg|jpeg|png)$/i).test(file.name)) { // only allow upload jpg, jpeg, png
          errorMsg = this._translationService.getTranslation(this.filesNotSupportedMessageKey);
        }

        if (errorMsg) {
          // file is over size or extension is not supported
          this._dialogService.showToastMessage(errorMsg);
        } else {
          this.buildPreview(file);
          this.uploadLogo(file);
        }
      }
    });
  }

}
