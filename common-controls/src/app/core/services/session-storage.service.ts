import {Injectable, Injector} from '@angular/core';
import * as storage from 'ngx-store';
import {CommunicationService} from './communication.service';

@Injectable({
    providedIn: 'root'
})
export class SessionStorageService extends storage.SessionStorageService {
    constructor(private injector: Injector) {
        super();
    }

    get sessionStorage() {
        return this.injector.get(CommunicationService).getSessionStorage();
    }

    set<T>(key: string, value: T): T {
        if (this.sessionStorage) {
            this.sessionStorage[key] = value;
            if(this.sessionStorage.$apply) {
                this.sessionStorage.$apply();
            }

        }
        return super.set(key, value);
    }
}
