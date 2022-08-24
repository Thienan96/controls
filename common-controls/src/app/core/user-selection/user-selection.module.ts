import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UserSelection } from './user-selection.component';
import { MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';

@NgModule({
    declarations: [
        UserSelection
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatFormFieldModule,
        MatChipsModule,
        MatIconModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        CommonControlsSharedModule
    ],
    exports: [
        UserSelection
    ],
})
export class UserSelectionModule {
}
