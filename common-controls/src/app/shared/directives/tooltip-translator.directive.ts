import {Directive, Input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslationService} from '../../core/services/translation.service';

@Directive({
    selector: '[matTooltip][ntk-tooltip-translator]'
})
export class TooltipTranslatorDirective {
    @Input('ntk-tooltip-translator') key: string;

    constructor(private matTip: MatTooltip,
                private translationService: TranslationService) {
        // Update text when the language is changed
        this.translationService.onLanguageChange().subscribe(() => {
            this.matTip.message = this.translationService.getTranslation(this.key);
        });
    }
}
