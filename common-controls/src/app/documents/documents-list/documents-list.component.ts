import { Component, OnInit, Input, Injector, ViewChild, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';

import { Observable, of } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { String } from 'typescript-string-operations';
import { UploadFilesDialog } from '../upload-files-dialog/upload-files-dialog.component';
import { AddEditFolderComponent } from '../add-edit-folder/add-edit-folder.component';
import { ILazyItem, IFolder, AttachmentData, UploadStatus, Document, IDataItems } from '../../shared/models/common.info';
import { IFormDefinition, IFieldDefinition } from '../../dynamic-form/dynamic-form.module';
import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { UtilityService } from '../../core/services/utility.service';
import { HelperService } from '../../core/services/helper.service';
import { TranslationService } from '../../core/services/translation.service';
import { DialogService } from '../../core/services/dialog.service';
import { AuthenticationService } from '../../core/services/authentication.service';
import { DateTimePipe, BaseQueryCondition } from '../../shared/common-controls-shared.module';
import { CommonDocumentService } from '../shared/common-document.service';
import { IGetDataEvent, VirtualListComponent } from '../../virtual-list/virtual-list/virtual-list.component';
import { Folder } from '../shared/document.model';
import { map } from 'rxjs/operators';


@Component({
  selector: 'ntk-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css'],
  providers: [DateTimePipe]
})
export class DocumentsListComponent implements OnInit {
  @Input('siteId') _siteId: string;

  @Input('withRooms') _withRooms: boolean;

  @Input('showDropDownFolder') showDropDownFolder = true; // show/hide dropdown select folder

  @Input('functionTemplate') functionTemplate; // add more button

  @Input('role') role: string; // disabled archive checked document.

  @Output('documentSelected') _documentSelected = new EventEmitter<Document>();

  @Output('documentChecked') $documentChecked = new EventEmitter<string[]>();

  @Output('documentExlude') $documentExlude = new EventEmitter<string[]>();

  @Output('isSelectAll') $isSelectAll = new EventEmitter<boolean>();

  @Output('totalDocument') $totalDocument = new EventEmitter<number>();

  @ViewChild('documentList', {static: true}) _documentList: VirtualListComponent;

  currentFolder: IFolder;
  getFolders: any;
  queryCondition: BaseQueryCondition;
  listDocumentChecked: string[] = [];
  canEditDocument = true;
  canSelectDocument = true;
  DocumentExcludeIds: string[];
  emptyDocument = false;
  flagSelectAll = false;

  private _lastFolders: any[];
  private _searchText: string;

  shouldShowCheck = false;
  isSelectAll = false;

  selectAllLabel = '';

  canAdd = false;

  private _documentService: CommonDocumentService;
  private _translationService: TranslationService;
  private _dialogService: DialogService;
  private _authService: AuthenticationService;
  private _utilityService: UtilityService;
  constructor(private _helperService: HelperService,
              private _dateTimePipe: DateTimePipe) {

    this._documentService = _helperService.DocumentService;
    this._translationService = _helperService.TranslationService;
    this._dialogService = _helperService.DialogService;
    this._authService = _helperService.AuthenticationService;
    this._utilityService = _helperService.UtilityService;

    this.getFolders = this._getFolders.bind(this);


    this.selectAllLabel = this._translationService.getTranslation('btSelectAll');

    if (this._authService.isAuthenticated) {
      let context = this._authService.workingContext;
      this.canAdd = ['Admin', 'Manager'].indexOf(context.Role) > -1;
    }
  }

  ngOnInit() {
    this.refreshFolders();
  }
  private refreshFolders() {
    if (this.showDropDownFolder) {
      this._documentService.getFoldersBySite(this._siteId, '').subscribe(folders => {
        if (folders && folders.length > 0) {
          this.currentFolder = folders[0];
          this.refreshDocuments();
        }
      });
    }
  }

  onDocumentChecked(event, item) {
    if (event.checked) {
      this.listDocumentChecked.push(item.Id);
    } else {
      if (this._documentList.checkedCount > 0 && this.DocumentExcludeIds.indexOf(item.Id) === -1) {
        this.DocumentExcludeIds.push(item.Id);
      }
      if (this.listDocumentChecked.length > 0) {
        const index: number = this.listDocumentChecked.indexOf(item.Id);
        this.listDocumentChecked.splice(index, 1);
      }
    }
    event.source['value'] = item;
    this._documentList.stateChanged(event);
    this.updateSelectAllLabel();
  }
  getUploadInformation(document?: Document) {
    if (!document || !document.UploadedBy) { return ''; }

    let result = this._translationService.getTranslation('lbUploadDocumentInfo');
    return String.Format(result, document.UploadedBy.Name, this._dateTimePipe.transform(document.UploadedDate, undefined));
  }

  onFetchDataFinished(items: any) {
    this.updateSelectAllLabel();
  }

