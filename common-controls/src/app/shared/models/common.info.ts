import {ComponentType} from '@angular/cdk/portal';
import {IssueAttachment} from '../../documents/shared/document.model';
import {SliderRef} from '../../slides/SliderRef';
import * as _ from 'underscore';
import {Observable, of} from 'rxjs';
import {AuthenticatedUser} from './user.info';
import {Injector, TemplateRef} from '@angular/core';

export interface IEntity {
    Id: string;
}

export interface IListItem extends IEntity {
    Name: string;
}

export interface IEntityItem extends IListItem {
    EntityType: string;
}

/**
 * GF-80
 */
export interface IPartyEntity extends IListItem {
    Role: string;
}

export interface ICheckedItem extends IListItem {
    IsChecked: boolean;
    IsArchived?: boolean;
}

export interface IUpdatedItem extends IListItem {
    EntityVersion: number;
}

export interface IDocumentWrapper {
    Id: string;
    EntityVersion?: number;
    Document: Document;
    HasDrawing?: boolean;
    DrawingPageIndex?: number;
    PageIndex?: number;
    Shapes?: Array<DrawingShape>;
    IsUnread?: boolean;
    CantRemove?: boolean;
    ThumbnailUrl?: string;
}

export interface IFolder extends IEntity {
    Site?: ISite;
    Type?: string;
    Name: string;

    ParentFolderId?: string;
    Room?: BaseItem;
    VisibleBy: string;
    IsPhotoFolder?: boolean;
    IsGeneratedDocumentFolder?: boolean;
    IsArchived?: boolean;
    IsManagedExternally?: boolean;
    DocumentCount?: number;
    AccessRights?: IFolderAccessRights;
    Connectors?: Array<IConnectorDataExchange>;

    FolderPath?: string;
    Level?: number;
}

export interface IFolderAccessRights {
    CanAddDocuments: boolean;
    CanAddSubFolder: boolean;
    CanArchive: boolean;
    CanEdit: boolean;
    CanEditDocuments: boolean;
}

export interface IUserAccessRights {
    CanAdd: boolean;
    CanAddSubFolder: boolean;
    CanArchive: boolean;
    CanEdit: boolean;
    CanShowSystemFolder: boolean;
    CanImportFromAproPLAN: boolean;
    CanExportToAproPLAN: boolean;
}

export class SelectableItem {
    Value: any;
    DisplayValue: any;
    TranslationKey: string;
    IsSelected: boolean;

    constructor(protected value: string, protected displayValue?: any, protected translationKey?: string, protected isSelected?: boolean) {
        this.Value = value;

        if (!!displayValue) {
            this.DisplayValue = displayValue;
        }

        if (!!translationKey) {
            this.TranslationKey = translationKey;
        }

        if (!!isSelected) {
            this.IsSelected = isSelected;
        }
    }
}

export class BaseItem {
    Id: string;
    Code?: string;
    Name: string;
}

export enum UploadStatus { None, Uploading, Uploaded, UploadFailed, Saving, Saved, SaveFailed, Offline }

export class AttachmentData {
    Id: string;
    Status: UploadStatus;
    File: File;
    DocumentWrapper: IDocumentWrapper;
    CantRemove?: boolean;
    LogoURL?: string;
    IsSelectToDisplay?: boolean;

    progress?: number; // this is for client only!
    clientId?: string; // this is a kind of tracking id for each uploading file
    
    isNewFileAttach?: boolean; 
}

export class Point {
    X: number;
    Y: number;
}

export class DrawingShape {
    Type: string;
    Points: Array<Point> = []; // 1 or more points according to the type of shape
    Color: string;
    Text: string;
    Thickness: number;
    Name: string;
    ArrowType: string;
}

export interface ISite extends IEntity {
    Code: string;
    Name: string;
    Address: string;
    Note: string;
    LogoId: string;
    IsArchived: boolean;
    IsManagedExternally: boolean;
    DisplayOrder: number;
    EntityVersion: number;

    ConnectorDataExchanges?: Array<IConnectorDataExchange>;

    ManagedCompany: BaseItem;
}

