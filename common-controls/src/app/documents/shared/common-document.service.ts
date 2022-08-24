import { Injectable, Output, EventEmitter, isDevMode } from '@angular/core';
import {
  HttpClient,
  HttpRequest,  
  HttpEvent,
  HttpEventType,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { throwError } from 'rxjs';
import {
  Document,
  IFolder,
  BaseItem,  
  IDataItems,
} from '../../shared/models/common.info';
import { UtilityService } from '../../core/services/utility.service';
import { AppConfig } from '../../core/app.config';
import { ApiService } from '../../core/services/Api.service';
import { Folder } from './document.model';

@Injectable()
export class CommonDocumentService {
  @Output() onShowDocumentInfo: EventEmitter<any> = new EventEmitter();
  @Output() onDownloadDocument: EventEmitter<any> = new EventEmitter();

  protected uploadFileUrl = 'Document/UploadFile';
  protected getDocumentInfoUrl = 'Document/GetDocumentInfo';
  protected getDocumentInfoKey = 'documentId';
  protected downloadFileUrl = 'Document/GetDownloadUrl';
  protected getDocumentDetailsUrl = 'Document/GetDocumentDetail';
  // custom url for ticket portal
  protected uploadDocumentURL = 'Document/UploadDocument';
  private _defaultIamgePlaceHolderPath?: string;

  private getDocumentDetailsIdParamName = 'documentId';
  // Key is file extension : ex:  docx
  // Value is the svg of this extension
  private svgDictionary: { [index: string]: string };

  constructor(
    protected _http: HttpClient,
    protected _util: UtilityService,
    protected _appConfig: AppConfig,
    protected _api: ApiService
  ) { }

  changeUploadApiMethod(method: string) {
    if (isDevMode()) {
      console.log('Upload API url has been changed to: ', method);
    }
    this.uploadFileUrl = method;
  }

  changeGetDocumentDetailsMethod(
    url: string,
    getDocumentDetailsIdParamName: string
  ) {
    this.getDocumentDetailsUrl = url;
    this.getDocumentDetailsIdParamName = getDocumentDetailsIdParamName;
  }

  setSvgDictionary(dic: { [index: string]: string }) {
    this.svgDictionary = dic;
  }

  setDefaultIamgePlaceHolderPath(value: string) {
    this._defaultIamgePlaceHolderPath = value;
  }

  getDefaultIamgePlaceHolderPath(): string | undefined {
    return this._defaultIamgePlaceHolderPath;
  }

  getFileTypeSvgIconKey(fileExtension: string): string {
    if (!this.svgDictionary) { return ''; }
    return this.svgDictionary[fileExtension];
  }

  buildDocumentThumbUrl(document: Document, pageIndex?: number) {
    if (!document) {
      return '';
    }

    if (pageIndex) {
      let url =
        this._util.addSlashIfNotExists(this._appConfig.API_URL) +
        document.DocumentUrl;

      if (document.Type === 'PDF') {
        url = url + '_' + (pageIndex || 0) + '.jpg';
      } else {
        url = url + '.' + document.Type;
      }

      return url;
    }

    return (
      this._util.addSlashIfNotExists(this._appConfig.API_URL) +
      document.DocumentUrl +
      '_thumb.jpg'
    );
  }

  buildDocumentUrl(document: Document, pageIndex?: number) {
    if (!document) {
      return '';
    }

    if (pageIndex === undefined) {
      pageIndex = 0;
    }
    let url =
      this._util.addSlashIfNotExists(this._appConfig.API_URL) +
      document.DocumentUrl;

    if (document.Type === 'PDF') {
      url = url + '_' + (pageIndex || 0) + '.jpg';
    } else {
      url = url + '.' + document.Type;
    }

    return url;
  }

  uploadFile(file: File, onUpdateProgress?: (event: HttpEventType, progress: number) => void,
    onUploadStart?: () => void,
    onFailed?: (httpCode: number, errorCode: string,errorMessage: string) => void) {
    // -----------------------------------------------------------------------------------
    if (!file) {
      return;
    }
    // /document/UploadFile?filename=image6.PNG&length=14303

    let url = this.uploadFileUrl;
    url = url + '?filename=' + encodeURIComponent(file.name);
    url = url + '&length=' + file.size;

    // Create request
    let request = new HttpRequest('POST', url, file, {
      reportProgress: true, // this request should be made in a way that exposes progress events
    });

    return this._http.request(request).pipe(
      map((event: HttpEvent<any>) => {
        // console.log('upload file event: ', event);

        let result: string;
        switch (event.type) {
          case HttpEventType.Sent:
            if (onUploadStart) {
              onUploadStart();
            }
            break;

          case HttpEventType.UploadProgress:
            if (onUpdateProgress) {
              // Compute and show the % done:
              const percentDone = Math.round(
                (100.0 * event.loaded) / event.total
              );

              // console.log(`--- common doc service uploaded: ${percentDone}%`);

              onUpdateProgress(HttpEventType.UploadProgress, percentDone);
            }
            break;

          case HttpEventType.Response:
            if (onUpdateProgress) {
              onUpdateProgress(HttpEventType.Response, 100);
            }

            result = event.body;
            break;
        }

        return result;
      }),
      catchError((failedResp: HttpErrorResponse) => {
        let message: string;
        if (failedResp.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          // console.error('An error occurred:', failedResp.error.message);
          message = failedResp.error.message;
          if (onFailed) {
            onFailed(failedResp.status, failedResp.statusText, message);
          }
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          // console.error(
          //    `Backend returned code ${failedResp.status}, ` +
          //    `body was: ${failedResp.error}`);

          let code = failedResp.error.code
            ? failedResp.error.code
            : failedResp.statusText;
          message = failedResp.error.message
            ? failedResp.error.message
            : failedResp.message;
          if (onFailed) {
            onFailed(failedResp.status, code, message);
          }
        }

        // return an ErrorObservable with a user-facing error message
        return throwError(message);
      })
    );
  }

  uploadLogo(file: File, onUpdateProgress?: (event: HttpEventType, progress: number) => void,
    onUploadStart?: () => void,
    onFailed?: (httpCode: number, errorCode: string,errorMessage: string) => void
  ) {
    // -----------------------------------------------------------------------------------
    if (!file) {
      return;
    }
    // /document/UploadFile?filename=image6.PNG&length=14303

    let url = this.uploadFileUrl;
    url = url + '?filename=' + encodeURIComponent(file.name);
    url = url + '&length=' + file.size;

    // Create request
    let request = new HttpRequest('POST', url, file, {
      reportProgress: true, // this request should be made in a way that exposes progress events
    });

    return this._http.request(request).pipe(
      map((event: HttpEvent<any>) => {
        // console.log('upload file event: ', event);

        let result: string;
        switch (event.type) {
          case HttpEventType.Sent:
            if (onUploadStart) {
              onUploadStart();
            }
            break;

          case HttpEventType.UploadProgress:
            if (onUpdateProgress) {
              // Compute and show the % done:
              const percentDone = Math.round(
                (100.0 * event.loaded) / event.total
              );
              onUpdateProgress(HttpEventType.UploadProgress, percentDone);
            }
            break;

          case HttpEventType.Response:
            if (onUpdateProgress) {
              onUpdateProgress(HttpEventType.Response, 100);
            }

            result = event.body;
            break;
        }

        return result;
      }),
      catchError((failedResp: HttpErrorResponse) => {
        let message: string;
        if (failedResp.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          // console.error('An error occurred:', failedResp.error.message);
          message = failedResp.error.message;
          if (onFailed) {
            onFailed(failedResp.status, failedResp.statusText, message);
          }
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          // console.error(
          //    `Backend returned code ${failedResp.status}, ` +
          //    `body was: ${failedResp.error}`);

          let code = failedResp.error.code
            ? failedResp.error.code
            : failedResp.statusText;
          message = failedResp.error.message
            ? failedResp.error.message
            : failedResp.message;
          if (onFailed) {
            onFailed(failedResp.status, code, message);
          }
        }

        // return an ErrorObservable with a user-facing error message
        return throwError(message);
      })
    );
  }

  createDocumentsFromFiles(
    siteId: string,
    files: BaseItem[]
  ): Observable<Document[]> {
    let postData = {
      SiteId: siteId,
      UploadFiles: files,
    };
    return this._http.post<Document[]>(this.uploadDocumentURL, postData);
  }

  uploadExcelFile(file: File, onUpdateProgress?: (event: HttpEventType, progress: number) => void,
    onUploadStart?: () => void,
    onFailed?: (
      httpCode: number,
      errorCode: string,
      errorMessage: string
    ) => void
  ) {
    // -----------------------------------------------------------------------------------
    if (!file) {
      return;
    }
    // /document/UploadFile?filename=image6.PNG&length=14303

    let fileName: string =
      this._util.createGuid() +
      '_' +
      this._util.getUniversalTicks() +
      '_' +
      file.name;

    let url = 'File/UploadExcel?';
    url = url + 'filename=' + encodeURIComponent(fileName);

    // Create request
    let request = new HttpRequest('POST', url, file, {
      reportProgress: true, // this request should be made in a way that exposes progress events
    });

    return this._http.request(request).pipe(
      map((event: HttpEvent<any>) => {
        let result: string;
        switch (event.type) {
          case HttpEventType.Sent:
            if (onUploadStart) {
              onUploadStart();
            }
            break;

          case HttpEventType.UploadProgress:
            if (onUpdateProgress) {
              // Compute and show the % done:
              const percentDone = Math.round(
                (100.0 * event.loaded) / event.total
              );
              onUpdateProgress(HttpEventType.UploadProgress, percentDone);
            }
            break;

          case HttpEventType.Response:
            if (onUpdateProgress) {
              onUpdateProgress(HttpEventType.Response, 100);
            }

            result = event.body;
            break;
        }

        return result;
      }),
      catchError((failedResp: HttpErrorResponse) => {
        let message: string;
        if (failedResp.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          // console.error('An error occurred:', failedResp.error.message);
          message = failedResp.error.message;
          if (onFailed) {
            onFailed(failedResp.status, failedResp.statusText, message);
          }
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          // console.error(
          //    `Backend returned code ${failedResp.status}, ` +
          //    `body was: ${failedResp.error}`);

          let code = failedResp.error.code
            ? failedResp.error.code
            : failedResp.statusText;
          message = failedResp.error.message
            ? failedResp.error.message
            : failedResp.message;
          if (onFailed) {
            onFailed(failedResp.status, code, message);
          }
        }

        // return an ErrorObservable with a user-facing error message
        return throwError(message);
      })
    );
  }

  uploadFileAndCreate(
    file: File,
    siteId: string | undefined,
    onUpdateProgress?: (event: HttpEventType, progress: number) => void,
    onUploadStart?: () => void,
    onFailed?: (
      httpCode: number,
      errorCode: string,
      errorMessage: string
    ) => void
  ): Observable<Document> {
    // -----------------------------------------------------------------------------------
    if (!file) {
      return;
    }
    let url = `${this.uploadDocumentURL}?`;
    url = url + 'filename=' + encodeURIComponent(file.name);
    url = url + '&length=' + file.size;
    url =
      url +
      '&siteId=' +
      (siteId ? siteId : '00000000-0000-0000-0000-000000000000');

    // Create request
    let request = new HttpRequest('POST', url, file, {
      reportProgress: true, // this request should be made in a way that exposes progress events
    });

    return this._http.request(request).pipe(
      map((event: HttpEvent<Document>) => {
        let result: Document;
        switch (event.type) {
          case HttpEventType.Sent:
            if (onUploadStart) {
              onUploadStart();
            }
            break;

          case HttpEventType.UploadProgress:
            if (onUpdateProgress) {
              // Compute and show the % done:
              const percentDone = Math.round(
                (100.0 * event.loaded) / event.total
              );
              onUpdateProgress(HttpEventType.UploadProgress, percentDone);
            }
            break;

          case HttpEventType.Response:
            if (onUpdateProgress) {
              onUpdateProgress(HttpEventType.Response, 100);
            }

            result = event.body;
            break;
        }

        return result;
      }),
      catchError((failedResp: HttpErrorResponse) => {
        let message: string;
        if (failedResp.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          // console.error('An error occurred:', failedResp.error.message);
          message = failedResp.error.message;
          if (onFailed) {
            onFailed(failedResp.status, failedResp.statusText, message);
          }
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          // console.error(
          //    `Backend returned code ${failedResp.status}, ` +
          //    `body was: ${failedResp.error}`);

          let code = failedResp.error.code
            ? failedResp.error.code
            : failedResp.statusText;
          message = failedResp.error.message
            ? failedResp.error.message
            : failedResp.message;
          if (onFailed) {
            onFailed(failedResp.status, code, message);
          }
        }

        // return an ErrorObservable with a user-facing error message
        return throwError(message);
      })
    );
  }

  // this method is not safe to use as it can happen a case that file is not fully upload but document entity created
  // uploadFileAndCreate(file: File, siteId: string | undefined, onUpdateProgress?: (event: HttpEventType, progress: number) => void,
  //     onUploadStart?: () => void,
  //     onFailed?: (httpCode: number, errorCode: string, errorMessage: string) => void): Observable<Document> {
  //     // -----------------------------------------------------------------------------------
  //     if (!file) { return; }
  //     let url = 'Document/UploadDocument?';
  //     url = url + 'filename=' + encodeURIComponent(file.name);
  //     url = url + '&length=' + file.size;
  //     url = url + '&siteId=' + (siteId ? siteId : '00000000-0000-0000-0000-000000000000');

  //     // Create request
  //     let request = new HttpRequest('POST', url, file, {
  //         reportProgress: true // this request should be made in a way that exposes progress events
  //     });

  //     return this._http.request(request).pipe(
  //         map((event: HttpEvent<Document>) => {
  //             let result: Document;
  //             switch (event.type) {
  //                 case HttpEventType.Sent:
  //                     if (onUploadStart) {
  //                         onUploadStart();
  //                     }
  //                     break;

  //                 case HttpEventType.UploadProgress:
  //                     if (onUpdateProgress) {
  //                         // Compute and show the % done:
  //                         const percentDone = Math.round(100.0 * event.loaded / event.total);
  //                         onUpdateProgress(HttpEventType.UploadProgress, percentDone);
  //                     }
  //                     break;

  //                 case HttpEventType.Response:
  //                     if (onUpdateProgress) {
  //                         onUpdateProgress(HttpEventType.Response, 100);
  //                     }

  //                     result = event.body;
  //                     break;
  //             }

  //             return result;
  //         }),
  //         catchError((failedResp: HttpErrorResponse) => {
  //             let message: string;
  //             if (failedResp.error instanceof ErrorEvent) {
  //                 // A client-side or network error occurred. Handle it accordingly.
  //                 // console.error('An error occurred:', failedResp.error.message);
  //                 message = failedResp.error.message;
  //                 if (onFailed) {
  //                     onFailed(failedResp.status, failedResp.statusText, message);
  //                 }
  //             } else {
  //                 // The backend returned an unsuccessful response code.
  //                 // The response body may contain clues as to what went wrong,
  //                 // console.error(
  //                 //    `Backend returned code ${failedResp.status}, ` +
  //                 //    `body was: ${failedResp.error}`);

  //                 let code = failedResp.error.code ? failedResp.error.code : failedResp.statusText;
  //                 message = failedResp.error.message ? failedResp.error.message : failedResp.message;
  //                 if (onFailed) {
  //                     onFailed(failedResp.status, code, message);
  //                 }
  //             }

  //             // return an ErrorObservable with a user-facing error message
  //             return throwError(message);
  //         })
  //     );
  // }

  getDocumentDetails(documentId: string): Observable<Document> {
    // let url = 'document/GetDocumentDetail';
    // let p = {
    //     documentId: documentId
    // }
    let url = this.getDocumentDetailsUrl;
    let propertyName = this.getDocumentDetailsIdParamName;
    let params = {};
    params[propertyName] = documentId;

    return this._http.get(url, { params: params }).pipe(map((data: any) => {
      // Map properties return from EJ4 API
      if (!data.DocumentUrl && (<any>data).DocumentBaseUrl) {
        data.DocumentUrl = (<any>data).DocumentBaseUrl;
      }
      if (!data.Type && (<any>data).DocumentType) {
        data.Type = (<any>data).DocumentType;
      }

      return <Document>data;
    }));
  }

  getFolders(
    siteId: string,
    searchText: string,
    ArchiveStatus?: string,
    withSystemFolders?: boolean,
    sortBy?: string
  ): Observable<IFolder[]> {
    let url = 'folder/GetList';
    let param = {
      ArchiveType: ArchiveStatus ? ArchiveStatus : 'UnArchived',
      IsIncludeSystemFolders: withSystemFolders ? withSystemFolders : false,
      SiteId: siteId,
      SortBy: sortBy ? sortBy : 'Name_asc',
      FolderSearchKeyword: searchText,
    };

    return this._http.post(url, param).pipe(map((data) => <IFolder[]>data));
  }

  getFoldersBySite(
    siteId: string,
    searchTextOnFolders: string,
    searchTextOnFiles?: string
  ): Observable<IFolder[]> {
    let url = 'folder/GetListFoldersBySite';
    let param = {
      SiteId: siteId,
      FolderSearchKeyword: searchTextOnFolders,
      DocumentSearchKeyword: searchTextOnFiles,
    };

    return this._http.post(url, param).pipe(map((data) => <IFolder[]>data));
  }

  countDocuments(
    folderId: string,
    ArchiveStatus?: string,
    sortBy?: string,
    searchText?: string
  ): Observable<number> {
    let url = 'document/GetCount';
    let param = {
      ArchiveType: ArchiveStatus ? ArchiveStatus : 'UnArchived',
      FolderId: folderId,
      SortBy: sortBy ? sortBy : 'Name_asc',
      SearchKeyword: searchText,
    };

    return this._http.post(url, param).pipe(map((data) => <number>data));
  }

  createDocumentsFromUploadFiles(
    folderId: string,
    docs: BaseItem[]
  ): Observable<boolean> {
    let url = 'document/createdocumentsbyuploadfiles';
    let param = {
      FolderId: folderId,
      UploadFiles: docs,
    };

    return this._http.post(url, param).pipe(map((data) => <boolean>data));
  }

  getDocuments(
    folderId: string,
    startIndex: number,
    pageSize: number,
    searchText?: string,
    ArchiveStatus?: string,
    sortBy?: string
  ): Observable<IDataItems<any>> {
    let url = 'document/GetList';
    let param = {
      ArchiveType: ArchiveStatus ? ArchiveStatus : 'UnArchived',
      FolderId: folderId,
      SortBy: sortBy ? sortBy : 'Name_asc',
      SearchKeyword: searchText,
      PageSize: pageSize,
      StartIndex: startIndex,
    };

    return this._http.post(url, param).pipe(map((data) => <IDataItems<any>>data));
  }

  saveDocument(doc: Document): Observable<string> {
    return this._http.post('document/update', doc).pipe(map((data) => <string>data));
  }

  saveFolder(folder: IFolder): Observable<string> {
    // return this._http.post('folder/save', folder).map(data => <string>data);
    return this._api.post<any>('folder/save', folder, true);
  }

  getDocumentInfo(documentId: string): Observable<any> {
    let url = this.getDocumentInfoUrl;
    let key = this.getDocumentInfoKey;
    return this._api.get<any>(url, { [key]: documentId });
  }

  downloadDocument(documentId: string, saveAsName?: string) {
    let url = this.downloadFileUrl;

    let param = {
      documentId: documentId, // for HSCL
      // id: documentId, // for EJ4
      saveAs: undefined, // for HSCL
      // requestedName: undefined // for EJ4
    };

    if (!!saveAsName) {
      param.saveAs = saveAsName;
      // param.requestedName = saveAsName;
    }

    // GF-478 (1.61.0): Consistency of download API methods in HS/CL and EJ4
    this._api.get<any>(url, param).subscribe((r) => {
      if (r) {
          let downloadUrl = r.DownloadUrl;
          this.downloadDocumentFromUrl(downloadUrl, saveAsName);
          // window.open(downloadUrl, 'blank');
      }
    });  
  }

  /**
   * 
   * NBSHD-4663: need to use a  dummy download action in case we have the url. open new tab is not logic
   * 
   */
  downloadDocumentFromUrl(url: string, saveAs?: string) {    
      let a = <any>document.createElement('A');
      a.href = url;

      if (saveAs) {
        a.download = saveAs;
      } else {
        a.download = url.split('/').pop()
      }
      
      document.body.appendChild(a);

      let currentPage = window.location || window.document.location;

      // Prevent cross site, open a new window tab to avoid in replace the curent location
      if (currentPage.hostname === a.hostname) {
          a.click();
      } else {        
          window.open(url, 'blank');
      }

      document.body.removeChild(a);
  }

  getFolderListExample() {
    return this._http.get(`src/assets/data/folder-data/folder-l1.json`);
  }

  getFolderByPage(
    fullFolderList: Folder[],
    startIndex: number,
    pageSize: number,
    ParentFolderId?: string,
    parentFolderLevel?: number
  ): Observable<any> {

    let listTemp = [];
    let result = {};
    if (ParentFolderId) {
      fullFolderList.forEach((e: Folder) => {
        if (e.ParentFolderId === ParentFolderId) {
          listTemp.push(e);
        }
      });
      result = {
        Count: listTemp.length,
        ListItems: listTemp.slice(startIndex, startIndex + pageSize),
      };
    } else {
      let i = 0;
      fullFolderList.forEach((e: Folder) => {
        if (!e.ParentFolderId) {
          listTemp.push(e);
          i++;
        }
      });
      result = {
        Count: listTemp.length,
        ListItems: listTemp.slice(startIndex, startIndex + pageSize),
      };
    }
    console.log('result load', startIndex, pageSize, result);

    return new Observable((ob) => {
      ob.next(result);
      ob.complete();
    });
  }

  exportExcel(moduleName: string, query: any) {
    let apiUrl = moduleName + '/exportExcel';
    return this._api.post(apiUrl, query);
  }
}
