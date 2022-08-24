import {
    Component,
    ContentChild,
    EventEmitter,
    HostListener,
    Injector,
    Input,
    NgZone,
    Output,
    TemplateRef
} from '@angular/core';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';
import {FlexibleConnectedPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {AutocompletePanelComponent} from '../autocomplete-panel/autocomplete-panel.component';
import {HelperService} from '../../core/services/helper.service';
import {ThemePalette} from '@angular/material';
import { filter } from 'rxjs/operators';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';

@Component({
    selector: 'ntk-autocomplete',
    templateUrl: './autocomplete.component.html',
    styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent {
    @ContentChild(TemplateRef, {static: false}) templateRef: TemplateRef<any>;

    @Input() template;
    @Input() onGetData;
    @Input() maxHeight = 300;
    @Input() minHeight = 50;
    @Input() itemHeight = 48;
    @Input() color: ThemePalette;
    @Input() connectedTo: HTMLElement;


    @Output() closed = new EventEmitter();
    @Output() opened = new EventEmitter();
    @Output() selected = new EventEmitter();


    loading = false;
    autocompletePanelComponent: AutocompletePanelComponent;
    private overlayRef: OverlayRef;

    @Input() isSmallScreen = false;
    @Input() title: string;
    @Input() searchKeyword: string;
    @Output() searchKeywordChange = new EventEmitter();

    constructor(private helperService: HelperService,
                private overlay: Overlay,
                private injector: Injector,
                private zone: NgZone) {
    }

    get isOpen(): boolean {
        return !!this.overlayRef;
    }


    @HostListener('window:resize')
    onWindowResize() {
        if (this.isOpen) {
            this.updateLayout();
        }
    }

    updateLayout() {
        if (this.overlayRef) {
            if (!this.isSmallScreen) {
                this.overlayRef.updateSize({
                    width: this.getWidth(),
                    height: this.getHeight()
                });

                this.overlayRef.updatePositionStrategy(this.getPosition(this.connectedTo));
            }            
        }
    }

    hidePanel() {
        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.autocompletePanelComponent = null;
        this.overlayRef = null;

        this.closed.emit();
    }

    showPanel() {
        let config: OverlayConfig = {
            positionStrategy: this.getPosition(this.connectedTo),
            backdropClass: 'autocomplete-backdrop',
            height: this.getHeight(),
            width: this.getWidth(),
            maxHeight: this.maxHeight,
            minHeight: this.minHeight,
            hasBackdrop: true
        };
        if (this.isSmallScreen) {
            config = {             
                width: '100vw',
                height: '100vh',
                maxHeight: '100vh',
                minWidth: '100vw',
                panelClass: 'ntk-mat-dropdown-panel'
            };
        }
        this.overlayRef = this.overlay.create(config);

        this.overlayRef.keydownEvents()
        .pipe(filter(event => {
            return event.keyCode === ESCAPE && !hasModifierKey(event);
        }))
        .subscribe(event => {
            event.preventDefault();
            this.hidePanel();
        });

        this.overlayRef.backdropClick().subscribe(() => {            
            this.hidePanel();
        });

        let autocompletePanelComponentPortal = new ComponentPortal(AutocompletePanelComponent, null, this.getPanelInjector());
        this.autocompletePanelComponent = this.overlayRef.attach(autocompletePanelComponentPortal).instance;
        this.autocompletePanelComponent.title = this.title;
        this.autocompletePanelComponent.isSmallScreen = this.isSmallScreen;
        this.autocompletePanelComponent.searchKeyword = this.searchKeyword;
        this.autocompletePanelComponent.isShowSearch = !!this.searchKeyword;
        this.autocompletePanelComponent.searchKeywordChange.asObservable().subscribe((searchKeyword) => {
            this.searchKeyword = searchKeyword;
            this.searchKeywordChange.next(searchKeyword);
        });
        this.opened.emit();
    }

    onSelected(item) {
        this.selectItem(item);
        this.hidePanel();
    }

    onTotalChanged() {
        this.updateLayout();
    }

    selectNextItem(number) {
        this.autocompletePanelComponent.selectNextItem(number);
    }

    getCurrentItem() {
        return this.autocompletePanelComponent.getCurrentItem();
    }

    selectItemAndClose() {
        let currentItem = this.getCurrentItem();
        if (currentItem) {
            this.selectItem(currentItem);
            this.hidePanel();
        }
    }

    refresh() {
        this.autocompletePanelComponent.currentIndex = -1;
        this.autocompletePanelComponent.virtualListComponent.refresh();
    }

    private selectItem(item) {
        this.autocompletePanelComponent.currentIndex = -1;
        this.selected.emit(item);
    }

    private getPanelInjector(): PortalInjector {
        let injectorTokens = new WeakMap();
        injectorTokens.set(MAT_DIALOG_DATA, {
            template: this.templateRef || this.template,
            onGetData: (data) => {
                this.zone.runTask(() => {
                    this.loading = true;
                    let callBack = data.callBack;
                    data.callBack = (callBackData) => {
                        this.loading = false;
                        callBack(callBackData);
                    };
                    this.onGetData(data);
                });
            },
            onSelected: this.onSelected.bind(this),
            changeTotal: this.onTotalChanged.bind(this),
            itemHeight: this.itemHeight,
            onClose: () => {
                if (this.isOpen) {
                    this.hidePanel();
                }
            }
        });
        return new PortalInjector(this.injector, injectorTokens);
    }

    private getPosition(connectedToContainer: Element): FlexibleConnectedPositionStrategy {
        let overlayPosition = this.overlay.position().flexibleConnectedTo(<any>connectedToContainer);
        overlayPosition.positions.push(
            {
                offsetX: 0,
                offsetY: 4,
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'top'
            },
            {
                offsetX: 0,
                offsetY: 0,
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'bottom'
            },
            {
                offsetX: 0,
                offsetY: 0,
                originX: 'end',
                originY: 'bottom',
                overlayX: 'end',
                overlayY: 'top'
            },
            {
                offsetX: 0,
                offsetY: 0,
                originX: 'end',
                originY: 'top',
                overlayX: 'end',
                overlayY: 'bottom'
            },
            {
                offsetX: 0,
                offsetY: 0,
                originX: 'end',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'center'
            },
            {
                offsetX: 0,
                offsetY: 0,
                originX: 'end',
                originY: 'top',
                overlayX: 'end',
                overlayY: 'center'
            }
        );
        return overlayPosition;
    }

    private getWidth(): number {
        return this.connectedTo.clientWidth;
    }

    private getHeight(): number {
        let h1 = $(this.connectedTo).offset().top,
            h2 = $(window).height() - (h1 + $(this.connectedTo).height()),
            height = Math.max(h1, h2) - 20;
        if (this.autocompletePanelComponent && this.autocompletePanelComponent.dataLoaded) {
            if (this.autocompletePanelComponent.virtualListComponent.itemCount === 0) {
                return this.minHeight;
            } else {
                let total = this.autocompletePanelComponent.virtualListComponent.itemCount,
                    minHeight = total * this.itemHeight;
                if (minHeight < height) {
                    height = minHeight;
                }
            }
        }

        if (height > this.maxHeight) {
            height = this.maxHeight;
        }


        return height;
    }
}
