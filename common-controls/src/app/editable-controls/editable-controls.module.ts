import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TableEditableCellInputComponent} from './table-editable-cell-input/table-editable-cell-input.component';
import {TableEditableCellDateComponent} from './table-editable-cell-date/table-editable-cell-date.component';
import {MatDatepickerModule, MatFormFieldModule, MatInputModule} from '@angular/material';
import {TableEditableCellDropdownComponent} from './table-editable-cell-dropdown/table-editable-cell-dropdown.component';
import {TableEditableCellCheckboxComponent} from './table-editable-cell-checkbox/table-editable-cell-checkbox.component';
import {DropdownModule} from '../dropdown/dropdown.module';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@NgModule({
    declarations: [
        TableEditableCellInputComponent,
        TableEditableCellDateComponent,
        TableEditableCellDropdownComponent,
        TableEditableCellCheckboxComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        DropdownModule,
        FormsModule
    ],
    exports: [
        TableEditableCellInputComponent,
        TableEditableCellDateComponent,
        TableEditableCellDropdownComponent,
        TableEditableCellCheckboxComponent
    ]
})
export class EditableControlsModule {
}
