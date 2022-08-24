import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { BlockUITemplateComponent } from './block-ui-template.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        BlockUITemplateComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule
    ],
    exports: [
        BlockUITemplateComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class BlockUIModule {
}
