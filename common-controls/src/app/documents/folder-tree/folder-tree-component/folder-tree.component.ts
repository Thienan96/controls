import { Component, Input, ViewChild, TemplateRef, Output, EventEmitter, OnChanges, ElementRef, OnInit } from '@angular/core';
import { FolderTreeDataController } from '../../shared/Folder-Tree-Data.controller';
import { Folder } from '../../shared/document.model';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as _ from 'underscore';
import { FolderTreeVirticalScrollComponent } from '../folder-tree-virtical-scroll/folder-tree-virtical-scroll.component';
import { TranslationService } from '../../../core/services/translation.service';
import { HelperService } from '../../../core/services/helper.service';
import { DatatableColumn, DatatableColumnPin } from '../../../datatable/shared/datatable.model';

@Component({
  selector: 'ntk-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss'],
})
export class FolderTreeComponent extends FolderTreeDataController<Folder> implements OnChanges, OnInit {

  @Input() getData: any;
  @Input() functionTemplate: TemplateRef<any>;
  @Input() rowSelected: Folder;
  @Input() headerTemplate: TemplateRef<any>;
  @Input() newRowToFocus: Folder;

  @Output() selectedRow = new EventEmitter<any>();
  @Output() folderChecked = new EventEmitter<any>();
  @Output() folderUnchecked = new EventEmitter<any>();
  @Output() showConnectorInfo = new EventEmitter<any>();
  @Output() dislayCheckboxSelectAll = new EventEmitter<boolean>();

  onExpandFolder = new EventEmitter<any>();

  listCacheFolderExpanded: Folder[] = [];

  listFolderCacheToShow: Folder[] = [];

  listenDataChange = new Subscription();

  @ViewChild('folderScroll', { static: false }) _folderScroll: FolderTreeVirticalScrollComponent;

  listConfigMiddLine = [{ Id: '', CalculateResult: [] }];
  // countFolderCheckLabel = '';
  offsetScroll = 0;

  listColumnWidth: number[] = [];

  @Input() columns: DatatableColumn[] = [
    {
      property: 'isChecked',
      width: 33,
      pin: DatatableColumnPin.center,
      show: true
    },
    {
      property: 'Name',
      translationKey: 'lbName',
      width: 300,
      pin: DatatableColumnPin.center,
      show: true,
      resizeable: true
    },
    {
      property: 'VisibleBy',
      translationKey: 'lbContactRole',
      width: 130,
      pin: DatatableColumnPin.center,
      show: true,
      resizeable: true
    },
    {
      property: 'Room',
      translationKey: 'lbRoom',
      width: 250,
      pin: DatatableColumnPin.center,
      show: true,
      resizeable: true
    },
    {
      property: 'aproplan',
      translationKey: '',
      width: 65,
      pin: DatatableColumnPin.center,
      show: true,
      resizeable: false
    }
  ];

  private _translationService: TranslationService;
  $element: JQuery;
  isPending: any;
  scrollLeft: number;

  constructor(
    private _helperService: HelperService,
    private elementRef: ElementRef) {
    super();
    this.$element = $(this.elementRef.nativeElement);
    this._translationService = this._helperService.TranslationService;
  }

