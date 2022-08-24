
// https://stackoverflow.com/questions/48542825/datatable-horizontal-scroll-bar-when-no-data/52814449#52814449
import { Directive, ElementRef, Renderer2, OnInit, AfterViewChecked, Input, OnDestroy, isDevMode } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import moment from 'moment-es6';

@Directive({
  selector: 'ngx-datatable[emptyRow]'
})
export class NgxDataTableEmptyRow implements OnInit, AfterViewChecked, OnDestroy {

  private _scrollSub: Subscription;
  private _lastChecked: moment.Moment;
  constructor(private renderer: Renderer2,
    private hostElement: ElementRef,
    private table: DatatableComponent) {
  }

  ngOnInit() {
    if (this.table) {
      this._scrollSub = this.table.scroll.subscribe(x => {
        // console.log('table scroll:', x);
        if (this.table.count === 0 && x.srcElement) {
          this.table.headerComponent.offsetX = x.srcElement.scrollLeft;
        }
      });
    }
    // this.hostElement.nativeElement.getElementsByClassName('datatable-body')[0].addEventListener('scroll', event => {
    //   if (this.isEmpty) {
    //     this.hostElement.nativeElement.getElementsByClassName('datatable-header')[0].scrollLeft = event.srcElement.scrollLeft;
    //   }
    // });
  }

  ngOnDestroy(): void {
    this._scrollSub.unsubscribe();
  }

  ngAfterViewChecked() {
    if (this.table && this.table.count === 0) {
      // to avoid do the check too often
      if (!this._lastChecked || moment().diff(this._lastChecked, 's') >= 1) {
        let emptyRows = this.hostElement.nativeElement.getElementsByClassName('empty-row');
        if (emptyRows.length !== 0) {
          let hederGroup = this.table.headerComponent.calcStylesByGroup('center');

          let headerWidth = parseInt(hederGroup.width, 10);

          if (isNaN(headerWidth) || headerWidth <= 0) {
            // if (isDevMode()) {
            //   console.log('Grid is empty, no valied width of header try to calculate by css');
            // }

            let headerInners = this.hostElement.nativeElement.getElementsByClassName('datatable-header-inner');
            if (headerInners.length > 0) {
              // console.log('headerInners= ', headerInners);
              headerWidth = $(headerInners[0]).width();
            }
          }

          headerWidth = Math.ceil(headerWidth);

          // if (isDevMode()) {
          //   console.log('Grid is empty, need to resize empty row to=', headerWidth);
          // }

          let emptyRow = $(emptyRows[0]);
          //let padLeft = emptyRow.css('padding-left');

          //box-sizing: border-box;

          emptyRow.width(headerWidth - 40);
        }
        this._lastChecked = moment();
      }
    }
  }
}
