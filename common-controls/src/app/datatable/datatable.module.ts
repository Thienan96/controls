import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatatableHeaderComponent} from './datatable-header/datatable-header.component';
import {DatatableFooterComponent} from './datatable-footer/datatable-footer.component';
import {DatatableBodyComponent} from './datatable-body/datatable-body.component';
import {DatatableRowComponent} from './datatable-row/datatable-row.component';
import {DatatableCellComponent} from './datatable-cell/datatable-cell.component';
import {DatatableComponent} from './datatable/datatable.component';
import {DatatableColumnComponent} from './datatable-column/datatable-column.component';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {PortalModule} from '@angular/cdk/portal';
import {FlexLayoutModule} from '@angular/flex-layout';
import {VirtualScrollerModule} from 'ngx-virtual-scroller';
import {DatatableScrollerHorizontalComponent} from './datatable-scroller-horizontal/datatable-scroller-horizontal.component';
import {DatatableDragDirective} from './shared/datatable-drag.directive';
import {DatatableGroupbyComponent} from './datatable-groupby/datatable-groupby.component';
import {MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule} from '@angular/material';
import {DatatableNagetivePipe} from './shared/datatable-nagetive.pipe';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {DatatableTreeComponent} from './datatable-tree/datatable-tree.component';
import {DatatableVirtualScrollComponent} from './datatable-virtual-scroll/datatable-virtual-scroll.component';
import { HeaderCellComponent } from './datatable-header/header-cell/header-cell.component';


@NgModule({
    declarations: [
        DatatableHeaderComponent,
        DatatableFooterComponent,
        DatatableBodyComponent,
        DatatableRowComponent,
        DatatableCellComponent,
        DatatableComponent,
        DatatableColumnComponent,
        DatatableScrollerHorizontalComponent,
        DatatableDragDirective,
        DatatableGroupbyComponent,
        DatatableNagetivePipe,
        DatatableTreeComponent,
        DatatableVirtualScrollComponent,
        HeaderCellComponent
    ],
    imports: [
        CommonModule,
        CommonControlsSharedModule,
        PortalModule,
        FlexLayoutModule,
        VirtualScrollerModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        DragDropModule,
        MatProgressSpinnerModule
    ],
    exports: [
        DatatableComponent,
        DatatableColumnComponent,
        DatatableGroupbyComponent,
        DatatableTreeComponent,
        DatatableCellComponent,
        DatatableScrollerHorizontalComponent,
        DatatableHeaderComponent
    ]
})
export class DatatableModule {
}
