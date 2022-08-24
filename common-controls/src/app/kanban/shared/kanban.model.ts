import {TemplateRef} from '@angular/core';
import {Subject} from 'rxjs';
import {KanbanDragRef} from './drag-ref';

export interface KanbanGroup {
    Name: string;
    Title: string;
    Columns: KanbanColumn[];

    [propName: string]: any;
}

export interface KanbanColumn {
    Name: string;
    Title: string;

    Items?: KanbanItem[];
    CanDrop?: boolean;
    CanSort?: boolean;
    ClassName?: string;
    ItemTemplate?: TemplateRef<any>;


    [propName: string]: any;
}

export interface KanbanItem {
    ClassName?: string;
    CanDrag?: boolean;
    IsSelected?: boolean;

    [propName: string]: any;
}


export interface KanbanDragStart {
    subscriber?: Subject<KanbanColumn[]>;
    /** Item that is being dropped. */
    item: KanbanItem;
    column: KanbanColumn;
    dragRef: KanbanDragRef;
}

