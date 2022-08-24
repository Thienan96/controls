import { Injector, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { PreferencesService } from "../services/preferences.service";
import { StorageKeys, StorageLocation, StorageService } from "../services/storage.service";

export class MatTableController implements OnInit, OnDestroy {
    isTableCompactMode: boolean;
    isTableAlternateColor: boolean;

    protected _storageSvc: StorageService;

    private tableMode: string;
    private _settingsChangeSubscription: Subscription;
    allSubs: Subscription = new Subscription;

    constructor(injector: Injector) {
        this._storageSvc = injector.get(StorageService);
        const preferencesService = injector.get(PreferencesService);

        this._settingsChangeSubscription = preferencesService.onSettingsChanged().subscribe(v => {
            if (v && (v.gridMode !== this.tableMode || v.gridAlternateColor !== this.isTableAlternateColor)) {
                this.restoreGeneralSettings();
            }
        });
    }

    ngOnInit() {
        this.restoreGeneralSettings();
    }

    ngOnDestroy() {
        if (this._settingsChangeSubscription) { this._settingsChangeSubscription.unsubscribe(); }
        this.allSubs.unsubscribe();
    }

    private restoreGeneralSettings() {
        const generalSettings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local);

        if (generalSettings && generalSettings.gridMode) {
            this.tableMode = generalSettings.gridMode;
        } else {
            this.tableMode = 'normal';
        }

        this.isTableCompactMode = this.tableMode === 'compact';

        if (generalSettings) {
            this.isTableAlternateColor = generalSettings.gridAlternateColor || false;
        }
    }
}
