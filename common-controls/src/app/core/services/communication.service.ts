import {Injectable, Injector} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs';

/**
 * Angular send/receive message to/from angularJs
 */
@Injectable({
    providedIn: 'root'
})
export class CommunicationService {
    private event = new Subject<{ name: string; value: any }>();

    get onEventChange() {
        return this.event.asObservable();
    }

    constructor(protected injector: Injector) {
    }

    protected get angularJs() {
        let $injector = this.injector.get('$injector', null);
        if ($injector) {
            return $injector.get('comunicate', null);
        } else {
            return null;
        }
    }

    getCommunicationServiceAngularJS() {
        return this.angularJs;
    }

    registerEvent() {
        let com = this.angularJs;
        if (com) {
            com['eventListener'] = (name, params) => {
                this.event.next({
                    name: name,
                    value: params
                });
            };
        }
    }

    navigate(name: string, params?: any) {
        this.angularJs.navigate(name, params);
    }

    private get(name) {
        let com = this.angularJs;
        if (com) {
            return com[name];
        }
    }

    protected excute(...params) {
        let com = this.angularJs,
            name = params[0];
        params.splice(0, 1);
        if (com && this.get(name)) {
            return com[name].apply(com, params);
        }
    }

    getSessionStorage() {
        return this.excute('getSessionStorage');
    }

    getLocalStorage() {
        return this.excute('getLocalStorage');
    }

    logOut() {
        return this.excute('logOut');
    }

    getCurrentClientId() {
        return this.excute('getCurrentClientId');
    }

    getCurrentUILanguage() {
        return this.excute('getCurrentUILanguage');
    }

    /**
     * Raise scope global event into AngularJS system
     * @param eventName : name of event to rasie
     * @param params : on single value to pass through event receiver
     */
    raise(...params) {
        params.splice(0, 0, 'raise');
        return this.excute(...params);
    }

    checkIfNeedRenewSession(): boolean {
        return this.excute('checkIfNeedRenewSession');
    }

    updateAppUrl(params) {
        this.excute('updateAppUrl', params);
    }

    showOfflineWarning() {
        this.raise('show_offline_warning');
    }

    updateLastCall() {
        this.raise('update_last_call');
    }
}
