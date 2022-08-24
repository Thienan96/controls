import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import 'rxjs/add/operator/map'; // to allow use old style of code: Observer.map()
import 'rxjs/add/operator/toPromise'; // allow convert to promise

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule
    ],
    exports: [
    ],
    entryComponents: [
    ],
    providers: []
})
export class CoreModule {
}
