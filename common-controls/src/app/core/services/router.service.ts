import {EventEmitter, Injectable, Injector, Output} from '@angular/core';
import {ActivatedRoute, NavigationEnd, NavigationExtras, NavigationStart, Router, RouterStateSnapshot} from '@angular/router';
import {StorageLocation, StorageService} from './storage.service';
import {RouteStorageKey} from '../../shared/models/common.info';

@Injectable({
    providedIn: 'root'
})
export class RouterService {
    @Output() onCurrentStateChanged = new EventEmitter();
    @Output() onRouteNavStartChanged = new EventEmitter();

    protected _router: Router;
    protected _storageService: StorageService;
    protected _activatedRoute: ActivatedRoute;

    constructor(protected injector: Injector) {
        this._router = this.injector.get(Router);
        this._storageService = this.injector.get(StorageService);
        this._activatedRoute = this.injector.get(ActivatedRoute);

        this._router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.onRouteNavStart(event);
                this.onRouteNavStartChanged.emit(event);
            }
            if (event instanceof NavigationEnd) {
                this.onRouteNavEnd(event);
            }
        });

    }

    onRouteNavStart(event: NavigationStart) {
    }

    onRouteNavEnd(event: NavigationEnd) {
        let state = this.getStateFromRouterEvent(this._activatedRoute);
        if (this.canSetCurrentState(state)) {
            let route = {
                state: state,
                url: this._router.url
            };
            this.setCurrentRoute(route);
            this.onCurrentStateChanged.emit(route);
        }
    }

    getStateFromRouterEvent(event: ActivatedRoute | RouterStateSnapshot | any): string {
        // current module is lazyload, route point to module, current path is ''
        if (event.firstChild && event.firstChild.firstChild === null && event.firstChild.routeConfig.path === '') {
            if (!event.routeConfig) {
                return '';
            }
            return event.routeConfig.path;
        }

        // current module is normal
        if (event.firstChild === null) {
            if (event.routeConfig) {
                return event.routeConfig.path;
            } else {
                return '';
            }
        } else {
            return this.getStateFromRouterEvent(event.firstChild);
        }
    }

    canSetCurrentState(state: string) {
        return !(state === '**' || state === ':lang' || state === '');
    }

    /**
     * Set current state contains params (example: users/1)
     * @param state
     */
    setCurrentRoute(state: { state: string, url: string }) {
        if (this.canSetCurrentState(state.state)) {
            this._storageService.setSessionValue(RouteStorageKey.CurrentRoute, state);
            this._storageService.setLocalUserValue(RouteStorageKey.CurrentRoute, state);
        }
    }

    getCurrentState(): any {
        let currentRoute = this.getCurrentRoute();
        return currentRoute ? currentRoute.state : null;
    }

    getCurrentRoute(): { state: string, url: string } {
        return this._storageService.getValue(RouteStorageKey.CurrentRoute, StorageLocation.Session);
    }

    navigateTo(commands: any[], extras?: NavigationExtras) {
        let paths = <string[]> commands[0].split('/');
        // Trim state
        if (paths[0] === '') {
            paths.splice(0, 1);
        }
        return this._router.navigate(commands, extras);
    }

    toState(name: string) {
        return this.navigateTo([name]);
    }

    navigateByUrl(url: string, extras?: NavigationExtras): Promise<boolean> {
        return this._router.navigateByUrl(url, extras);
    }

    /**
     * Get state from url
     * @param url
     */
    getState(url: string): string {
        throw new Error('Error get current slide');
    }


    /**
     * Go to State after login
     */
    toDefaultStateAfterLogin() {
        throw new Error('Override toDefaultStateAfterLogin to State after login');
    }
}
