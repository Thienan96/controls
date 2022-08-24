import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from '@angular/router';
import {forkJoin, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './core/services/authentication.service';
import {TranslationService} from './core/services/translation.service';
import {AppParams} from './core/app.params';
import {StorageService} from './core/services/storage.service';
import {HelperService} from './core/services/helper.service';
import {ModuleBarService} from './module-bar/shared/module-bar.service';


@Injectable({
    providedIn: 'root'
})
export class AuthGuardService implements CanActivate, CanActivateChild {

    constructor(private authService: AuthenticationService,
                private trans: TranslationService,
                private router: Router,
                private appParam: AppParams,
                private _storageSvc: StorageService,
                private helperService: HelperService,
                private moduleBarService: ModuleBarService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        return this.checkLogin();
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }


    checkLogin(): Observable<any> {
        if (this.authService.isAuthenticated) {
            return this.trans.loadTranslations('en');
        }

        let obs = [
            this.autoLogon(),
            this.trans.loadTranslations('en')
        ];

        return forkJoin(obs).pipe(map(xs => {

            this.helperService.TranslationService.raiseLanguageChange();

            console.log('all obs are complete: ', xs);

            this._storageSvc.setLocalUserValue('GeneralSettings', {
                gridMode: 'compact',
                gridAlternateColor: true
            });

            return true;
        }));
    }

    private autoLogon(): Observable<boolean> {
        const connectionTokens = this.appParam.connectionInfor.split('/');
        return new Observable<boolean>(sub => {
            this.authService.logon(connectionTokens[0], connectionTokens[1], 'en').subscribe(x => {
                // because user return by EJ4 not the same as HS/CL so that we need to set user context key again (from UserLogin to Login)
                let user = <any> this.helperService.AuthenticationService.getAuthUser();
                if (user) {
                    this.helperService.StorageService.setUserContextKey(user.Login || user.UserLogin);
                    this.moduleBarService.raiseUpdateModulesAccessRights(user.ScreenAccessRights);

                } else {
                    this.helperService.StorageService.setUserContextKey('UserLogin');
                    this.helperService.StorageService.setCompanyContextKey('CompanyContextKey');
                }


                if (Array.isArray(x)) {
                    this.authService.logon(connectionTokens[0], connectionTokens[1], 'en', x[0]['ContextId'] || x[0]['Id']).subscribe(y => {
                        console.log('log with company sucess: ', y);
                        sub.next(true);
                        sub.complete();
                    });
                } else {
                    sub.next(true);
                    sub.complete();
                }
            }, (error) => {
                console.log('logon error: ', error);
                sub.error(error);
                sub.complete();
            });
        });
    }

}
