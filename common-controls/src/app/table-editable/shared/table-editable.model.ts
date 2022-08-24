export enum TableEditableControlType {
    Select,
    Date,
    Input,
    Textarea,
    Number,
    Decimal,
    Currency,
    Checkbox,
    Percent,
    DecimalNegative,
    PercentNegative,
}

export class TableEditableCell {
    row: number;
    col: number;
    container?: JQuery;
    columnName?: string;

    constructor(properties) {
        Object.assign(this, properties);
    }
}

export enum TableEditableKeyboardNavigation {
    KeyLeft,
    KeyRight,
    KeyDown,
    KeyUp
}

export class TabledEditableChanged {
    added = [];
    edited = [];
    deleted = [];
}

export enum TableEditableEditMode {
    QuickEdit, // Edit Quickly
    Standard // Google excel
}

export enum TableEditableCellMode {
    View,
    Edit
}


export class TableEditableRow {

}
