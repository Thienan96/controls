/**
 * This almost to allow comunicate with ngx-table component
 *
*/
export class Page {
    // The number of elements in the page
    size = 0;
    // The total number of elements
    totalElements = 0;
    // The total number of pages
    totalPages = 0;
    // The current page number
    pageNumber = 0;
}

export class GridColumnDef {
    name: string;
    translationKey: string;

    property: string;
    isDefault: boolean; // show it by default or not

    initialWidth: number;
    minWidth?: number;

    currentWidth?: number;

    // for columns selection
    // showing: mean that the column will show on the grid
    // madatory: mean that this columns must always show in the grid
    showing?: boolean;
    mandatory?: boolean;

    // required: used only for editing grid, mean that the value if this column must be required
    required?: boolean;

    negativeCheck?: boolean;

    displayValue?: string;

    maxWidth?: number;

    disableSort?: boolean;
}

export class SortEvent {
    sorts: SortDef[];
    column: {name: string; prop: string}; // infact it is column object
    prevValue: 'desc' | 'asc';
    newValue: 'desc' | 'asc';
}

export class SortDef {
    dir: 'desc' | 'asc';
    prop: string;
}

export class GridViewState {
    sortBy?: SortDef[];
    visibleColumns: Array<{name: string, width: number}>;
}
