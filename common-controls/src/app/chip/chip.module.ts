import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChipComponent} from './chip.component';
import {MatChipsModule, MatIconModule, MatInputModule, MatOptionModule} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {AutocompleteModule} from '../autocomplete/autocomplete.module';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';


@NgModule({
    declarations: [ChipComponent],
    imports: [
        FlexLayoutModule,
        CommonModule,
        MatChipsModule,
        MatIconModule,
        MatOptionModule,
        FormsModule,
        AutocompleteModule,
        CommonControlsSharedModule,
        MatInputModule
    ],
    exports: [ChipComponent]
})
export class ChipModule {
}
