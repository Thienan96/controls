import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { ColumnsSelectionDialog } from './columns-selection.dialog';
import { MatButtonModule, MatCheckboxModule, MatDialogModule, MatDividerModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
    declarations: [
        ColumnsSelectionDialog
    ],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        CommonControlsSharedModule,
        FormsModule,
        DragDropModule,
        MatCheckboxModule,
        MatDividerModule,
        FlexLayoutModule,
        MatDialogModule
    ],
    exports: [
        ColumnsSelectionDialog
    ],
    entryComponents: [
        ColumnsSelectionDialog
    ],
    providers: []
})
export class ColumnsSelectionModule {
}
