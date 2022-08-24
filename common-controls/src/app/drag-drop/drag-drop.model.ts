import {Subject, Subscriber} from 'rxjs';
import {NtkDropListRef} from './drop-list-ref';
import {CdkDrag} from '@angular/cdk/drag-drop';
import {InjectionToken} from '@angular/core';


export interface NtkDragStart {
    subscriber?: Subject<any[]>;
    /** Item that is being dropped. */
    item: NtkDragDropItem;
    column?: any;
}

// tslint:disable-next-line:no-empty-interface
export interface NtkDragDropItem {

}

export  const NTK_DRAG_PARENT = new InjectionToken('NTK_DRAG_PARENT');


export interface NtkDragDropContainer {
    id: string;
    data: any;
    dropListRef: NtkDropListRef;
}

export interface NtkDragDropParams {
    subscriber?: Subscriber<any>;

    /** Index of the item when it was picked up. */
    previousIndex: number;
    /** Current index of the item. */
    currentIndex: number;
    /** Item that is being dropped. */
    item: CdkDrag;

    /** Whether the user's pointer was over the container when the item was dropped. */
    isPointerOverContainer: boolean;
    /** Distance in pixels that the user has dragged since the drag sequence started. */
    position: {
        left: number;
        top: number;
    };

    /** Container in which the item was dropped. */
    container: NtkDragDropContainer;
    /** Container from which the item was picked up. Can be the same as the `container`. */
    previousContainer: NtkDragDropContainer;
}
