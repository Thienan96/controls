import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KanbanComponent} from './kanban.component';
import {KanbanHeaderComponent} from './kanban-header/kanban-header.component';
import {KanbanColumnComponent} from './kanban-column/kanban-column.component';
import {KanbanItemComponent} from './kanban-item/kanban-item.component';
import {KanbanGroupComponent} from './kanban-group/kanban-group.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {KanbanItemsComponent} from './kanban-items/kanban-items.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {KanbanDropList} from './shared/kanban-drop-list';
import {KanbanDrag} from './shared/drag';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {ScrollingModule} from '@angular/cdk/scrolling';


@NgModule({
    declarations: [
        KanbanComponent,
        KanbanHeaderComponent,
        KanbanColumnComponent,
        KanbanItemComponent,
        KanbanGroupComponent,
        KanbanItemsComponent,
        KanbanDropList,
        KanbanDrag
    ],
    exports: [
        KanbanComponent,
        KanbanHeaderComponent,
        KanbanColumnComponent,
        KanbanItemComponent,
        KanbanGroupComponent,
        KanbanDropList,
        KanbanDrag
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        DragDropModule,
        ScrollingModule,
        CommonControlsSharedModule
    ]
})
export class KanbanModule {
}