  private updateSelectAllLabel() {
    let count = this._documentList.itemCount;

    let checkedCount = this._documentList.checkedCount;
    this.isSelectAll = this._documentList.isSelectAll;

    this.shouldShowCheck = checkedCount > 0;

    // emit selectAll only when select all is checked
    if (this.isSelectAll) {
      this.$isSelectAll.emit(this.isSelectAll);
    }
    this.$documentChecked.emit(this.listDocumentChecked);
    this.$documentExlude.emit(this.DocumentExcludeIds);
    // if (checkedCount > 0) {
    //   this.selectAllLabel = checkedCount + ' ' + this._translationService.getTranslation('lbItemsSelected');
    //   return true;
    // } else {
      this.selectAllLabel = this._translationService.getTranslation('btSelectAll');
      return false;
    // }
  }

  editDocumentClick(document: Document) {
    // console.log('editDocumentClick: ', document);
    let formDef = <IFormDefinition> {
      titleKey: 'lbEditDocument',
      fields: []
    };

    formDef.fields.push(<IFieldDefinition> {
      name: 'Name',
      placeHolderKey: 'lbName',
      type: 'text',
      required: true
    });

    let formData = {
      formDefinition: formDef,
      value: document,
      saveCallback: this.saveDocument.bind(this),
      cantDoubleClick: true
    };
    this._dialogService.openDialog(DynamicFormComponent, formData, '500px', '300px'
      , true, false, undefined).subscribe(doc => {
        if (doc) { document.Name = doc.Name; }
      });
  }

  private saveDocument(doc: Document): Observable<any> {
    return this._documentService.saveDocument(doc).pipe(map(id => {
      doc.Id = id;
      return doc;
    }));
  }

  selectedAllChanged() {
    if (!this.carArchiveDocument || this.emptyDocument) {
      return;
    }
    this.DocumentExcludeIds = [];
    this._documentList.isSelectAll = !this.isSelectAll;
    this._documentList.selectedAllChanged();

    let count = this._documentList.itemCount;

    // if (!this.isSelectAll) {
    //   this.shouldShowCheck = true;
    //   this.selectAllLabel = count + ' ' + this._translationService.getTranslation('lbItemsSelected');
    // } else {
      this.shouldShowCheck = true;
      this.selectAllLabel = this._translationService.getTranslation('btSelectAll');
    // }
    this.$isSelectAll.emit(!this.isSelectAll);
  }
  onFolderChanged() {
    this.isSelectAll = false;
    this.refreshDocuments();
    // if ( this.currentFolder && this.currentFolder.AccessRights ) {
    //   this.canAdd = this.currentFolder.AccessRights.CanAddDocuments;
    // }
  }
  private _countFolders(searchText: string): Observable<number> {
    return this._documentService.getFoldersBySite(this._siteId, searchText, this._searchText).pipe(map((folders) => {
      this._lastFolders = folders;

      if (this._lastFolders.length === 0 && this._documentSelected) {
        this._documentSelected.emit(undefined);
      }
      return this._lastFolders.length;
    }));
  }

  private _getFolders(startIndex: number, pageSize: number, searchText: string): Observable<IDataItems<IFolder>> {
    if (startIndex === 0) {
      return this._documentService.getFoldersBySite(this._siteId, searchText, this._searchText).pipe(map((folders) => {
        this._lastFolders = folders;

        if (this._lastFolders.length === 0 && this._documentSelected) {
          this._documentSelected.emit(undefined);
        }
        return { Count: this._lastFolders.length, ListItems: this._lastFolders };
      }));
    } else {
      let result = this._lastFolders.slice(startIndex, startIndex + pageSize);
      return of({ ListItems: result });
    }
  }

  getDocumentList(event: IGetDataEvent) {
    if (!this.currentFolder) {
      // event.callBack.next({ Count: 0, ListItems: [] });
      // event.callBack.complete();

      event.callBack({ Count: 0, ListItems: [] });
      return;
    }

    this._documentService.getDocuments(
      this.currentFolder.Id,
      event.startIndex,
      event.pageSize,
      this._searchText,
      this.queryCondition ? this.queryCondition.ArchiveType : '').subscribe((result: IDataItems<ILazyItem>) => {
      if ((!result || result.Count === 0)) {
        this.emptyDocument = true;
        if (this._documentSelected) {
          this._documentSelected.emit(undefined);
        }
      } else {
        this.emptyDocument = false;
      }
      // event.callBack.next(result);
      // event.callBack.complete();

      event.callBack(result);
    });
  }

  refreshDocuments(searchText?: string) {
    this.DocumentExcludeIds = [];
    // console.log('refreshDocuments with:', searchText);
    if (searchText !== undefined) {
      this._searchText = searchText;
    }
    this._documentList.refresh();
  }

