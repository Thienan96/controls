import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {DateAdapter, MatIconRegistry, MAT_DATE_FORMATS} from '@angular/material';
import {HsclDateAdapter, hsclDateFormats} from './shared/directives/min-date.directive';
import {
    CommonControlsSharedModule,
    CustomHttpInterceptor,
    UtilityService
} from './shared/common-controls-shared.module';
import {AppParams} from './core/app.params';
import {DummyHttpInterceptor} from './core/services/dummy-http.interceptor';
import {DemoModule} from './demo/demo.module';
import {RouterService} from './core/services/router.service';
import {CustomRouterService} from './demo/shared/CustomRouter.service';
import { TOOLBAR_SVG_ICONS } from './toolbar/shared/svg-icon-dictionany';
import { SVG_ICON_DICTIONARY } from './svg-icon-dictionary';


@NgModule({
    declarations: [],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        FlexLayoutModule,
        CommonControlsSharedModule,
        ToastrModule.forRoot({
            timeOut: 5000,
            positionClass: 'toast-top-right',
            preventDuplicates: true,
            countDuplicates: true
        }),
        DemoModule
    ],
    providers: [
        {provide: AppParams, useValue: window['APP_PARAMS']},

        {provide: HTTP_INTERCEPTORS, useClass: DummyHttpInterceptor, multi: true},

        // Connect to server
        // {provide: HTTP_INTERCEPTORS, useClass: CustomHttpInterceptor, multi: true},

        {provide: DateAdapter, useClass: HsclDateAdapter},
        {provide: MAT_DATE_FORMATS, useValue: hsclDateFormats},
        CustomRouterService,
        {
            provide: RouterService,
            useExisting: CustomRouterService
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, util: UtilityService) {
        // register all svg
        let dic = Object.assign(TOOLBAR_SVG_ICONS, SVG_ICON_DICTIONARY);

        for (let key in dic) {
            let url: string = util.addSlashIfNotExists(util.getRootUrl()) + 'src/assets/svg/' + dic[key];
            iconRegistry.addSvgIcon(key, sanitizer.bypassSecurityTrustResourceUrl(url));
        }
    }
}
