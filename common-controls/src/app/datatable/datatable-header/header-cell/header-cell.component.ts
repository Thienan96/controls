import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {DatatableColumn} from '../../shared/datatable.model';
import {CdkDragMove, DragRef} from '@angular/cdk/drag-drop';


@Component({
    selector: 'ntk-datatable-header-cell',
    templateUrl: './header-cell.component.html',
    styleUrls: ['./header-cell.component.css'],
    host: {
        '[class.resizeable]': 'columnDef.resizeable',
        '[class.un-resizeable]': '!columnDef.resizeable'
    }
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderCellComponent implements OnInit, OnChanges {

    @Input() template: TemplateRef<any>;

    @Input() columnDef: DatatableColumn;

    @ViewChild('dragHandler', {static: true}) _dragHandler: DragRef;

    @Output() resized = new EventEmitter<DatatableColumn>();

    @Output() sorted = new EventEmitter();


    width = 100;
    // initWidth = 100;

    minWidth = 100;
    maxWidth;

    iconSort;

    directionSort = 1; // default sort asc; -1 will be desc

    defaultDragPoint = {x: 0, y: 0};

    constructor(private cd: ChangeDetectorRef, private elRef: ElementRef) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columnDef']) {
            this.width = this.columnDef.width;
            this.minWidth = this.columnDef.minWidth || 50;
            this.maxWidth = this.columnDef.maxWidth;
        }
    }

    onResizing($event: CdkDragMove) {
        this.width = this.columnDef.width + $event.distance.x;
    }

    onResizeFinish() {
        setTimeout(() => {
            this.columnDef.width = this.width < 50 ? 50 : this.width;
            this.defaultDragPoint = {x: 0, y: 0};
            this.cd.detectChanges();

            this.resized.emit(this.columnDef);
        }, 50);
    }

    onConstrainPosition(point: { x: number, y: number }) {
        let parentLeft = this.elRef.nativeElement.getBoundingClientRect().left;

        if (point.x < parentLeft + this.minWidth) {
            return {x: parentLeft + this.minWidth, y: point.y};
        }
        if (this.maxWidth && point.x > parentLeft + this.maxWidth) {
            return {x: parentLeft + this.maxWidth, y: point.y};
        }

        return point;
    }

    onSortClick() {
        if (this.columnDef.sortable) {
            this.sorted.emit();
        }
    }
}
