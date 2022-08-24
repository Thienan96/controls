import { Component, ElementRef, Inject, Injector, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

import { BaseDialog } from '../base.dialog';
import { GridColumnDef } from '../../../shared/models/ngxTable.model';
import { DialogData } from '../../../shared/models/common.info';
import * as _ from 'underscore';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';


@Component({
    selector: 'ntk-columns-selection-dialog',
    templateUrl: './columns-selection.dialog.html',
    styleUrls: ['./columns-selection.dialog.scss']
})

export class ColumnsSelectionDialog extends BaseDialog {
    @ViewChild('inputQuery', { static: false }) inputQuery: ElementRef;

    selectAll = false;
    items: GridColumnDef[];
    titleKey: string;
    isShowSearch = false;
    query: string;

    // EJ4-1419 : We do not allow the user reorder the columns
    allowReorderingColumns = true;


    private deviderIndexes = [];

    private _defaults: GridColumnDef[];

    constructor(injector: Injector, dialogRef: MatDialogRef<ColumnsSelectionDialog>
        , @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);

        this.items = dialogData.Data.items;
        this.titleKey = dialogData.Data.titleKey;
        this._defaults = dialogData.Data.defaultOrder;

        // By default allowReorderingColumns = true
        if (dialogData.Data.allowReorderingColumns !== null && dialogData.Data.allowReorderingColumns !== undefined)
            this.allowReorderingColumns = dialogData.Data.allowReorderingColumns
        

        this.initializeData();
        this.updateOrder();
    }

    initializeData() {
        // this._defaults = [];
        _.forEach(this.items, itm => {
            if (itm && !itm.displayValue) {
                itm.displayValue = this._translationSvc.getTranslation(itm.translationKey);
            }

            // this._defaults.push(_.clone(itm));
        });

        // _.forEach(this._defaults, c => {
        //     c.showing = c.isDefault;
        // });
    }

    updateOrder() {
        if (this.items && this.items.length > 0) {
            const items = this.items.sort((item1, item2) => {
                // let result = (item2.mandatory ? 1 : 0) - (item1.mandatory ? 1 : 0);

                // if (result === 0) {
                //     result = (item2.showing ? 1 : 0) - (item1.showing ? 1 : 0);
                // }
                let result = (item2.showing ? 1 : 0) - (item1.showing ? 1 : 0);

                // if (result === 0) {
                //     result =  (item2.displayValue || '').localeCompare(item1.displayValue || '');
                // }

                return result;
            });

            this.items = items.slice();

            this.deviderIndexes = [];
            for (let i = 0; i < this.items.length - 1; i++) {
                if (this.items[i].mandatory && !this.items[i + 1].mandatory) {
                    this.deviderIndexes.push(i);
                } else if (this.items[i].showing && !this.items[i + 1].showing) {
                    this.deviderIndexes.push(i);
                }
            }

            this.updateDidiversPositions();
        }

        // console.log('after sort:', this.items);
    }

    needShowDivider(index: number) {
        return _.indexOf(this.deviderIndexes, index) >= 0;
    }

    ok() {
        const result = this.getReturnValue();
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
        this.clearQuery();
    }

    clearQuery() {
        this.query = '';
    }

    onshowingChanged(item: any) {

        if (this.allowReorderingColumns) {
            this.updateOrder();
        }
        else {
            // keep hiden columns 
            let hideColumns: string[] = [];
            _.forEach(this.items, (it) => {if (!it.showing) hideColumns.push(it.name)});

            // keep width of each columns
            let columnsWidthHash: { [index: string]: number } = {};
            _.forEach(this.items, (it) => {
                columnsWidthHash[it.name] = it.currentWidth;
            });

            // Show all first
            this.items = _.clone(this._defaults).slice();
            _.forEach(this.items, c => {
                c.currentWidth = columnsWidthHash[c.name] ? columnsWidthHash[c.name] : c.initialWidth;
                c.showing = true;
            });
            
            // Then after hide the columns
            _.forEach(hideColumns, (cln) => {
                let column = this.items.find((it) => {return it.name === cln});
                if (column) column.showing = false;
            });

            this.updateOrder();
        }
        
    }

    private getReturnValue(): any {
        let result: any[];

        if (this.items && this.items.length > 0) {
            result = [];
            this.items.forEach(itm => {
                if (!!itm.showing) {
                    result.push(itm);
                }
            });
        }

        return result;
    }

    restoreDefaults() {

        // In the case the Column is mandatory for the grid but
        // It's show/hide by the data 
        let mandatoryColumnsNotShow: string[] = [];
        _.forEach(this.items, (it) => {
            if (it.mandatory && !it.showing) mandatoryColumnsNotShow.push(it.name);
        });

        this.items = _.clone(this._defaults).slice();
        _.forEach(this.items, c => {
            c.currentWidth = c.initialWidth;
            if (mandatoryColumnsNotShow.indexOf(c.name) < 0)
                c.showing = c.isDefault;
            else 
                c.showing = false;
        });
        this.updateDidiversPositions();
    }

    private updateDidiversPositions() {
        this.deviderIndexes = [];
        for (let i = 0; i < this.items.length - 1; i++) {
            if (this.items[i].mandatory && !this.items[i + 1].mandatory) {
                this.deviderIndexes.push(i);
            } else if (this.items[i].showing && !this.items[i + 1].showing) {
                this.deviderIndexes.push(i);
            }
        }
    }

    onColumnDrop($event: CdkDragDrop<GridColumnDef>) {
        moveItemInArray(this.items, $event.previousIndex, $event.currentIndex);
    }
    get checkedItems(): GridColumnDef[] {
        return this.items.filter(c => c.showing);
    }
    get unCheckedItems(): GridColumnDef[] {
        return this.items.filter(c => !c.showing);
    }

}
