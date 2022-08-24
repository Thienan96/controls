import {NgModule} from '@angular/core';
import {AppComponent} from '../app.component';
import {ResourcePlanningWorkspaceComponent} from './resource-planning-workspace/resource-planning-workspace.component';
import {ControlsComponent} from './controls/controls.component';
import {ShuffleComponent} from './shuffle/shuffle.component';
import {NgxDataTableComponent} from './NgxDataTable/NgxDataTable.component';
import {TableEditableWorkspaceComponent} from './table-editable-workspace/table-editable-workspace.component';
import {DocumentWorkspaceComponent} from './DocumentWorkspace/document-workspace.component';
import {DemoToolbarComponent} from './toolbar/demo-toolbar.component';
import {ChartsComponent} from './charts/charts.component';
import {PdfPreviewWorkspaceComponent} from './pdf-preview-workspace/pdf-preview-workspace.component';
import {DatatableSortComponent} from './datatable-workspace/datatable-sort/datatable-sort.component';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TextTruncationModule} from '../text-truncation/text-truncation.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ToolbarModule} from '../toolbar/toolbar.module';
import {CommonControlsSharedModule, HelperService} from '../shared/common-controls-shared.module';
import {ToastrModule} from 'ngx-toastr';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatIconModule, MatIconRegistry} from '@angular/material/icon';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CoreModule} from '../core/core.module';
import {
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTooltipModule
} from '@angular/material';
import { DropdownModule} from '../dropdown/dropdown.module';
import {TreeDropdownModule} from '../tree-dropdown/tree-dropdown.module';
import {CommonDocumentModule} from '../documents/documents.module';
import {PdfPreviewModule} from '../pdf-preview/pdf-preview.module';
import {StoreModule} from '@ngrx/store';
import {metaReducers, reducers} from '../core/state';
import {ShuffleModule} from '../shuffle/shuffle.module';
import {ChartsModule} from '../charts/charts.module';
import {MaterialModule} from '../material.module';
import {AppRoutingModule} from '../routing/app-routing.module';
import {ResourcePlanningModule} from '../resource-planning/resource-planning.module';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {AngularSplitModule} from 'angular-split';
import {TableEditableModule} from '../table-editable/table-editable.module';
import {PortalModule} from '@angular/cdk/portal';
import {SpeedDialFabModule} from '../speed-dial-fab/speed-dial-fab.module';
import {DatatableModule} from '../datatable/datatable.module';
import {DataFieldModule} from '../data-field/data-field.module';
import {VirtualListModule} from '../virtual-list/virtual-list.module';
import {YearCalendarModule} from '../year-calendar/year-calendar.module';
import {ModuleBarModule} from '../module-bar/module-bar.module';
import {TOOLBAR_SVG_ICONS} from '../toolbar/shared/svg-icon-dictionany';
import {SVG_ICON_DICTIONARY} from '../svg-icon-dictionary';
import {DatatableWorkspaceComponent} from './datatable-workspace/datatable-workspace.component';
import {DatatableEditableComponent} from './datatable-workspace/datatable-editable/datatable-editable.component';
import {TreeIndentModule} from '../core/tree-indent/tree-indent.module';
import {LanguagesModule} from '../languages/languages.module';
import {DemoChipComponent} from './chip/chip.component';
import {AutocompleteModule} from '../autocomplete/autocomplete.module';
import {ChipModule} from '../chip/chip.module';
import {SlideDialogBaseDialog} from './dialog/slide-dialog-base/slide-dialog-base.dialog';
import {SlideDialog1Dialog} from './dialog/slide-dialog-slide-1/slide-dialog-1.dialog';
import {DemoDialogComponent} from './dialog/dialog.component';
import {SlideDialog2Dialog} from './dialog/slide-dialog-slide-2/slide-dialog-2.dialog';
import {NtkTimeInputModule} from '../ntk-time-input/ntk-time-input.module';
import {NtkDurationInputModule} from '../ntk-duration-input/ntk-duration-input.module';
import {DurationModule} from '../duration/duration.module';
import {DemoDurationComponent} from './DemoDurationComponent/duration.component';
import {
    NgxMatDateAdapter,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule
} from '@angular-material-components/datetime-picker';
import {CustomDateAdapter} from '../shared/directives/CustomDateTimeAdapter';
import {KanbanDemoComponent} from './kanban/kanban.demo.component';
import {KanbanModule} from '../kanban/kanban.module';
import {VirtualScrollerModule} from 'ngx-virtual-scroller';
import {DemoVirtualScrollComponent} from './demo-virtual-scroll/demo-virtual-scroll.component';
import {VirtualScrollModule} from '../virtual-scroll/virtual-scroll.module';
import {LinesDemoComponent} from './lines/lines.component';
import {VirtualScrollExpansionModule} from '../virtual-scroll-expansion/virtual-scroll-expansion.module';
import {DetailsCalendarModule} from '../details-calendar/details-calendar.module';
import {DemoDetailsCalendarComponent} from './details-calendar/details-calendar.component';
import {NtkDrapDropModule} from '../drag-drop/drap-drop.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {NtkNumberInputModule} from '../ntk-number-input/ntk-number-input.module';
import {ExpandableModule} from '../expandable/expandable.module';
import {LineDetailsComponent} from './lines/line-details/line-details.component';
import {LinesEditComponent} from './lines/line-edit/lines-edit.component';
import {FolderTreeModule} from '../documents/folder-tree/folder-tree.module';
import {DocumentsListModule} from '../documents/documents-list/documents-list.module';
import {AttachmentBoxModule} from '../documents/attachment-box/attachment-box.module';
import {AddEditFolderModule} from '../documents/add-edit-folder/add-edit-folder.module';
import {AttachDocumentsDialogModule} from '../documents/attach-document-dialog/attach-documents-dialog.module';
import {AddCommentModule} from '../core/add-comment/add-comment.module';
import {MessageDialogModule} from '../core/dialogs/message-dialog/message.dialog.module';
import {SlidesModule} from '../slides/slides.module';
import {ColumnsSelectionModule} from '../core/dialogs/columns-selection-dialog/columns-selection.module';
import {AuthenticationModule} from '../authentication/authentication.module';
import {DemoAddCommentComponent} from './add-comment/add-comment.component';
import {AddCommentMobileModule} from '../core/add-comment/add-comment-mobile/add-comment-mobile.module';
import {AttachmentBoxMobileModule} from '../documents/attachment-box-mobile/attachment-box-mobile.module';
import {EditableControlsModule} from '../editable-controls/editable-controls.module';
import {WeekTsModule} from '../week-ts/week-ts.module';
import {DemoWeektsComponent} from './weekts/weekts.component';
import { DocumentViewModule } from '../documents/document-view/document-view.module';
import {XxsComponent} from './controls/xxs/xxs.component';
import {TruncationComponent} from './controls/truncation/truncation.component';
import {TooltipComponent} from './controls/tooltip/tooltip.component';
import {DropdownComponent} from './controls/dropdown/dropdown.component';
import { MultiLinesFieldModule } from '../multi-lines-field/multi-lines-field.module';


