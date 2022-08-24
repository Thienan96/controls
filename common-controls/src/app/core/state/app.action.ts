import { Action } from '@ngrx/store';

export const CHANGE_UI_LANGUAGE = 'CHANGE_UI_LANGUAGE';

export class ChangeUILanguageAction implements Action {
    type = CHANGE_UI_LANGUAGE;
    
    constructor(public payload: string) { }
}

//---------------------------------------------------------------------------------------------------------------------
export type All = ChangeUILanguageAction;