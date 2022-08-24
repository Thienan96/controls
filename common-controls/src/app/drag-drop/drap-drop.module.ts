import {NgModule} from '@angular/core';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {NtkDrag} from './drag';
import {NtkDropList} from './drop-list';
import {NtkDragHandle} from './drag-handle';


@NgModule({
    declarations: [
        NtkDrag,
        NtkDropList,
        NtkDragHandle
    ],
    imports: [
        DragDropModule
    ],
    exports: [
        NtkDrag,
        NtkDropList,
        NtkDragHandle
    ]
})
export class NtkDrapDropModule {
}
