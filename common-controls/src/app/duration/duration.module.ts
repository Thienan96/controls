import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DurationComponent} from './duration.component';
import {MatButtonModule, MatDividerModule, MatIconModule} from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
    declarations: [
        DurationComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        MatDividerModule,
        MatButtonModule,
        DragDropModule
    ],
    exports: [
        DurationComponent
    ],
    entryComponents: []
})
export class DurationModule {
}
