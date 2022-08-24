import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { PreferencesDialogComponent } from './preferences-dialog.component';
import { MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatToolbarModule } from '@angular/material';
import { CommonControlsSharedModule } from '../../../shared/common-controls-shared.module';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
    declarations: [
        PreferencesDialogComponent
    ],
    imports: [
        CommonModule,
        MatToolbarModule,
        CommonControlsSharedModule,
        MatRadioModule,
        MatSlideToggleModule,
        FormsModule,
        MatCheckboxModule,
        MatSelectModule,
        FlexLayoutModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule
    ],
    exports: [
        PreferencesDialogComponent
    ],
    entryComponents: [
        PreferencesDialogComponent
    ],
    providers: []
})
export class PreferenceDialogModule {
}
