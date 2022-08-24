import { Component, OnInit, Injector, AfterViewInit, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GridBaseController } from '../../core/controllers/grid-base-controller';
import { Observable, throwError, of } from 'rxjs';
import { GridColumnDef } from '../../shared/models/ngxTable.model';
import { mapTo, delay } from 'rxjs/operators';


@Component({
  selector: 'ntk-test-datatable',
  templateUrl: './NgxDataTable.component.html',
  styleUrls: ['./NgxDataTable.component.css']
})
export class NgxDataTableComponent extends GridBaseController implements OnInit, AfterViewInit {
  _rows = [];

  count = 0;

  private _initCount = 0;

  ColumnMode = 'standard';

  @ViewChild('sampleGrid', { static: true }) _sampleGrid: DatatableComponent;

  constructor(private injector: Injector) {
    super(injector);
    //this.rowHeight = 50;
    this.rowMode = 'Compact';
    this.isAlternateColor = true;
  }

  ngOnInit() {
    super.ngOnInit();
    this.fetch(data => {
      this._rows = data;
      this.count = this._rows.length;
      this._initCount = this._rows.length;

      this.refresh();
    });
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `src/assets/data/company.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    //this.refresh();
    // setTimeout(() => {
    //   this.refresh();
    // }, 100);
  }

  loadData(startIndex: number, pageSize: number, columns: string[], sort?: string): Observable<any> {
    console.log('---dame table load data: startIndex = ', startIndex , 'pageSize= ', pageSize);
    // return new Observable(sub => {
    //   console.log('sub....');
    //   sub.next({ ListItems: this._rows.slice(startIndex, startIndex + pageSize), Count: this.count });
    //   sub.complete();
    // }).pipe(delay(500));

    //return of({ ListItems: this._rows.slice(startIndex, startIndex + pageSize), Count: this.count }).pipe(delay(10));

    // return new Observable();

    return of(null).pipe(
      mapTo({ ListItems: this._rows.slice(startIndex, startIndex + pageSize), Count: this.count }),
      delay(500)
      );
  }

  getAllColumnsDef(): GridColumnDef[] {
    return [
      { name: 'Name', property: 'name', isDefault: true, initialWidth: 150, maxWidth: 2000, translationKey: 'lbName', mandatory: true },
      { name: 'Gender', property: 'gender', isDefault: true, initialWidth: 100, maxWidth: 450, translationKey: 'Gender' },
      { name: 'Company', property: 'company', isDefault: true, initialWidth: 100, maxWidth: 500, translationKey: 'Company' },
      { name: 'Test 1', property: 'Test 1', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 2', property: 'Test 2', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 3', property: 'Test 3', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 4', property: 'Test 4', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 5', property: 'Test 5', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 6', property: 'Test 6', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 7', property: 'Test 7', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 8', property: 'Test 8', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 9', property: 'Test 9', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 10', property: 'Test 10', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 11', property: 'Test 11', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' },
      { name: 'Test 12', property: 'Test 12', isDefault: false, initialWidth: 100, maxWidth: 500, translationKey: 'Test 1' }
    ];
  }

  getGidComponent(): DatatableComponent {
    return this._sampleGrid;
  }

  onChangeRowMode() {
    // this.simulateRowModeChange();
  }

  onLoad10() {
    this.count = 10;
    this.refresh();
  }

  onLoad20() {
    this.count = 20;
    this.refresh();
  }

  onLoadAll() {
    this.count = this._initCount;
    this.refresh();
  }

  emptyRow() {
    this.count = 0;
    this.refresh();
  }
}
