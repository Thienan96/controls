import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {IPageInfo} from 'ngx-virtual-scroller';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators/takeUntil';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LazyDataController} from '../core/controllers/lazy-data-controller';
import {IGetDataEvent} from '../virtual-list/virtual-list/virtual-list.component';
import {ReplaySubject} from 'rxjs/internal/ReplaySubject';

export class StickyItem {
  data: any;
  index: number;
  offsetTop: number;
  isSticked: boolean;
  constructor(obj?: Partial<StickyItem>) {
    if (obj) { Object.assign(this, obj); }
  }
}
@Component({
  selector: 'ntk-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss']
})
export class VirtualScrollComponent extends LazyDataController<any> implements OnInit {
  @ViewChild('scrollbar', { static: true }) private scrollbar: ElementRef<HTMLElement>;
  @Input() itemHeight = 50;
  @Input() stickyHeight = 30;
  @Input() clickCollapse: EventEmitter<any>;
  @Input() shouldShowSrollTop = true;
  @Input() heightShouldShowBtnScrollTop = 300;
  @Output() itemClick = new EventEmitter<any>();
  @Output() itemDbClick = new EventEmitter<any>();
  onFetchDataFinishedSub = new Subject<any>();
  @Output('onGetData') _onGetData = new EventEmitter<IGetDataEvent>();
  @ContentChild(TemplateRef, { static: false }) _itemTemplate: TemplateRef<any>;
  currentScroll = 0;
  diffTop = 0;
  currentStickyItem = new StickyItem();
  widthOfTicky: number;
  isScrolllUp: boolean;
  isCollapsed: boolean;
  wScrollBar: number;
  private _indexNextSticky = -1;
  private _indexPrevSticky = -1;
  private offsetTopNextSticky = -1;
  private offsetTopCurrSticky = -1;
  private offsetTopPrevSticky = -1;
  private _indexCurrentSticky = -1;
  private get indexCurrentSticky() { return this._indexCurrentSticky; }
  private set indexCurrentSticky(value: number) {
    if (this._indexCurrentSticky !== value) {
      this._indexCurrentSticky = value;
      this.offsetTopCurrSticky = this.findOffsetTopCurSticky();
      this.findCurrentStickyByIndex();
    }

  }
  private get indexNextSticky() { return this._indexNextSticky; }
  private set indexNextSticky(value: number) {
    if (this._indexNextSticky !== value) {
      this._indexNextSticky = value;
      this.offsetTopNextSticky = this.findOffsetTopNextSticky();
    }
  }

  private get indexPrevSticky() { return this._indexPrevSticky; }
  private set indexPrevSticky(value: number) {
    if (this._indexPrevSticky !== value) {
      this._indexPrevSticky = value;
      this.offsetTopPrevSticky = this.findOffsetTopPrevSticky();
    }
  }

  constructor(protected injector: Injector, protected _changeDetectorRef: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    console.log('sub---', this.clickCollapse);
    if (this.clickCollapse) {
      this.clickCollapse.subscribe(v => {
        this.collapse(v.Item, v.IsExpaned);
      });
    }

  }

  onUpdate(viewPortItems: any[]) {
    this.wScrollBar = this.scrollbar.nativeElement.offsetWidth - this.scrollbar.nativeElement.clientWidth;
    this.updateViewPortChanged(viewPortItems);
    // this.safeApply();
  }

  onChange(event: IPageInfo) {
    this.onRequestItemsLoad(event);
    // this.safeApply();
  }

  onScroll(event) {
    this.isScrolllUp = this.scrollbar.nativeElement.scrollTop < this.currentScroll;
    this.currentScroll = this.scrollbar.nativeElement.scrollTop;
    this.checkStickItem( this.isScrolllUp);
    if (this.isScrolllUp) {
      if (this.indexCurrentSticky > -1) {
        if ((this.scrollbar.nativeElement.scrollTop < this.offsetTopNextSticky)
          && (this.offsetTopNextSticky < this.scrollbar.nativeElement.scrollTop + this.stickyHeight)) {
          this.diffTop = (this.offsetTopNextSticky - this.scrollbar.nativeElement.scrollTop) - this.stickyHeight;
        } else {
          this.diffTop = 0;
        }
      }
    } else {
      if ((this.scrollbar.nativeElement.scrollTop < this.offsetTopNextSticky)
        && (this.offsetTopNextSticky < this.scrollbar.nativeElement.scrollTop + this.stickyHeight)) {
        this.diffTop = (this.offsetTopNextSticky - this.scrollbar.nativeElement.scrollTop) - this.stickyHeight;
      } else {
        this.diffTop = 0;
      }
    }
  }

  scrollTop() {
    this._virtualScroll.scrollToPosition(0);
  }

