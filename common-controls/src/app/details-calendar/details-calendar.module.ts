import {NgModule} from '@angular/core';
import {DetailsCalendarComponent} from './details-calendar/details-calendar.component';
import {DetailsCalendarDayComponent} from './details-calendar-day/details-calendar-day.component';
import {DetailsCalendarDayColumnComponent} from './details-calendar-day-column/details-calendar-day-column.component';
import {DetailsCalendarDayEventComponent} from './details-calendar-day-event/details-calendar-day-event.component';
import {DetailsCalendarDayHeaderComponent} from './details-calendar-day-header/details-calendar-day-header.component';
import {DetailsCalendarHoursComponent} from './details-calendar-hours/details-calendar-hours.component';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {DetailsCalendarDragDirective} from './shared/details-calendar-drag.directive';
import {DetailsCalendarDropList} from './shared/drop-list';
import {MatIconModule} from '@angular/material';
import {DetailsCalendarResizableDirective} from './shared/details-calendar-resizable.directive';
import {DetailsCalendarResizeHandleDirective} from './shared/details-calendar-resize-handle.directive';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {NtkDrapDropModule} from '../drag-drop/drap-drop.module';
import {ResizableModule} from 'angular-resizable-element';
import {DetailsCalendarDragScrollDirective} from './shared/details-calendar-drag-scroll.directive';
import {DetailsCalendarBackgroundComponent} from './background/details-calendar-background/details-calendar-background.component';
import {DetailsCalendarBackgroundDayComponent} from './background/details-calendar-background-day/details-calendar-background-day.component';
import {DetailsCalendarBackgroundDayEventComponent} from './background/details-calendar-background-day-event/details-calendar-background-day-event.component';
import {DetailsCalendarDayFooterComponent} from './details-calendar-day-footer/details-calendar-day-footer.component';
import {DetailsCalendarDragDurationComponent} from './details-calendar-drag-duration/details-calendar-drag-duration.component';

@NgModule({
    declarations: [
        DetailsCalendarComponent,
        DetailsCalendarDayComponent,
        DetailsCalendarDayColumnComponent,
        DetailsCalendarDayEventComponent,
        DetailsCalendarDayHeaderComponent,
        DetailsCalendarHoursComponent,
        DetailsCalendarDragDirective,
        DetailsCalendarDropList,
        DetailsCalendarResizableDirective,
        DetailsCalendarResizeHandleDirective,
        DetailsCalendarDragScrollDirective,
        DetailsCalendarBackgroundComponent,
        DetailsCalendarBackgroundDayComponent,
        DetailsCalendarBackgroundDayEventComponent,
        DetailsCalendarDayFooterComponent,
        DetailsCalendarDragDurationComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        CommonControlsSharedModule,
        DragDropModule,
        NtkDrapDropModule,
        MatIconModule,
        ResizableModule
    ],
    exports: [
        DetailsCalendarComponent,
        DetailsCalendarDayComponent,
        DetailsCalendarDayColumnComponent,
        DetailsCalendarDayEventComponent,
        DetailsCalendarDayHeaderComponent,
        DetailsCalendarHoursComponent,
        DetailsCalendarDragDirective,
        DetailsCalendarDropList,
        DetailsCalendarResizableDirective,
        DetailsCalendarResizeHandleDirective,
        DetailsCalendarDragScrollDirective,
        DetailsCalendarBackgroundComponent,
        DetailsCalendarBackgroundDayComponent,
        DetailsCalendarBackgroundDayEventComponent,
        DetailsCalendarDayFooterComponent,
        DetailsCalendarDragDurationComponent
    ]

})
export class DetailsCalendarModule {

}
