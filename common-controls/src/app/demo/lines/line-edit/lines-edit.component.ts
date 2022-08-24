import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material';
import {ApiService} from '../../../core/services/Api.service';
import {HelperService} from '../../../core/services/helper.service';
import {forkJoin} from 'rxjs';
import {ExpandableComponent, IExpandableOption, CheckListItemWrapper} from '../../../expandable/public_api';


@Component({
    selector: 'ntk-demo-lines-edit',
    templateUrl: './lines-edit.component.html',
    styleUrls: ['./lines-edit.component.scss']
})
export class LinesEditComponent implements AfterViewInit {
    items: any[] = [];
    options: IExpandableOption = {
        itemHeight: 49,
        indent: 32
    };
    parentCheckListBase = {
        Id: '876de6c1-e453-4974-b3cd-ef2e8014e7d2',
        EntityType: 'CheckListTemplate',
        Name: '111'
    };

    _addingMenuTimer: any;
    currentMenuTrigger: MatMenuTrigger;
    @ViewChild(ExpandableComponent, {static: false}) virtualList: ExpandableComponent;
    isConnectServer = false;

    constructor(private apiService: ApiService,
                private helperService: HelperService) {
    }

    ngAfterViewInit() {
        let url = `src/assets/data/lines.json`;
        if (this.isConnectServer) {
            url = 'CheckListDetail/GetFullCheckListBaseDetail?checkListBaseId=' + this.parentCheckListBase.Id;
        }
        this.apiService.get(url).subscribe((data: any) => {
            this.items = data.CheckListItems;
            setTimeout(() => {
                this.virtualList.refreshList();
            }, 100);
        });
    }

    onExpandAll() {
        this.virtualList.expandAll();
    }

    onCollapseAll() {
        this.virtualList.collapseAll();
    }

    onSave() {
        let data: any = this.virtualList.getChanges();
        if (data) {
            data.CheckListBaseId = this.parentCheckListBase.Id;
            this.apiService.post(`CheckListDetail/UpdateCheckListItems`, data).subscribe((result) => {
                console.log(`respone`, result);
            });
        }

    }

    onToggleButtonClick(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.virtualList.toggle(item);
    }

    toggleSelectLine(item: CheckListItemWrapper) {
        this.virtualList.toggleSelectLine(item, !item.isSelected);
    }

    onIncreaseLevel(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.virtualList.onIncreaseLevel(item);
    }

    onDecreaseLevel(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.virtualList.onDecreaseLevel(item);
    }

    onDeleteItem(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();

        let title = this.helperService.TranslationService.getTranslation('lbConfirm'),
            message = this.helperService.TranslationService.getTranslation('msgConfirmToDeleteSelectedItems');
        this.helperService.DialogService.showMessageDialog(title, message, `btYesNo`).subscribe((result) => {
            if (result) {
                this.virtualList.onDeleteItem(item);
            }
        });
    }

    onCopyItem(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.virtualList.onCopyItem(item);
    }

    private clearTimeTime() {
        clearTimeout(this._addingMenuTimer);
    }

    onMouseEnterMenu() {
        this.clearTimeTime();
    }

    onMouseEnterLines(matMenuTrigger: MatMenuTrigger) {
        this.closeMenu();
        this.clearTimeTime();
        this.currentMenuTrigger = matMenuTrigger;
        this._addingMenuTimer = setTimeout(() => {
            matMenuTrigger.openMenu();
        }, 500);
    }

    onMouseLeaveLines(matMenuTrigger: MatMenuTrigger) {
        this.clearTimeTime();
        this._addingMenuTimer = setTimeout(() => {
            this.closeMenu();
        }, 500);
    }

    private closeMenu() {
        if (this.currentMenuTrigger) {
            this.currentMenuTrigger.closeMenu();
        }
    }


    private onMenuItemClick(ev: MouseEvent) {
        // Prevent fire to parent
        ev.stopImmediatePropagation();

        this.clearTimeTime();

        // Hide menu
        this.closeMenu();
    }

    onAddLine(item: CheckListItemWrapper, ev: MouseEvent) {
        this.onMenuItemClick(ev);

        // Add new line
        let isForceAddAsSib: boolean = ev ? ev.ctrlKey || ev.shiftKey : false;
        this.virtualList.addLine(item, isForceAddAsSib);
    }

    onAddSection(item: CheckListItemWrapper, ev: MouseEvent) {
        this.onMenuItemClick(ev);

        let isForceAddAsSib = false;
        if (item.isSectionItem) {
            isForceAddAsSib = true;
        }
        this.virtualList.addSection(item, isForceAddAsSib);
    }


    private getDataToImport() {
        // local
        let linesBase = this.apiService.get(`src/assets/data/lines-base.json`);
        let children = this.apiService.get(`src/assets/data/lines-checklists.json`);
        if (this.isConnectServer) {
            // server
            let checkListBaseId = `16ab4745-9be0-403a-8627-25c2ef0e4d03`;
            linesBase = this.apiService.get(`CheckListDetail/GetCheckListBaseDetail?checkListBaseId=${checkListBaseId}`);
            children = this.apiService.get(`CheckListDetail/GetCloneCheckListItemBasesAndConvertIncludeItemsToSectionItems?checkListBaseId=${checkListBaseId}&toCheckListBaseId=${this.parentCheckListBase.Id}&toCheckListBaseType=CheckListTemplate`);
        }

        return forkJoin(linesBase, children);
    }

    onAddChecklist(item: CheckListItemWrapper, ev: MouseEvent) {
        this.onMenuItemClick(ev);
        this.getDataToImport().subscribe((data: any) => {
            this.virtualList.addChecklist(item, false, data[0], data[1]);
        });

    }

    onAddLinkChecklist(item: CheckListItemWrapper, ev: MouseEvent) {
        this.onMenuItemClick(ev);
        this.getDataToImport().subscribe((data: any) => {

            this.virtualList.addLinkChecklist(item, true, data[0], data[1]);
        });


    }

    onAddConditional(item: CheckListItemWrapper, ev: MouseEvent) {
        this.onMenuItemClick(ev);
        this.virtualList.addConditional(item);
    }


}

