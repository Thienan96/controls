import {Component, ContentChild, TemplateRef, ViewContainerRef, OnInit} from '@angular/core';
import {TemplatePortal} from '@angular/cdk/portal';


@Component({
    selector: 'ntk-slide',
    templateUrl: './slide.component.html'
})
export class SlideComponent implements OnInit {
    @ContentChild(TemplateRef, { static: false}) private templateRef: TemplateRef<any>;

    content: TemplatePortal | null = null;
    isActive = false;
    position: number;

    constructor(private _viewContainerRef: ViewContainerRef) {

    }


    ngOnInit() {
        this.content = new TemplatePortal(this.templateRef, this._viewContainerRef);
    }


}