export class Document {
    public Id = '00000000-0000-0000-0000-000000000000';
    public EntityVersion: number;
    public Name: string;
    public UploadedBy: BaseItem;
    public UploadedDate: Date;
    public Folder: IFolder;
    public Type: string;
    public Status: string;
    public NbrPages: number;
    public ManagedEntityId: string; // This the Id of entity that wrapper the document
    public IsArchived: boolean;
    public DocumentUrl: string; // Note: it has not yet specified thumbnail/fullsize or index page PDF so according context that we will build url exactly
    public File: File; // using for offline. Display image to thumbnail without upload document by api
    public FileBuffer: string | ArrayBuffer; // file type to store in indexeddb
    // This should set from client to build full path url
    public SiteId: string;

    // for UI
    public isChecked: boolean;
}

export class DialogData {
    Data: any;
    DefaultWidth: string;
    DefaultHeight: string;
    IsFullScreenInMobileMode: boolean;
    ShowBackButton = false;
}

export class BaseQueryCondition {
    SearchKeyword: string;
    SortBy?: string;
    ItemIdToGetIndex?: string;
    ArchiveType: string;
    ColumnFilters?: FilterDefinition[] = [];
    ExcludeItemIds?: string[];
    IsCollapsedButton?: boolean;
    // Get an item to refresh a row on list/grid after change data
    ItemId?: string;
    ExtraCondition?: any; // Using for some module have special queris which can not decalre as common

    // SiteId?: boolean; // put siteid right for site module can use this property
    constructor(properties?) {
        Object.assign(this, properties);
    }

    set(properties) {
        Object.assign(this, properties);
    }

    clone() {
        let cloned: BaseQueryCondition = JSON.parse(JSON.stringify(this));
        if (cloned.ColumnFilters) {
            cloned.ColumnFilters = cloned.ColumnFilters.map((item: FilterDefinition) => {
                return new FilterDefinition(item);
            });
        }
        return new BaseQueryCondition(cloned);
    }
}

export class ListQueryCondition extends BaseQueryCondition {
    StartIndex?: number;
    PageSize?: number;

    SortOrder?: string;
}

export class QueryDuplicateIncidentsCondition extends ListQueryCondition {
    SiteId?: string;
    SelectedIncidentId?: string;
    ParentIncidentId?: string;
}

export class GridQueryCondition extends ListQueryCondition {
    DataFields: string[];
    SortByDataFieldIndex?: string;
}

export class Language {
    Id: string;
    Name: string;
    Code: string;
}

export class AboutInformation {
    Website: string;
    EmailSupport: string;
    Privacy: string;
}

export enum PageStatus { None, Loading, Loaded }

export interface ILazyItem extends IEntity {
    UniqueKey: string;
    Name: string;

    isChecked?: boolean;
}

export interface IDataItems<T> {
    Count?: number;
    TotalCount?: number;
    Index?: number;
    ListItems?: T[];
    AppendRows?: any[];
    HierarchicalData?: T[];
    Rows?: T[];
}

export interface IPageContent {
    Status: PageStatus;
    Items?: ILazyItem[];
}

export class InterventionItem implements ILazyItem {
    UniqueKey: string;
    Id: string;
    Name: string;
    Subject: string;
    Status: string;
    ParentIncidentNumber: number;
    Number: string;
    PlannedDate: string;
    PlannedStartHour?: number;
    PlannedEndHour?: number;
    IsUrgent: boolean;
    Site: BaseItem;
    Intervener: BaseItem;
}

export interface IMailItem extends ILazyItem {
    Subject: string;
    EntityCreationDate: Date;
    SentDate: Date;
    Recipients: any[];
    To: any[];
    Cc: any[];
    Bcc: any[];
    Status: string;
}


export enum FilterType {
    Separator = 'Separator', // Separator
    Selector = 'Selector', // Field Filter
    Action = 'Action', // Filter by
    Boolean = 'Boolean', // Boolean
    QuickFilter = 'QuickFilter'
}

export enum FilterOperator {
    Contains = 'Contains',
    In = 'In',

    Equals = 'Equals',
    NotEqual = 'NotEqual',
    Less = 'Less',
    LessOrEqual = 'LessOrEqual',
    Greater = 'Greater',
    GreaterOrEqual = 'GreaterOrEqual',
    Between = 'Between',

    // not only apply this operator but also clear on filter before
    ClearBefore = 'ClearBefore'
}

export enum DataType {
    None = '',
    Date = 'Date',
    Decimal = 'Decimal',
    Integer = 'Integer',
    Enum = 'Enum',
    Boolean = 'Boolean',
    Duration = 'Duration',
    Custom = 'Custom', // NF-362: new type to display logo in the filter bar
    Month = 'Month' // NF-368: show year and month
}

