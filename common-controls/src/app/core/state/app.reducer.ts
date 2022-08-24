import { AppStateData, AppState } from './index';
import * as fromAppActions from './app.action';

export const initialCommonState: AppStateData = <AppStateData>{ };

export function reducer(state = initialCommonState, action: fromAppActions.All): any {
    switch (action.type) {
        case fromAppActions.CHANGE_UI_LANGUAGE:
            return { LanguageCode: action.payload };
        
        default: 
            return state;
    }
} 

export const getChangeUILanguageState = (state: AppState) => state.ChangeUILanguageState.LanguageCode;