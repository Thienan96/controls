import {Component, ComponentRef, Injector, Input, OnChanges, OnInit, SimpleChanges, ViewContainerRef} from '@angular/core';
import {INJECTION_TOKEN_LIST, LazyLoaderService} from '../services/lazy-loader.service';


@Component({
    selector: 'ntk-lazy-loader',
    template: '',
    styleUrls: ['./lazy-loader.component.scss']
})
export class LazyLoaderComponent implements OnInit, OnChanges {
    @Input() module;
    @Input() component;
    @Input() input: any;
    componentRef: ComponentRef<any>;


    constructor(private viewContainerRef: ViewContainerRef,
                private injector: Injector) {
    }

    ngOnInit() {
        /**
         * Load new module , parent of new module is new module (set injector)
         */
        let lazyLoaderService: LazyLoaderService = this.injector.get(LazyLoaderService);
        lazyLoaderService.getModule(this.module, this.injector).subscribe((moduleRef) => {
            let injectionTokenList = moduleRef.injector.get(INJECTION_TOKEN_LIST, null),
                componentToken = injectionTokenList[this.component],
                dynamicComponentType = moduleRef.injector.get(componentToken, null),
                compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory(dynamicComponentType);

            // create component scope is moduleRef
            this.componentRef = this.viewContainerRef.createComponent(compFactory, undefined, moduleRef.injector);
            this.updateInput();
        });
    }

    private updateInput() {
        if (this.componentRef) {
            // tslint:disable-next-line:forin
            for (let name in this.input) {
                // @ts-ignore
                this.componentRef.instance[name] = this.input[name];
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.input) {
            this.updateInput();
        }
    }

    getComponent() {
        return this.componentRef ? this.componentRef.instance : null;
    }
}
