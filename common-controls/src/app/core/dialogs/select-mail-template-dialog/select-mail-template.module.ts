import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { SelectMailTemplateDialog } from './select-mail-template.dialog';
import { MatButtonModule, MatDialogModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        SelectMailTemplateDialog
    ],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        CommonControlsSharedModule,
        FlexLayoutModule,
        MatDialogModule
    ],
    exports: [
        SelectMailTemplateDialog
    ],
    entryComponents: [
        SelectMailTemplateDialog
    ],
    providers: []
})
export class SelectMailTemplateModule {
}
