import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WeekTsComponent} from './week-ts.component';
import {WeekTsDayPlanningComponent} from './week-ts-day-planning/week-ts-day-planning.component';
import {WeekTsEventComponent} from './week-ts-event/week-ts-event.component';
import {WeekTsBgEventComponent} from './week-ts-bg-event/week-ts-bg-event.component';
import {WeekTsLinesComponent} from './week-ts-lines/week-ts-lines.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {WeekTsHeaderComponent} from './week-ts-header/week-ts-header.component';
import {WeekTsDurationComponent} from './week-ts-duration/week-ts-duration.component';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {MatDividerModule} from '@angular/material/divider';
import {ResizableModule} from 'angular-resizable-element';
import {WeekTsEventResizableDirective} from './shared/week-ts-event-resizable.directive';
import {WeekTsResizeHandleDirective} from './shared/week-ts-resize-handle.directive';


@NgModule({
    declarations: [
        WeekTsComponent,
        WeekTsDayPlanningComponent,
        WeekTsEventComponent,
        WeekTsBgEventComponent,
        WeekTsLinesComponent,
        WeekTsHeaderComponent,
        WeekTsDurationComponent,
        WeekTsEventResizableDirective,
        WeekTsResizeHandleDirective
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule,
        MatDividerModule,
        ResizableModule
    ],
    exports: [
        WeekTsComponent,
        WeekTsDayPlanningComponent,
        WeekTsEventComponent,
        WeekTsBgEventComponent,
        WeekTsLinesComponent,
        WeekTsHeaderComponent,
        WeekTsDurationComponent,
        WeekTsEventResizableDirective,
        WeekTsResizeHandleDirective
    ]
})
export class WeekTsModule {
}