export interface IDisplayItem {
    Value?: string;
    DisplayValue?: string;
    IsSelected?: boolean;
    TranslateKey?: string;
    OriginData?: any;
    Disabled?: boolean;
    Template?: string;
}

export class DisplayItem implements IDisplayItem {
    Value: string;
    DisplayValue: string;
    IsSelected = false;
    TranslateKey: string;
    OriginData: any;
    Disabled = false;
    Template?: string;

    constructor(value: string, displayValue: string, isSelected?: boolean, translateKey?: string, originData?: any, disabled?: boolean, template?: string) {
        this.Value = value;
        this.DisplayValue = displayValue;
        if (isSelected) {
            this.IsSelected = isSelected;
        }
        if (translateKey) {
            this.TranslateKey = translateKey;
        }
        if (originData) {
            this.OriginData = originData;
        }
        if (disabled) {
            this.Disabled = disabled;
        }
        if (template) {
            this.Template = template;
        }
    }

    toJson() {
        return {
            Value: this.Value,
            DisplayValue: this.DisplayValue,
            IsSelected: this.IsSelected,
            TranslateKey: this.TranslateKey,
            OriginData: this.OriginData,
            Disabled: this.Disabled,
            Template: this.Template
        };
    }
}

export class TreeDisplayItem extends DisplayItem {
    Children: TreeDisplayItem[] = [];
    Level: number;
    Type: string;
    Id: any;

    constructor(properties) {
        super(properties.Value, properties.DisplayValue, properties.IsSelected, properties.TranslateKey, properties.OriginData, properties.Disabled);
        Object.assign(this, properties);
    }

    hasChildren() {
        return this.Children.length > 0;
    }

    toJson() {
        return {
            // Base
            Value: this.Value,
            DisplayValue: this.DisplayValue,
            IsSelected: this.IsSelected,
            TranslateKey: this.TranslateKey,
            OriginData: this.OriginData,
            Disabled: this.Disabled,
            Template: this.Template,

            // Tree
            Children: this.Children,
            Level: this.Level,
            Type: this.Type,
            Id: this.Id
        };
    }

    clone() {
        return new TreeDisplayItem(this.toJson());
    }
}

export enum ToolbarFilterViewType {
    NormalList = 'NormalList',
    VirtualLoad = 'VirtualLoad',
    NormalTree = 'NormalTree',
    TreeGroup = 'TreeGroup',
    TreeVirtualLoad = 'TreeVirtualLoad'
}

export interface IFilterDefinition {
    ColumnName: string;
    DisplayValue: string;
    TranslateKey: string;
    FilterType: FilterType;
    FilterOperator: FilterOperator;
    IsSelected: boolean;
    DataType: DataType;
    ViewType: ToolbarFilterViewType;
    Value?: any;
    SelectedItems?: DisplayItem[];
    IsCheckboxSelectedAll?: boolean; // checkbox
    CheckedAll?: boolean; //  All items is checked
    CanUpdateCheckedAll?: boolean;
    SelectedItemsTotal?: number;
    LeafType?: string;
    NodeType?: string;
    ExpectedFilterItem?: string;
    IsExpectedSingleSelection?: boolean;
    editing?: boolean;
    IsValid?: boolean;
    IsFavorite?: boolean;

    // to custom needed operator
    AvailableOperators?: object[];
    // custom min value
    MinValue?: number;
    // custom max length
    AllowNegative?: boolean;
    MaxLength?: number;
    IsPredefined?: boolean;
}

export class FilterDefinition implements IFilterDefinition {
    ColumnName: string;
    DisplayValue: string;
    TranslateKey: string;
    FilterType: FilterType;
    FilterOperator: FilterOperator;
    IsSelected = false; // Is Item Selected (For Checkbox ArchiveType)
    DataType: DataType = DataType.None;
    ViewType: ToolbarFilterViewType = ToolbarFilterViewType.NormalList;
    Value: any = [];
    SelectedItems: DisplayItem[] = [];
    IsCheckboxSelectedAll = false; // checkbox
    CheckedAll = false; //  All items is checked
    CanUpdateCheckedAll = true;
    IsExclude = false;
    SelectedItemsTotal = 0;
    LeafType: string;
    NodeType: string;
    ExpectedFilterItem: string;
    IsExpectedSingleSelection = false;
    IsValid = true;
    IsFavorite = false;
    Data: any;
    canEdit = true;
    canRemove = true;
    // to custom needed operator
    AvailableOperators?: {
        value: string;
        translateKey: string;
    }[];
    // custom min value
    MinValue?: number;
    // custom max length
    MaxLength?: number;
    AllowNegative?: boolean;
    IsPredefined = false;

