import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatorPipe } from './pipes/translator.pipe';
import { DateTimePipe, FormatDatePipe, FriendlyDatePipe, TimePipe, TimeOnlyPipe, TimesOfDayBoundariesPipe } from './pipes/date.pipe';
import { CarriageReturn2HtmlBrPipe } from './pipes/carriage-return-2-html-br.pipe';
import { FormatDecimalPipe, IntergerPipe, ProtectBadge, FormatDurationPipe } from './pipes/number.pipe';
import { FilterTextPipe } from './pipes/filter-text.pipe';
import { AsyncValidatorDirective } from './directives/async-validator.directive';
import { DebounceDirective } from './directives/debounce.directive';
import { EmailValidatorDirective } from './directives/email-validator.directive';
import { OnlyNumberDirective } from './directives/only-number.directive';
import { RequiredValidatorDirective } from './directives/required-validator.directive';
import { Empty2WhiteSpacePipe } from './pipes/empty-2-white-space.pipe';
import { NumericInputDirective } from './directives/numeric-input.directive';
import { NumericPercentInputDirective } from './directives/numeric-percent-input.directive';
import { AutofocusDirective } from './directives/auto-focus.directive';
import { StopMonitoringDirective } from './directives/stop-monitoring.directive';
import { MinDateValidatorDirective } from './directives/min-date-validator.directive';

import { NotificationTransformPipe } from './pipes/notification-transform.pipe';
import { DisableControlDirective } from './directives/disable-control.directive';
import { MinDateDirective } from './directives/min-date.directive';
import { SecurePipe } from './pipes/secure.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { NoBlankStringValidatorDirective } from './directives/no-blankstring-validator.directive';
import { TemplateDirective } from './directives/template.directive';
import { NtkTooltipComponent } from '../ntk-tooltip/ntk-tooltip.component';
import { AutocompleteDirective } from './directives/autocomplete.directive';
import { AutocompleteOpenDirective } from './directives/autocomplete-open.directive';
import { ArraySortOrderPipe } from './pipes/array-sort-order.pipe';
import { ArrayFilterPipe } from './pipes/array-filter.pipe';
import { FormatDisplayDatePipe } from './pipes/format-display-date.pipe';
import { OnlyDatePickerDirective } from './directives/only-date-picker.directive';
import { ColorContrastDirective } from './directives/color-contrast.directive';
import { FractionPipe } from './pipes/fraction.pipe';
import { TranslatorDirective } from './directives/translator.directive';


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        TranslatorPipe,
        FormatDatePipe,
        DateTimePipe,
        TimePipe,
        TimeOnlyPipe,
        CarriageReturn2HtmlBrPipe,
        FormatDecimalPipe,
        FormatDurationPipe,
        TimesOfDayBoundariesPipe,
        IntergerPipe,
        ProtectBadge,
        FilterTextPipe,
        NotificationTransformPipe,
        FriendlyDatePipe,
        SafeHtmlPipe,
        ArraySortOrderPipe,
        Empty2WhiteSpacePipe,
        SecurePipe,
        ArrayFilterPipe,
        FormatDisplayDatePipe,
        FractionPipe,

        AsyncValidatorDirective,
        DebounceDirective,
        EmailValidatorDirective,
        OnlyNumberDirective,
        RequiredValidatorDirective,
        NumericInputDirective,
        NumericPercentInputDirective,
        DisableControlDirective,
        AutofocusDirective,
        MinDateDirective,
        StopMonitoringDirective,
        MinDateValidatorDirective,
        NoBlankStringValidatorDirective,
        TemplateDirective,
        AutocompleteDirective,
        AutocompleteOpenDirective,
        OnlyDatePickerDirective,
        ColorContrastDirective,
        TranslatorDirective
    ],
    exports: [
        TranslatorPipe,
        FormatDatePipe,
        DateTimePipe,
        TimePipe,
        TimeOnlyPipe,
        CarriageReturn2HtmlBrPipe,
        FormatDecimalPipe,
        FormatDurationPipe,
        TimesOfDayBoundariesPipe,
        IntergerPipe,
        ProtectBadge,
        FilterTextPipe,
        NotificationTransformPipe,
        FriendlyDatePipe,
        SafeHtmlPipe,
        ArraySortOrderPipe,
        Empty2WhiteSpacePipe,
        SecurePipe,
        ArrayFilterPipe,
        FormatDisplayDatePipe,
        FractionPipe,

        AsyncValidatorDirective,


        DebounceDirective,
        EmailValidatorDirective,

        OnlyNumberDirective,
        RequiredValidatorDirective,


        NumericInputDirective,
        NumericPercentInputDirective,
        AutofocusDirective,
        DisableControlDirective,
        AutofocusDirective,
        MinDateDirective,
        StopMonitoringDirective,

        MinDateValidatorDirective,


        NoBlankStringValidatorDirective,

        TemplateDirective,

        AutocompleteDirective,
        AutocompleteOpenDirective,

        OnlyDatePickerDirective,
        ColorContrastDirective,
        TranslatorDirective

    ],
    providers: [],
    entryComponents: [NtkTooltipComponent],

})
export class CommonSharedLightModule {
    constructor() {
    }
}
