import {Injectable, Injector} from '@angular/core';
import {AuthenticationService} from './authentication.service';
import {DialogService} from './dialog.service';
import {StorageService} from './storage.service';
import {TranslationService} from './translation.service';
import {UtilityService} from './utility.service';
import {CommonDataService} from './common-data.service';
import { BlockUIService } from './blockUI.service';
import { CommonDocumentService } from '../../documents/shared/common-document.service';


@Injectable({
    providedIn: 'root'
})
export class HelperService {
    get UtilityService() {
        if (!this._utilityService) {
            this._utilityService = this._injector.get(UtilityService);
        }
        return this._utilityService;
    }

    get AuthenticationService() {
        if (!this._authenticationService) {
            this._authenticationService = this._injector.get(AuthenticationService);
        }
        return this._authenticationService;
    }

    get DialogService() {
        if (!this._dialogService) {
            this._dialogService = this._injector.get(DialogService);
        }
        return this._dialogService;
    }

    get StorageService() {
        if (!this._storageService) {
            this._storageService = this._injector.get(StorageService);
        }
        return this._storageService;
    }

    get TranslationService() {
        if (!this._translationService) {
            this._translationService = this._injector.get(TranslationService);
        }
        return this._translationService;
    }

    get DocumentService() {
        if (!this._documentService) {
            this._documentService = this._injector.get(CommonDocumentService);
        }
        return this._documentService;
    }

    get CommonDataService() {
        if (!this._commonDataService) {
            this._commonDataService = this._injector.get(CommonDataService);
        }
        return this._commonDataService;
    }

    get BlockUIService(): BlockUIService {
        if (!this._blockUIService) {
            this._blockUIService = this._injector.get(BlockUIService);
        }
        return this._blockUIService;
    }    
    
    get isBusy(): boolean {
        return this._isBusy;
    }

    set isBusy(bValue: boolean) {
        this._isBusy = bValue;
        if (bValue) {
            this.BlockUIService.start();
        } else {
            this.BlockUIService.stop();
        }
    }

    private _blockUIService: BlockUIService;
    private _isBusy: boolean;
    private _authenticationService: AuthenticationService;
    private _dialogService: DialogService;
    private _storageService: StorageService;
    private _translationService: TranslationService;
    private _utilityService: UtilityService;
    private _documentService: CommonDocumentService;
    private _commonDataService: CommonDataService;

    constructor(private _injector: Injector) {
    }
}