    constructor(properties: IFilterDefinition) {
        Object.getOwnPropertyNames(properties).forEach((key) => {
            if (properties[key] !== undefined && properties[key] !== null) {
                this[key] = properties[key];
            }
        });
    }

    clone(): FilterDefinition {
        let cloned: FilterDefinition = JSON.parse(JSON.stringify(this));
        if (cloned.SelectedItems) {
            cloned.SelectedItems = cloned.SelectedItems.map((item: DisplayItem) => {
                return new DisplayItem(item.Value, item.DisplayValue, item.IsSelected, item.TranslateKey, item.OriginData, item.Disabled, item.Template);
            });
        }
        return new FilterDefinition(cloned);
    }

    reset() {
        this.Value = [];
        this.SelectedItems = [];
        this.IsSelected = false;
        this.SelectedItemsTotal = 0;
        this.IsCheckboxSelectedAll = false;
        this.CheckedAll = false;
        this.IsExclude = false;
        this.IsValid = true;
    }

}


export class SortItem {
    Name: string;
    TranslationKey: string;
    IsSelected = false;
    Order = 'desc';

    constructor(value: string, translationKey: string, isSelected?: boolean, order?: string) {
        this.Name = value;
        this.TranslationKey = translationKey;
        if (isSelected) {
            this.IsSelected = isSelected;
        }
        if (order) {
            this.Order = order;
        }
    }

    reset() {
        this.IsSelected = false;
        this.Order = 'desc';
    }

    equal(name: string) {
        return name.split('_')[0] === this.Name;
    }

    active(sortBy: string) {
        this.IsSelected = true;
        if (sortBy.split('_').length > 1) {
            this.Order = sortBy.split('_')[1];
        } else {
            this.Order = 'desc';
        }
    }

    setName(sortBy: string) {
        this.Name = sortBy.split('_')[0];
    }

    get SortBy() {
        return this.Name + '_' + this.Order;
    }

    toggleSort() {
        this.Order = this.Order === 'desc' ? 'asc' : 'desc';
    }
}


export class CustomFilter {
    Id: string;
    Name: string;

    // EJ4-1486
    Public?: boolean;
    // MustPinned is the filter must be pinned for all user,
    // Map from the flag Pinned from the API
    MustPinned?: boolean;

    Pinned = false;
    Filters: FilterDefinition[] = [];
    Count: number;
    constructor(propeties) {
        Object.assign(this, propeties);

        if (propeties) {
            // Clone Filters
            if (propeties.Filters) {
                this.Filters = JSON.parse(JSON.stringify(propeties.Filters));
            }
        }

    }
}


export interface IPartyEmail extends IEntity {
    EntityDiscriminator: string;
    Name: string;
    Email: string;
}

export interface ISendMailData {
    DialogTitle: string;
    EntityType: string;
    EntityId: string;
    MailTemplate: string;
    Subject: string;
    To: BaseItem[];
    Cc: BaseItem[];
    Bcc: BaseItem[];
    Message: string;

    CommentIds?: string[];
    SendWithAttachments: boolean;
    Attachments: any[];

    // For UI management
    ToReadonly: boolean;
    HideMessage: boolean;

    AttachmentName: string;
    ReportData: any;

    // Post change
    ToSelected: IPartyEmail[];
    CcSelected: IPartyEmail[];
    BccSelected: IPartyEmail[];
    AttachmentsIdsSelected: string[];

    // GF-803 (2022.1.0): Manage contacts in CC for Tickets and Interventions
    ContactsInCC?: string;
}

export interface IGenerateReportData {
    DialogTitle: string;
    SelectedIds: string[];
    EntityType: string; // Incident or Intervention
    Mode: string; // list or detail

    Attachments?: any[]; // Attachments of the Incident or Intervention
    EntityNumber?: string; // Number of the Incident or Intervention
    Query?: ListQueryCondition;

    // For send mail
    SendMailDialogTitle?: string;
    MailTemplate?: string;
    Subject?: string;
    To?: BaseItem[];
    Cc?: BaseItem[];
    Bcc?: BaseItem[];
    ToReadonly?: boolean;
    HideMessage?: boolean;
    allTemplates?: ISuitableTemplate[];

