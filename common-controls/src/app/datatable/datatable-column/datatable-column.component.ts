import {Component, ContentChild, Input, TemplateRef} from '@angular/core';
import {DatatableColumnPin, DatatableDataType} from '../shared/datatable.model';

@Component({
    selector: 'ntk-datatable-column',
    template: '',
    styleUrls: []
})
export class DatatableColumnComponent {
    @Input() property: string;
    @Input() translationKey: string;
    @Input() displayValue: string;
    @Input() pin: DatatableColumnPin | string = DatatableColumnPin.center;
    @Input() mandatory: string;
    @Input() width: string;
    @Input() show = true;
    @Input() sortable: boolean;
    @Input() resizeable = true;

    /**
     * For some reason, the application need to track more values than what we design, we lat them add values them want to allow managed in their template
     */
    @Input() additionalValue?: any;

    @Input() minWidth?: string;
    @Input() maxWidth?: string;
    @Input() editable = false;
    @Input() selectable = false;
    @Input() dataType: DatatableDataType | string = DatatableDataType.String;
    @Input() required = false;
    @Input() showActiveBorder = true;

    @ContentChild(TemplateRef, {static: false}) template: TemplateRef<any>;
}
