import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MiddleTruncationComponent} from './middle-truncation/middle-truncation.component';
import {TextTruncationComponent} from './text-truncation/text-truncation.component';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';

@NgModule({
    imports: [
        CommonModule,
        MatTooltipModule,
        CommonControlsSharedModule
    ],
    declarations: [
        MiddleTruncationComponent,
        TextTruncationComponent
    ],
    exports: [
        MiddleTruncationComponent,
        TextTruncationComponent
    ]
})
export class TextTruncationModule {
}
