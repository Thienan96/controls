import { Component, Inject, Injector, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

import { BaseDialog } from '../base.dialog';
import { SelectableItem, DialogData } from '../../../shared/models/common.info';

@Component({
    selector: 'ntk-items-selection-dialog',
    templateUrl: './items-selection.dialog.html',
    styleUrls: ['./items-selection.dialog.scss']
})

export class ItemsSelectionDialog extends BaseDialog {
    @ViewChild('inputQuery', {static: false}) inputQuery: ElementRef;

    items: SelectableItem[];
    titleKey: string;
    isShowSearch: boolean = false;
    query: string;
    
    constructor(injector: Injector, dialogRef: MatDialogRef<ItemsSelectionDialog>, @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);

        this.items = dialogData.Data.items;
        this.titleKey = dialogData.Data.titleKey;

        this.initializeData();
    }

    initializeData() {
        if (this.items && this.items.length > 0) {
            this.items.forEach(itm => {
                if (itm.TranslationKey) {
                    if (!itm.DisplayValue)
                        itm.DisplayValue = this._translationSvc.getTranslation(itm.TranslationKey);

                    itm.TranslationKey = undefined;
                }
            });
        }
    }
    
    ok() {
        let result = this.getReturnValue();
        this._dialogRef.close(result);
    }
    
    enableSearch() {
        this.isShowSearch = true;

        if (!this._util.isDevice) {
            TimerObservable.create(200).subscribe(() => this.inputQuery.nativeElement.focus());    
        }
    }

    disableSearch() {
        this.isShowSearch = false;
    }

    clearQuery() {
        this.query = '';
    }

    itemClicked(item: SelectableItem) {
        item.IsSelected = !item.IsSelected;
    }

    private getReturnValue(): any {
        let result: any[];

        if (this.items && this.items.length > 0) {
            result = [];
            this.items.forEach(itm => {
                if (!!itm.IsSelected)
                    result.push(itm.Value);
            });
        }

        return result;
    }

    updateStateItems(isSelected: boolean) {
        if (this.items && this.items.length > 0) {
            this.items.forEach(itm => {
                itm.IsSelected = isSelected;
            });
        }
    }
}