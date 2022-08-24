import {AfterContentInit, Component, ContentChild, Input, TemplateRef} from '@angular/core';
import {DataType, FilterOperator, ToolbarFilterViewType} from '../../shared/models/common.info';
import {HelperService} from '../../core/services/helper.service';

@Component({
    selector: 'ntk-toolbar-filters-item',
    template: ''
})
export class ToolbarFiltersItemComponent implements AfterContentInit {
    @Input() public columnName: string;
    @Input() public filterType: string;
    @Input() public filterOperator: FilterOperator | string;
    @Input() public dataType: DataType | string;
    @Input('selected') public isSelected = false;
    @Input() public translateKey: string;
    @Input() public viewType: ToolbarFilterViewType | string;
    @Input() public leafType: string;
    @Input() public nodeType: string;
    @Input() public expectedFilterItem: string;
    @Input() public isExpectedSingleSelection = false;
    @Input() public isFavorite = false;
    // to custom needed operator
    @Input() public availableOperators: object[];
    // custom the min value
    @Input() public minValue: number;
    // custom max length
    @Input() public maxLength: number;

    @Input() public canUpdateCheckedAll = true;

    @Input() public allowNegative = true;

    @ContentChild(TemplateRef, {static: false}) public template: TemplateRef<any>;

    public displayValue: string;

    constructor(private helperService: HelperService) {
    }

    ngAfterContentInit() {
        this.displayValue = this.helperService.TranslationService.getTranslation(this.translateKey);
    }
}
