import {Component, EventEmitter, Output} from '@angular/core';
import {HelperService} from '../../core/services/helper.service';
import {LanguageModel, SelectableItem} from '../../shared/models/common.info';

@Component({
    selector: 'ntk-languages-selection',
    templateUrl: './languages-selection.component.html',
    styleUrls: ['./languages-selection.component.scss']
})
export class LanguagesSelectionComponent {
    @Output() change: EventEmitter<LanguageModel> = new EventEmitter();

    languages: SelectableItem[];
    currentLanguage: SelectableItem;
    currentLanguageTranslationKey: string;


    constructor(private helper: HelperService) {
        // Get languages
        this.languages = this.helper.TranslationService.getAllDisplayItemLanguages();

        // Find current language
        let code3 = this.helper.TranslationService.getCurrentLanguage().toUpperCase();
        this.currentLanguage = this.languages.find((language) => {
            return code3 === language.Value;
        });

        // Current key
        this.currentLanguageTranslationKey = this.helper.TranslationService.getLanguage(code3).DisplayValue;
    }

    onLanguageClick(lang) {
        this.currentLanguage = lang;


        this.currentLanguageTranslationKey = this.helper.TranslationService.getLanguage(lang.Value).DisplayValue;

        // Translate
        let language = this.helper.TranslationService.getLanguage(lang.Value);
        this.helper.TranslationService.changeLanguage(language.Code2).subscribe(() => {
            // Refresh language list
            this.languages = this.helper.TranslationService.getAllDisplayItemLanguages();
            this.change.emit(language);
        });
    }

}
