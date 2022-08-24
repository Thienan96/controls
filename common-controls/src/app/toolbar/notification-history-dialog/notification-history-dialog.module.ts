import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatDialogModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { DatatableModule } from '../../datatable/datatable.module';
import { NotificationHistoryDialogComponent } from './notification-history-dialog.component';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';


@NgModule({
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatDialogModule,
        DatatableModule,
        CommonControlsSharedModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule
    ],
    declarations: [
        NotificationHistoryDialogComponent
    ],
    exports: [
        NotificationHistoryDialogComponent
    ],
    entryComponents:[
        NotificationHistoryDialogComponent
    ]
})
export class NotificationHistoryDialogModule {
}
