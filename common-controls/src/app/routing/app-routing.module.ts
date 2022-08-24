import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ControlsComponent} from '../demo/controls/controls.component';
import {AuthGuardService} from '../auth-guard.service';
import {ResourcePlanningWorkspaceComponent} from '../demo/resource-planning-workspace/resource-planning-workspace.component';
import {ShuffleComponent} from '../demo/shuffle/shuffle.component';
import {NgxDataTableComponent} from '../demo/NgxDataTable/NgxDataTable.component';
import {TableEditableWorkspaceComponent} from '../demo/table-editable-workspace/table-editable-workspace.component';
import {DocumentWorkspaceComponent} from '../demo/DocumentWorkspace/document-workspace.component';
import {DemoToolbarComponent} from '../demo/toolbar/demo-toolbar.component';
import {ChartsComponent} from '../demo/charts/charts.component';
import {DatatableWorkspaceComponent} from '../demo/datatable-workspace/datatable-workspace.component';
import {DemoChipComponent} from '../demo/chip/chip.component';
import {DemoDialogComponent} from '../demo/dialog/dialog.component';
import {STATES} from './consts';
import {DemoDurationComponent} from '../demo/DemoDurationComponent/duration.component';
import {KanbanDemoComponent} from '../demo/kanban/kanban.demo.component';
import { DemoVirtualScrollComponent } from '../demo/demo-virtual-scroll/demo-virtual-scroll.component';
import { LinesDemoComponent } from '../demo/lines/lines.component';
import {DemoDetailsCalendarComponent} from '../demo/details-calendar/details-calendar.component';
import { DemoAddCommentComponent } from '../demo/add-comment/add-comment.component';
import {DemoWeektsComponent} from '../demo/weekts/weekts.component';

const routes: Routes = [
    {path: '', redirectTo: 'en/homepage', pathMatch: 'full'},
    {
        path: ':lang',
        children: [
            {path: STATES.homepage, component: ControlsComponent, canActivate: [AuthGuardService]},
            {path: STATES.virtualScroll, component: DemoVirtualScrollComponent, canActivate: [AuthGuardService]},
            {path: STATES.resourcePlanning, component: ResourcePlanningWorkspaceComponent, canActivate: [AuthGuardService]},
            {path: STATES.shuffle, component: ShuffleComponent, canActivate: [AuthGuardService]},
            {path: STATES.ngxGrid, component: NgxDataTableComponent, canActivate: [AuthGuardService]},
            {path: STATES.tableEditable, component: TableEditableWorkspaceComponent, canActivate: [AuthGuardService]},
            {path: STATES.datatable, component: DatatableWorkspaceComponent, canActivate: [AuthGuardService]},
            {path: STATES.documents, component: DocumentWorkspaceComponent, canActivate: [AuthGuardService]},
            {path: STATES.toolbar, component: DemoToolbarComponent, canActivate: [AuthGuardService]},
            {path: STATES.charts, component: ChartsComponent, canActivate: [AuthGuardService]},
            {path: STATES.chip, component: DemoChipComponent, canActivate: [AuthGuardService]},
            {path: STATES.dialog, component: DemoDialogComponent, canActivate: [AuthGuardService]},
            {path: STATES.duration, component: DemoDurationComponent, canActivate: [AuthGuardService]},
            {path: STATES.kanban, component: KanbanDemoComponent, canActivate: [AuthGuardService]},
            {path: STATES.lines, component: LinesDemoComponent, canActivate: [AuthGuardService]},
            {path: STATES.DetailsCalendar, component: DemoDetailsCalendarComponent, canActivate: [AuthGuardService]},
            {path: STATES.AddComment, component: DemoAddCommentComponent, canActivate: [AuthGuardService]},
            {path: STATES.WeekTs, component: DemoWeektsComponent, canActivate: [AuthGuardService]}
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {useHash: true})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
