import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {NotificationService, ToolbarComponent, ToolbarService} from '../../toolbar/public_api';
import {
    BaseQueryCondition,
    DataType,
    FilterDefinition,
    FilterOperator,
    TreeDisplayItem
} from '../../shared/models/common.info';
import {DisplayItem, EntityListService, HelperService, IDataItems} from '../../shared/common-controls-shared.module';
import {Subscriber} from 'rxjs';
import {map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material';
import {
    IPreferencesDialogSettings,
    PreferencesDialogComponent
} from '../../core/dialogs/preferences-dialog/preferences-dialog.component';
import {LanguagesDialogComponent} from '../../languages/languages-dialog/languages-dialog.component';
import {AboutDialogComponent, IAboutSettings} from '../../core/dialogs/about-dialog/about-dialog.component';
import {UserProfileDialogComponent} from '../../authentication/user-profile-dialog/user-profile-dialog.component';

enum IncidentStatus {
    New,
    InProgress,
    Fixed,
    Closed,
    Cancelled
}

@Component({
    selector: 'ntk-demo-toolbar',
    templateUrl: './demo-toolbar.coponent.html',
    styleUrls: ['./demo-toolbar.scss']
})
export class DemoToolbarComponent implements AfterViewInit {
    // toolbar1
    @ViewChild('toolbar1', {static: true}) toolbar1: ToolbarComponent;

    @ViewChild('customNotifTemplate', {static: true}) customNotifTemplate: TemplateRef<any>;
    @ViewChild('customNotifHIstorySubjectTemplate', {static: true}) customNotifHIstorySubjectTemplate: TemplateRef<any>;


    currentViewMode1 = 'list-preview';
    currentFilter1: BaseQueryCondition = new BaseQueryCondition({
        SortBy: 'Number_asc',
        ArchiveType: 'Archived'
    });

    // toolbar2
    currentViewMode2 = 'list-preview';
    @ViewChild('toolbar2', {static: true}) toolbar2: ToolbarComponent;
    currentFilter2: BaseQueryCondition = new BaseQueryCondition();


    // toolbar3
    currentViewMode3 = 'list-preview';
    @ViewChild('toolbar3', {static: true}) toolbar3: ToolbarComponent;
    currentFilter3: BaseQueryCondition = new BaseQueryCondition();

    get DataType() {
        return DataType;
    }

    get FilterOperator() {
        return FilterOperator;
    }

    constructor(private toolbarService: ToolbarService,
                private _listService: EntityListService,
                private helper: HelperService,
                private snackBar: MatSnackBar,
                private notifSvc: NotificationService) {
    }


    ngAfterViewInit(): void {

        // toolbar 1
        if (this.toolbar1) {
            let toolbarService1 = this.toolbar1.getToolbarService(); // To get data from localstorage you have to use toolbarService from _toolbar.getToolbarService
            // Restore viewmode
            this.currentViewMode1 = toolbarService1.getCurrentViewMode() || this.currentViewMode1;
            let currentFilter1: BaseQueryCondition = toolbarService1.getCurrentFilter();
            if (currentFilter1) {
                this.currentFilter1.set(currentFilter1);
            }
            this.currentFilter1.ColumnFilters = toolbarService1.getCurrentFieldsFilter();
            this.toolbar1.init();
        }

        // toolbar 2
        if (this.toolbar2) {
            let toolbarService2 = this.toolbar2.getToolbarService(); // To get data from localstorage you have to use toolbarService from _toolbar.getToolbarService
            // Restore viewmode
            this.currentViewMode2 = toolbarService2.getCurrentViewMode() || this.currentViewMode2;
            let currentFilter2: BaseQueryCondition = toolbarService2.getCurrentFilter();
            if (currentFilter2) {
                this.currentFilter2.set(currentFilter2);
            }
            this.currentFilter2.ColumnFilters = toolbarService2.getCurrentFieldsFilter();
            this.toolbar2.init();
        }

        // toolbar 3
        if (this.toolbar3) {
            this.toolbar3.init();
        }


        this.toolbarService.onUserMenuClick().subscribe((action) => {
            switch (action) {
                case 'showGeneralSetting':
                    let settings = <IPreferencesDialogSettings>{
                        showIncidentSettings: true,
                        showInterventionSettings: true,
                        showPlanningSettings: true,
                        showSalesSettings: true,
                        showPurchasesSettings: true,
                        showcreationQuoteSettings: true,
                        showcreationSalesInvoiceSettings: true,
                        showcreationPurchaseInvoiceSettings: true,
                        showcreationPOSettings: true,
                        quotesApproval: 'Manual',
                        purchaseInvoicesApproval: "Manual",
                        purchaseOrdersApproval:"ApprovalWorkflow"
                    };
                    this.helper.DialogService.openDialog(PreferencesDialogComponent, settings, '650px', '700px').subscribe();
                    break;
                case 'showChangeLanguage':
                    this.helper.DialogService.openDialog(LanguagesDialogComponent, null, '512px', 'auto').subscribe();
                    break;
                case 'showAbout':
                    let aboutConfig: IAboutSettings = {
                        websiteUrl: 'https://helpsites.be/',
                        privacyUrl: 'https://helpsites.be/privacy-policy',
                        supportSite: 'support.helpsites@netika.com',
                        logo: 'src/assets/images/module_active.png',
                        companyName: 'Common Control'
                    };
                    this.helper.DialogService.openDialog(AboutDialogComponent, aboutConfig, '512px', '440px').subscribe();
                    break;
                case 'showUserProfile':
                    this.helper.DialogService.openDialog(UserProfileDialogComponent, undefined, '512px', '440px').subscribe();
                    break;
            }
        });

        this.notifSvc.registeredCustomItemTemplate(this.customNotifTemplate);
        this.notifSvc.registeredCustomItemHostorySubjectTemplate(this.customNotifHIstorySubjectTemplate);
    }



    onFiltersChanged(data) {
        console.log('data', data);
    }

    onTittleClicked() {
        console.log('onTittleClicked');
    }

    getColumnFilter(data) {
        const filter = data.filter,
            currentFilterItems: FilterDefinition[] = data.currentFilterItems,
            ob: Subscriber<IDataItems<DisplayItem> | DisplayItem[] | any> = data.observer,
            columnName: string = filter.ColumnName;
        let site = null;
        switch (columnName) {
            case 'Status':
                ob.next(this.toolbarService.getListByEnum(IncidentStatus, 'IssueStatus'));
                break;
            case 'Site.Name':
                this.getSites(filter).subscribe(ob);
                break;
            case 'IsUrgent':
                ob.next(this.toolbarService.getListByBoolean());
                break;
            case 'Room.Name':
                site = currentFilterItems.find((item) => {
                    return item.ColumnName === 'Site.Name';
                });
                if (site.IsExclude) { // IsExclude = true and have  a site was selected
                    this.getSites(filter).subscribe((sites: any) => {
                        let selectedSite = sites.find((item) => {
                            return site.SelectedItems.findIndex((selectedItem) => {
                                return selectedItem.Value === item.Value;
                            }) === -1;
                        });
                        if (selectedSite) {
                            filter.SiteId = selectedSite.Value;
                            this.getRooms(filter).subscribe(ob);
                        }
                    });
                } else {
                    filter.SiteId = site.SelectedItems[0].Value;
                    this.getRooms(filter).subscribe(ob);
                }
                break;
            case 'Equipment.Name':
                site = currentFilterItems.find((item) => {
                    return item.ColumnName === 'Site.Name';
                });
                if (site.IsExclude) { // IsExclude = true and have  a site was selected
                    this.getSites(filter).subscribe((sites) => {
                        let selectedSite = sites.find((item) => {
                            return site.SelectedItems.findIndex((selectedItem) => {
                                return selectedItem.Value === item.Value;
                            }) === -1;
                        });
                        if (selectedSite) {
                            filter.SiteId = selectedSite.Value;
                            this.getEquipments(filter).subscribe(ob);
                        }
                    });
                } else {
                    filter.SiteId = site.SelectedItems[0].Value;
                    this.getEquipments(filter).subscribe(ob);
                }
                break;
            case 'Custom':
                this.getSites(filter).subscribe(ob);
                break;
            default:
                ob.next([]);
                break;
        }

    }

    private getTemplate(item) {
        let template = '<span>' + item.Name + ' - ' + item.Id.substr(0, 8) + '</span>';

		return template;
	}

    private getCountAndDataByUrl(url, filter) {
        return this._listService.getList(url, filter).pipe(map((data: any) => {
            let filterList = data.ListItems.filter((item) => {
                return item.Name.toUpperCase().indexOf((filter.Query || '').toUpperCase()) !== -1;
            });
            data.ListItems = filterList
                .slice(filter.FromIndex, filter.PageSize + filter.FromIndex)
                .map((item) => {
                    let displayItem = new DisplayItem(item.Id, item.Name);
                    displayItem.Disabled = item.Disabled;
                    displayItem.OriginData = item;
                    displayItem.Template = this.getTemplate(item)
                    return displayItem;
                });
            data.Count = filterList.length;
            return data;
        }));
    }


    private getSites(filter) {
        return this.getCountAndDataByUrl('src/assets/data/site.json', filter);
    }

    private getRooms(filter) {
        return this._listService.getList('src/assets/data/room.json', filter).pipe(map((data: any) => {
            let list = data.HierarchicalData
                .filter((item) => {
                    return item.Name.toUpperCase().indexOf(filter.Query.toUpperCase()) !== -1;
                });
            let listItems = list
                .slice(filter.FromIndex, filter.PageSize + filter.FromIndex)
                .map((item) => {
                    return new TreeDisplayItem({
                        Id: item.Id,
                        Value: item.Id,
                        DisplayValue: item.Name,
                        Level: item.Level,
                        OriginData: item,
                        Disabled: item.Disabled
                    });
                });
            return {
                Count: list.length,
                Index: data.Index,
                ListItems: listItems,
                AppendRows: []
            };
        }));
    }

    private getEquipments(filter) {
        return this._listService.getList('src/assets/data/equipment.json', filter).pipe(map((data: any[]) => {
            let listItems = data
                .slice(filter.FromIndex, filter.PageSize + filter.FromIndex)
                .map((item) => {
                    return new TreeDisplayItem({
                        Id: item.Id,
                        Value: item.Id,
                        DisplayValue: item.Name,
                        Level: item.Level + 1,
                        OriginData: item,
                        Disabled: item.EntityType === 'EqT' ? true : false
                    });
                });
            return {
                Count: data.length,
                ListItems: listItems,
                AppendRows: []
            };
        }));
    }


    public canCreateFilter(data) {
        let ob = data.observer,
            currentFilterItems = data.currentFilterItems;
        switch (data.columnName) {
            case 'Room.Name':
            case 'Equipment.Name':
                if (currentFilterItems.findIndex((item) => {
                    return item.ColumnName === 'Site.Name';
                }) === -1) {
                    this.snackBar.open('Please first add a filter by "Site".', 'Ok', {
                        duration: 5000,
                        horizontalPosition: 'right',
                        verticalPosition: 'top'
                    });
                    ob.error();
                } else {
                    ob.next();
                }
                break;
            default:
                ob.next();
                break;
        }

    }

    getPredefineFiltersChange($event) {
        let ob = $event.observer,
            filter = $event.filter,
            items: DisplayItem[] = [];
        if (filter.ColumnName === 'Site.Name' ||
            filter.ColumnName === 'Status' ||
            filter.ColumnName === 'Room.Name' ||
            filter.ColumnName === 'Equipment.Name') {

            let translateKey = 'lb' + filter.ColumnName.split('.')[0];
            items.push(new DisplayItem('Favorites', this.helper.TranslationService.getTranslation('lbFavorites'), false, 'lbFavorites'));
            items.push(new DisplayItem(filter.ColumnName, this.helper.TranslationService.getTranslation(translateKey), false, translateKey));

        }
        ob.next(items);
        ob.complete();
    }

    get showMenuButton() {
        let isSmallScreen = this.helper.UtilityService.isSmallScreen;
        return isSmallScreen;
    }
}
