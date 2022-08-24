import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { DocumentInfoDialog } from './document-infor.dialog/document-info.dialog';
import { MatButtonModule, MatDialogModule } from '@angular/material';
import { CommonDocumentService } from './shared/common-document.service';


@NgModule({
    declarations: [
        DocumentInfoDialog,
    ],
    imports: [
        CommonModule,
        FormsModule,
        MatTooltipModule,
        CommonControlsSharedModule,
        FlexLayoutModule,
        MatButtonModule,
        MatDialogModule
    ],
    exports: [
        DocumentInfoDialog
    ],
    providers: [
        CommonDocumentService
    ],
    bootstrap: [],
    entryComponents: [
        DocumentInfoDialog,
    ]
})
export class CommonDocumentModule {
    constructor() {

    }
}
