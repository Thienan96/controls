import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, NgZone, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { KanbanItem } from '../shared/kanban.model';
import { KanbanService } from '../shared/kanban.service';

@Component({
    selector: 'ntk-kanban-item',
    templateUrl: './kanban-item.component.html',
    styleUrls: ['./kanban-item.component.scss'],
    host: {
        '[class]': 'item.ClassName',
        '[class.selected]': 'item.IsSelected'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanItemComponent implements OnInit, OnDestroy {
    @Input() item: KanbanItem;
    @Input() template: TemplateRef<any>;
    @Input() itemClick: any;
    private sub = new Subscription();

    @HostListener('click') onItemClick() {
        this.itemClick(this.item);
        this._kanbanService.setSelectItem(this.item);
    }
    constructor(private _kanbanService: KanbanService, private cd: ChangeDetectorRef, private _zone: NgZone) { }

    ngOnInit(): void {
        this._kanbanService.selectItem$.subscribe(r => {
            if (r && r.Id === this.item.Id) {
                this._zone.run(() => {
                    this.itemClick(this.item);
                    this.cd.markForCheck();
                });
            }
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

}
