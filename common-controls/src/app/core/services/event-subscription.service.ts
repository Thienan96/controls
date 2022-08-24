import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';


Injectable({
    providedIn: 'root'
})
// Service used to raise/catch events between applications
export class EventSubscriptionService {
    // using callback for refresh page when close dialog
    private event = new Subject<{ name: string; value: any, callback?: (x) => void }>();

    get onEventChange() {
        return this.event.asObservable();
    }

    raise(name: string, value: any, callback?: (x) => void) {
        this.event.next({ name: name, value: value, callback: callback });
    }

    constructor() {

    }
}