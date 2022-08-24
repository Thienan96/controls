import {BaseItem, IEntity} from './common.info';

export class WorkingContext {
    Id: string;
    Role: string;
    Company: string;
}

export class AuthenticatedUser {
    SessionId: string;
    UILanguageId: string;
    ManagedCompany: BaseItem;
    Contact: BaseItem;
    WorkingContext: WorkingContext;
    UserLogin: string;
    RefreshToken: string;
    Parameters: { [param: string]: any };
    ModuleAccessRights: ModuleAccessRights;

    // NBSHD-4344: [HS/CL] Update status change granted to users with restricted access to HS/CL
    ScreenAccessRights: { [param: string]: any };
}

export class Contact implements IEntity {
    Id: string;
    Name: string;
    Email: string;
    Phone: string;
    Address: string;
    EmailLanguageId: string;
}

export class ModuleAccessRights {
    Incidents: boolean;
    Interventions: boolean;
    // GF-226 (1.56): new module Maintenance Schedules
    // NBSHD-4127 (1.57.0): [HS] Allow users to notify other users in comments  
    MaintenanceSchedules: boolean;
    Contacts: boolean;
    Sites: boolean;
    Documents: boolean;
    Configuration: boolean;
    Help: boolean;

     // GF-278: access right Site(Rooms & Equipment)
     Rooms: boolean;
     Equipments: boolean;
}

export class ManagedCompanyRelativeInfo {
    AproPLANConnectionUrl: string;
    Id: string;
    Name: string;
    Logo: string;
    ModuleChecklists: boolean;
    ModuleHelpsites: boolean;
    EmailLanguage: {
        Id: string
        Name: string
    };
}
