import {InjectionToken, TemplateRef} from '@angular/core';
import {Subject} from 'rxjs/Subject';


export class DatatableColumn {
    [propName: string]: any;

    property: string;
    translationKey?: string;
    displayValue?: string;
    showing?: boolean; // showing: mean that the column will show on the grid
    mandatory?: boolean; // mandatory: mean that this columns must always show in the grid
    width?: number;
    minWidth?: number;
    pin?: DatatableColumnPin;
    value?: any;
    template?: TemplateRef<any>;
    show?: boolean;
    sortable? = false;
    activatedSort?: boolean; // the column activated sort, just one column could be sortable in one time
    resizeable?: boolean;
    maxWidth?: number;
    isDefault?: boolean; // this columns must show in the grid is default
    dataType ?: DatatableDataType | string = DatatableDataType.String;
    isLastColumn ? = false;
    editable ? = false; // Check cell can edit
    selectable ? = false; // Check cell can select
    required ? = false; // Check column need fill data
    showActiveBorder?: true; // Show blue border

    constructor(properties) {
        if (!properties.pin) {
            properties.pin = DatatableColumnPin.center;
        }

        if (properties.show === undefined) {
            properties.show = true;
        }

        if (typeof properties.width === `string`) {
            properties.width = parseFloat(properties.width + ``);
        }

        Object.assign(this, properties);
    }
}

export interface ISort {
    prop: string;
    dir: SortDirection;
}

export enum SortDirection {
    Asc = 'asc',
    Desc = 'desc'
}

export enum DatatableColumnPin {
    left = 'left',
    center = 'center',
    right = 'right'
}

export class DatatableColumnsByPin {
    left: DatatableColumn[] = [];
    center: DatatableColumn[] = [];
    right: DatatableColumn[] = [];

    reset() {
        this.left.splice(0, this.left.length);
        this.right.splice(0, this.right.length);
        this.center.splice(0, this.center.length);
    }
}

export class DatatableRow {
    [propName: string]: any;

    UniqueKey?: string | number;
    Value?: any;
    Id?: string | number;
    parentId?: string | number;
    level?: number;
    hasChildren?: boolean;
    expanded?: boolean;
    isExpanding?: boolean;
    queryOptions?: any;
    $$index?: number;
    isChecked?: boolean;

    editable?: boolean; // Check row can editable
    isNew?: boolean; // Item is new (create by manual)
    isGroup?: boolean; // Check type of row (Group)
    isExpanded?: boolean; // Check row is expanded once time
}


export class DatatableGroup {
    name: string;
    property: string;
    readOnly = false;

    constructor(properties) {
        Object.assign(this, properties);
    }
}

export enum DatatableViewMode {
    grid = 'grid',
    tree = 'tree'
}

export class DatatableViewState {
    sortBy?: ISort;
    visibleColumns: Array<{ name: string, width: number }>;
}


export const NTK_DATATABLE = new InjectionToken('NTK_DATATABLE');

export class DatatableCell {
    row: DatatableRow;
    col: DatatableColumn;
}


export enum DatatableKeyboardNavigation {
    KeyLeft,
    KeyRight,
    KeyDown,
    KeyUp
}


export enum DatatableCellMode {
    View,
    Edit
}

export enum DatatableDataType {
    String = 'string',
    Date = 'date',
    Select = 'select',
    Checkbox = 'checkbox',
    Decimal = 'decimal', // 0 1.1 2
    Number = 'number', //  0 1
    Boolean = 'boolean', // true//false
    PositiveNumber = 'PositiveNumber', // -1 0 1
    PositiveDecimal = 'PositiveDecimal', // -1.1 0 1.1
    Duration = 'duration' // 1h20, -2h20
}

export class DatatableChanged {
    added: DatatableRow[] = [];
    edited: DatatableRow[] = [];
    deleted: DatatableRow[] = [];
}

class State {
    touched = false;
}

export class DatatableRowState {
    Id: string | number;

    [propName: string]: State | any;

    constructor(properties) {
        Object.assign(this, properties);
    }
}

// tslint:disable-next-line:no-empty-interface
export interface DatatableComponentInterface {
    isDisabledSelectionRow: boolean;
    rowReady: Subject<any>;
    leftWidth: number;
    centerWidth: number;
    rightWidth: number;

    changeToViewMode();

    goDownCell();

    markCellModified(cell: DatatableCell);

    updateState(cell: DatatableCell);

    isCellValidate(cell: DatatableCell);

    isMerged(cell: DatatableCell);

    isRef(cell: DatatableCell);

    isCellEditable(cell: DatatableCell);

    isCellDisabled(cell: DatatableCell);

    getCellSelected(): DatatableCell;

    isRowDisabled(row: DatatableRow): boolean;
}
