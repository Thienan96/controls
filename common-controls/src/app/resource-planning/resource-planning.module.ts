import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PortalModule} from '@angular/cdk/portal';
import {FlexLayoutModule} from '@angular/flex-layout';
import {VirtualScrollerModule} from 'ngx-virtual-scroller';
import {
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatRippleModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule
} from '@angular/material';
import './shared/lib/draggable.scroll';
import './shared/lib/draggable.zIndex';
import './shared/lib/ui.ddmanager';
import {CoreModule} from '../core/core.module';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {ResourcePlanningComponent} from './resource-planning/resource-planning.component';
import {ResourcePlanningHeaderComponent} from './resource-planning-header/resource-planning-header.component';
import {ResourcePlanningResourceComponent} from './resource-planning-resource/resource-planning-resource.component';
import {ResourcePlanningEventComponent} from './resource-planning-event/resource-planning-event.component';
import {ResourcePlanningEventsComponent} from './resource-planning-events/resource-planning-events.component';
import {ResourcePlanningTooltipComponent} from './resource-planning-tooltip/resource-planning-tooltip.component';
import {ResourcePlanningDraggableComponent} from './resource-planning-draggable/resource-planning-draggable.component';
import {ResourcePlanningDroppableComponent} from './resource-planning-droppable/resource-planning-droppable.component';
import {ResourcePlanningLinesComponent} from './resource-planning-lines/resource-planning-lines.component';


@NgModule({
    declarations: [
        ResourcePlanningComponent,
        ResourcePlanningHeaderComponent,
        ResourcePlanningResourceComponent,
        ResourcePlanningEventComponent,
        ResourcePlanningEventsComponent,
        ResourcePlanningTooltipComponent,
        ResourcePlanningDraggableComponent,
        ResourcePlanningDroppableComponent,
        ResourcePlanningLinesComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatRippleModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        MatSelectModule,
        PortalModule,
        VirtualScrollerModule,
        FlexLayoutModule,
        CoreModule,
        CommonControlsSharedModule
    ],
    exports: [
        ResourcePlanningComponent,
        ResourcePlanningDraggableComponent,
        ResourcePlanningDroppableComponent
    ],
    providers: []
})
export class ResourcePlanningModule {
}
