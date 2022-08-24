import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'ntk-data-field',
    templateUrl: './data-field.component.html',
    styleUrls: ['./data-field.component.scss']
})

export class DataFieldComponent implements OnChanges {
    canShowIconButton = false;
    @Input() captionKey: string;

    @Input() value: string;
    @Input() valueSufix: string;

    @Input() withTruncation?: boolean;
    @Input() maxLines?: number;

    @Input() showIconButton = false;

    @Input() iconName?: string;


    @Input() toolTip?: string;

    @Input() skipTranslation: boolean = false;

    // tslint:disable-next-line: no-output-rename
    @Output('onFieldIconClick') _onFieldIconClick = new EventEmitter<any>();

    // NBSHD-4537 (.160.0): the user mouse over this icon, we will display errors and warnings associated with the field.
    @Output('onFieldIconMouseEnter') _onFieldIconMouseEnter = new EventEmitter<CdkOverlayOrigin>();

    onIconClick() {
        this._onFieldIconClick.emit();
    }

    onIconMouseEnter(overlay: CdkOverlayOrigin) {
        this._onFieldIconMouseEnter.emit(overlay);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.value || changes.showIconButton || changes.showIconButton) {
            this.UpdateCanShowIconButton();
        }
    }

    private UpdateCanShowIconButton() {
        this.canShowIconButton = !!this.value && !!this.showIconButton && !!this.iconName;
    }
}
