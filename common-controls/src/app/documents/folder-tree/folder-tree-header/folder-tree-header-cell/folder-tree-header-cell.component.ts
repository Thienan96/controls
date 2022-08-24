import { Component, OnInit, Input, TemplateRef, ViewChild, Output, EventEmitter, ChangeDetectorRef, ElementRef, SimpleChanges } from '@angular/core';
import { DragRef, CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { DatatableColumn } from '../../../../datatable/shared/datatable.model';

@Component({
  selector: 'ntk-folder-tree-header-cell',
  templateUrl: './folder-tree-header-cell.component.html',
  styleUrls: ['./folder-tree-header-cell.component.scss']
})
export class FolderTreeHeaderCellComponent implements OnInit {

  @ViewChild('dragHandler', { static: true }) _dragHandler: DragRef<any>;

  @Input() columnDef: DatatableColumn;

  @Input() template: any;

  @Input() lastColumn: boolean;

  @Input() isLastCol: boolean;

  @Output() resized = new EventEmitter<any>();

  width = 100;

  minWidth = 100;

  iconSort;

  directionSort = 1; // default sort asc; -1 will be desc

  defaultDragPoint = { x: 0, y: 0 };

  constructor(private cd: ChangeDetectorRef, private elRef: ElementRef) {
  }

  ngOnInit() {
  }

  ngDoCheck() {
    this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columnDef']) {
      this.width = this.columnDef.width;
      this.minWidth = this.columnDef.minWidth || 130;
    }
  }

  onResizing($event: CdkDragMove<any>) {
    this.width = this.columnDef.width + $event.distance.x;
    if (this.width < this.minWidth) {
      this.width = this.minWidth;
    }
  }

  onResizeFinish($event: CdkDragRelease) {
    this.columnDef.width = this.width;
    this.defaultDragPoint = { x: 0, y: 0 };

    this.resized.emit(this.columnDef);
  }

  onConstrainPosition(point: { x: number, y: number }, dragRef: DragRef<any>) {
    let parentLeft = this.elRef.nativeElement.getBoundingClientRect().left;

    if (point.x < parentLeft + this.minWidth) {
      return { x: parentLeft + this.minWidth, y: point.y };
    }
    return point;
  }
}