@NgModule({
    declarations: [
        AppComponent,
        ResourcePlanningWorkspaceComponent,
        ControlsComponent,
        ShuffleComponent,
        NgxDataTableComponent,
        TableEditableWorkspaceComponent,
        DatatableWorkspaceComponent,
        DatatableEditableComponent,
        DatatableSortComponent,
        DocumentWorkspaceComponent,
        DemoToolbarComponent,
        ChartsComponent,
        PdfPreviewWorkspaceComponent,
        DemoChipComponent,
        DemoDialogComponent,
        SlideDialogBaseDialog,
        SlideDialog1Dialog,
        SlideDialog2Dialog,
        DemoDurationComponent,
        KanbanDemoComponent,
        DemoVirtualScrollComponent,
        LinesDemoComponent,
        DemoDetailsCalendarComponent,
        LineDetailsComponent,
        LinesEditComponent,
        DemoAddCommentComponent,
        DemoWeektsComponent,
        XxsComponent,
        TruncationComponent,
        TooltipComponent,
        DropdownComponent
    ],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        TextTruncationModule,
        FlexLayoutModule,
        ToolbarModule,
        CommonControlsSharedModule,
        ToastrModule.forRoot({
            timeOut: 5000,
            positionClass: 'toast-top-right',
            preventDuplicates: true,
            countDuplicates: true
        }),
        MatSnackBarModule,
        MatIconModule,
        FormsModule,
        CommonModule,
        CoreModule,
        MatFormFieldModule,
        DropdownModule,
        TreeDropdownModule,
        CommonDocumentModule,
        PdfPreviewModule,
        MatDatepickerModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatTooltipModule,
        StoreModule.forRoot(reducers, {metaReducers}),

        ShuffleModule,
        ChartsModule,
        MatCardModule,
        MatButtonModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MaterialModule,
        AppRoutingModule,
        ResourcePlanningModule,
        MatSliderModule,
        NgxDatatableModule,
        AngularSplitModule,
        TableEditableModule,
        PortalModule,
        SpeedDialFabModule,
        DatatableModule,
        DataFieldModule,
        VirtualListModule,
        YearCalendarModule,
        ModuleBarModule,
        TreeIndentModule,
        AutocompleteModule,
        ChipModule,
        NtkTimeInputModule,
        NtkDurationInputModule,
        DurationModule,
        NgxMatDatetimePickerModule,
        NgxMatTimepickerModule,
        NgxMatNativeDateModule,
        KanbanModule,
        VirtualScrollerModule,
        VirtualScrollModule,
        VirtualScrollExpansionModule,
        DetailsCalendarModule,
        NtkDrapDropModule,
        DragDropModule,
        NtkNumberInputModule,
        ExpandableModule,
        FolderTreeModule,
        DocumentsListModule,
        AttachmentBoxModule,
        AddEditFolderModule,
        DocumentsListModule,
        AttachDocumentsDialogModule,
        AddCommentModule,
        MessageDialogModule,
        SlidesModule,
        AuthenticationModule,
        AddCommentMobileModule,
        AttachmentBoxMobileModule,
        EditableControlsModule,
        WeekTsModule,        
        AddCommentMobileModule,  
        AttachmentBoxMobileModule,
        DocumentViewModule,
        MultiLinesFieldModule
    ],
    exports: [
        ResourcePlanningWorkspaceComponent,
        ControlsComponent,
        ShuffleComponent,
        NgxDataTableComponent,
        TableEditableWorkspaceComponent,
        DatatableWorkspaceComponent,
        DatatableEditableComponent,
        DatatableSortComponent,
        DocumentWorkspaceComponent,
        DemoToolbarComponent,
        ChartsComponent,
        PdfPreviewWorkspaceComponent,
        LanguagesModule,
        DemoDurationComponent,
        KanbanDemoComponent,
        DemoDetailsCalendarComponent,
        LineDetailsComponent,
        LinesEditComponent,
        ColumnsSelectionModule,
        XxsComponent,
        TruncationComponent,
        TooltipComponent,
        DropdownComponent
    ],
    providers: [
        {provide: NgxMatDateAdapter, useClass: CustomDateAdapter}
    ],
    entryComponents: [SlideDialogBaseDialog, SlideDialog1Dialog, SlideDialog2Dialog]
})
export class DemoModule {
    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, helperService: HelperService) {
        // register all svg
        let keys: string[] = Object.keys(Object.assign({}, TOOLBAR_SVG_ICONS, SVG_ICON_DICTIONARY));
        keys.forEach(key => {
            let url: string = helperService.UtilityService.addSlashIfNotExists(helperService.UtilityService.getRootUrl()) + 'src/assets/svg/' + TOOLBAR_SVG_ICONS[key];
            iconRegistry.addSvgIcon(key, sanitizer.bypassSecurityTrustResourceUrl(url));
        });
    }
}
