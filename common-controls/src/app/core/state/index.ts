import { ActionReducerMap, ActionReducer, MetaReducer } from '@ngrx/store';

import * as fromAppReducers from './app.reducer';

export interface AppStateData {
    LanguageCode: string;
}

export interface AppState {
    ChangeUILanguageState: AppStateData;
}

//---------------------------------------------------------------------------------
export function logger(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
    return function (state: AppState, action: any): AppState {
        //console.info('State Logger -> Env: ', process.env.NODE_ENV, action, state);
        return reducer(state, action);
    };
}

//export const metaReducers: MetaReducer<AppState>[] = process.env.NODE_ENV === 'dev' ? [logger] : [];
// why cannot compile?
export const metaReducers: MetaReducer<AppState>[] = [];


export const reducers: ActionReducerMap<AppState> = {
    // properties must be the same AppState class
    ChangeUILanguageState: fromAppReducers.reducer
};
