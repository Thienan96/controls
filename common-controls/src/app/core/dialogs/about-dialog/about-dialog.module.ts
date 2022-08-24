import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { AboutDialogComponent } from './about-dialog.component';
import { MatButtonModule, MatDialogModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
    declarations: [
        AboutDialogComponent
    ],
    imports: [
        CommonModule,
        MatToolbarModule,
        CommonControlsSharedModule,
        MatIconModule,
        MatButtonModule,
        FlexLayoutModule,
        MatDialogModule
    ],
    exports: [
        AboutDialogComponent
    ],
    entryComponents: [
        AboutDialogComponent
    ],
    providers: []
})
export class AboutDialogModule {
}
