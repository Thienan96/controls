import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {CoreModule} from '../core/core.module';
import {TextTruncationModule} from '../text-truncation/text-truncation.module';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule
} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DropdownModule} from '../dropdown/dropdown.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TableEditableDragHandleDirective} from './shared/table-editable-drag-handle.directive';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormatDecimalPipe, IntergerPipe} from '../shared/pipes/number.pipe';
import {TableEditableFixHeaderDirective} from './shared/table-editable-fix-header.directive';
import {EditableControlsModule} from '../editable-controls/editable-controls.module';
import {TableEditableCellSelectedComponent} from './table-editable-cell-selected/table-editable-cell-selected.component';

@NgModule({
    declarations: [
        TableEditableDragHandleDirective,
        TableEditableFixHeaderDirective,
        TableEditableCellSelectedComponent
    ],
    imports: [
        CommonModule,
        MatFormFieldModule,
        NgxDatatableModule,
        CommonControlsSharedModule,
        CoreModule,
        TextTruncationModule,
        MatIconModule,
        MatTooltipModule,
        MatCheckboxModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        DropdownModule,
        MatDatepickerModule,
        MatInputModule,
        FlexLayoutModule,
        DragDropModule,
        EditableControlsModule
    ],
    exports: [
        TableEditableDragHandleDirective,
        TableEditableFixHeaderDirective,
        TableEditableCellSelectedComponent
    ],
    providers: [
        IntergerPipe,
        FormatDecimalPipe
    ]
})
export class TableEditableModule {
}
