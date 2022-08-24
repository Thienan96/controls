import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Injector,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { LazyDataController } from '../../core/controllers/lazy-data-controller';
import { ILazyItem } from '../../shared/models/common.info';
import { Observable } from 'rxjs';
import { IPageInfo } from 'ngx-virtual-scroller';
import * as _ from 'underscore';


export interface IGetDataEvent {
  startIndex: number;
  pageSize: number;
  callBack: (IGetDataCallback) => void;
  idToGetIndex?: string;
  searchKeyword: string;
}

export interface IGetDataCallback {
  Count?: number;
  ListItems?: any[];
}

@Component({
  selector: 'ntk-virtual-list',
  templateUrl: './virtual-list.component.html',
  styleUrls: ['./virtual-list.component.css']
})
export class VirtualListComponent extends LazyDataController<ILazyItem> implements OnInit, AfterViewInit, OnChanges {
  @Output('itemClick') itemClick = new EventEmitter<any>();
  @Output('itemDbClick') itemDbClick = new EventEmitter<any>();
  @Output('selectedChange') selectedChange = new EventEmitter<any>();
  @Output('onGetData') _onGetData = new EventEmitter<IGetDataEvent>();
  @Output() fetchDataFinished = new EventEmitter();
  @Input() parentScroll;

  @Input('pageSize') _pageSize = 20;
  @Input('scrollDebounceTime') scrollDebounceTime = 100; // 100ms by default
  @Input() template: TemplateRef<any>;
  @ContentChild(TemplateRef, { static: false }) _itemTemplate: TemplateRef<any>;
  @ViewChild('container', { static: false }) private _container: ElementRef<any>;

  zone: NgZone;
  constructor(private injector: Injector, private _changeDetectorRef: ChangeDetectorRef) {
    super(injector);
    this.zone = injector.get(NgZone);

    this._useMouseUpToLoad = false;
  }
  ngOnChanges(changes: SimpleChanges): void {

    if (changes._pageSize) {
      this.NUMBER_ITEMS_PER_PAGE = this._pageSize;

      if (!changes._pageSize.firstChange) {
        this.refreshList(false);
      }
    }
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    // setTimeout(() => {
    //   this.refreshList();
    // }, 100);
  }

  trackByFunction(index: number, item: any) {
    return item.Id || index;
  }

  onItemClick(item: any) {
    // we fire only when the item finish to load
    if (item.Id.length > 0) {
      this.zone.runTask(() => { // Run InZone when click on item
        this.itemClick.emit(item);
      });
    }
  }

  onItemDbClick(item: any) {
    // we fire only when the item finish to load
    if (item.Id.length > 0) {
      this.zone.runTask(() => { // Run InZone when dbclick on item
        this.itemDbClick.emit(item);
      });
    }
  }


  setSelectedItem(item, checkNullItemId = false, userInteract = false, ignoreRaiseEvent = false) {
    this.zone.runTask(() => {
      if (!!checkNullItemId) {
        // item is loading
        if (!item || !item.Id) { return; }
      }

      if (item) {
        // console.trace('-----setSelectedItem------', item);
      }

      let isSame = _.isEqual(this._selectedItem, item);

      this._selectedItem = item;
      // reset to make sure it is not select again
      this._indexToSelect = undefined;

      if (!ignoreRaiseEvent && !isSame) {
        this.onSelectedItemChanged(item);
      }
    });
  }

  loadData(startIndex: number, pageSize: number): Observable<any> {

    let obResult = new Observable<any>((subscriber) => {
      let data = <IGetDataEvent>{
        startIndex: startIndex,
        pageSize,
        callBack: (x) => {
          subscriber.next(x);
          subscriber.complete();

          setTimeout(() => {
            this.safeApply();
          }, 100);
        }
      };

      this._onGetData.emit(data);
    });

    return obResult;
  }

  onUpdate(viewPortItems: any[]) {
    this.updateViewPortChanged(viewPortItems);
    this.safeApply();
  }

  onChange(event: IPageInfo) {
    this.onRequestItemsLoad(event);
    // this.safeApply();    
  }

  private safeApply() {
    try {
      this._changeDetectorRef.detectChanges();
    } catch (e) { }
  }
  // keepCurrneItems: avoid blind when refresh data
  refresh(keepCurrentItems?: boolean) {
    this._virtualScroll.scrollToIndex(0, true, 0, 1);
    this.refreshList(true, false, keepCurrentItems);
  }

  refreshOnTopListItem() {
    this._selectedItem = undefined;
    this.refreshList(true);
  }

  refreshOnTopKeepSelect() {
    this.refreshList(true, true);
  }

  public scrollToIndex(index: number, withAnimation = false) {
    this._virtualScroll.scrollToIndex(index, true, 0, withAnimation ? 100 : 0);
  }

  protected onSelectedItemChanged(item?: ILazyItem) {
    this.selectedChange.emit(item);
  }

  getVirtualScroll() {
    return this._virtualScroll;
  }

  onFetchDataFinished<T>(items?: T[] | undefined) {
    this.fetchDataFinished.emit(items);
  }


  stateChanged(event: any) {

    // GF-210: problem of cannot scroll on Chome when checked, we need to blur all elements
    if ((<HTMLElement>this._container.nativeElement).contains(document.activeElement)) {
      document.activeElement['blur']();
    }

    this.zone.runTask(() => { // Run InZone when click on item
      if (event.checked) {
        this.checkedCount++;
        if (this.checkedCount === this.itemCount) {
          this.isSelectAll = true;
        }

        if (this.isExclude) {
          const pos = this.excludeItems.findIndex((item) => {
            return item.Id === event.source.value.Id;
          });
          if (pos !== -1) {
            this.excludeItems.splice(pos, 1);
          }
        }
      } else {
        this.checkedCount--;
        if (this.isSelectAll) {
          this.isSelectAll = false;
        }

        if (this.isExclude) {
          this.excludeItems.push(event.source.value);
        }
      }
    });
  }
}
