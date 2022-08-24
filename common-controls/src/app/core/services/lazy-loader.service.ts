import {Compiler, Injectable, InjectionToken, Injector, isDevMode, NgModuleFactory, NgModuleRef} from '@angular/core';
import {BlockUIService} from './blockUI.service';
import {Observable, of, throwError} from 'rxjs';
import {catchError, flatMap} from 'rxjs/operators';

export const LAZY_MODULES = new InjectionToken<any>('LAZY_MODULES');
export const INJECTION_TOKEN_LIST = new InjectionToken<any>('INJECTION_TOKEN_LIST');

@Injectable({
    providedIn: 'root'
})
export class LazyLoaderService {
    isSupportLazyLoad = false;
    private _blockUIService: BlockUIService;
    private _compiler: Compiler;
    private _lazyWidgets: any;
    private styles = [];

    constructor(protected _injector: Injector) {
        this._compiler = this._injector.get(Compiler);
        this._blockUIService = this._injector.get(BlockUIService);
        this._lazyWidgets = this._injector.get(LAZY_MODULES, null);
    }

    /**
     * Get Module by moduleName
     * @param moduleName : Name of module
     * @param injector: Injector of module
     */
    getModule(moduleName: string, injector?: Injector): Observable<NgModuleRef<any>> {
        return new Observable((sub) => {
            if (this.isSupportLazyLoad) {
                this.manualLoadModule(moduleName, injector).then((m) => {
                    if (isDevMode()) {
                        console.log('@ntk-common-controls - manual lazy load module ', m);
                    }
                    sub.next(m);
                    sub.complete();
                });
            } else {
                let m = injector.get(NgModuleRef);
                sub.next(m);
                sub.complete();
            }
        });
    }

    getService(name: string): Observable<any> {
        let segs = name.split(':');
        let module = segs[0],
            serviceName = segs[1];
        return this.getModule(module, this._injector).pipe(flatMap((m) => {
            let injectionTokenList = m.injector.get(INJECTION_TOKEN_LIST);
            let token = injectionTokenList ? injectionTokenList[serviceName] : (m.instance.getInjectionTokenList ? m.instance.getInjectionTokenList()[serviceName] : null);

            if (isDevMode()) {
                console.log('@ntk-common-controls - lazy load module - getService - injectionTokenList ', injectionTokenList);
                console.log('@ntk-common-controls - lazy load module - getService - tokens ', token);
            }

            let svc = m.injector.get(token);
            if (!svc) {
                console.error('Service not found ', name);
            }
            return of(svc);
        }),
        catchError((err) => {
            console.log('getService error ', err);
            return throwError(err);
        }));
    }

    execute(name: string, func: string, ...params: any[]) {
        return this.getService(name).pipe(flatMap((s) => {
            if (isDevMode()) {
                console.log('@ntk-common-controls - lazy load module - execute -servivce ', s);
            }
            return s[func].apply(s, params);
        }),
        catchError((err) => {
            console.log('execute error ', err);
            return throwError(err);
        }));
    }

    executeService(name: string, func: string, ...params: any[]) {
        return this.getService(name).pipe(flatMap((s) => {
            if (isDevMode()) {
                console.log('@ntk-common-controls - lazy load module - executeService -servivce ', s);
            }
            return of(s[func].apply(s, params));
        }));
    }

    private async manualLoadModule(moduleName: string, injector: Injector = this._injector): Promise<NgModuleRef<any>> {
        this._blockUIService.start();
        const tempModule = await this._lazyWidgets[moduleName]();
        let moduleFactory;

        if (tempModule instanceof NgModuleFactory) {
            // For AOT
            moduleFactory = tempModule;
        } else {
            // For JIT
            moduleFactory = await this._compiler.compileModuleAsync(tempModule);
        }

        const moduleRef: NgModuleRef<any> = moduleFactory.create(injector);


        this._blockUIService.stop();
        return moduleRef;
    }

    /**
     * Remove styles from dom
     */
    removeStyles() {
        let links = document.getElementsByTagName('link');
        $(links).each((num, link) => {
            this.styles.forEach((style) => {
                if (style.id === link.id) {
                    $(link).remove();
                }
            });
        });
        this.styles.splice(0, this.styles.length);
    }

    loadDynamicStyle(id: string, href: string): Observable<any> {
        // push style to list that app can remove style from dom when destroy module
        this.styles.push({
            id: id,
            href: href
        });

        return new Observable<any>((subscriber) => {
            const head = document.getElementsByTagName('head')[0];

            let themeLink = document.getElementById(id) as HTMLLinkElement;
            if (themeLink) {
                themeLink.href = href;
                subscriber.next();
                subscriber.complete();
            } else {
                const style = document.createElement('link');
                style.id = id;
                style.rel = 'stylesheet';
                style.href = `${href}`;
                style.onload = () => {
                    subscriber.next();
                    subscriber.complete();
                };
                style.onerror = (error) => {
                    subscriber.error(error);
                    subscriber.complete();
                };
                head.appendChild(style);
            }
        });
    }

    loadDynamicScript(id: string, scriptPath: string): Observable<any> {
        return new Observable<any>((subscriber) => {
            const head = document.getElementsByTagName('head')[0];
            let scriptLink = document.getElementById(id) as HTMLScriptElement;
            if (scriptLink) {
                scriptLink.src = scriptPath;
                subscriber.next();
                subscriber.complete();
            } else {
                let script = document.createElement('script');
                script.id = id;
                script.src = `${scriptPath}`;
                script.async = false;
                script.onload = () => {
                    subscriber.next();
                    subscriber.complete();
                };
                script.onerror = (error) => {
                    subscriber.error(error);
                    subscriber.complete();
                };
                head.appendChild(script);
            }
        });
    }
}
