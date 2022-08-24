import { Component, Input, TemplateRef, Output, EventEmitter, OnChanges } from '@angular/core';
import { DatatableColumn, DatatableColumnsByPin, DatatableColumnPin } from '../../../datatable/shared/datatable.model';

@Component({
  selector: 'ntk-folder-tree-header',
  templateUrl: './folder-tree-header.component.html',
  styleUrls: ['./folder-tree-header.component.scss']
})
export class FolderTreeHeaderComponent implements OnChanges {

  @Input() columns: DatatableColumn[];
  @Input() template: TemplateRef<any>;
  @Input() scrollLeft: number;

  @Output() columnResized = new EventEmitter<DatatableColumn>();

  @Output() selectAll = new EventEmitter<boolean>();

  isSelectedAll: boolean;

  columnsByPin: DatatableColumnsByPin = new DatatableColumnsByPin();
  constructor() { }

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    if (changes['columns']) {
      if (this.columns && this.columns.length > 0) {
        this.columnsByPin = new DatatableColumnsByPin();
        this.columns.forEach((column) => {
          if (column.show) {
            this.columnResized.emit(column);
            switch (column.pin) {
              case DatatableColumnPin.left:
                this.columnsByPin.left.push(column);
                break;
              case DatatableColumnPin.right:
                this.columnsByPin.right.push(column);
                break;
              default:
                this.columnsByPin.center.push(column);
            }
          }
        });
      }
    }
  }

  onColumnResized($event: DatatableColumn) {
    this.columnResized.emit($event);
  }

  onSelectAll() {
    this.selectAll.emit(this.isSelectedAll);
  }
}
