import {AfterContentInit, Component} from '@angular/core';
import {IDropdownGetDataEvent} from '../../../dropdown/shared/dropdown.model';
import {Observable, of} from 'rxjs';


@Component({
    selector: 'ntk-demo-dropdown',
    templateUrl: './dropdown.component.html'
})
export class DropdownComponent implements AfterContentInit {
    dropdownValue: any;
    isRequired = false;
    dropdownValueEmpty: any;
    getData1: any;
    getFewData: any;
    selectedRoom: any;
    private _dropdownData = [];
    private _preAppendData = [];
    disabled = false;
    disabledSearch = false;

    public iconName: string;

    constructor() {
        this.getData1 = this._getData1.bind(this);
        this.getFewData = (startIndex: number, pageSize: number, searchText: string) => {
            let c = 2;
            let data = this._dropdownData.slice(startIndex, c);

            if (startIndex === 0) {
                return new Observable((sub) => {
                    setTimeout(() => {
                        sub.next({ListItems: data, Count: c});
                        sub.complete();
                    }, 500);
                });
            } else {
                return of({ListItems: data});
            }
        };
    }

    ngAfterContentInit(): void {
        for (let i = 0; i < 4; i++) {
            this._preAppendData.push({
                Id: 'pre-' + i,
                Name: 'Pre item ' + i
            });
        }

        for (let i = 0; i < 1000; i++) {
            this._dropdownData.push({
                Id: 'code-' + i,
                Name: 'Item number ' + i
            });

            if (i === 5) {
                this._dropdownData[i].Name += 'this is a very logn text to tes the text truncation system with tooltip';
            }
        }
    }

    onDisabledSearchChanged(ev) {
        this.disabledSearch = ev.checked;
    }

    onDisabledChanged(ev) {
        this.disabled = ev.checked;
    }

    onValueChange(event) {
        console.log(`onValueChange`, event);
    }

    onGetTreeData(event: IDropdownGetDataEvent) {
        let list = [
            {Id: '0000', Name: 'Parent 1', Level: 1},
            {Id: '00001', Name: 'child 1', Level: 2},
            {Id: '000012', Name: 'Child 12', Level: 3},
            {Id: '111111', Name: 'Parent 2', Level: 1},
            {Id: '111112', Name: 'Child 21', Level: 2}
        ];
        let data = {ListItems: list, Count: list.length};
        event.callBack.next(data);
        event.callBack.complete();
    }

    onGetDropdownData(event: IDropdownGetDataEvent) {
        this.getDropdownData(event.startIndex, event.pageSize, event.searchText).subscribe(x => {
            event.callBack.next(x);
            event.callBack.complete();
        }, (err) => {
            event.callBack.error(err);
            event.callBack.complete();
        });
    }


    private getDropdownData(startIndex: number, pageSize: number, searchText: string): Observable<any> {
        let items: any[] = this._dropdownData;
        items = items.filter((item) => {
            if (!searchText || (searchText && searchText.trim() === '')) {
                return true;
            }
            return item.Name.toUpperCase().indexOf(searchText.toUpperCase()) !== -1;
        });
        let data = items.slice(startIndex, startIndex + pageSize);
        if (startIndex === 0) {
            return new Observable((sub) => {
                sub.next({ListItems: data, Count: items.length, AppendRows: this._preAppendData});
                sub.complete();
            });
        } else {
            return of({ListItems: data, Count: items.length});
        }
    }

    _getData1(startIndex: number, pageSize: number, searchText: string): Observable<any> {
        let _data = [];
        for (let i = 0; i < 1000; i++) {
            let code = 'code-' + i;
            if (!searchText || code.indexOf(searchText) >= 0) {
                _data.push({
                    Id: 'code-' + i,
                    Name: 'Item number ' + i
                });
            }
        }

        let data = _data.slice(startIndex, startIndex + pageSize);

        if (startIndex === 0) {
            return new Observable((sub) => {
                sub.next({ListItems: data, Count: _data.length});
                sub.complete();
            });
        } else {
            return of({ListItems: data, Count: _data.length});
        }
    }

    getEmtpyData(startIndex: number, pageSize: number, searchText: string): Observable<any> {
        return of({ListItems: [], Count: 0});
    }

    public getRooms(searchText: string, parent?: any): Observable<any[]> {

        console.log('get room, parent = ', parent);

        let result = [];

        for (let i = 0; i < 10; i++) {
            result.push({
                Id: parent ? `${parent.Id}_${i}` : `${i}`,
                Name: parent ? `Item ${parent.Name}_${i}` : `Item ${i}`,
                Type: 'type',
                isExpandable: true,
                isGroup: false,
                Level: (parent ? parent.Levvel + 1 : 0) + 1
            });
        }

        result[0].Name = 'This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. ';

        let finalResult = result;
        if (searchText) {
            finalResult = result.filter(f => {
                return (f.Name + '').includes(searchText);
            });
        }


        return of(finalResult);
    }

    public setIconName() {
        this.iconName = 'build';
    }

    public clearIconName() {
        this.iconName = null;
    }
}
