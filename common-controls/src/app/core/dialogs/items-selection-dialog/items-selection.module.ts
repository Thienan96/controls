import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { ItemsSelectionDialog } from './items-selection.dialog';
import { MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatListModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        ItemsSelectionDialog
    ],
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        CommonControlsSharedModule,
        FlexLayoutModule,
        MatDividerModule,
        MatListModule,
        MatDialogModule
    ],
    exports: [
        ItemsSelectionDialog
    ],
    entryComponents: [
        ItemsSelectionDialog
    ],
    providers: []
})
export class ItemsSelectionsModule {
}
