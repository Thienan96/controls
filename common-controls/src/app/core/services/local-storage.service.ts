import * as storage from 'ngx-store';
import {Injectable, Injector} from '@angular/core';
import {CommunicationService} from './communication.service';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService extends storage.LocalStorageService {
    
    constructor(private injector: Injector) {
        super();
    }

    private get localStorage(): any {
        let svc = this.injector.get(CommunicationService);

        // when angularJS not availble we dont need to work on local storage of ANgualrJS
        if (!svc) {
            return null;
        }

        return svc.getLocalStorage();
    }

    set<T>(key: string, value: T): T {
        // Set in AngularJs
        if (this.localStorage) {
            this.localStorage[key] = value;
            if(this.localStorage.$apply) {
                this.localStorage.$apply();
            }
        }
        // Set in Angular
        return super.set(key, value);
    }

    /**
     * This just get store object of Angularjs prefix by 'helpsites' is the one of AngularJs app
     * @param key: just keey, you need to manage prefix of user context or  company context key
     */
    getNgStorage(key: string): any {
        if (this.localStorage) {
            return this.localStorage[key];
        } else {
            return undefined;
        }        
    }
}
