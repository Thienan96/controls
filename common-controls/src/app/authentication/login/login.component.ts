import {
    AfterViewInit,
    Component,
    ContentChildren,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ICompany} from '../shared/authentication.model';
import {finalize} from 'rxjs/operators';
import {RouterService} from '../../core/services/router.service';
import {StorageService} from '../../core/services/storage.service';
import {TranslationService} from '../../core/services/translation.service';
import {AuthenticationService} from '../../core/services/authentication.service';
import {DialogService} from '../../core/services/dialog.service';
import {BlockUIService} from '../../core/services/blockUI.service';
import {TemplateDirective} from '../../shared/directives/template.directive';
import {LoginStepper} from '../login-stepper/login-stepper.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'ntk-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
    @Input() netikaUrl = 'https://netika.com/';
    @Input() netikaLogo = 'src/assets/images/byNETiKA.png';
    @Input() logo = '';
    @Input() title = 'lbLoginToCHECKLISTS';
    @Input() showKeepMeSignIn: boolean = true;
    @Input() showFogotPassWord: boolean = true;
    @Input () titleLogin = 'lbUser';
    @Output() onLoginComplete = new EventEmitter();
    @Output() onFieldValueChanged = new EventEmitter<{field: string; value: any}>();

    @ContentChildren(TemplateDirective) templateDirectives: QueryList<TemplateDirective>;
    @ViewChild('stepper', {static: true}) stepper: LoginStepper;
    @ViewChild('companyTemplateDefault', {static: true}) companyTemplate: TemplateRef<any>;
    companies: ICompany[];
    isLoginError: boolean;
    errorMessage: string;
    ssoErrorMessage: string;

    resetForm: FormGroup;
    loginForm: FormGroup;


    constructor(protected formBuilder: FormBuilder,
                protected router: RouterService,
                protected storageService: StorageService,
                protected authenticationService: AuthenticationService,
                protected translationService: TranslationService,
                protected dialogService: DialogService,
                protected blockUIService: BlockUIService,
                private dialogRef: MatDialog) {

        // Clear auth when to login
        this.authenticationService.clearAllAuthenticationStates();

        this.dialogRef.closeAll();
        // Hide all popup when go to login page

    }


    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            Login: ['', [Validators.required]],
            Password: ['', [Validators.required]],
            IsKeepSignedIn: [{value: false, disabled: false}]
        });

        // hide the error message when login or password changed
        this.loginForm.get('Login').valueChanges.subscribe((x) => {
            this.isLoginError = false;
            this.errorMessage = undefined;
            this.onFieldValueChanged.emit({ field: 'Login', value: x})

        });
        this.loginForm.get('Password').valueChanges.subscribe((x) => {
            this.isLoginError = false;
            this.errorMessage = undefined;
            this.onFieldValueChanged.emit({ field: 'Password', value: x})
        });


        this.resetForm = this.formBuilder.group({
            login: ['', [Validators.required, Validators.email]]
        });


    }

    ngAfterViewInit() {
        let companyItemTemplate = this.templateDirectives.find((template) => {
            return template.name === 'company';
        });
        if (companyItemTemplate) {
            this.companyTemplate = companyItemTemplate.tpl;
        }
    }

    updateFieldReadOnly(field: string, isRedOnly: boolean) {
        if (!this.loginForm.get(field)) { return; }

        if (isRedOnly) {
            this.loginForm.get(field).disable();
        } else {
            this.loginForm.get(field).enable();
        }
    }

    isFieldRedonly(field: string): boolean {
        if (!this.loginForm.get(field)) { return false; }

        return this.loginForm.get(field).disabled;
    }

    checkLogin() {
        this.loginByContextId();
    }

    onCompanyClick(company) {
        this.loginByContextId(company.Id);
    }

    onSlideTo(name: string) {
        switch (name) {
            case 'LoginScreen':
                this.stepper.selectedIndex = 0;
                break;
            case 'CompanyScreen':
                this.stepper.selectedIndex = 1;
                break;
            default:
                this.stepper.selectedIndex = 2;
                break;
        }
    }

    sendMail() {
        if (this.resetForm.get('login').value && this.resetForm.valid) {
            this.authenticationService.sendResetPasswordEmail(this.resetForm.value).subscribe(result => {
                if (result) {
                    let title = this.translationService.getTranslation('lbInformation');
                    let msg = this.translationService.getTranslation('msgActivationMailSent');
                    this.dialogService.showMessageDialog(title, msg, 'btOK').subscribe();
                } else {
                    this.resetForm.controls.login.setErrors({
                        InvalidUser: true
                    });
                }
            });
        }
    }

    private loginByContextId(contextId?) {
        if (this.loginForm.valid) {
            this.blockUIService.start();
            this.authenticationService
                .logon(
                    this.loginForm.value.Login,
                    this.loginForm.value.Password,
                    this.translationService.getDefaultLanguageCodeUI(),
                    contextId,
                    this.loginForm.value.IsKeepSignedIn,
                    undefined,
                    true
                )
                .pipe(finalize((() => {
                    this.blockUIService.stop();
                })))
                .subscribe((response: any) => {
                        if (!!response) { // login OK
                            if (Array.isArray(response)) {
                                this.companies = response.map((company: any) => {
                                    return {
                                        Id: company.Id || company.ContextId,
                                        Name: company.Name || company.Company || company.ManagedCompany,
                                        Role: company.Role
                                    };
                                });
                                this.onSlideTo('CompanyScreen');
                            } else {
                                this.onLoginComplete.emit(response);
                            }
                        }
                    },
                    (err) => {
                        if (err.error && err.error.code) {
                            switch (err.error.code) {
                                case 'InvalidLoginOrPassword':
                                    this.errorMessage = this.translationService.getTranslation('errorInvalidUserOrPassword');
                                    break;
                                case 'AccountLocked':
                                    this.errorMessage = this.translationService.getTranslation('errorAccountLocked');
                                    break;
                                case 'AccountNotAllowLogon':
                                case 'ExternalClientNotAllowLogon':
                                case 'ExternalClientOrIntervenerNotAllowLogon':
                                case 'ExternalIntervenerNotAllowLogon':
                                    this.errorMessage = this.translationService.getTranslation('errorDontHaveRightsToLogin');
                                    break;
                                case 'SystemAdminLogonOnInvalidIpAddress':
                                    this.errorMessage = this.translationService.getTranslation('errorDontHaveSystemAdminRights');
                                    break;
                                case 'NoSiteAssociatedToTheProjectsVisibleByThisUser':
                                    this.errorMessage = this.translationService.getTranslation('NoSiteAssociatedToTheProjectsVisibleByThisUser');
                                    break;
                                case 'NoVisibilitySiteByThisUser':
                                    this.errorMessage = this.translationService.getTranslation('NoVisibilitySiteByThisUser');
                                    break;
                                default:
                                    this.errorMessage = this.translationService.getTranslation('ApiErrorCodes_Unknow') + ': ' +  + err.error.code;
                            }

                        } else {
                            this.errorMessage = this.translationService.getTranslation('ApiErrorCodes_Unknow') + ': ' + err.status;
                            // this.errorMessage = this.translationService.getTranslation('ApiErrorCodes_Unknow');
                        }
                        this.isLoginError = true;
                    });
        }
    }

}