  ngOnInit(): void {
    this.columns.forEach(
      f => {
        this.listColumnWidth.push(f.width);
      }
    );
  }

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    if (!this.items) {
      return;
    }
  }

  onClickSelectAll(value: boolean) {
    if (this.items) {
      this.items.forEach((folder) => {
        folder.isChecked = value;
      });
      this.countFolderChecked();
    }
  }

  loadData(): Observable<any> {
    return this.getData.apply(this, arguments);
  }

  onUpdate(event: any) {
    this.updateViewPortChanged(event);
  }

  onChange(event: any) {
    this.onRequestItemsLoad(event);
  }

  // expand parent folder
  onExpandedChanged(folder: Folder) {
    folder.isExpanding = true;
    if (!folder.expanded) {
      this.removeFolder(folder);
      this.countFolderChecked();
      folder.isExpanding = false;
    } else {
      let folderPath = `${folder.FolderPath ? folder.FolderPath + ' > ' : ''}${
        folder.Name
        }`;
      let i = 0;
      for (i; i < this.items.length; i++) {
        if (this.items[i].Id === folder.Id) {
          break;
        }
      }
      if (this.listCacheFolderExpanded.filter(f => f.ParentFolderId === folder.Id).length > 0) {
        this.listFolderCacheToShow = [];
        this.updateListCacheFolder(folder);

        this.items.splice(i + 1, 0, ...this.listFolderCacheToShow);
        folder.isExpanding = false;
        return;
      }

      // this.getTempFolder(folder);
      this.getChildFolder(folder)
      .subscribe((res: any) => {
        this.items[i].countChildren = res.Count;
        let noneDataList = [];
        folder.isExpanding = false;

        // insert none data
        for (let j = 0; j < res.Count; j++) {
          let noneData: Folder = {
            Type: 'Custom',
            HasChildren: false,
            uniqueKey: j,
            Id: '-1',
            expanded: false,
            isExpanding: false,
            VisibleBy: '',
            Name: '',
            ParentFolderId: folder.Id,
            Level: folder.Level + 1,
            isChecked: folder.isChecked,
            FolderPath: folderPath,
            AccessRights: folder.AccessRights,
            parentRole: folder.VisibleBy
          };
          noneDataList.push(noneData);
        }

        // insert none data
        this.items.splice(i + 1, 0, ...noneDataList);


        // replace none data with real data
        if (res.ListItems.length > 0) {
          this.items.splice(i + 1, res.ListItems.length, ...res.ListItems);
        }

        this.countFolderChecked();
      });
    }
    this.checkPadding();
  }

  updateListCacheFolder(parentFolder: Folder) {
    let i = 0;
    for (let item of this.listCacheFolderExpanded) {
      if (item.ParentFolderId === parentFolder.Id) {
        this.listFolderCacheToShow.push(item);
        if (item.expanded) {
          this.updateListCacheFolder(item);
        }
      }
      i++;
    }
  }

  // Check first folder to resize tree indent
  isFirstItemInLevel(folder: Folder): boolean {
    let index = 0;
    for (index; index < this.items.length; index++) {
      if (folder.Id === this.items[index].Id) {
        break;
      }
    }
    if (this.items && index > 0) {
      let item = this.items[index];
      let pre = this.items[index - 1];

      // in case close folder. folder child was removed. undefined item
      if (!_.has(item, 'Level')) {
        return false;
      }

      return pre.Level < item.Level;
    }
    return true;
  }

  // calculate to print middle of tree indent
  calculateMiddleLines(folder: Folder): boolean[] {
    if ( (!this.items) || (this.items.length === 0)) {
      return [];
    }
    let result: boolean[] = new Array(folder.Level > 0 ? folder.Level : 0).fill(
      true
    );

    // folder level 0 not implement
    if (folder.Level === 0) {
      let configMiddle;
      configMiddle = {
        Id: folder.Id,
        CalculateResult: result,
      };
      this.listConfigMiddLine.push(configMiddle);
      return result;
    }

    let index = 0;
    for (index; index <= this.items.length; index++) {
      // this folder is last element
      if (index === this.items.length - 1) {
        result = new Array(folder.Level > 0 ? folder.Level : 0).fill(false);
        return result;
      }
      if (folder.Id === this.items[index].Id) {
        break;
      }
    }

    if (folder.Level > 0) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.listConfigMiddLine.length; i++) {
        if (this.listConfigMiddLine[i].Id === folder.ParentFolderId) {
          let tempList = this.listConfigMiddLine[i].CalculateResult.slice(
            0,
            result.length - 1
          );
          result.splice(0, result.length - 1, ...tempList);

          if (this.items[index].Level > this.items[index + 1].Level) {
            result.splice(result.length - 1, 1, false);
          }
          break;
        }
      }

      for (let i = index + 1; i < this.items.length; i++) {
        if (this.items[i].Level === this.items[index].Level) {
          result.splice(result.length - 1, 1, true);
          break;
        } else {
           // last child folder
          result.splice(result.length - 1, 1, false);
        }
        if (this.items[i].Level < this.items[index].Level) {
          break;
        }
      }
      this.listConfigMiddLine.push({
        Id: folder.Id,
        CalculateResult: result,
      });
      return result;
    }
  }

  // click select a row
  onSelectedItemChanged(item: Folder) {
    this.rowSelected = item;
    this.selectedRow.emit(item);
  }

  // check checkbox
  onCheckedFolder(item: Folder) {
    this.onCheckedFolderChaged(item);
    // this.countFolderSelected(item.isChecked ? 1 : -1);
    this.countFolderChecked();
  }

  refreshData() {
    this.listCacheFolderExpanded = [];
    this._clearChecked();
    this.items = [];
    this.loadData().subscribe((res) => {
      this.items = res.ListItems;
      this.insertNonData(res.Count);
      this.rowSelected = this.items[0];
      this.selectedRow.emit(this.rowSelected);
      this.countFolderChecked();
      this.checkPadding();
      if (res.Index && res.Index > -1) {
        this.scrollToIndex(res.Index);
      }
    });
  }

  // insert none data to list items
  insertNonData(totalData: number, indexToInsert?: number) {
    for (let i = this.items.length; i < totalData; i++) {
      let noneData: Folder = {
        Type: 'Custom',
        HasChildren: false,
        uniqueKey: i,
        Id: '-1',
        expanded: false,
        isExpanding: false,
        VisibleBy: '',
        Name: '',
        Level: 0,
        AccessRights: {
          CanAddDocuments: true,
          CanAddSubFolder: true,
          CanArchive: true,
          CanEdit: true,
          CanEditDocuments: true
        }
      };
      this.items.push(noneData);
    }
  }

  // get list folder checked
  getFolderChecked() {
    if (this.items.length > 0) {
      return this.items.filter((f) => {
        return f.isChecked === true;
      });
    }
    return [];
  }

  // checking relate folder
  onCheckedFolderChaged(item: Folder, flag?: boolean) {
    if (!flag) {
      this.checkChildren(item);
    }
    this.checkParents(item);
  }

  // checking all child folder when parent folder check
  checkChildren(item: Folder) {
    let folderChildren = this.items.filter((f: Folder) => {
      return f.ParentFolderId === item.Id;
    });
    if (folderChildren.length < 1) {
      return;
    }
    folderChildren.forEach((f: Folder) => {
      f.isChecked = item.isChecked;
      if (item.isChecked) {
        // this.countFolderSelected(1);
      } else {
        // this.countFolderSelected(-1);
      }
      this.onCheckedFolderChaged(f);
    });
  }

  // unchecking all parent when child folder uncheck
  checkParents(item: Folder) {
    if (item.isChecked) {
      return;
    }
    let folderParent = this.items.filter((f: Folder) => {
      return f.Id === item.ParentFolderId;
    });
    if (folderParent.length < 1) {
      return;
    }
    folderParent.forEach((f: Folder) => {
      if (f.isChecked) {
        // this.countFolderSelected(-1);
      }
      f.isChecked = item.isChecked;
      this.onCheckedFolderChaged(f, true);
    });
  }

  // count total folder checked
  countFolderChecked() {
    for (let item of this.items) {
      if (!item.AccessRights.CanArchive) {
        item.isChecked = false;
      }
    }
    let listFolderChecked = [];
    let listFolderUnchecked = [];
    for (let item of this.items) {
      if (item.isChecked) {
        listFolderChecked.push(item);
      } else {
        listFolderUnchecked.push(item);
      }
    }

    this.totalChecked = listFolderChecked.length;
    // if (this.totalChecked > 0) {
    //   this.countFolderCheckLabel = this.totalChecked + ' ' + this._translationService.getTranslation('lbItemsSelected');
    // } else {
    //   this.countFolderCheckLabel = '';
    // }

    this.behaviorDisplaySelectAll();
    this.folderChecked.emit(listFolderChecked);

    this.folderUnchecked.emit(listFolderUnchecked);
  }

  updateDocumentCount(obj: any) {
    for (let item of this.items) {
      if (item.Id === obj.Id) {
        item.DocumentCount = obj.DocumentCount;
      }
    }
  }

  onShowConnectorInfo($event) {
    this.showConnectorInfo.emit($event);
  }

  // focus to specific folder
  scrollToIndex(index: number) {
    this._folderScroll.scrollToIndex(index);
    this.rowSelected = this.newRowToFocus;
    this.selectedRow.emit(this.rowSelected);
  }

  // resize column event
  onResizeColumn($event: DatatableColumn) {
    let indexColumnChanged = this.columns.findIndex(c => {
      return c.property === $event.property;
    });
    this.listColumnWidth[indexColumnChanged] = $event.width;
  }

  // scroll horizon event
  setScrollLeft(left: number) {
    this.scrollLeft = left;
  }

  behaviorDisplaySelectAll() {
    for (let item of this.items) {
      if (item.AccessRights && item.AccessRights.CanArchive && !item.isChecked) {
        this.dislayCheckboxSelectAll.emit(false);
        return;
      }
    }
    this.dislayCheckboxSelectAll.emit(true);
  }

  private getChildFolder(
    parentFolder: Folder,
  ): Observable<any> {
    let folderPath = `${parentFolder.FolderPath ? parentFolder.FolderPath + ' > ' : ''}${
      parentFolder.Name
      }`;
    return this.getData(
      0,
      this.pageSize,
      parentFolder.Id,
      parentFolder.Level + 1,
      parentFolder.isChecked,
      folderPath,
      parentFolder.VisibleBy
    ).pipe(
      tap((data) => {
        setTimeout(() => { }, 100);
      })
    );
  }

  // collapse folder
  private removeFolder(parentFolder: Folder) {
    let folderChildren = this.items.filter((f: Folder) => {
      return f.ParentFolderId === parentFolder.Id;
    });
    if (folderChildren.length < 1) {
      return;
    }

    folderChildren.forEach((f: Folder) => {
      this.removeFolder(f);
    });

    // Remove children
    this.removeArray(this.items, folderChildren);
  }

  private removeArray(
    array: Folder[],
    arrayToDelete: Folder[],
  ) {
    for (let needDelete of arrayToDelete) {
      if (needDelete.isChecked) {
        // this.countFolderSelected(-1);
      }
      let pos = array.indexOf(needDelete);
      array.splice(pos, 1);
      if (this.listCacheFolderExpanded.length === 0 ||
        this.listCacheFolderExpanded.filter(f => f.ParentFolderId === needDelete.ParentFolderId && f.uniqueKey === needDelete.uniqueKey).length === 0
        ) {
          this.listCacheFolderExpanded.push(needDelete);
        }
    }
  }

  // clear checked when refresh
  private _clearChecked() {
    this.totalChecked = 0;
    this.folderChecked.emit([]);
  }

  // get rightpadding when scroll vertical appearance
  private checkPadding() {
    setTimeout(() => {
      this.offsetScroll = this.getScrollbarWidth(this.$element);
    }, 100);
  }

  get getCurrentListItem() {
    return this.items;
  }
}
