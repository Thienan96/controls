import {Component, ViewChild} from '@angular/core';
import {IGetDataEvent} from '../../virtual-list/virtual-list/virtual-list.component';
import {HttpClient} from '@angular/common/http';
import {ILazyItem} from '../../shared/models/common.info';
import {AutocompleteComponent} from '../../autocomplete/autocomplete/autocomplete.component';
import {FormControl, Validators} from '@angular/forms';
import {TreeIndentService} from '../../core/services/tree-indent.service';


/**
 * @title Chips Autocomplete
 */
@Component({
    selector: 'mat-demo-chip',
    templateUrl: 'chip.component.html',
    styleUrls: ['chip.component.scss']
})
export class DemoChipComponent {
    @ViewChild(AutocompleteComponent, {static: false}) autocompleteComponent: AutocompleteComponent;
    data: any;
    selected: ILazyItem[] = [];
    disabled = false;
    readonly = false;
    nounderline = false;
    mini = true;
    chipFormControl = new FormControl('', [
        Validators.required
    ]);


    constructor(private httpClient: HttpClient,
                private treeIndentService: TreeIndentService) {
        this.httpClient.get('src/assets/data/room.json').subscribe((data: any) => {
            this.data = data;
            this.data.HierarchicalData.forEach((item) => {
                item.Level = item.Level - 1;
            });
            this.selected = data.HierarchicalData.slice(3, 5);
        });


    }




    onGetData(event: IGetDataEvent) {
        let items: any[] = this.data.HierarchicalData;
        items.forEach((item, index) => {
            item.indentLines = this.treeIndentService.calculateIndentLines(items, index, 'Level', 1);
            item.offsetHeight = this.treeIndentService.isFirstItemInLevel(items, index) ? -10 : 0;
        });
        items = items.filter((item) => {
            if (!event.searchKeyword || (event.searchKeyword && event.searchKeyword.trim() === '')) {
                return true;
            }
            return item.Name.toUpperCase().indexOf(event.searchKeyword.toUpperCase()) !== -1;
        });
        items = items.filter((item) => {
            return !!!this.selected.find((i) => {
                return i.Id === item.Id;
            });
        });
        let newItems = items.slice(event.startIndex, event.startIndex + event.pageSize);
        setTimeout(() => {
            event.callBack({Count: items.length, ListItems: newItems});
        }, 1000);
    }

    isItemDisabled(item) {
        return item.Level === 0;
    }

    onSubmit(form) {
        console.log('form', form);
    }

    onItemChanged($event) {
        console.log('selected:', this.selected);
    }

    onChangeDisable(ev) {
        this.disabled = ev.checked;
    }

    onChangeReadOnly(ev) {
        this.readonly = ev.checked;
    }

    onChangeUnderline(ev) {
        this.nounderline = ev.checked;
    }

    onChangeMini(ev) {
        this.mini = ev.checked;
    }

}
