import {Component, Input} from '@angular/core';
import {PasswordStrength} from '../shared/authentication.model';

@Component({
    selector: 'ntk-estimate-password-strength',
    templateUrl: './estimate-password-strength.component.html',
    styleUrls: ['./estimate-password-strength.component.scss'],
    host: {
        '[class.weak]': 'passwordStrength===PasswordStrength.Weak',
        '[class.medium]': 'passwordStrength===PasswordStrength.Medium',
        '[class.strong]': 'passwordStrength===PasswordStrength.Strong',
    }
})
export class EstimatePasswordStrengthComponent {

    get PasswordStrength() {
        return PasswordStrength;
    }

    @Input() passwordStrength: string;

}
