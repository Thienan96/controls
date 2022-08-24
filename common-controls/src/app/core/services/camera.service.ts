/**
 * cordova-plugin-camera
 * require permistion from AndroidManifest.xml are
 * android:requestLegacyExternalStorage="true"
 * android.permission.WRITE_EXTERNAL_STORAGE
 */
import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor(private _zone: NgZone,
    private _snackBar: MatSnackBar) { }

  /**
   * 
   * @param source 
   * @param acceptOnlyPicture filter document only picture, using for upload profile
   * @returns special file to upload to serve
   */
  takeFile(source: 'CAMERA' | 'PHOTOLIBRARY', acceptOnlyPicture?: boolean): Observable<File> {
    try {
      if (window['Camera']) {
        return this._zone.run(() => { // try to fix first time install app can not open camera
          return this.getPicture(source, acceptOnlyPicture).pipe(
            concatMap(r => this.imageUriToFileEntry(r)),
            concatMap(r => this.fileEntryToFile(r)),
            concatMap(r => this.fileToBlob(r)),
          );
        });
      } else {
        of(null);
      }
    } catch (error) {
      //TODO: have to debug why it fall here
      console.log(error);
      // this._snackBar.open(error, 'OK', { duration: 2000 });
      return of(null);
    }
  }

  /**
   * 
   * @param source 
   * @param acceptOnlyPicture 
   * @returns uri of image in the storage of device, ex: /storage/emulated/0/DCIM/Camera/IMG_20210910_055900.jpg
   */
  private getPicture(source: 'CAMERA' | 'PHOTOLIBRARY', acceptOnlyPicture?: boolean): Observable<string> {
    return new Observable(ob => {
      let option;
      if (source === 'CAMERA') {
        option = {
          quality: 80, // quality output of image
          sourceType: window['Camera'].PictureSourceType.CAMERA,
          encodingType: window['Camera'].EncodingType.JPEG,
          destinationType: window['Camera'].DestinationType.FILE_URI,
          mediaType: window['Camera'].MediaType.PICTURE,
          correctOrientation: true,
          saveToPhotoAlbum: true,
          // targetWidth: window.screen.width,
          // targetHeight: window.screen.height,
        };
      } else {
        option = {
          quality: 80,
          sourceType: window['Camera'].PictureSourceType.PHOTOLIBRARY,
          mediaType: acceptOnlyPicture ? window['Camera'].MediaType.PICTURE : window['Camera'].MediaType.ALLMEDIA,
          destinationType: window['Camera'].DestinationType.FILE_URI,
          correctOrientation: true
        };
      }
      try {
        const onSuccess = (imageUri) => {
          ob.next(imageUri);
          ob.complete();
        };
        const onFail = (e) => {
          console.log(e);
          // this._snackBar.open(e, 'OK', { duration: 2000 });
          ob.complete();
        };
        if (navigator['camera']) {
          navigator['camera'].getPicture(onSuccess, onFail, option);
        } else {
          // try access camera one more time
          setTimeout(() => {
            if (navigator['camera']) {
              navigator['camera'].getPicture(onSuccess, onFail, option);
            } else {
              // this._snackBar.open('Camera not available', 'OK', { duration: 2000, panelClass: ['snackbar-action']  });
            }
          }, 1000);
        }
      } catch (e) {
        // this._snackBar.open(e, 'OK', { duration: 2000, panelClass: ['snackbar-action']  });
      }
    });
  }

  /**
   * 
   * @param imageUri uri of image in the storage of device
   * @returns fileEntry, special file type retrned from device
   * fileEntry only AVAILABLE on cordova, angular source code can not reference this type at runtime
   * any <=> FileEntry
   */
  private imageUriToFileEntry(imageUri: string): Observable<any> {
    return new Observable(ob => {
      const onSuccess = (fileEntry: any) => {
        ob.next(fileEntry);
        ob.complete();
      };
      const onFail = (e) => {
        console.log(e);
        // this._snackBar.open(e, 'OK', { duration: 2000 });
        ob.complete();
      };
      // file choose from gallery return absolute path, need mananual add prefix file:///
      // re-consider this point for IOS
      // files choose from folder download of device have refix content://
      imageUri = imageUri.indexOf('cdvfile://') > -1 || imageUri.indexOf('file://') > -1 || imageUri.indexOf('content://') > -1 ? imageUri : 'file://' + imageUri;
      window['resolveLocalFileSystemURL'](imageUri, onSuccess, onFail);
    });
  }

  /**
   * 
   * @param fileEntry 
   * @returns file obtain in FileEntry
   */
  // any <=> FileEntry
  private fileEntryToFile(fileEntry: any): Observable<File> {
    return new Observable(ob => {
      const onSuccess = (file: File) => {
        ob.next(file);
        ob.complete();
      };
      const onFail = (e) => {
        console.log(e);
        // this._snackBar.open(e, 'OK', { duration: 2000 });
        ob.complete();
      };
      fileEntry.file(onSuccess, onFail);
    });
  }

  /**
   * cordova-plugin-file override windown.File
   * => can not use normal way to create File
   * @param file 
   * @returns blob file with some information need to upload to server
   */
  // cordova-plugin-file override windown.File
  // => can not use normal way to create File
  private fileToBlob(file: File): Observable<File> {
    return new Observable(ob => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onloadend = () => {
        // workaround
        let imgBlob = new Blob([fileReader.result], { type: file.type });
        if ((/(\.|\/)(pdf|jpg|jpeg|png)$/i).test(file.name)) {
          imgBlob['name'] = file.name;
        } else {
          // pdf loaded from download file doest not have file extension
          // re-check if download file !== pdf
          // no combind extende in case is not pdf(just tempo, maybe more type) to throw error exception on attactment box
          // REFACTOR IN THE FUTURE
          imgBlob['name'] = file.type.indexOf('pdf') > -1 ? file.name + '.pdf' : file.name;
        }
        imgBlob['lastModified'] = new Date(file.lastModified);
        //
        ob.next(<File>imgBlob);
        ob.complete();
      };
      fileReader.onerror = () => {
        // this._snackBar.open('fileToBlob', 'OK', { duration: 2000, panelClass: ['snackbar-action']  });
        ob.complete();
      };
    });
  }
}
