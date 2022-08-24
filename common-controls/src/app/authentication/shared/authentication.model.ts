export enum PasswordStrength {
    'None' = '',
    'Weak' = 'Weak',
    'Medium' = 'Medium',
    'Strong' = 'Strong'
}

export interface ICompany {
    Id: string;
    Name: string;
    Role?: string;
    ContextId?: string;
    ManagedCompany?: string;
}
