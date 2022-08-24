import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatCommonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule
} from '@angular/material';
import {MatBadgeModule} from '@angular/material/badge';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ToolbarFiltersComponent} from './toolbar-filters/toolbar-filters.component';
import {ToolbarFiltersItemComponent} from './toolbar-filters-item/toolbar-filters-item.component';
import {ToolbarSortsComponent} from './toolbar-sorts/toolbar-sorts.component';
import {ToolbarSortsItemComponent} from './toolbar-sorts-item/toolbar-sorts-item.component';
import {FiltersBarComponent} from './filters-bar/filters-bar.component';
import {FiltersBarItemComponent} from './filters-bar-item/filters-bar-item.component';
import {FiltersDialogSimpleComponent} from './filters-dialog/filters-dialog-simple/filters-dialog-simple.component';
import {FiltersDialogMultiChooseComponent} from './filters-dialog/filters-dialog-multi-choose/filters-dialog-multi-choose.component';
import {FiltersDialogDateComponent} from './filters-dialog/filters-dialog-date/filters-dialog-date.component';
import {FiltersDialogNumberComponent} from './filters-dialog/filters-dialog-number/filters-dialog-number.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ToolbarVirtualScrollComponent} from './toolbar-virtual-scroll/toolbar-virtual-scroll.component';
import {ToolbarComponent} from './toolbar.component';
import {ToolbarTreeComponent} from './toolbar-tree/toolbar-tree.component';
import {ToolbarListComponent} from './toolbar-list/toolbar-list.component';
import {ToolbarTreeVirtualScrollComponent} from './toolbar-tree-virtual-scroll/toolbar-tree-virtual-scroll.component';
import {HistoryToolbarComponent} from './history-toolbar/history-toolbar.component';
import {ScrollableComponent} from './scrollable/scrollable.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {CoreModule} from '../core/core.module';
import {UserMenuComponent} from './user-menu/user-menu.component';
import {NotificationPanelComponent} from './notification-panel/notification-panel.component';
import {OverlayModule} from '@angular/cdk/overlay';
import {TextTruncationModule} from '../text-truncation/text-truncation.module';
import {CustomFilterItemComponent} from './custom-filter-item/custom-filter-item.component';
import {CustomFiltersComponent} from './custom-filters/custom-filters.component';
import {ToolbarNotificationComponent} from './toolbar-notification/toolbar-notification.component';
import {ToolbarReleaseAlertComponent} from './toolbar-release-alert/toolbar-release-alert.component';
import {ToolbarSearchComponent} from './toolbar-search/toolbar-search.component';
import {ToolbarTitleComponent} from './toolbar-title/toolbar-title.component';
import {ToolbarRowComponent} from './toolbar-row/toolbar-row.component';
import {ToolbarLayoutsComponent} from './toolbar-layouts/toolbar-layouts.compopnent';
import {ToolbarLayoutsItemComponent} from './toolbar-layouts-item/toolbar-layouts-item.component';
import {VirtualScrollerModule} from 'ngx-virtual-scroller';
import {CustomFilterDialog} from './custom-filter-dialog/custom-filter-dialog';
import {FiltersDialogDateFilterComponent} from './filters-dialog/filters-dialog-date-filter/filters-dialog-date-filter.component';
import {CommonControlsSharedModule} from '../shared/common-controls-shared.module';
import {TreeIndentModule} from '../core/tree-indent/tree-indent.module';
import {SearchIconModule} from '../search-icon/search-icon.module';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {FiltersDialogDurationComponent} from './filters-dialog/filters-dialog-duration/filters-dialog-duration.component';
import {NtkDurationInputModule} from '../ntk-duration-input/ntk-duration-input.module';
import {ToolbarReleaseAlertDialog} from './toolbar-release-dialog-alert/toolbar-release-alert.dialog';
import { CommonSharedLightModule } from '../shared/common-shared-light.module';;
import { FilterMonthCalendarHeader, FiltersDialogMonthComponent } from './filters-dialog/filters-dialog-month/filters-dialog-month.component'

@NgModule({
    declarations: [
        ToolbarComponent,
        ToolbarFiltersComponent,
        ToolbarFiltersItemComponent,
        ToolbarSortsComponent,
        ToolbarSortsItemComponent,
        FiltersBarComponent,
        FiltersBarItemComponent,
        FiltersDialogSimpleComponent,
        FiltersDialogSimpleComponent,
        FiltersDialogMultiChooseComponent,
        FiltersDialogDateComponent,
        FiltersDialogNumberComponent,
        FiltersDialogDurationComponent,
        ToolbarVirtualScrollComponent,
        ToolbarTreeComponent,
        ToolbarListComponent,
        ToolbarTreeVirtualScrollComponent,
        HistoryToolbarComponent,
        ScrollableComponent,
        UserMenuComponent,
        NotificationPanelComponent,
        CustomFilterItemComponent,
        CustomFiltersComponent,
        ToolbarNotificationComponent,
        ToolbarReleaseAlertComponent,
        ToolbarRowComponent,
        ToolbarSearchComponent,
        ToolbarTitleComponent,
        ToolbarLayoutsComponent,
        ToolbarLayoutsItemComponent,
        CustomFilterDialog,
        FiltersDialogDateFilterComponent,
        ToolbarReleaseAlertDialog,
        FiltersDialogMonthComponent, 
        FilterMonthCalendarHeader    ],
    imports: [
        // Material desgin
        MatToolbarModule,
        MatCommonModule,
        MatIconModule,
        MatDividerModule,
        MatMenuModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatTooltipModule,
        MatTreeModule,
        MatBadgeModule,
        MatProgressBarModule,


        CommonModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        OverlayModule,
        TextTruncationModule,
        VirtualScrollerModule,
        CoreModule,
        CommonSharedLightModule,
        TreeIndentModule,
        SearchIconModule,
        NtkDurationInputModule
    ],
    exports: [
        ToolbarComponent,
        ToolbarFiltersComponent,
        ToolbarFiltersItemComponent,
        ToolbarSortsComponent,
        ToolbarSortsItemComponent,
        FiltersBarComponent,
        FiltersBarItemComponent,
        FiltersDialogSimpleComponent,
        FiltersDialogMultiChooseComponent,
        FiltersDialogDateComponent,
        FiltersDialogNumberComponent,
        FiltersDialogDurationComponent,
        ToolbarVirtualScrollComponent,
        ToolbarTreeComponent,
        ToolbarListComponent,
        ToolbarTreeVirtualScrollComponent,
        HistoryToolbarComponent,
        ScrollableComponent,
        UserMenuComponent,
        CustomFilterItemComponent,
        CustomFiltersComponent,
        ToolbarNotificationComponent,
        ToolbarReleaseAlertComponent,
        ToolbarRowComponent,
        ToolbarSearchComponent,
        ToolbarTitleComponent,
        ToolbarLayoutsComponent,
        ToolbarLayoutsItemComponent,
        FiltersDialogDateFilterComponent,
        FiltersDialogMonthComponent,
        FilterMonthCalendarHeader
    ],
    entryComponents: [
        FiltersDialogSimpleComponent,
        FiltersDialogMultiChooseComponent,
        FiltersDialogDateComponent,
        FiltersDialogNumberComponent,
        FiltersDialogDurationComponent,
        NotificationPanelComponent,
        CustomFilterDialog,
        FiltersDialogDateFilterComponent,
        ToolbarReleaseAlertDialog,
        FiltersDialogMonthComponent, 
        FilterMonthCalendarHeader
    ],
    bootstrap: [],
    providers: []
})

export class ToolbarModule {
}
