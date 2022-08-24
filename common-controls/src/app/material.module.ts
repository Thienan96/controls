import {NgModule} from '@angular/core';
// import controls which you will use
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {ScrollingModule} from '@angular/cdk/scrolling';


@NgModule({
    imports: [
        MatButtonModule,
        MatMenuModule,
        MatToolbarModule,
        MatIconModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatDialogModule,
        MatStepperModule,
        MatListModule,
        MatDividerModule,
        MatOptionModule,
        MatSelectModule,
        MatRippleModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatRadioModule,
        MatButtonToggleModule,
        ScrollingModule,
        MatChipsModule,
        MatAutocompleteModule
    ],
    exports: [
        MatButtonModule,
        MatMenuModule,
        MatToolbarModule,
        MatIconModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatDialogModule,
        MatStepperModule,
        MatListModule,
        MatDialogModule,
        MatDividerModule,
        MatOptionModule,
        MatSelectModule,
        MatRippleModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatRadioModule,
        MatButtonToggleModule,
        ScrollingModule,
        MatChipsModule,
        MatAutocompleteModule
    ]
})
export class MaterialModule {
}
