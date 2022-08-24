import { ChangeDetectorRef } from '@angular/core';
import { AfterViewInit, TemplateRef } from '@angular/core';
import { Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { catchError, map } from 'rxjs/operators';
import { DatatableController } from '../../core/controllers/ntk-datatable-controller';
import { HelperService } from '../../core/services/helper.service';
import { DatatableRow } from '../../datatable/shared/datatable.model';
import { NotificationService } from '../shared/notification.service';

@Component({
  selector: 'ntk-notification-history-dialog',
  templateUrl: './notification-history-dialog.component.html',
  styleUrls: ['./notification-history-dialog.component.scss']
})
export class NotificationHistoryDialogComponent extends DatatableController implements AfterViewInit {

  subjectTemplate: TemplateRef<any>;

  private noDataText = 'No data';
  private loadingText = 'Loading...';

  private loadDataExternalParam = null;

  constructor(cd: ChangeDetectorRef,
              injector: Injector,
              private dialogRef: MatDialogRef<any>,
              @Inject(MAT_DIALOG_DATA)  dialogData: any,
              private _helperService: HelperService,
              private _notifSvc: NotificationService) {
              super(cd, injector);

              if(dialogData.Data && dialogData.Data.param) {
                this.loadDataExternalParam = dialogData.Data.param;
              }

              this.noDataText = _helperService.TranslationService.getTranslation('lbNoDataToDisplay');
              this.loadingText = _helperService.TranslationService.getTranslation('lbLoadingData');
              this.subjectTemplate = _notifSvc.getRegisteredCustomHistorySubjectTemplate();


  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.datatable.refreshGrid();
    }, 100);
  }

  loadData(row: DatatableRow, startIndex: number, pageSize: number, options?: any) {
    this.datatable.bodyComponent.noDataText = this.loadingText;

    return this._notifSvc.getNotifications(startIndex, pageSize, true, this.loadDataExternalParam).pipe(
      map(x => {
        this.datatable.bodyComponent.noDataText = this.noDataText;
        return x;
      }),
      catchError((err) => {
        this.datatable.bodyComponent.noDataText = this.noDataText;
        return err;
      })
    );

    // return of({
    //           Count: this.historyData.length,
    //           Index: -1,
    //           ListItems: this.historyData
    //         });

    // return this._sheduleService.loadFollowup(this.maintenanceId, startIndex, pageSize, row ? <string>row.Id : undefined).pipe(
    //   map(x => {
    //     let result = {
    //       Count: x.TotalCount,
    //       Index: -1,
    //       ListItems: x.HierarchicalData
    //     };

    //     this.datatable.bodyComponent.noDataText = this.noDataText;
    //     return result;
    //   }),
    //   catchError((err) => {
    //     this.datatable.bodyComponent.noDataText = this.noDataText;
    //     return err;
    //   })
    // );
  }

  onRowClick(row: DatatableRow) {
    // console.log('select row click', row);
    this._notifSvc.raiseHistoryItemClick(row);
    this.close();
  }

  close(result?: any, animation = true) {
    this.dialogRef.close(result);
  }
}
