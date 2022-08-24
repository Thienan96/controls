import { Component, EventEmitter, Input, Output } from '@angular/core';

import { speedDialFabAnimations } from './speed-dial-fab.animations';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

export interface FabButton {
    icon: string;
    tooltip: string;
}
@Component({
    selector: 'speed-dial-fab',
    templateUrl: './speed-dial-fab.component.html',
    styleUrls: ['./speed-dial-fab.component.scss'],
    animations: speedDialFabAnimations
})
export class SpeedDialFabComponent {
    private _fabButtons = new BehaviorSubject<any>([]);
    private _defaultIcon = new BehaviorSubject<any>('add');
    // @Input('buttons') fabButtons: FabButton[];
    @Input() isDisabled;
    // using for mobile, open by click to defaul button
    @Input() triggerByClick: boolean;
    @Input() showTooltip: boolean = true;
    @Output('fabClick') fabClick = new EventEmitter();
    @Output() defaultClick = new EventEmitter();
    buttons = [];
    fabTogglerState = 'inactive';
    isSvg: boolean;
    @Input('defaultIcon') set defaultIcon(value) {
        this._defaultIcon.next(value);
    }
    @Input('buttons') set fabButtons(value) {
        this._fabButtons.next(value);
    }
    get items() {
        return this._fabButtons.getValue();
    }
    get default() {
        return this._defaultIcon.getValue();
    }
    constructor(private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer) {
        this._fabButtons.subscribe(btn => {
            btn.forEach(item => {
                if (!!item.icon) {
                    this.matIconRegistry.addSvgIcon(
                        item.action,
                        this.domSanitizer.bypassSecurityTrustResourceUrl(item.icon)
                    );
                }
            });
        });

        this._defaultIcon.subscribe(btn => {
            this.isSvg = this.checkExtensionICon(btn);
            if (this.isSvg) {
                this.matIconRegistry.addSvgIcon(
                    'default',
                    this.domSanitizer.bypassSecurityTrustResourceUrl(btn)
                );
            }
        });

    }


    showItems() {
        if (!this.buttons.length) {
            this.fabTogglerState = 'active';
            this.buttons = this.items;
        }
    }

    hideItems() {
        if (this.buttons.length) {
            console.log('hide--items');
            this.fabTogglerState = 'inactive';
            this.buttons = [];
        }
    }

    checkExtensionICon(icon: string): boolean {
        return (/(\.|\/)(svg)$/i).test(icon);
    }

    // public onToggleFab() {
    //     this.buttons.length ? this.hideItems() : this.showItems();
    // }

    public onClickFab(btn: { icon: string }) {
        this.hideItems();
        this.fabClick.emit(btn);
    }

    onClickDefault() {
        if (this.triggerByClick) {
            if (this.fabTogglerState === 'inactive') {
                this.showItems();
            } else {
                this.hideItems();
            }
        } else {
            this.defaultClick.emit();
        }
    }
}