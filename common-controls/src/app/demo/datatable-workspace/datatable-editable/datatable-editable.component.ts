import {AfterViewInit, ChangeDetectorRef, Component, Injector, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import * as _ from 'underscore';
import {
    DatatableCell,
    DatatableColumn,
    DatatableColumnPin,
    DatatableDataType,
    DatatableGroup,
    DatatableRow
} from '../../../datatable/shared/datatable.model';
import {DatatableComponent} from '../../../datatable/datatable/datatable.component';
import {DatatableController} from '../../../core/controllers/ntk-datatable-controller';
import moment from 'moment-es6';
import {IDropdownCallbackData, IDropdownGetDataEvent} from '../../../dropdown/shared/dropdown.model';
import {map} from 'rxjs/operators';
import {LinkListItem} from '../../../core/tree/LinkListItem';
import {MatSlideToggleChange} from '@angular/material';

@Component({
    selector: 'ntk-datatable-editable',
    templateUrl: './datatable-editable.component.html',
    styleUrls: ['./datatable-editable.component.scss']
})
export class DatatableEditableComponent extends DatatableController implements AfterViewInit {
    @ViewChild('datatable', {static: false}) datatable: DatatableComponent;
    allColumns: DatatableColumn[] = [
        {
            translationKey: 'Country',
            displayValue: 'Country',
            property: 'Country',
            width: 150,
            isDefault: true,
            selectable: true
        },
        {
            translationKey: 'checked',
            displayValue: 'Checked',
            property: 'Checked',
            width: 100,
            show: true,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Checkbox,
            pin: DatatableColumnPin.left,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Sport',
            displayValue: 'Sport',
            property: 'Sport',
            mandatory: false,
            width: 300,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Select,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Year',
            displayValue: 'Year',
            property: 'Year',
            width: 100,
            show: true,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Number,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Gold',
            displayValue: 'Gold (NegativeNaturalNumber)',
            property: 'Gold',
            mandatory: false, width: 200,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Number,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Silver',
            displayValue: 'Silver (PositiveDecimal)',
            property: 'Silver',
            mandatory: false,
            width: 200,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.PositiveDecimal,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Bronze',
            displayValue: 'Bronze (Number)',
            property: 'Bronze',
            mandatory: false,
            width: 200,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Number,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Age',
            displayValue: 'Age',
            property: 'Age',
            mandatory: false,
            width: 100,
            selectable: true,
            isDefault: true
        },
        {
            translationKey: 'Date',
            displayValue: 'Date',
            property: 'Date',
            mandatory: false,
            width: 150,
            pin: DatatableColumnPin.left,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.Date,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Athlete',
            displayValue: 'Athlete',
            property: 'Athlete',
            mandatory: false,
            width: 150,
            editable: true,
            selectable: true,
            dataType: DatatableDataType.String,
            required: true,
            isDefault: true
        },
        {
            translationKey: 'Editable',
            displayValue: 'Editable',
            property: 'Editable',
            width: 100,
            isDefault: true,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'Disabled',
            displayValue: 'Disabled',
            property: 'Disabled',
            width: 100,
            isDefault: true,
            editable: true,
            selectable: true,
            required: true
        },
        {
            translationKey: 'Editable_False',
            displayValue: 'Editable False',
            property: 'Editable_False',
            width: 80,
            selectable: true,
            isDefault: true
        },
        {
            translationKey: 'Disable_Select',
            displayValue: 'Disable_Select False',
            property: 'Disable_Select',
            width: 80,
            selectable: false,
            isDefault: true
        },
        {
            translationKey: 'Actions',
            displayValue: 'Actions',
            property: 'Actions',
            width: 90,
            pin: DatatableColumnPin.right,
            isDefault: true
        }
    ];
    footer = {
        Country: 'country',
        Year: 'year',
        Sport: 'sport',
        Athlete: 'athlete',
        Gold: 100,
        Silver: 200,
        Bronze: 300,
        Total: 400,
        Age: 100,
        Date: 'date'
    };
    private cachedList: DatatableRow[] = [];
    groups: DatatableGroup[] = [];

    isShowBorder = false;
    isEditable = false;
    isDisabledSelectionRow = false;


    constructor(public cd: ChangeDetectorRef,
                injector: Injector,
                private httpClient: HttpClient) {
        super(cd, injector);
        this.groups.push(new DatatableGroup({
            name: 'Country',
            property: 'Country'
        }));
        this.storageKey = 'DatatableEditableComponent';

    }


    ngAfterViewInit() {
        this.httpClient.get('src/assets/data/grid.json').subscribe((data: any[]) => {
            data.forEach((row: DatatableRow, i) => {
                Object.assign(row, {
                    Id: _.uniqueId(`Id-`),
                    Date: moment(row.Date, `DD/MM/YYYY`).toISOString(),
                    Checked: true,
                    Editable: i % 2,
                    Disabled: !(i % 2),
                    RowDisabled: i % 7 === 0,
                    Editable_False: 0,
                    Disable_Select: true
                });
            });
            this.cachedList = data;


            this.forceRefresh = !this.isEditable;

            // Load grid
            this.refreshDatatable(true);
        });
    }

    private getData(parent: DatatableRow, options?: any): Observable<DatatableRow[]> {
        let list = this.filterRows(this.cachedList, options.query, options.groupBy);
        return of(list);
    }


    loadData(parent: DatatableRow, startIndex: number, pageSize: number, options?: any) {
        let node = this.root;
        if (parent) {
            node = this.root.find((item) => {
                return item.Id === parent.Id;
            });
        }
        if (this.isRowLoaded(parent) && this.isEditable) {
            console.log(`load from cache`);

            // Load from cache
            let nodeChildren = node.getChildren();
            let rows = nodeChildren
                .slice(startIndex, startIndex + pageSize)
                .map((item) => {
                    return item.itemData;
                });
            return of({
                Count: nodeChildren.length,
                Index: -1,
                ListItems: rows
            });
        } else {
            console.log(`load new`);
            return this.getData(parent, options).pipe(map((list) => {
                // Add
                node.isLoaded = true;
                list.forEach((item) => {
                    LinkListItem.newItem(node, item);
                });

                let rows = list.slice(startIndex, startIndex + pageSize);
                return {
                    Count: list.length,
                    Index: -1,
                    ListItems: rows
                };
            }));
        }

    }

    private filterRows(list: DatatableRow[], query: {}, groupBy: string = ``): DatatableRow[] {
        let rowsGrouped = _.where(list, query);
        if (groupBy) {
            rowsGrouped = this.groupBy(rowsGrouped, groupBy);
        }
        return rowsGrouped;
    }

    private groupBy(list: DatatableRow[], groupBy: string): DatatableRow[] {
        let rowsGrouped: DatatableRow[] = [];
        list = _.sortBy(list, groupBy);
        list.forEach((item) => {
            let value = item[groupBy];
            let pos = rowsGrouped.findIndex((r) => {
                return r.Value === value;
            });
            if (pos === -1) {
                let query = {};
                query[groupBy] = value;
                let children = _.where(list, query);
                rowsGrouped.push({
                    Id: this.createGuid(),
                    Value: value,
                    childrenCount: children.length,
                    isGroup: true
                });
            }
        });
        return rowsGrouped;
    }


    onRowDbClick(row: DatatableRow) {
        console.log('dbClick', row);
    }


    onExpandedChanged(ev) {
        this.datatable.onExpandedChanged(ev, this.groups);
    }


    isRef(cell: DatatableCell): boolean {
        if (cell.row.isGroup && cell.col.property === `Group`) {
            return true;
        }
        return false;
    }

    getRef(cell: DatatableCell) {
        if (cell.row.isGroup) {
            if (cell.col.property !== `Group` && cell.col.property !== `Actions`) {
                let col = this.datatable.columns.find((c) => {
                    return c.property === `Group`;
                });
                return {
                    row: cell.row,
                    col: col
                };
            } else {
                return cell;
            }

        } else {
            if (cell.col.property === `Group`) {
                let col = this.datatable.columns.find((c) => {
                    return c.property === `Checked`;
                });
                return {
                    row: cell.row,
                    col: col
                };
            }
            return cell;
        }
    }

    isMerged(cell: DatatableCell): boolean {
        if (cell.row.isGroup) {
            if (cell.col.property !== `Group` && cell.col.property !== `Actions`) {
                return true;
            }
        } else {
            return false;
        }
    }

    onGetSportData(event: IDropdownGetDataEvent) {
        let sport = ['Swimming', 'Gymnastics', 'Speed Skating', 'Cross Country Skiing', 'Short-Track Speed Skating', 'Diving', 'Cycling', 'Biathlon', 'Alpine Skiing', 'Ski Jumping', 'Nordic Combined', 'Athletics', 'Table Tennis', 'Tennis', 'Synchronized Swimming', 'Shooting', 'Rowing', 'Fencing', 'Equestrian', 'Canoeing', 'Bobsleigh', 'Badminton', 'Archery', 'Wrestling', 'Weightlifting', 'Waterpolo', 'Volleyball', 'Triathlon', 'Trampoline', 'Taekwondo', 'Softball', 'Snowboarding', 'Skeleton', 'Sailing', 'Rhythmic Gymnastics', 'Modern Pentathlon', 'Luge', 'Judo', 'Ice Hockey', 'Hockey', 'Handball', 'Football', 'Figure Skating', 'Freestyle Skiing', 'Curling', 'Baseball', 'Boxing', 'Beach Volleyball', 'Basketball'];
        let list = sport
            .filter((name) => {
                let searchText = event.searchText || '',
                    match = name.toUpperCase().indexOf(searchText.toUpperCase());
                return match > -1;
            })
            .map((name) => {
                return {
                    Id: this.createGuid(),
                    Name: name
                };
            });
        let data: IDropdownCallbackData = {
            Count: list.length,
            ListItems: list,
            AppendRows: []
        };
        event.callBack.next(data);
        event.callBack.complete();
    }

    onGetDropdownDisplayText(value) {
        if (value) {
            return typeof value === `object` ? value.Name : value;
        }
    }

    onDropdownChanged(cell: DatatableCell, value) {
        let cellComponent = this.datatable.getCellComponentFromCell(cell);
        if (cellComponent) {
            cellComponent.setValue(value.Name);
        }
    }

    onSave() {
        if (!this.isDataValid()) { // The control is invalid, go to first cell
            let firstCellInvalid = this.datatable.getFirstCellInvalid();
            let indexOfRow = this.datatable.getIndexOfRow(firstCellInvalid.row);
            if (indexOfRow === -1) { // Row is collapsed and it is invalid
                this.datatable.forceExpandRow(firstCellInvalid.row);
                this.datatable.bodyComponent.virtualScroll.refreshScroll(true, () => {
                    this.datatable.setSelectedCell(firstCellInvalid);
                });
            } else {
                this.datatable.setSelectedCell(firstCellInvalid);
            }
        } else { // Control is valid the control
            console.log('submit:', this.datatable.getChanges());
        }
    }


    private addGroup(row: DatatableRow): DatatableRow {
        // Insert new group at next of row
        let value = row.Value + ` new Group`;
        let groupRow = {
            Id: this.createGuid(),
            Value: value,
            childrenCount: 0,
            isGroup: true,
            hasChildren: true,
            expanded: true,
            parentId: row.parentId,
            level: row.level,
            queryOptions: row.queryOptions,
            children: []
        };
        let position = this.getPositionOfNewGroup(row);
        return this.datatable.insertRow(groupRow, position + 1);
    }

    private addFirstGroup(row: DatatableRow): DatatableRow {
        // Insert new group at next of row
        let queryOptions = this.clone(row.queryOptions);
        queryOptions.query[queryOptions.groupBy] = row.Id;
        queryOptions.level = queryOptions.level + 1;

        let groupRow = {
            Id: this.createGuid(),
            Value: `new ` + row.Value,
            childrenCount: 0,
            isGroup: true,
            hasChildren: true,
            expanded: true,
            parentId: row.UniqueKey,
            level: row.level + 1,
            queryOptions: row.queryOptions,
            children: []
        };
        let position = this.getPositionOfNewGroup(row);
        return this.datatable.insertRow(groupRow, position + 1);
    }

    private addFirstLine(groupCreated: DatatableRow) {
        // Insert
        let queryOptions = this.clone(groupCreated.queryOptions);
        queryOptions.query[queryOptions.groupBy] = groupCreated.Value;
        queryOptions.groupBy = ``;
        queryOptions.level = queryOptions.level + 1;
        let newRow = {
            Id: this.createGuid(),
            level: groupCreated.level + 1,
            parentId: groupCreated.UniqueKey,
            queryOptions: queryOptions,
            hasChildren: false
        };
        // tslint:disable-next-line:forin
        for (let name in queryOptions.query) {
            newRow[name] = queryOptions.query[name];
        }
        let positionOfViewPort = this.datatable.items.indexOf(groupCreated);
        return this.datatable.insertRow(newRow, positionOfViewPort + 1);
    }

    private addRowRecursion(row: DatatableRow) {
        if (row.level + 1 === this.groups.length) { // group
            this.addFirstLine(row);
        } else {
            let firstGroup = this.addFirstGroup(row);
            this.addRowRecursion(firstGroup);
        }
    }

    onGroupAdded(row: DatatableRow) {
        let groupCreated = this.addGroup(row);
        this.addRowRecursion(groupCreated);
    }

    onGroupCopied(row: DatatableRow) {
        // Create new group from row
        let newGroup: DatatableRow = this.clone(row);
        newGroup.Id = this.createGuid();
        newGroup.UniqueKey = null;
        newGroup.isNew = true;
        newGroup.Value = `copy of ` + newGroup.Value;

        this.copyGroup(newGroup, row);
    }

    private updateCount(row: LinkListItem<DatatableRow>) {
        let currentRow = row;
        while (currentRow) {
            // Update total for data in tree
            let total = 0;
            currentRow.getChildren().forEach((n) => {
                total = total + (n.itemData.childrenCount || 1);
            });
            currentRow.itemData.childrenCount = total;

            // Update total for data in viewport
            let itemInViewPort = this.datatable.items.find((i) => {
                return i.Id === currentRow.itemData.Id;
            });
            itemInViewPort.childrenCount = total;


            currentRow = currentRow._parentItem_;
            if (currentRow.itemData.UniqueKey === -1) { // is root
                break;
            }
        }
    }


    onShowBorderButtonChange(change: MatSlideToggleChange) {
        this.isShowBorder = change.checked;
    }

    onEditableButtonChange(change: MatSlideToggleChange) {
        this.isEditable = change.checked;
        if (this.isEditable) {
            this.isDisabledSelectionRow = true;
            this.forceRefresh = false;
        } else {
            // Change to viewmode
            this.datatable.changeToViewMode();

            // Unselect cell
            this.datatable.unSelectCell();

            // Turn on select row, disable select cell
            this.isDisabledSelectionRow = false;

            this.forceRefresh = true;
        }
    }

    isCellEditable(cell: DatatableCell): boolean {
        if (cell.col.property === `Editable`) {
            return cell.row.Editable;
        }
        return this.datatable.isCellEditableDefault(cell);
    }

    isCellDisabled(cell: DatatableCell): boolean {
        if (cell.col.property === `Disabled`) {
            return cell.row.Disabled;
        }
        return this.datatable.isCellDisabledDefault(cell);
    }

    isRowDisabled(row: DatatableRow): boolean {
        return row.RowDisabled;
    }


    onGroupAfterAdded(row: DatatableRow) {
        super.onGroupAfterAdded(row);
        this.updateChildrenCount(row);
    }

    onGroupAfterRemoved(row: DatatableRow) {
        super.onGroupAfterRemoved(row, this.cachedList);
        this.updateChildrenCount(row);
    }

    private updateChildrenCount(row: DatatableRow) {
        // Increase count
        let currentRow: DatatableRow = row;
        while (true) {
            let parent = this.datatable.items.find((item) => {
                return item.UniqueKey === currentRow.parentId;
            });
            if (parent) {
                let count = 0;
                this.datatable.items
                    .filter((item) => {
                        return item.parentId === parent.UniqueKey;
                    })
                    .forEach((item) => {
                        if (item.isGroup) {
                            count = count + item.childrenCount;
                        } else {
                            count = count + 1;
                        }
                    });
                parent.childrenCount = count;
                currentRow = parent;
            } else {
                break;
            }
        }
    }


}
