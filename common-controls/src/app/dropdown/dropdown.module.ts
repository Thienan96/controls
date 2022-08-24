import {NgModule} from '@angular/core';
import {DropdownComponent} from './dropdown.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {FlexLayoutModule} from '@angular/flex-layout';
import {DropdownPanelComponent} from './dropdown-panel.component';
import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { MatCheckboxModule, MatToolbarModule } from '@angular/material';

export * from './dropdown.component';
export * from './shared/dropdown.model';

@NgModule({
    declarations: [
        DropdownComponent,
        DropdownPanelComponent
    ],
    imports: [
        MatIconModule,
        MatButtonModule,
        FlexLayoutModule,
        OverlayModule,
        MatCardModule,
        CommonModule,
        MatListModule,
        MatCheckboxModule,
        MatToolbarModule,
        // tslint:disable-next-line: deprecation
        ScrollingModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatProgressBarModule,
        CommonControlsSharedModule,
    ],
    exports: [DropdownComponent],
    providers: [],
    bootstrap: [],
    entryComponents: [DropdownComponent, DropdownPanelComponent]
})
export class DropdownModule {
    constructor() {
    }
}
