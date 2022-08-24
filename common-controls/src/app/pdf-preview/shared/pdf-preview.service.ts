import {Injectable, Injector} from '@angular/core';
import {AppConfig} from '../../core/app.config';
import {AuthenticationService, StorageService} from '../../shared/common-controls-shared.module';
import {CommunicationService} from '../../core/services/communication.service';

@Injectable({
  providedIn: 'root'
})
export class PdfPreviewService {
  private _authenticationSvc: AuthenticationService;

  private _storageSvc: StorageService;


  constructor(private injector: Injector, private _appConfig: AppConfig) {

    this._authenticationSvc = injector.get(AuthenticationService);
    this._storageSvc = injector.get(StorageService);

   }

  getClientId(): string {
    if (this._appConfig.WITH_NG1) {
        return this.injector.get(CommunicationService).getCurrentClientId();
    } else {
        return this._authenticationSvc.clientId;
    }
  }

  getSessionId(): string {
    return this._authenticationSvc.sessionId;
  }

  getWrapperDocumentDemo() {
    
  }

}