    // GF-803 (2022.1.0): Manage contacts in CC for Tickets and Interventions
    ContactsInCC?: string;
}


export enum MailType {
    In,
    UserAccountInvitation,
    UserAccountResetPassword,
    IncidentInformationRequest,
    InterventionRequest,
    InterventionDateProposal,
    InterventionDateConfirmation,
    InterventionCompleted,
    MailCanvas,
    SendReports,
    UserAccountInternalContactConfirmation,
    UserAccountIExternalContactConfirmation,
    IncidentClosureRequest,
    IncidentComment,
    IncidentClosureNotification,
    IncidentCreationNotification,
    InterventionReminder,
    InterventionComment,
    VisitAssigned,    
    InterventionAssignment,
    IncidentCreatedFromPortalNotification,
    IncidentCommentFromPortalNotification
}

export class MailTemplate {
    Id: string;
    ManagedCompanyId?: string;
    Module: string;
    MailType: MailType;
}

export class MailTemplateDetail {
    Id: string;
    EntityVersion: number;
    Subject: string;
    Body: string;
    MailTemplateId: string;
    LanguageId: string;
}

export class KeyCode {


    static DOM_VK_CANCEL = 3;

    static DOM_VK_HELP = 6;
    static DOM_VK_BACK_SPACE = 8;
    static DOM_VK_TAB = 9;
    static DOM_VK_CLEAR = 12;
    static DOM_VK_RETURN = 13;
    static DOM_VK_ENTER = 14;
    static DOM_VK_SHIFT = 16;
    static DOM_VK_CONTROL = 17;
    static DOM_VK_ALT = 18;
    static DOM_VK_PAUSE = 19;
    static DOM_VK_CAPS_LOCK = 20;
    static DOM_VK_ESCAPE = 27;
    static DOM_VK_SPACE = 32;
    static DOM_VK_PAGE_UP = 33;
    static DOM_VK_PAGE_DOWN = 34;
    static DOM_VK_END = 35;
    static DOM_VK_HOME = 36;
    static DOM_VK_LEFT = 37;
    static DOM_VK_UP = 38;
    static DOM_VK_RIGHT = 39;
    static DOM_VK_DOWN = 40;
    static DOM_VK_PRINTSCREEN = 44;
    static DOM_VK_INSERT = 45;
    static DOM_VK_DELETE = 46;
    static DOM_VK_0 = 48;
    static DOM_VK_1 = 49;
    static DOM_VK_2 = 50;
    static DOM_VK_3 = 51;
    static DOM_VK_4 = 52;
    static DOM_VK_5 = 53;
    static DOM_VK_6 = 54;
    static DOM_VK_7 = 55;
    static DOM_VK_8 = 56;
    static DOM_VK_9 = 57;
    static DOM_VK_SEMICOLON = 59;
    static DOM_VK_EQUALS = 61;
    static DOM_VK_A = 65;
    static DOM_VK_B = 66;
    static DOM_VK_C = 67;
    static DOM_VK_D = 68;
    static DOM_VK_E = 69;
    static DOM_VK_F = 70;
    static DOM_VK_G = 71;
    static DOM_VK_H = 72;
    static DOM_VK_I = 73;
    static DOM_VK_J = 74;
    static DOM_VK_K = 75;
    static DOM_VK_L = 76;
    static DOM_VK_M = 77;
    static DOM_VK_N = 78;
    static DOM_VK_O = 79;
    static DOM_VK_P = 80;
    static DOM_VK_Q = 81;
    static DOM_VK_R = 82;
    static DOM_VK_S = 83;
    static DOM_VK_T = 84;
    static DOM_VK_U = 85;
    static DOM_VK_V = 86;
    static DOM_VK_W = 87;
    static DOM_VK_X = 88;
    static DOM_VK_Y = 89;
    static DOM_VK_Z = 90;
    static DOM_VK_CONTEXT_MENU = 93;
    static DOM_VK_NUMPAD0 = 96;
    static DOM_VK_NUMPAD1 = 97;
    static DOM_VK_NUMPAD2 = 98;
    static DOM_VK_NUMPAD3 = 99;
    static DOM_VK_NUMPAD4 = 100;
    static DOM_VK_NUMPAD5 = 101;
    static DOM_VK_NUMPAD6 = 102;
    static DOM_VK_NUMPAD7 = 103;
    static DOM_VK_NUMPAD8 = 104;
    static DOM_VK_NUMPAD9 = 105;
    static DOM_VK_MULTIPLY = 106;
    static DOM_VK_ADD = 107;
    static DOM_VK_SEPARATOR = 108;
    static DOM_VK_SUBTRACT = 109;
    static DOM_VK_DECIMAL = 110;
    static DOM_VK_DIVIDE = 111;
    static DOM_VK_F1 = 112;
    static DOM_VK_F2 = 113;
    static DOM_VK_F3 = 114;
    static DOM_VK_F4 = 115;
    static DOM_VK_F5 = 116;
    static DOM_VK_F6 = 117;
    static DOM_VK_F7 = 118;
    static DOM_VK_F8 = 119;
    static DOM_VK_F9 = 120;
    static DOM_VK_F10 = 121;
    static DOM_VK_F11 = 122;
    static DOM_VK_F12 = 123;
    static DOM_VK_F13 = 124;
    static DOM_VK_F14 = 125;
    static DOM_VK_F15 = 126;
    static DOM_VK_F16 = 127;
    static DOM_VK_F17 = 128;
    static DOM_VK_F18 = 129;
    static DOM_VK_F19 = 130;
    static DOM_VK_F20 = 131;
    static DOM_VK_F21 = 132;
    static DOM_VK_F22 = 133;
    static DOM_VK_F23 = 134;
    static DOM_VK_F24 = 135;
    static DOM_VK_NUM_LOCK = 144;
    static DOM_VK_SCROLL_LOCK = 145;
    static DOM_VK_COMMA = 188;
    static DOM_VK_NUMPAD_SUBTRACT = 189;
    static DOM_VK_PERIOD = 190;
    static DOM_VK_SLASH = 191;
    static DOM_VK_BACK_QUOTE = 192;
    static DOM_VK_OPEN_BRACKET = 219;
    static DOM_VK_BACK_SLASH = 220;
    static DOM_VK_CLOSE_BRACKET = 221;
    static DOM_VK_QUOTE = 222;
    static DOM_VK_META = 224;

