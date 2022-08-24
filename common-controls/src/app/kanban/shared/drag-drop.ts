import {Subscriber} from 'rxjs';
import {CdkDrag} from '@angular/cdk/drag-drop';
import {KanbanItem} from './kanban.model';

export interface KanbanDragDropContainer {
    id: string;
    items: KanbanItem[];
}

export interface KanbanDragDrop {
    subscriber?: Subscriber<any>;

    /** Index of the item when it was picked up. */
    previousIndex: number;
    /** Current index of the item. */
    currentIndex: number;
    /** Item that is being dropped. */
    item: CdkDrag;
    /** Container in which the item was dropped. */
    container: KanbanDragDropContainer;
    /** Container from which the item was picked up. Can be the same as the `container`. */
    previousContainer: KanbanDragDropContainer;
    /** Whether the user's pointer was over the container when the item was dropped. */
    isPointerOverContainer: boolean;
    /** Distance in pixels that the user has dragged since the drag sequence started. */
    distance: {
        x: number;
        y: number;
    };
}
