import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonDocumentService } from '../../documents/shared/common-document.service';
import { Observable, of } from 'rxjs';
import { Folder } from '../../documents/shared/document.model';
import { flatMap } from 'rxjs/operators';
import { IDocumentWrapper } from '../../shared/models/common.info';

@Component({
  selector: 'ntk-pdf-preview-workspace',
  templateUrl: './pdf-preview-workspace.component.html',
  styleUrls: ['./pdf-preview-workspace.component.scss']
})
export class PdfPreviewWorkspaceComponent implements AfterViewInit {

  previewTitle = 'Test PDF';
  isGeneratingReport = true;
  isShowFullReport = false;
  isShowPDFDocument: any;
  currentSite;
  getSite;
  fullFolderList;
  documentWrapper: IDocumentWrapper;


  constructor(private _documentService: CommonDocumentService) {
    this.getSite = this.getFolderByPage.bind(this);
  }


  ngAfterViewInit() {
    this.getFolderList();
}

  onShowFullPreview(event) {
    if (this.isShowFullReport !== event) {
        if (this.isShowFullReport) {
            // this._showPreview = false;
        }
        this.isShowFullReport = event;
        setTimeout(() => {
            // this._showPreview = true;
          window.dispatchEvent(new Event('resize'));
        }, 100);
    }
  }

  getPdfFile() {
    
  }

  getFolderList() {
    this._documentService.getFolderListExample().subscribe((res: Folder[]) => {
        this.fullFolderList = res;
    });
}

getFolderByPage(
    startIndex: number,
    pageSize: number,
    parentFolderId?: string,
    folderLevel?: number,
    isChecked?: boolean,
    folderPath?: string,
): Observable<any> {
    return this._documentService.getFolderByPage(this.fullFolderList, startIndex, pageSize, parentFolderId).pipe(flatMap((data) => {
        let tempList: Folder[] = data.ListItems;
        data.ListItems.forEach((d: Folder) => {
            d.Level = folderLevel ? folderLevel : 0;
            d.ParentFolderId = parentFolderId;
            d.isChecked = isChecked;
            d.FolderPath = folderPath ? folderPath : null;
        });
        return of({
            Count: data.Count,
            ListItems: tempList
        });
    }));
}
}
