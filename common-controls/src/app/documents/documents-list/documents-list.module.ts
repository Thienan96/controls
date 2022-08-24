import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {CommonControlsSharedModule, HelperService} from '../../shared/common-controls-shared.module';
import { MatButtonModule, MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatTooltipModule } from '@angular/material';
import { DocumentsListComponent } from './documents-list.component';
import { VirtualListModule } from '../../virtual-list/virtual-list.module';
import { FormsModule } from '@angular/forms';
import { FileDropModule } from '../file-drop/file-drop.module';
import { TextTruncationModule } from '../../text-truncation/text-truncation.module';
import { DocumentThumbComponent } from './document-thumb/document-thumb.component';
import { DropdownModule } from '../../dropdown/dropdown.module';
import { AddEditFolderModule } from '../add-edit-folder/add-edit-folder.module';


@NgModule({
    declarations: [
        DocumentsListComponent,
        DocumentThumbComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        CommonControlsSharedModule,
        MatMenuModule,
        MatDividerModule,
        MatCheckboxModule,
        VirtualListModule,
        MatTooltipModule,
        FormsModule,
        FileDropModule,
        TextTruncationModule,
        MatFormFieldModule,
        DropdownModule,
        MatButtonModule,
        AddEditFolderModule
    ],
    exports: [
        DocumentsListComponent,
        DocumentThumbComponent
    ],
    entryComponents: [
        
    ],
    providers: [
        HelperService
    ]
})
export class DocumentsListModule {
}
