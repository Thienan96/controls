import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModuleBarMenuComponent} from './module-bar-menu/module-bar-menu.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatButtonModule, MatDividerModule, MatIconModule, MatToolbarModule, MatTooltipModule} from '@angular/material';
import {ModuleBarItemComponent} from './module-bar-item/module-bar-item.component';
import {ModuleItemWrapperComponent} from './module-item-wraper/module-item-wrapper.component';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {ModuleBarComponent} from './module-bar/module-bar.component';


@NgModule({
    declarations: [
        ModuleBarMenuComponent,
        ModuleBarItemComponent,
        ModuleItemWrapperComponent,
        ModuleBarComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDividerModule,
        MatToolbarModule
    ],
    exports: [
        ModuleBarMenuComponent,
        ModuleBarComponent
    ]
})
export class ModuleBarModule {
}
