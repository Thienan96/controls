import { Subscription, Subscriber } from 'rxjs';

export interface IDropdownCallbackData {
    Count?: number;
    ListItems: any[];
    AppendRows?: any[];
}

export interface IDropdownGetDataEvent {
    startIndex: number;
    pageSize: number;
    callBack: Subscriber<IDropdownCallbackData>;
    searchText?: string;
    idToGetIndex?: string;
}
