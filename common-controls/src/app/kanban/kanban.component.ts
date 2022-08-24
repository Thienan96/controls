import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    NgZone,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {KanbanColumn, KanbanDragStart, KanbanGroup, KanbanItem} from './shared/kanban.model';
import {KanbanColumnComponent} from './kanban-column/kanban-column.component';
import {TemplateDirective} from '../shared/directives/template.directive';
import {KanbanService} from './shared/kanban.service';
import {KanbanDrag} from './shared/drag';
import {ScrollDispatcher} from '@angular/cdk/overlay';

@Component({
    selector: 'ntk-kanban',
    templateUrl: './kanban.component.html',
    styleUrls: ['./kanban.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'ntk-kanban'
    }
})
export class KanbanComponent implements AfterViewInit, OnChanges {
    @Input() groups: KanbanGroup[] = [];
    @Input() columns: KanbanColumn[] = [];
    @Input() moved;
    @Input() canDragToOtherGroup = false;
    @Input() showGroupTitle = true;
    @Input() dragStart;
    @Output() eventDragStart = new EventEmitter(); // fire event when start drag item
    @ContentChildren(KanbanColumnComponent) queryListColumns: QueryList<KanbanColumnComponent>;
    @ContentChildren(TemplateDirective) templateDirectives: QueryList<TemplateDirective>;
    @ViewChild('scrollContainer', {static: true}) scrollContainer: ElementRef;
    paddingRight = 0;
    selectedItems: KanbanItem[] = [];
    currentDragItem: KanbanDrag;
    availableDropColumns: KanbanColumn[] = [];
    currentGroup: KanbanGroup;

    constructor(private kanbanService: KanbanService,
                private elementRef: ElementRef,
                private scrollDispatcher: ScrollDispatcher,
                private cd: ChangeDetectorRef,
                private zone: NgZone) {
        this.scrollDispatcher.scrolled(300).subscribe(this.onScrolled.bind(this));
    }

    get scroller() {
        return $(this.scrollContainer.nativeElement);
    }

    @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.key === 'Escape' || event.key === 'Esc') && this.currentDragItem) {
            let ev;
            if (typeof (Event) === 'function') {
                ev = new Event('mouseup');
            } else {
                ev = document.createEvent('Event');
                ev.initEvent('mouseup', true, true);
            }
            document.dispatchEvent(ev);
        }
    }

    ngAfterViewInit() {
        this.buildColumns();
        this.buildTemplatesForColumns();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.groups) {
            setTimeout(() => {
                this.zone.run(() => {
                    this.cd.detectChanges();
                    this.currentGroup = this.getCurrentGroup();
                });
            }, 100);
            // computing after get full data
            this.onResize();
        }
    }

    onItemClick(item: KanbanItem) {
        this.selectItem(item);
    }

    onResize() {
        setTimeout(() => {
            this.paddingRight = this.kanbanService.getScrollbarWidth(this.elementRef.nativeElement);
        }, 100);
    }

    onDragStart(item: KanbanDragStart) {
        this.eventDragStart.emit();
        this.currentDragItem = item.dragRef.data;
        item.subscriber.subscribe((columns) => {
            if (columns) {
                this.availableDropColumns = columns;
            }
        });
        if (this.dragStart) {
            this.dragStart(item);
        } else {
            this.checkDragStart(item);
        }
    }

    onDragEnd() {
        this.currentDragItem = null;
        this.availableDropColumns = [];
    }

    trackByGroup(index, group: KanbanGroup) {
        let uni = group.Id + group.Name;
        return uni ? uni : index;
    }

    gotoItem(itemId: string, animation: boolean = true, scrollDuration: number = 600) {
        let itemEl = $(this.elementRef.nativeElement).find('[itemId="' + itemId + '"]');
        if (itemEl.length > 0) {
            let top = itemEl.offset().top + this.scroller[0].scrollTop - this.scroller.offset().top;
            if (animation) {
                this.scroller.animate({
                    scrollTop: top
                }, scrollDuration);
            } else {
                this.scroller.scrollTop(top);
            }
        }
    }

    private checkDragStart(event: KanbanDragStart) {
        let columns = this.getDragStartColumns(event.item, event.column);
        if (event.item.CanDrag) {
            event.subscriber.next(columns);
        } else {
            event.subscriber.next(null);
        }
        event.subscriber.complete();
    }

    private getDragStartColumns(item: KanbanItem, column: KanbanColumn): KanbanColumn[] {
        let columns: KanbanColumn[] = [];
        this.groups.forEach((group) => {
            group.Columns.forEach((c) => {
                if (this.canDragToOtherGroup) {
                    columns = columns.concat(group.Columns);
                } else {
                    let matched = c.Items.find((i) => {
                        return i.Id === item.Id;
                    });
                    if (matched) {
                        columns = columns.concat(group.Columns);
                    }
                }
            });
        });


        columns = columns.filter((columnItem) => {
            if (!columnItem.CanDrop && columnItem !== column) {
                return false;
            }
            return !(columnItem === column && !column.CanSort);
        });

        return columns;
    }

    private selectItem(item: KanbanItem) {
        this.selectedItems.forEach((selectedItem) => {
            selectedItem.IsSelected = false;
        });
        this.selectedItems.splice(0, this.selectedItems.length);
        if (item) {
            item.IsSelected = true;
            this.selectedItems.push(item);
        }
    }

    private buildColumns() {
        // Reset columns
        this.columns.splice(0, this.columns.length);

        // Build columns
        this.queryListColumns.forEach((columnComponent) => {
            if (this.columns.findIndex((column) => {
                return column.Name === columnComponent.name;
            }) === -1) {
                this.columns.push({
                    Name: columnComponent.name,
                    Title: columnComponent.title,
                    ClassName: columnComponent.class,
                });
            }
        });
    }

    /**
     * Build templates for columns
     * @private
     */
    private buildTemplatesForColumns() {

        // Default Item Template
        let defaultItemTemplate = this.templateDirectives.find((template) => {
            return template.name === 'item';
        });
        if (defaultItemTemplate) {
            this.columns.forEach((column) => {
                column.ItemTemplate = defaultItemTemplate.tpl;
            });
        }


        // Item for each column
        this.queryListColumns.forEach((columnComponent) => {
            let column = this.columns.find((c) => {
                return c.Name === columnComponent.name;
            });
            if (column && columnComponent.itemTemplate) {
                column.ItemTemplate = columnComponent.itemTemplate;
            }
        });


        // Template
        this.columns.forEach((column) => {
            this.templateDirectives.forEach((item) => {
                if (item.name === column.Name) {
                    column.ItemTemplate = item.tpl;
                }
            });
        });
    }

    private onScrolled() {
        let oldGroup = this.currentGroup;
        this.currentGroup = this.getCurrentGroup();
        if (oldGroup !== this.currentGroup) {
            try {
                this.cd.detectChanges();
            } catch (e) {
            }
        }
    }

    private getCurrentGroup(): KanbanGroup {
        let scrollerTop = $(this.scrollContainer.nativeElement).offset().top;
        let resourcesEls = $(this.elementRef.nativeElement).find('ntk-kanban-group').get().reverse();
        let resourceEl = resourcesEls.find((el) => {
            return scrollerTop - $(el).offset().top + 2 >= 0;
        });
        return <KanbanGroup> $(resourceEl).data('group');
    }
}
