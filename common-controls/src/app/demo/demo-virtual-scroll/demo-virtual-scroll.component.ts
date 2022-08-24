import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { IGetDataEvent } from '../../virtual-list/virtual-list/virtual-list.component';
import { VirtualScrollComponent } from '../../virtual-scroll/virtual-scroll.component';
export class QueryTasks {
  LateExpanded: boolean;
  TodayExpanded: boolean;
  TomorrowExpanded: boolean;
  UpcomingExpanded: boolean;
  FutureExpanded: boolean;
  StartIndex: number;
  Count: number;
  SearchText: string;
}
@Component({
  selector: 'ntk-demo-virtual-scroll',
  templateUrl: './demo-virtual-scroll.component.html',
  styleUrls: ['./demo-virtual-scroll.component.scss']
})
export class DemoVirtualScrollComponent implements OnInit, AfterViewInit {
  @ViewChild('virtualList', { static: false }) virtualList: VirtualScrollComponent;
  onClickCollapse = new EventEmitter<any>();
  queryTasks = new QueryTasks();
  private data;
  constructor(private httpClient: HttpClient) {
    this.queryTasks.LateExpanded = true;
    this.queryTasks.TodayExpanded = true;
    this.queryTasks.TomorrowExpanded = true;
    this.queryTasks.UpcomingExpanded = true;
    this.queryTasks.FutureExpanded = true;
  }

  ngOnInit() {
    // this._allItems = this.
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.virtualList.refresh();
    }, 200);
  }

  onGetData(event: IGetDataEvent) {

    // console.log('------get data ',  event.startIndex, ' ----page size ', event.pageSize);
    
    this.httpClient.get('src/assets/data/assigments.json').subscribe((data) => {
      this.data = <any>data;
      if (!this.queryTasks.LateExpanded) {
        this.data.HierarchicalData.splice(1, this.data.HierarchicalData[0].TotalCount);
        this.data.TotalCount = this.data.HierarchicalData.length;
      }
      if (!this.queryTasks.TodayExpanded) {
        const iToday = this.data.HierarchicalData.findIndex(g => g.Name === 'Today')
        this.data.HierarchicalData.splice(iToday + 1, this.data.HierarchicalData[iToday].TotalCount);
        this.data.TotalCount = this.data.HierarchicalData.length;
      }
      if (!this.queryTasks.TomorrowExpanded) {
        const iTomorrow = this.data.HierarchicalData.findIndex(g => g.Name === 'Tomorrow')
        this.data.HierarchicalData.splice(iTomorrow + 1, this.data.HierarchicalData[iTomorrow].TotalCount);
        this.data.TotalCount = this.data.HierarchicalData.length;
      }
      if (!this.queryTasks.UpcomingExpanded) {
        const iUpcoming = this.data.HierarchicalData.findIndex(g => g.Name === 'Upcoming')
        this.data.HierarchicalData.splice(iUpcoming + 1, this.data.HierarchicalData[iUpcoming].TotalCount);
        this.data.TotalCount = this.data.HierarchicalData.length;
      }
      if (!this.queryTasks.FutureExpanded) {
        const iFuture = this.data.HierarchicalData.findIndex(g => g.Name === 'Future')
        this.data.HierarchicalData.splice(iFuture + 1, this.data.HierarchicalData[iFuture].TotalCount);
        this.data.TotalCount = this.data.HierarchicalData.length;
      }
      console.log('-----load data ', event.startIndex, '/', event.pageSize);

      let res = this.data.HierarchicalData.slice(event.startIndex, event.startIndex + event.pageSize);
      console.log('---- result = ', res);
      let result = {
        Count: event.startIndex === 0 ? this.data.TotalCount : null,
        ListItems: res,
        Index: 0
      };

      if (event.startIndex === 0) {
        result.Index = result.Count - 20;
      }

      setTimeout(() => {
        event.callBack(result);
      }, 200);
    });

  }

  onItemClick(event) {
    console.log(event);
  }


  collapse(item, event) {
    event.preventDefault();
    event.stopPropagation();
    let isExpaned: boolean;
    switch (item.Name) {
      case 'Late':
        this.queryTasks.LateExpanded = !this.queryTasks.LateExpanded;
        isExpaned = this.queryTasks.LateExpanded;
        break;
      case 'Today':
        this.queryTasks.TodayExpanded = !this.queryTasks.TodayExpanded;
        isExpaned = this.queryTasks.TodayExpanded;
        break;
      case 'Tomorrow':
        this.queryTasks.TomorrowExpanded = !this.queryTasks.TomorrowExpanded;
        isExpaned = this.queryTasks.TomorrowExpanded;
        break;
      case 'Upcoming':
        this.queryTasks.UpcomingExpanded = !this.queryTasks.UpcomingExpanded;
        isExpaned = this.queryTasks.UpcomingExpanded;
        break;
      case 'Future':
        this.queryTasks.FutureExpanded = !this.queryTasks.FutureExpanded;
        isExpaned = this.queryTasks.FutureExpanded;
        break;
    }
    this.onClickCollapse.emit({Item: item, IsExpaned: isExpaned});
  }
}
