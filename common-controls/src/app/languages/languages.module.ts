import {NgModule} from '@angular/core';
import {LanguagesDialogComponent} from './languages-dialog/languages-dialog.component';
import {MatButtonModule} from '@angular/material/button';
import {FlexLayoutModule} from '@angular/flex-layout';
import {
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatRadioModule,
    MatToolbarModule
} from '@angular/material';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {LanguagesSelectionComponent} from './languages-selection/languages-selection.component';

@NgModule({
    declarations: [
        LanguagesDialogComponent,
        LanguagesSelectionComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatRadioModule,
        MatListModule,
        MatIconModule,
        MatMenuModule,
        FlexLayoutModule,
        FormsModule,
        CommonControlsSharedModule,
        MatToolbarModule
    ],
    entryComponents: [LanguagesDialogComponent],
    exports: [LanguagesSelectionComponent]
})
export class LanguagesModule {
}
