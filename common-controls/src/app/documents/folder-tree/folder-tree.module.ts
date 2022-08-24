import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatDividerModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FolderTreeComponent } from './folder-tree-component/folder-tree.component';
import { FolderTreeHeaderComponent } from './folder-tree-header/folder-tree-header.component';
import { FolderTreeIndentComponent } from './folder-tree-indent/folder-tree-indent.component';
import { FolderTreeRowComponent } from './folder-tree-row/folder-tree-row.component';
import { FolderTreeVirticalScrollComponent } from './folder-tree-virtical-scroll/folder-tree-virtical-scroll.component';
import { DatatableModule } from '../../datatable/datatable.module';
import { FolderTreeHeaderCellComponent } from './folder-tree-header/folder-tree-header-cell/folder-tree-header-cell.component';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { DragDropModule } from '@angular/cdk/drag-drop';



@NgModule({
    declarations: [
        FolderTreeComponent,
        FolderTreeHeaderComponent,
        FolderTreeIndentComponent,
        FolderTreeRowComponent,
        FolderTreeVirticalScrollComponent,
        FolderTreeHeaderCellComponent
    ],
    imports: [
        CommonModule,
        CommonControlsSharedModule,
        FlexLayoutModule,
        MatDividerModule,
        MatCheckboxModule,
        DatatableModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FormsModule,
        MatButtonModule,
        DragDropModule
    ],
    exports: [
        FolderTreeComponent,
        FolderTreeHeaderComponent,
        FolderTreeRowComponent,
        FolderTreeVirticalScrollComponent,
        FolderTreeHeaderCellComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class FolderTreeModule {
}