  checkStickItem(up: boolean) {
    if (this.viewPortItems.length > 0) {
      if (this.indexCurrentSticky > -1) {

        if (!this.currentStickyItem) {
          this.findCurrentStickyByIndex();
          return;
        }
        if (up) {
          if (this.indexPrevSticky < 0) {
            this.indexPrevSticky = this.getIndexPrevSticky();
          }
        } else {
          if (this.indexNextSticky < 0) {
            this.indexNextSticky = this.getIndexNextSticky();
          }
        }
        // in zone
        // line this.offsetTopNextSticky > 0 ? this.offsetTopNextSticky : this.scrollbar.nativeElement.scrollTop + 1
        // Purpose: when can not find next sticky, auto set current sticky still in zone
        if ((this.offsetTopCurrSticky <= this.scrollbar.nativeElement.scrollTop)
          && (this.scrollbar.nativeElement.scrollTop
            <= (this.offsetTopNextSticky > 0 ? this.offsetTopNextSticky : this.scrollbar.nativeElement.scrollTop + 1))) {
          // do nothing. Sticky is staying in zone
        } else {
          if (up) {
            this.indexNextSticky = JSON.parse(JSON.stringify(this.indexCurrentSticky));
            this.indexCurrentSticky = JSON.parse(JSON.stringify(this.indexPrevSticky));
            this.indexPrevSticky = this.getIndexPrevSticky();
          } else {
            this.indexPrevSticky = JSON.parse(JSON.stringify(this.indexCurrentSticky));
            this.indexCurrentSticky = JSON.parse(JSON.stringify(this.indexNextSticky));
            this.indexNextSticky = this.getIndexNextSticky();
          }
        }
      } else {
        this.indexCurrentSticky = this.getIndexCurrentSticky();
        this.indexNextSticky = this.getIndexNextSticky();
      }
    } else {
      this.indexCurrentSticky = -1;
      this.indexNextSticky = -1;
    }
  }

  refresh() {
    this.refreshList();
  }

  private getIndexCurrentSticky(): number {
    // find sticky in current viewport
    for (let item of this.items) {
      let sIndex = 0;
      if (item.Level === 0) {
        sIndex = +item.UniqueKey;
        if (this.indexCurrentSticky === -1 || sIndex !== this.indexCurrentSticky) {
          // distance need to sroll to sticky item
          let offsetTopCurrSticky = this.items.slice(0, sIndex)
            .reduce((prev, curr) =>
              (prev + (curr.Level === 0 ? this.stickyHeight : this.itemHeight)), 0);
          if (this.scrollbar.nativeElement.scrollTop >= offsetTopCurrSticky) {
            return sIndex;
          }
        }
      }
    }
    return -1;
  }

  private findOffsetTopCurSticky(): number {
    if (this.indexCurrentSticky > -1) {
      // distance need to sroll to sticky item
      return this.items.slice(0, this.indexCurrentSticky)
        .reduce((prev, curr) =>
          (prev + (curr.Level === 0 ? this.stickyHeight : this.itemHeight)), 0);
    }
    return -1;
  }

  private getIndexNextSticky(): number {
    if (this.indexCurrentSticky > -1) {
      for (let item of this.items.slice(this.indexCurrentSticky + 1, -1)) {
        if (item.Level === 0) {
          return +item.UniqueKey;
        }
      }
    }
    return -1;
  }

  private findOffsetTopNextSticky(): number {
    if (this.indexNextSticky && this.indexNextSticky >= 0) {
      // distance need to sroll to sticky item
      return this.items.slice(0, this.indexNextSticky)
        .reduce((prev, curr) =>
          (prev + (curr.Level === 0 ? this.stickyHeight : this.itemHeight)), 0);
    }
    return -1;
  }

  private getIndexPrevSticky(): number {
    if ((!this.indexPrevSticky || this.indexPrevSticky < 0) && this.indexCurrentSticky > -1) {
      let prevArray = this.items.slice(0, this.indexCurrentSticky);
      const indexPrev = prevArray.reverse().findIndex(item => item.Level === 0);
      return indexPrev > -1 ? prevArray.length - indexPrev - 1 : -1;
    }
    return -1;
  }

  private findOffsetTopPrevSticky(): number {
    if (this.indexPrevSticky > -1) {
      return this.items.slice(0, this.indexPrevSticky)
        .reduce((prev, curr) =>
          (prev + (curr.Level === 0 ? this.stickyHeight : this.itemHeight)), 0);
    }
    return -1;
  }

