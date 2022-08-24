import {Injector, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {HelperService} from '../services/helper.service';
import {Observable} from 'rxjs';

export class BaseController implements OnDestroy {
    private _baseHelperService: HelperService;
    canExportExcel = false;

    protected destroy$ = new Subject<any>();

    constructor(injector: Injector) {
        this._baseHelperService = injector.get(HelperService);
    }

    exportExcel(moduleName: string, query: any): Observable<any> {
        return this._baseHelperService.DocumentService.exportExcel(moduleName, query);
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
    }
}

