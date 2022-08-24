import { Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export interface IGetDataEvent {
  startIndex: number;
  pageSize: number;
  callBack: (IGetDataCallback) => void;
  idToGetIndex?: string;
  searchKeyword: string;
}

@Component({
  selector: 'ntk-virtual-scroll-expansion',
  templateUrl: './virtual-scroll-expansion.component.html',
  styleUrls: ['./virtual-scroll-expansion.component.scss']
})
export class VirtualScrollExpansionComponent implements OnInit {
  items: any[] = [];
  @Input() template: TemplateRef<any>;
  @Input() ClickExpand: EventEmitter<any>;
  @Input() preventExpand = false;
  @Input() haveCheckbox = false;
  @Input() selectedItemIds: string[];
  @Output() selectAllChanged = new EventEmitter();
  @Output() availableAction = new EventEmitter();
  @Input() hasHeader = false;
  itemsAllowCheck;

  // isChecked: boolean;

  private _isSelectAll: boolean;
  get isSelectAll(): boolean {
    return this._isSelectAll;
  }
  set isSelectAll(value: boolean) {
    if (this._isSelectAll !== value) {
      this.selectAllChanged.emit(value);
    }
  }

  listCacheChildItems = [];
  _selectedItem: any;
  @ContentChild('headerTemplate', { static: false }) _headerTemplate: TemplateRef<any>;
  @ContentChild('itemTemplate', { static: false }) _itemTemplate: TemplateRef<any>;
  @Input() getData: any;

  @Output('onGetData') _onGetData = new EventEmitter<IGetDataEvent>();
  private _subscriptions: Subscription = new Subscription();

  constructor() {
  }

  clearListener() {
    if (this._subscriptions) {
      this._subscriptions.unsubscribe();
    }
  }

  ngOnInit() {
    this._subscriptions.add(this.ClickExpand.subscribe(v => {
      if (v.IsExpaded) {
        this.expandSection(v.Item);
      } else {
        this.collapseSection(v.Item);
      }
    }));

    if (!this.selectedItemIds) this.selectedItemIds = [];

  }

  onExpand(v) {
    if (v.IsExpaded) {
      this.expandSection(v.Item);
    } else {
      this.collapseSection(v.Item);
    }
  }

  refresh() {
    this.loadData().subscribe((res) => {

      this.items = res.ListItems;
      this.itemsAllowCheck = this.items.filter(f=>{
        return f.allowCheck
      })
      if (this.selectedItemIds.length > 0) {
        this.items.forEach(item => {
          let index = this.selectedItemIds.indexOf(item.Id);
          if (index >= 0) {
            item.isChecked = true;
          }
        });
        if(this.selectedItemIds.length === this.itemsAllowCheck.length) this.isSelectAll = true;
      }
      
      this.checkAvailableAction();
    });
  }

  loadData(): Observable<any> {
    return this.getData.apply(this, arguments);
  }

  expandSection(sectionParent: any) {
    let sectionChildren = [];
    let lineChildren = [];
    let parentIndex = this.items.findIndex(item => {
      return item.Id === sectionParent.Id
    })
    this.items[parentIndex].IsExpanded = true;
    for (let itemLine of this.listCacheChildItems) {
      if (itemLine.ParentVisitItemId === sectionParent.Id) {
        lineChildren.push(itemLine);
      }
    }
    this.appendArray(this.items, lineChildren, parentIndex + 1);

    for (let itemSection of this.items) {

      if (itemSection.ParentVisitItemId === sectionParent.Id) {

          itemSection.IsExpanded = true;
          sectionChildren.push(itemSection);
      }
    }
    
    sectionChildren.forEach((f) => {
      this.expandSection(f);
    });
  }

  appendArray(array: any[],
    arrayToAppend: any[], indexToInsert: number) {
    for (let item of arrayToAppend) {
      this.listCacheChildItems.splice(
        this.listCacheChildItems.findIndex(i => {
          return i.Id === item.Id
        }), 1
      )
    }
    array.splice(indexToInsert, 0, ...arrayToAppend);
  }

  collapseSection(sectionParent: any) {
    let sectionChildren = [];
    let lineChildren = [];
    let parentIndex = this.items.findIndex(item => {
      return item.Id === sectionParent.Id
    })
    this.items[parentIndex].IsExpanded = false;
    for (let item of this.items) {
      if (item.ParentVisitItemId === sectionParent.Id) {
        if (item.EntityDiscriminator === 'VisitSection') {
          item.IsExpanded = false;
          sectionChildren.push(item);
        } else {
          lineChildren.push(item);
        }
      }
    }
    lineChildren.forEach((l) => {
      this.collapseSection(l);
    })

    sectionChildren.forEach((s) => {
      this.collapseSection(s);
    });
    this.removeArray(this.items, lineChildren);
  }

  expandAllSection(isExpand) {
     let allSection = this.items.filter(s => {
      return s.EntityDiscriminator === 'VisitSection'
    });
    if(isExpand){ 
      for(let section of allSection) {
        this.expandSection(section);
      }
    } else {
      for(let section of allSection) {
        this.collapseSection(section);
      }
    }
  }

  collapseLineChildren(lineItem: any) {
    let lineChildren = [];
    for (let item of this.items) {
      if (item.ParentVisitItemId === lineItem.Id) {
          lineChildren.push(item);
      }
    }
    lineChildren.forEach((l) => {
      this.collapseLineChildren(l);
    })
    this.removeArray(this.items, lineChildren);
  }

  private removeArray(
    array: any[],
    arrayToDelete: any[]
  ) {
    for (let needDelete of arrayToDelete) {

      if (this.listCacheChildItems.length === 0 ||
        this.listCacheChildItems.findIndex(f => f.Id === needDelete.Id) < 0) {
        this.listCacheChildItems.push(needDelete);
      }
      let pos = array.indexOf(needDelete);
      array.splice(pos, 1);
    }
  }

  isSelectedItem(item: any): boolean {
    if (item && this._selectedItem && item.Id === this._selectedItem.Id) {
      return true;
    }

    return false;
  }

  onSelectRow(row) {
    if(!this._selectedItem) {this._selectedItem = row; return;};
    if (this._selectedItem.Id === row.Id) {
      this._selectedItem = undefined;
    } else {
      this._selectedItem = row;
    }
  }

  changeCheckedStatus(row: any, isCheck: boolean) {
    this.addSelectedItemIds(row, isCheck);

    // all children items must have the same check with the parent
    // must include expanded/collapsed items
    let items = this.items.concat(this.listCacheChildItems);
    for (let item of items) {
      if (item.ParentVisitItemId === row.Id && item.allowCheck) {
        item.isChecked = isCheck;
        this.addSelectedItemIds(item, isCheck);
        this.changeCheckedStatus(item, isCheck)
      }
    }

    // parent item must be checked if the children checked
    if (row.isChecked && row.ParentVisitItemId) {
      this.setCheckedParentItem(row);
    }
    
    
    this.isSelectAll = this.selectedItemIds.length === this.itemsAllowCheck.length;
  }

  private addSelectedItemIds(row: any, isCheck: boolean) {
    let index = this.selectedItemIds.indexOf(row.Id);
    if (isCheck && index < 0)
      this.selectedItemIds.push(row.Id);
    if (!isCheck && index >= 0)
      this.selectedItemIds.splice(index, 1);
  }

  private setCheckedParentItem(row) {
    let parentItem = this.items.find(item => {
      return item.Id === row.ParentVisitItemId;
    });

    if (parentItem) {
      parentItem.isChecked = true;
      this.addSelectedItemIds(parentItem, true);
      // parent item must be checked if the children checked
      if (parentItem.ParentVisitItemId) {
        this.setCheckedParentItem(parentItem);
      }
    }
  }

  setCheckedAll(isCheck: boolean) {
    // must include expanded/collapsed items
    let items = this.items.concat(this.listCacheChildItems);
    for (let item of items) {
      if(item.allowCheck) {
        item.isChecked = isCheck;
        this.addSelectedItemIds(item, isCheck);
      }
    }
  }

  checkAvailableAction() {
    let canExpandAll = false;
    let canCollapseAll = false;

    canCollapseAll = this.items.findIndex(i => {
      return i.EntityDiscriminator === 'VisitSection' && i.IsExpanded
    }) > -1
    canExpandAll = this.items.findIndex(i => {
      return i.EntityDiscriminator === 'VisitSection' && !i.IsExpanded
    }) > -1
    this.availableAction.emit({
      canExpandAll: canExpandAll,
      canCollapseAll: canCollapseAll
    });
  }
}
