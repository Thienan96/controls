import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MenuHoverService {
    private _menuContentEnterSubject = new Subject();
    private _menuContentLeave = new Subject();
    private _menuClose = new Subject();

    getMenuContentEnter() {
        return this._menuContentEnterSubject.asObservable();
    }

    setMenuContentEnter(value) {
        this._menuContentEnterSubject.next(value);
    }

    getMenuContentLeave() {
        return this._menuContentLeave.asObservable();
    }

    setMenuContentLeave(value) {
        this._menuContentLeave.next(value);
    }

    getMenuClose() {
        return this._menuClose.asObservable();
    }

    setMenuClose(value) {
        this._menuClose.next(value);
    }
}
