import {NgModule} from '@angular/core';
import {ShuffleComponent} from './shuffle.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {CommonModule} from '@angular/common';
import {ShuffleItemComponent} from './shuffle-item/shuffle-item.component';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';


@NgModule({
    declarations: [
        ShuffleComponent,
        ShuffleItemComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule
    ],
    exports: [ShuffleComponent, ShuffleItemComponent]
})
export class ShuffleModule {
}