  changeCurrentFolder(folder: Folder, queryCondition: BaseQueryCondition, validRoleSelectDocument: boolean) {
    this.currentFolder = folder;
    this.queryCondition = queryCondition;
    this.refreshDocuments(queryCondition.SearchKeyword);
    this.clearToolbar();
    if ( this.currentFolder && this.currentFolder.AccessRights ) {
      this.canSelectDocument = validRoleSelectDocument && this.currentFolder.Type !== 'Attachments' && this.currentFolder.Type !== 'GeneratedDocuments';
      this.canEditDocument = this.currentFolder.AccessRights.CanEditDocuments;
      // this.canAdd = this.currentFolder.AccessRights.CanAddDocuments;
    }
  }

  onCountDocument(event) {
    this.$totalDocument.emit(event);
  }

  clearToolbar() {
    this.isSelectAll = false;
    this._documentList.checkedCount = 0;
    this.updateSelectAllLabel();
    this.listDocumentChecked = [];
  }

  onSelectedItemChanged(item: any) {
    // console.log('document list selected changed to:', item);
    if (this._documentSelected) {
      this._documentSelected.emit(item);
    }
  }

  getCheckedDocuments(): Observable<Document[]> {
    if (this.isSelectAll) {
      return this._documentService.getDocuments(this.currentFolder.Id, 0, 10000, this._searchText).pipe(map(result => {
        return result.ListItems;
      }));
    } else {
      let count = this._documentList.itemCount;

      let selected = this._documentList.getCheckedItems();
      if (selected.length === 0 && this._documentList.getSelectedItem()) {
        selected.push(this._documentList.getSelectedItem());
      }

      return of(selected);
    }
  }

  onAddSubFolderClicked() {
    this.addFolder(this.currentFolder);
  }

  onAddFolderClicked() {
    if (this.currentFolder) {
      this.addFolder(this.findFolderById(this.currentFolder.ParentFolderId));
    } else {
      this.addFolder();
    }
  }

  private findFolderById(id?: string): IFolder | undefined {
    if (!!id && this._lastFolders) {
      return this._lastFolders.find((f) => f.Id === id);
    }

    return undefined;
  }

  private addFolder(parentFolder?: IFolder) {

    let titleKey = 'btAddFolder';

    if (parentFolder) {
      titleKey = 'btAddSubFolder';
    }
    let formData = {
      folder: {
        ParentFolderId: parentFolder ? parentFolder.Id : undefined,
        Room: parentFolder ? parentFolder.Room : undefined,
        VisibleBy: parentFolder ? parentFolder.VisibleBy : this._authService.validWorkingContexts[0].Role, // get current when add a folder
        Site: { Id: this._siteId }
      },
      parentFolder: parentFolder,
      titleKey: titleKey,
      showRoom: this._withRooms
    };
    this._dialogService.openDialog(AddEditFolderComponent, formData, '500px', '400px'
      , true, false, undefined).subscribe(doc => {
        if (doc) {
          this.currentFolder = doc;
          this.refreshDocuments(this._searchText);
        }
      });
  }

  private saveNewFolder(tmpFolder: any) {
    // console.log('saveNewFolder: ', tmpFolder);

    // let newFolder = <IFolder> {
    //   FolderType: 'Custom',
    //   Id: undefined,
    //   Name: tmpFolder.Name,
    //   SiteId: this._siteId,
    //   VisibleBy: tmpFolder.Role,
    //   Room: tmpFolder.Room
    // };

    // if (tmpFolder.Parent) {
    //   newFolder.ParentFolderId = this.currentFolder.Id;
    // }

    // return this._documentService.saveFolder(newFolder);
  }

  onFilesAdded(files: File[]) {
    let initData = {
      initFiles: [],
      folderId: undefined,
      siteId: this._siteId
    };

    if (this.currentFolder) {
      initData.folderId = this.currentFolder.Id;
    }
    let hasValidData = false;

    files.forEach(f => {
      let fileData = <AttachmentData> {
        Id: undefined,
        Status: UploadStatus.None,
        File: f
      };
      if (f) {
        hasValidData = true;
      }
      initData.initFiles.push(fileData);
    });
    if (!hasValidData) {
      return;
    }

    this._dialogService.openDialog(UploadFilesDialog, initData, '500px', '600px'
      , true, false, undefined).subscribe(doc => {
        if (doc) {
          this.refreshDocuments(this._searchText);
        }
      });
  }

  onDocumentStatusChanged($event) {
    let doc = <Document> $event;
    if (doc.Status === 'Processed') {
      // Raise this event so that the document on right side can trigger to reload
      if (this._documentSelected) {
        this._documentSelected.emit(doc);
      }
    }
  }

  get carArchiveDocument() {
    if (this.role) {
      return this.role.toLowerCase() !== 'user';
    }
    return true;
  }

  get canAddDocument() {
    if ( this.currentFolder && this.currentFolder.AccessRights ) {
      return this.currentFolder.AccessRights.CanAddDocuments;
    }
    return false;
  }
}
