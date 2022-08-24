import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { MatButtonModule, MatButtonToggleModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, MatToolbarModule, MatTooltipModule } from '@angular/material';
import { DocumentViewComponent } from './document-view.component';
import { DrawingBoardComponent } from './drawing-board/drawing-board.component';
import { ViewDocumentDialog } from './document-view-dialog/view-document.dialog';
import { FormsModule } from '@angular/forms';
import { TextTruncationModule } from '../../text-truncation/text-truncation.module';


@NgModule({
    declarations: [
        DocumentViewComponent,
        DrawingBoardComponent,
        ViewDocumentDialog
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        CommonControlsSharedModule,
        MatButtonToggleModule,
        MatButtonModule,
        FormsModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        TextTruncationModule,
        MatDialogModule
    ],
    exports: [
        DocumentViewComponent,
        DrawingBoardComponent,
        ViewDocumentDialog
    ],
    entryComponents: [
        ViewDocumentDialog
    ],
    providers: []
})
export class DocumentViewModule {
}
