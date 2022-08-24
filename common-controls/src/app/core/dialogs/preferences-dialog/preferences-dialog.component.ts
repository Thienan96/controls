import { Component, OnInit, Injector, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { BaseDialog } from '../base.dialog';
import { PreferencesService } from '../../services/preferences.service';
import { StorageService, StorageKeys, StorageLocation } from '../../services/storage.service';
import { DialogData } from '../../../shared/models/common.info';
import {UtilityService} from '../../services/utility.service';

export interface IPreferencesDialogSettings {
  showIncidentSettings: boolean;
  showInterventionSettings: boolean;
  showPlanningSettings: boolean;
  showSalesSettings: boolean;
  showPurchasesSettings: boolean;

  showcreationQuoteSettings: boolean;
  showcreationSalesInvoiceSettings: boolean;
  showcreationPOSettings: boolean;
  showcreationPurchaseInvoiceSettings: boolean;

  quotesApproval:'Off' | 'Manual' | 'ApprovalWorkflow';
  purchaseOrdersApproval:'Off' | 'Manual' | 'ApprovalWorkflow';
  purchaseInvoicesApproval:'Off' | 'Manual' | 'ApprovalWorkflow';
  invoicesApproval:'Off' | 'Manual' | 'ApprovalWorkflow';
  purchaseInvoicesAccessRight: 'Full' | 'Limited' | 'ReadOnly';

}

@Component({
  selector: 'ntk-preferences-dialog',
  templateUrl: './preferences-dialog.component.html',
  styleUrls: ['./preferences-dialog.component.css']
})
export class PreferencesDialogComponent extends BaseDialog implements OnInit, AfterViewInit {

  settings: any;

  hasIncidentAccess = false;
  hasInterventionAccess = false;
  private _prefSvc: PreferencesService;
  private _storageSvc: StorageService;

  private _svc: HelperService;

  invoiceStatusList = [];
  quoteStatusList = [];
  purchaseOrderStatusList = [];
  purchaseInvoiceStatusList = [];

  preferenceSetting: IPreferencesDialogSettings;

  constructor(private injector: Injector, private dialogRef: MatDialogRef<PreferencesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
    super(injector, dialogRef, dialogData);

    this.preferenceSetting = dialogData.Data;

    this._prefSvc = injector.get(PreferencesService);
    this._storageSvc = injector.get(StorageService);
    this._svc = injector.get(HelperService);
  }
  ngAfterViewInit(): void {
    this.updateDialogSize();
  }

  updateDialogSize() {
    if (this.preferenceSetting) {
      let height = 232;
      if (this.preferenceSetting.showIncidentSettings || this.preferenceSetting.showInterventionSettings) {
        height += 44;

        if (this.preferenceSetting.showIncidentSettings) { height += 44; }
        if (this.preferenceSetting.showInterventionSettings) { height += 44; }
      }

      if (this.preferenceSetting.showPlanningSettings) { height += 88; }
      if (this.preferenceSetting.showSalesSettings) { height += 176; }
      if (this.preferenceSetting.showPurchasesSettings) { height += 88; }

      if(this.injector.get(UtilityService).isSmallScreen) {
          this.dialogRef.updateSize('100%', '100%');
      } else{
          this.dialogRef.updateSize(this.dialogData.DefaultWidth, `${height}px`);
      }
    }
  }

  ngOnInit() {
    this.settings = this._storageSvc.getUserValue(StorageKeys.GeneralSettings, StorageLocation.Local);

    if (!this.settings) {
      this.settings = {};
    }

    if (!this.settings.gridMode) {
      this.settings.gridMode = 'normal';
    }

    if (!this.settings.showIncidentHistoryDefault) {
      this.settings.showIncidentHistoryDefault = false;
    }

    if (!this.settings.showInterventionHistoryDefault) {
      this.settings.showInterventionHistoryDefault = false;
    }

    if (!this.settings.gridAlternateColor) {
      this.settings.gridAlternateColor = false;
    }

    if (!this.settings.ShowTasksStatusAs) {
      this.settings.ShowTasksStatusAs = 'tabs';
    }

    if (!this.settings.DefaultTabOnInvoicesAndQuotes) {
      this.settings.DefaultTabOnInvoicesAndQuotes = 'lines';
    }

    if (!this.settings.DefaultInvoiceStatus) { this.settings.DefaultInvoiceStatus = 'Draft'; }

    if (!this.settings.DefaultQuoteStatus) { this.settings.DefaultQuoteStatus = 'Draft'; }

    if (!this.settings.DefaultPurchaseOrdersStatus) { this.settings.DefaultPurchaseOrdersStatus = 'Draft'; }

    if (!this.settings.DefaultPurchaseInvoiceStatus) { this.settings.DefaultPurchaseInvoiceStatus = 'Draft'; }


    this.invoiceStatusList = [];

    if (this.preferenceSetting && this.preferenceSetting.invoicesApproval === 'Off') {
      this.invoiceStatusList.push({ Id: 'Draft', Name: 'Draft' });
      this.invoiceStatusList.push({ Id: 'ToInvoice', Name: 'ToInvoice' });
    }
    else if (this.preferenceSetting && this.preferenceSetting.invoicesApproval === "Manual") {
      this.invoiceStatusList.push({ Id: "Draft", Name: "Draft" });
      this.invoiceStatusList.push({ Id: "ToApprove", Name: "ToApprove" });
      this.invoiceStatusList.push({ Id: "ApprovalInProgress", Name: "ApprovalInProgress" });
      this.invoiceStatusList.push({ Id: "ToInvoice", Name: "ToInvoice" });
    }
    else if (this.preferenceSetting && this.preferenceSetting.invoicesApproval === "ApprovalWorkflow") {
        this.invoiceStatusList.push({ Id: "Draft", Name: "Draft" });
    }
   


    this.quoteStatusList = [];
    this.quoteStatusList.push({ Id: 'Draft', Name: 'Draft' });

    if (this.preferenceSetting && this.preferenceSetting.quotesApproval === 'Manual') {
      this.quoteStatusList.push({ Id: 'ToApprove', Name: 'ToApprove' });
      this.quoteStatusList.push({ Id: 'ApprovalInProgress', Name: 'ApprovalInProgress' });
      this.quoteStatusList.push({ Id: 'ToSend', Name: 'ToSend' });
    } 

    this.purchaseOrderStatusList = [];
    if (this.preferenceSetting && this.preferenceSetting.purchaseOrdersApproval === 'Off') {
      this.purchaseOrderStatusList.push({ Id: 'Draft', Name: 'Draft' });
      this.purchaseOrderStatusList.push({ Id: 'ToOrder', Name: 'ToOrder' });
    }
    else if (this.preferenceSetting && this.preferenceSetting.purchaseOrdersApproval === "Manual") {
      this.purchaseOrderStatusList.push({ Id: "Draft", Name: "Draft" });
      this.purchaseOrderStatusList.push({ Id: "ToApprove", Name: "ToApprove" });
      this.purchaseOrderStatusList.push({ Id: "ApprovalInProgress", Name: "ApprovalInProgress" });
      this.purchaseOrderStatusList.push({ Id: "ToOrder", Name: "ToOrder" });
      
    }
    else if (this.preferenceSetting && this.preferenceSetting.purchaseOrdersApproval === "ApprovalWorkflow") {
        this.purchaseOrderStatusList.push({ Id: "Draft", Name: "Draft" });
        this.purchaseOrderStatusList.push({ Id: "ToApprove", Name: "ToApprove" });
    }

    this.purchaseInvoiceStatusList = [];
    this.purchaseInvoiceStatusList.push({ Id: "Draft", Name: "Draft" });
    let purchaseInvoiceApprovalMode = this.preferenceSetting.purchaseInvoicesApproval;
    if (purchaseInvoiceApprovalMode === "Off") {
        if (this.preferenceSetting.purchaseInvoicesAccessRight === "Full")
          this.purchaseInvoiceStatusList.push({ Id: "ToPost", Name: "ToPost" });
    }
    else if (purchaseInvoiceApprovalMode === "Manual") {
      this.purchaseInvoiceStatusList.push({ Id: "ToApprove", Name: "ToApprove" });
      this.purchaseInvoiceStatusList.push({ Id: "ApprovalInProgress", Name: "ApprovalInProgress" });  
      if (this.preferenceSetting.purchaseInvoicesAccessRight === "Full")
        this.purchaseInvoiceStatusList.push({ Id: "ToPost", Name: "ToPost" });
    }
    else if (purchaseInvoiceApprovalMode === "ApprovalWorkflow") {
        this.purchaseInvoiceStatusList.push({ Id: "ToApprove", Name: "ToApprove" });
    }

    let index = this.quoteStatusList.findIndex((s) => { return s.Id === this.settings.DefaultQuoteStatus});
    if (index < 0) this.settings.DefaultQuoteStatus = "Draft";

    index = this.purchaseOrderStatusList.findIndex((s) => { return s.Id === this.settings.DefaultPurchaseOrdersStatus});
    if (index < 0) this.settings.DefaultPurchaseOrdersStatus = "Draft";

    index = this.invoiceStatusList.findIndex((s) => { return s.Id === this.settings.DefaultInvoiceStatus});
    if (index < 0) this.settings.DefaultInvoiceStatus = "Draft";


    index = this.purchaseInvoiceStatusList.findIndex((s) => { return s.Id === this.settings.DefaultPurchaseInvoiceStatus});
    if (index < 0) this.settings.DefaultPurchaseInvoiceStatus = "Draft";

    

    
  }

  onSaveClick() {
    this._storageSvc.setLocalUserValue(StorageKeys.GeneralSettings, this.settings);
    this._prefSvc.raiseChange(this.settings);
    this.close(this.settings);
  }
}
