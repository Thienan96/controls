import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { NgxResizeWatcherDirective } from './directives/ngxDataTable-resize-watcher.directive';
import { TooltipToggleDirective } from './directives/tooltip-toggle.directive';
import { ResizeSensorDirective } from './directives/resize-sensor.directive';
import { NgxDataTableEmptyRow } from './directives/ngx-datatable-emptyRow.directive';
import { DragScrollDirective } from './directives/drag-scroll.directive';
import { DropDisableDirective } from './directives/drop-disable.directive';
import { NtkTooltipDirective } from './directives/ntk-tooltip.directive';
import { NtkTooltipComponent } from '../ntk-tooltip/ntk-tooltip.component';
import { TooltipTranslatorDirective } from './directives/tooltip-translator.directive';
import { DebounceClickDirective } from './directives/DebounceClick.Directive';
import { TranslatorAttributeDirective } from './directives/translator-attribute.directive';
import { CommonSharedLightModule } from './common-shared-light.module';

export { TranslatorPipe } from './pipes/translator.pipe';
export { DateTimePipe, FormatDatePipe, TimePipe, FriendlyDatePipe, TimeOnlyPipe } from './pipes/date.pipe';
export { CarriageReturn2HtmlBrPipe } from './pipes/carriage-return-2-html-br.pipe';
export { IntergerPipe } from './pipes/number.pipe';
export { SafeHtmlPipe } from './pipes/safe-html.pipe';
export { ArraySortOrderPipe } from './pipes/array-sort-order.pipe';


export { UtilityService } from '../core/services/utility.service';
export { StorageService, StorageKeys, StorageLocation } from '../core/services/storage.service';
export { DialogService } from '../core/services/dialog.service';
export { TranslationService } from '../core/services/translation.service';
export { AuthenticationService } from '../core/services/authentication.service';
export { CommonDataService } from '../core/services/common-data.service';
export { EntityListService } from '../core/services/entity-list.service';
export { EntityDetailsService } from '../core/services/entity-details.service';
export { PreferencesService } from '../core/services/preferences.service';
export { BaseDialog } from '../core/dialogs/base.dialog';

export { AppConfig } from '../core/app.config';
export { SlideService } from '../core/services/slide.service';
export { SlideDialogService } from '../core/services/slide.dialog.service';
export { CustomHttpInterceptor } from '../core/services/http.interceptor';
export { BlockUIService } from '../core/services/blockUI.service';
export { HelperService } from '../core/services/helper.service';

export * from './models/common.info';
export * from './models/ngxTable.model';
export * from './models/user.info';
export * from './models/unit.model';


@NgModule({
    imports: [
        CommonModule,
        CommonSharedLightModule
    ],
    declarations: [

        NtkTooltipComponent,
        ClickOutsideDirective,
        NgxResizeWatcherDirective,
        TooltipToggleDirective,
        TooltipTranslatorDirective,
        ResizeSensorDirective,
        NgxDataTableEmptyRow,
        DragScrollDirective,
        DropDisableDirective,
        NtkTooltipDirective,
        DebounceClickDirective,
        TranslatorAttributeDirective
    ],
    exports: [
        NtkTooltipComponent,
        ClickOutsideDirective,
        NgxResizeWatcherDirective,
        TooltipToggleDirective,
        TooltipTranslatorDirective,
        ResizeSensorDirective,
        NgxDataTableEmptyRow,
        DragScrollDirective,
        DropDisableDirective,
        NtkTooltipDirective,
        DebounceClickDirective,
        TranslatorAttributeDirective,
        CommonSharedLightModule
    ],
    providers: [],
    entryComponents: [NtkTooltipComponent],

})
export class CommonControlsSharedModule {
    constructor() {
    }
}
