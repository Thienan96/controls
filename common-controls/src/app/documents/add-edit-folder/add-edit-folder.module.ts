import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatToolbarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { AddEditFolderComponent } from './add-edit-folder.component';
import { DataFieldModule } from '../../data-field/data-field.module';
import { TreeDropdownModule } from '../../tree-dropdown/tree-dropdown.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        AddEditFolderComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        CommonControlsSharedModule,
        MatToolbarModule,
        MatButtonModule,
        MatFormFieldModule,
        DataFieldModule,
        MatSelectModule,
        TreeDropdownModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        MatInputModule,
        MatDialogModule
    ],
    exports: [
        AddEditFolderComponent
    ],
    entryComponents: [
        AddEditFolderComponent
    ],
    providers: []
})
export class AddEditFolderModule {
}
