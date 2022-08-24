import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {MatButtonModule, MatIconModule} from '@angular/material';
import {SearchIconComponent} from './search-icon.component';
import {DynamicFormModule} from '../dynamic-form/dynamic-form.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
    declarations: [
        SearchIconComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule,
        MatButtonModule,
        MatIconModule,
        DynamicFormModule,
        ReactiveFormsModule,
        FormsModule
    ],
    exports: [
        SearchIconComponent
    ]
})
export class SearchIconModule {
}
