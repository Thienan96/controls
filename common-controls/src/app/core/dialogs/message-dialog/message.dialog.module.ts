import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { MessageDialog } from './message.dialog';
import { MatButtonModule, MatDialogModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
    declarations: [
        MessageDialog
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        CommonControlsSharedModule,
        FlexLayoutModule,
        MatButtonModule,
        MatDialogModule
    ],
    exports: [
        MessageDialog
    ],
    entryComponents: [
        MessageDialog
    ],
    providers: []
})
export class MessageDialogModule {
}