  private findCurrentStickyByIndex() {
    this.currentStickyItem = new StickyItem({
      data: this.items[this.indexCurrentSticky],
      index: this.indexCurrentSticky,
      offsetTop: this.offsetTopCurrSticky,
      isSticked: this.indexCurrentSticky > -1 ? true : false
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
            // this.safeApply();
          }, 100);
        }
      };

      this._onGetData.emit(data);
    });

    return obResult;
  }

  trackByFunction(index: number, item: any) {
    return item.Id || index;
  }

  compareItems(item1: any, item2: any) {
    return item1.Id === item2.Id;
  }

  onItemClick(item: any, index?) {
    // we fire only when the item finish to load
    if (item.Id.length > 0) {
      // this.zone.runTask(() => { // Run InZone when click on item
      this.itemClick.emit(item);
      // });
    }
  }

  collapse(item: any, IsExpaned) {
    let destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);
    // this.indexCurrentSticky = -1;
    this.indexNextSticky = -1;
    this.indexPrevSticky = -1;
    this.computeList();
    this.onFetchDataFinishedSub
      .pipe(takeUntil(destroyed$))
      .subscribe(data => {
        if (item.Name === (this.currentStickyItem.data && this.currentStickyItem.data.Name)
          && this.currentStickyItem.offsetTop < this.currentScroll) {
          this.indexCurrentSticky = this.getIndexNextSticky();
          this._virtualScroll.scrollToIndex(this.indexCurrentSticky);
        }
        this._virtualScroll.refresh();
        destroyed$.next();
        destroyed$.complete();
      });
  }

  onFetchDataFinished(items) {
    this.onFetchDataFinishedSub.next(items);
  }

  onItemDbClick(item: any) {
    // we fire only when the item finish to load
    if (item.Id.length > 0) {
      // this.zone.runTask(() => { // Run InZone when dbclick on item
      this.itemDbClick.emit(item);
      // });
    }
  }

  protected computeList(allowCheckingSelectedItem = false) {
    // clean data
    this.clean();

    // before starting count data
    this.onCountDataStart();

    const subscription = this._loadData(0, this.NUMBER_ITEMS_PER_PAGE).subscribe(data => {
      // remove request in pending collection
      this.removePendingRequest(subscription);

      let countItems = 0;
      let indexToSelect = -1;
      this._indexToSelect = undefined;

      if (this._coreHelperService.UtilityService.isInteger(data)) {
        countItems = data;
      } else {
        countItems = data.Count;
        this._dataFirstPage = data.ListItems;
        this._indexToSelect = indexToSelect;
      }

      const newItems = [];
      for (let i = 0; i < countItems; i++) {
        let item;
        if (this.items[i]) {
          item = this.items[i];
        } else {
          item = { UniqueKey: i.toString(), Id: '', Name: '' };
        }
        newItems.push(item);
      }

      this._dicPages = [];
      this.items = newItems;
      this.onCountDataFinished(countItems, indexToSelect);

      if (countItems > 0) {
        if (indexToSelect >= 0) {
          // ensure virtual container initialize OK to scroll correctly
          TimerObservable.create(200).subscribe(() => {
            let it = this.items[indexToSelect];
            // console.log('scroll to:', it);

            this._virtualScroll.scrollInto(this.items[indexToSelect]);

            // console.log('Count result 2: countItems: ' + countItems + ' - indexToSelect: ' + indexToSelect
            // + ' - lastStart: ' + this._lastStart + ' - lastEnd: ' + this._lastEnd + ' - lastNumberOfItemsRequested: '
            // + this._lastNumberOfItemsRequested);

            if (indexToSelect < this._lastNumberOfItemsRequested) {
              // when the selected item is in first page, some the scroll doesn't work
              // we should call request the first page to make the list loaded
              this.requestItems(0, this._lastNumberOfItemsRequested, allowCheckingSelectedItem);
            } else {
              // special case: tab browser is not visible
              if (this._lastStart === 0 && this._lastEnd < 0 && this._lastNumberOfItemsRequested === 0) {
                this.tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem, indexToSelect);
              }
            }
          });
        } else {
          if (this._lastStart === 0 && this._lastEnd < 0 && this._lastNumberOfItemsRequested === 0) {
            // special case: tab browser is not visible
            this.tryToLoadDataWhileBrowserTabInActive(allowCheckingSelectedItem);
          } else {
            // the list load data in the first time
            this.requestItems(0, this._lastNumberOfItemsRequested, allowCheckingSelectedItem);
          }
        }
      } else {
        if (this._selectedItem) {
          this.setSelectedItem(undefined);
        }

        if (this.isSelectAll) {
          this.isSelectAll = false;
        }
      }

      this.checkedCount = this.isSelectAll ? this.itemCount : 0;
    });

    // keep request in pending collection
    this._pendingRequests.push(subscription);
  }

  protected clean() {
    this._pendingRequests.forEach(obs => {
      obs.unsubscribe();
    });

    // reset variables
    this._lastStart = 0;
    this._lastEnd = 0;
    this._lastNumberOfItemsRequested = 0;

    // clear list items
    this._dicPages = [];
    // this.items = [];
    this._pendingRequests = [];

    this.isSelectAll = false;

    this.isExclude = false;
    this.excludeItems.splice(0, this.excludeItems.length);
  }


  protected safeApply() {
    try {
      this._changeDetectorRef.detectChanges();
    } catch (e) { }
  }
}
