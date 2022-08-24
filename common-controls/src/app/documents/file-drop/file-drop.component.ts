import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import {UtilityService} from '../../core/services/utility.service';
import {TranslationService} from '../../core/services/translation.service';
import {DialogService} from '../../core/services/dialog.service';

@Component({
  selector: 'ntk-file-drop',
  templateUrl: './file-drop.component.html',
  styleUrls: ['./file-drop.component.scss']
})
export class FileDropComponent implements OnInit {

  @ViewChild('inputBrowseFiles', {static: false}) inputBrowseFiles: ElementRef;

  @Output('onFilesDrop') onFilesDrop = new  EventEmitter<File[]>();
  constructor(private _utilityService: UtilityService,
              private _translationService: TranslationService,
              private _dialogService: DialogService ) { }

  ngOnInit() {
  }

  dropped(files: NgxFileDropEntry[]) {
    // console.log('file dropped: ', $event);

    if (this.onFilesDrop) {
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

              // console.log(droppedFile.relativePath, file);

              let f = this.invalidateFile(file);

              if (f) {
                dropFiles.push(f);
              } else {
                error = true;
              }

              completed++;

              // console.log('dropFiles 1: ', dropFiles);
          });
        }
      }

      let interval = IntervalObservable.create(100);
      let timmer = interval.subscribe(() => {
        if (error) {
          timmer.unsubscribe();
        } else if (completed === totalFiles) {
          // console.log('dropFiles: ', dropFiles);
          this.onFilesDrop.emit(dropFiles);
          timmer.unsubscribe();
        }
      });

    }
  }

  private invalidateFile(file: File): File | undefined {
    let errorMsg: string;

    if (file.size / 1024 > 30720) { // The file exceeds the maximum upload size (max 30 MB).
      errorMsg = this._translationService.getTranslation('msgSelectedFileExceed30MB').replace('{0}', file.name);
    } else if (!(/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) {
        errorMsg = this._translationService.getTranslation('msgSelectedFilesNotSupported');
    }

    if (errorMsg) {
        // file is over size or extension is not supported
        this._dialogService.showToastMessage(errorMsg);
        return undefined;
    } else {
        return file;
    }
  }

  browseFiles() {
    // In IE text Browse doesn't work, so we have to trigger in event click
    if (this._utilityService.isIE) {
        this.inputBrowseFiles.nativeElement.click();
    }
  }

  onSelectFiles(files: any) {
    // object.values not working in IE
    let values = Object.keys(files).map(e => files[e]);
    this.onFilesDrop.emit(values.map(f => this.invalidateFile(f)));
  }
}
