import {ChangeDetectorRef, Injector, OnInit, ViewChild} from "@angular/core";
import {MatDrawer, MatDrawerContainer} from "@angular/material/sidenav";
import {ModuleBarComponent} from "../../module-bar/module-bar/module-bar.component";
import {UtilityService} from "../services/utility.service";
import {ToolbarService} from "../../toolbar/shared/toolbar.service";


export class AppBaseController implements OnInit {
    @ViewChild(MatDrawer, {static: false}) drawer: MatDrawer;
    @ViewChild(MatDrawerContainer, {static: false}) drawerContainer: MatDrawerContainer;
    @ViewChild(ModuleBarComponent, {static: false}) moduleBarComponent: ModuleBarComponent;

    isSmallScreen: boolean;
    showScrollerBar = false;
    hasBackdrop = false;
    mode: "over" | "push" | "side" = 'side';
    opened = true;
    forceExpanded = false;
    showCollapseButton = true;

    protected utilityService: UtilityService;
    protected toolbarService: ToolbarService;
    protected cd: ChangeDetectorRef;

    constructor(protected injector: Injector) {
        this.utilityService = this.injector.get(UtilityService);
        this.toolbarService = this.injector.get(ToolbarService);
        this.cd = this.injector.get(ChangeDetectorRef);

        this.showScrollerBar = this.utilityService.isDevice;
        this.isSmallScreen = this.utilityService.isSmallScreen;
    }

    ngOnInit() {
        this.updateLayout();

        /**
         * Open menu if click on menu button on toolbar
         */
        this.toolbarService.onMenuButtonClick().subscribe(() => {
            this.openMenu();
        });

        /**
         * Watch resize to update layout
         */
        this.utilityService.screenResizeToSmall().subscribe((isSmallScreen) => {
            this.isSmallScreen = isSmallScreen;

            this.updateLayout();
        });
    }

    /**
     * Trigger when expand|collapse menu
     */
    onCollapsedChange() {
        if (this.isSmallScreen) {
            this.closeMenu();
        } else {
            this.cd.detectChanges();
            this.drawerContainer.updateContentMargins();
        }
    }

    /**
     * Trigger when click on menu-item
     * Close menu if screen is small
     */
    onModuleItemClicked() {
        if (this.isSmallScreen) {
            this.closeMenu();
        }
    }

    /**
     * Close menu if screen is small
     * Expand|Collapse menu if screen is desktop
     */
    onMenuButtonClicked() {
        if (this.isSmallScreen) {
            this.closeMenu();
        } else {
            this.moduleBarComponent.toggle();
        }
    }

    /**
     * Close menu when click on backdrop
     */
    onBackdropClicked() {
        this.closeMenu();
    }

    /**
     * Close menu
     */
    closeMenu() {
        this.drawer.close().then();
    }

    /**
     * Open menu
     */
    openMenu() {
        this.drawer.open().then();
    }

    /**
     * Update left menu
     * @private
     */
    private updateLayout() {
        if (this.isSmallScreen) { // mobile
            this.mode = 'over';
            this.opened = false;
            this.hasBackdrop = true;
            this.forceExpanded = true;
            this.showCollapseButton = false;
        } else { // desktop
            this.mode = 'side';
            this.opened = true;
            this.hasBackdrop = false;
            this.forceExpanded = false;
            this.showCollapseButton = true;
        }

        try {
            this.cd.detectChanges();
            if (this.drawerContainer) {
                this.drawerContainer.updateContentMargins();
            }
        } catch (e) {
        }
    }
}
