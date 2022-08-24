import {
  Input
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { IPageInfo } from 'ngx-virtual-scroller';
import * as _ from 'underscore';
import { forkJoin } from 'rxjs';
import { Folder } from './document.model';
import { BaseQueryCondition } from '../../shared/common-controls-shared.module';

export class FolderTreeDataController<T extends Folder> {
  @Input() items: T[];
  viewPortItems: T[] = [];
  @Input() queryCondition: BaseQueryCondition;
  @Input() pageSize = 20;


  listFolderCheckedCount = 0;
  totalChecked = 0;

  constructor() {}

  loadData(
    startIndex: number,
    pageSize: number,
    parentFolderId?: string,
    parentFolderLevel?: number,
    isChecked?: boolean,
    folderPath?: string,
    parentRole?: string
  ): Observable<any> {
    throw new Error('not yet implemented loadData function');
  }

  updateViewPortChanged(viewPortItems: any[]) {
    this.viewPortItems = viewPortItems;
  }

  onRequestItemsLoad(event: IPageInfo) {
    let start = event.startIndex,
      end = event.endIndex;
    if (event.startIndex < 0 || event.endIndex < 0) {
      return;
    }
    if (this.items.slice(start, end + 1).length === 0) {
      return;
    }

    this.requestItems(start, end);
  }

  getScrollbarWidth(container: JQuery) {
    let datatable = container.closest('ntk-folder-tree');
    if (datatable.length > 0) {
        let body = datatable.find('.full-width-divider'),
            content = datatable.find('.scrollable-content');
        return body.width() - content.width();
    } else {
        return 0;
    }
  }

  private requestItems(start: number, end: number) {
    let rows: Folder[] = this.items.slice(start, end + 1);
    let localStart = 0;
    let localEnd = rows.length;

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].Id !== '-1') {
        start++;
        localStart++;
      } else {
        break;
      }
    }

    for (let j = rows.length - 1; j >= 0; j--) {
      if (rows[j].Id !== '-1') {
        end--;
        localEnd--;
      } else {
        break;
      }
    }

    rows = rows.slice(localStart, localEnd);

    if (rows.length === 0) {
      return;
    }
    // group by level folder
    let groups = [];

    groups[0] = {
      items: [rows[0]],
      index: rows[0].uniqueKey,
      level: rows[0].Level,
      parentFolderId: rows[0].ParentFolderId,
      folderPath: rows[0].FolderPath,
      isChecked: rows[0].isChecked,
      parentRole: rows[0].parentRole
    };
    for (let k = 1; k < rows.length; k++) {
      let row = rows[k];
      let inGroup = false;
      groups.forEach((g) => {
        if (row.Level === g.level) {
          g.items.push(row);
          inGroup = true;
        }
      });
      if (!inGroup) {
        let newGroup = {
          items: [row],
          index: row.uniqueKey,
          level: row.Level,
          parentFolderId: row.ParentFolderId,
          folderPath: row.FolderPath,
          isChecked: row.isChecked,
          parentRole: row.parentRole
        };
        groups.push(newGroup);
      }
    }

    let requests = [];
    groups.forEach((gr) => {
      let request = this.loadData(
        gr.index,
        gr.items.length,
        gr.parentFolderId,
        gr.level,
        gr.isChecked,
        gr.folderPath,
        gr.parentRole
      );
      requests.push(request);
    });
    forkJoin(requests).subscribe((res) => {
      let listTempItems = [];
      res.forEach((listFolders: any) => {
        listTempItems.push(...listFolders.ListItems);
      });
      this.items.splice(start, listTempItems.length, ...listTempItems);
    });
  }
}
