import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { LazyLoaderComponent } from './lazy-loader.component';

@NgModule({
    declarations: [
        LazyLoaderComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        LazyLoaderComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class LazyLoaderModule {
}
