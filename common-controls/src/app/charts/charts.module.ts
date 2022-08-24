import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {CommonModule} from '@angular/common';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';
import { PieChartComponent } from './pie-chart/pie-chart.component';

@NgModule({
    declarations: [
        PieChartComponent,
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule
    ],
    exports: [PieChartComponent]
})
export class ChartsModule {
    
}
