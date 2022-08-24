import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { IGetDataCallback, IGetDataEvent } from '../../virtual-list/virtual-list/virtual-list.component';
import { Observable, of } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { DialogService } from '../../core/services/dialog.service';
import { BaseQueryCondition } from '../../shared/common-controls-shared.module';
import { BackgroundService } from '../../background-tasks/shared/background.service';
import { AddEditFolderComponent } from '../../documents/add-edit-folder/add-edit-folder.component';
import { FolderTreeComponent } from '../../documents/folder-tree/folder-tree-component/folder-tree.component';
import { CommonDocumentService } from '../../documents/shared/common-document.service';
import { DocumentsListComponent } from '../../documents/documents-list/documents-list.component';
import { Folder } from '../../documents/shared/document.model';


@Component({
    selector: 'ntk-document-workspace',
    templateUrl: './document-workspace.component.html',
    styleUrls: ['./document-workspace.component.scss']
})
export class DocumentWorkspaceComponent implements AfterViewInit {
    constructor(
        private _documentService: CommonDocumentService,
        private _dialogService: DialogService,
        private _backgroundSvc: BackgroundService
    ) {
        this.getFolder = this.getFolderByPage.bind(this);
        for (let i = 0; i < 1000; i++) {
            this.data.push({ Id: `${i}`, Name: `Item ${i}` });
        }
        this.queryCondition = new BaseQueryCondition({
            ArchiveType: 'UnArchived',
            SortBy: 'Name_asc'
        });
    }
    data = [];
    drawingShapes = [];
    imgUrl = 'https://i1-vnexpress.vnecdn.net/2021/12/07/z2748071896584-3fe37073775a32e-1687-3666-1638862929.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=vDQ9N4x2jJamcat9DL1_6w';

    attachments = [];
    folderList = []; // Trung create
    fullFolderList = []; // Trung create
    folderType: any;
    getFolder: any;
    currentSite: any;

    @ViewChild(DocumentsListComponent, { static: true }) documentsListComponent: DocumentsListComponent;

    @ViewChild('folderTree', { static: false }) _folderTree: FolderTreeComponent;
    queryCondition: any;

    speedDialFabButtons = [
        {
          maticon: 'create_new_folder',
          tooltip: 'lbLinkContacts',
          action: 'linkContacts'
        },
        {
          imageurl: 'src/assets/images/add_subfolder.png',
          tooltip: 'btAddContact',
          action: 'addContact',
        },
      ];

    ngAfterViewInit() {
        this.documentsListComponent.refreshDocuments();
        this.getFolderList();
    }

    onSelectedAttachmentChanged($event) {
        console.log('onSelectedAttachmentChanged = ', $event);
    }

    getVLData(event: IGetDataEvent) {
        console.log('--- on get data: ', event);

        let data = <IGetDataCallback> {
            Count: this.data.length,
            ListItems: this.data.slice(event.startIndex, event.startIndex + event.pageSize)
        };

        event.callBack(data);
    }

    onRefresh($event: any) {
        this.documentsListComponent.refreshDocuments();
    }


    getFolderList() {
        this._documentService.getFolderListExample().subscribe((res: Folder[]) => {
            this.fullFolderList = res;
            this._folderTree.refreshData();
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
            let i = 0;
            data.ListItems.forEach((d: Folder) => {
                d.uniqueKey = i;
                d.Level = folderLevel ? folderLevel : 0;
                d.ParentFolderId = parentFolderId;
                d.isChecked = isChecked;
                d.FolderPath = folderPath ? folderPath : null;
                i++;
            });
            return of({
                Count: data.Count,
                ListItems: tempList
            });
        }));
    }

    changeStatusFolder($event) {
    }

    openDialog(): void {
    }

    addFolderClick() {
        console.log('add folder click ', this._folderTree.rowSelected);
        
        this._dialogService.openDialog(
            AddEditFolderComponent,
             { folder: this._folderTree.rowSelected },
            '500px', '450px').subscribe(newItem => {
        });
    }

    showPendding() {
        this._backgroundSvc.showPenddingTasks();
    }
}