    static getKeyCode(keyEvent: KeyboardEvent): number {
        return keyEvent.which || keyEvent.keyCode;
    }
}


export class Slide {
    isActive = false;
    position?: number;
    content?: any;
    component: ComponentType<any>;
    data: DialogData;
    loaded?: any;
    slideRef?: SliderRef;

    constructor(properties) {
        Object.assign(this, properties);
    }
}

export class IssueComment {
    Id: string;
    IssueId: string;
    Commentary: string;
    Date: string;
    IsAuthor: boolean;
    IsPrivate: boolean;
    CreatedBy: BaseItem;
    IssueAttachments: IssueAttachment[];

    attachData: AttachmentData[];

    // NBSHD-3675 for sending email
    IsSelected: boolean;
}

export class MessageObject {
    Code: string;
    Message: string;
}

export class CommonSharedConfig {
    useCustomGetAuthInfoBySession: boolean;

    /**
     * When AuthenticationService call server to get back user infor when user refresh the browser
     */
    CustomGetAuthInfoBySession(injector: Injector): Observable<AuthenticatedUser> {
        return of(undefined);
    }
}

export class LanguageModel {
    Code3: string; // 'ENG',
    Code2: string; // "en",
    DisplayValue: string; // 'Language_eng',
    TranslationKey: string; // 'lbLanguageEngByEng',
    FileName: string; // 'en.json',
    Local: string; // 'en-us'
    Name: string; // English, French, Dutch
}

export interface IConnectorDataExchange extends IEntity {
    ExternalId: string;
    Broken: boolean;
    ConnectorName: string;
    ConnectorType: string;
    Direction: string;
    Id: string;
}


export enum RouteStorageKey {
    CurrentRoute = 'CurrentRoute'
}

export class TemplateRefModel {
    tpl: TemplateRef<any>;
    name: string;
}

export class CalendarDate {
    Date: Date;
    Count: number;
}

export class ExistingInsertionsPerDate {
    Date: Date;
    NbrInsertions: number;
    DetailPerTitle: ExistingInsertionsPerTitle[];
}

export class ExistingInsertionsPerTitle {
    Title: string;
    NbrInsertions: number;
}

// issue GF-328
export interface ISuitableTemplate extends IListItem {
    IsPredefined: boolean;
    IsDefault: boolean;
    Languages: IListLanguages[];
}

export interface IListLanguages extends IListItem {
    IsDefault: boolean;
}

export interface ITreeItem extends BaseItem {
    Level: number;
}
