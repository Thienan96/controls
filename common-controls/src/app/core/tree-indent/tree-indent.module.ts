import { NgModule } from '@angular/core';
import { TreeIndentComponent } from './tree-indent.component';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        TreeIndentComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
    ],
    exports: [
        TreeIndentComponent
    ],
})
export class TreeIndentModule {
}
