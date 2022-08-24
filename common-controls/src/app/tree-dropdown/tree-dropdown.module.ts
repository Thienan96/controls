import {NgModule} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTreeModule } from '@angular/material/tree';
import {FlexLayoutModule} from '@angular/flex-layout';
import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {FormsModule} from '@angular/forms';
import {TreeDropdownComponent} from './tree-dropdown.component';
import {TreePanelComponent} from './tree-panel.component';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TreeIndentModule } from '../core/tree-indent/tree-indent.module';
import { MatToolbarModule } from '@angular/material';

@NgModule({
    declarations: [
        TreeDropdownComponent,
        TreePanelComponent
    ],
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        FlexLayoutModule,
        OverlayModule,
        MatCardModule,
        CommonModule,
        MatListModule,
        FormsModule,
        CommonControlsSharedModule,
        MatTreeModule,
        ScrollingModule,
        MatProgressBarModule,
        TreeIndentModule,
        MatToolbarModule
    ],
    exports: [TreeDropdownComponent],
    providers: [],
    bootstrap: [],
    entryComponents: [TreeDropdownComponent, TreePanelComponent]
})
export class TreeDropdownModule {
    constructor() {
    }
}
