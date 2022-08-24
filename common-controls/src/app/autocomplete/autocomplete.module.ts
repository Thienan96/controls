import {NgModule} from '@angular/core';
import {MatListModule, MatOptionModule, MatProgressBarModule} from '@angular/material';
import {VirtualListModule} from '../virtual-list/virtual-list.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AutocompletePanelComponent} from './autocomplete-panel/autocomplete-panel.component';
import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {AutocompleteComponent} from './autocomplete/autocomplete.component';
import {SearchIconModule} from '../search-icon/search-icon.module';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
    declarations: [
        AutocompleteComponent,
        AutocompletePanelComponent
    ],
    imports: [
        CommonModule,
        MatListModule,
        VirtualListModule,
        FlexLayoutModule,
        MatOptionModule,
        OverlayModule,
        MatProgressBarModule,
        SearchIconModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule
    ],
    exports: [
        AutocompleteComponent,
        AutocompletePanelComponent
    ],
    entryComponents: [AutocompletePanelComponent]
})
export class AutocompleteModule {
}
