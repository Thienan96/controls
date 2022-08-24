import {Component, ContentChild, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {KanbanGroup} from '../../kanban/shared/kanban.model';
import {KanbanDragDrop} from '../../kanban/shared/drag-drop';
import {moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {KanbanComponent} from '../../kanban/kanban.component';

@Component({
    selector: 'ntk-kanban-demo',
    templateUrl: './kanban.demo.component.html',
    styleUrls: ['./kanban.demo.component.scss']
})
export class KanbanDemoComponent {
    groups: KanbanGroup[] = [];
    @ViewChild(KanbanComponent, {static: false}) kanbanComponent: KanbanComponent;

    constructor(private httpClient: HttpClient) {
        httpClient.get('src/assets/data/kanban.json').subscribe((data) => {
            this.groups = <any> data;
        });
    }

    onMove(event: KanbanDragDrop) {
        if (event.previousContainer.id === event.container.id) {
            moveItemInArray(event.container.items, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(event.previousContainer.items, event.container.items, event.previousIndex, event.currentIndex);
        }
        event.subscriber.next();
        event.subscriber.complete();
    }

    gotoItem() {
        this.kanbanComponent.gotoItem('e881fe3d-013c-49c3-b7a4-683d603c9d4c');
    }
}
