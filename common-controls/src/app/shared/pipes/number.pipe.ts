import { Pipe, PipeTransform, Injector } from '@angular/core';
import { AuthenticationService } from '../../core/services/authentication.service';
import { UtilityService } from '../../core/services/utility.service';




@Pipe({ name: 'formatInterger' })
export class IntergerPipe implements PipeTransform {
    transform(value: number, params: any): string {
        if (value) {
            return value.toString();
        }
        return '';
    }
}

@Pipe({ name: 'formatDecimal' })
export class FormatDecimalPipe implements PipeTransform {
    private authenticationService: AuthenticationService;
    private utilityService: UtilityService;

    constructor(private injector: Injector) {
        this.authenticationService = injector.get(AuthenticationService);
        this.utilityService = injector.get(UtilityService);
    }

    transform(value: number | string, numberDecimals?: number, removeUnnecessaryZeros?: boolean, minDecimalCharsNumber?: number, allowNull?: boolean): string {
        if (!numberDecimals) { numberDecimals = this.authenticationService.numberDecimals; }
        let nValue = this.utilityService.transform(value, this.authenticationService.groupSep, this.authenticationService.decimalSep, numberDecimals, removeUnnecessaryZeros, minDecimalCharsNumber);
        if (allowNull && (!value && value !== 0)) {
            nValue = null;
        }
        return nValue;
    }

    parse(value: string, numberDecimals?: number): string {
        if (!numberDecimals) { numberDecimals = this.authenticationService.numberDecimals; }
        return this.utilityService.parse(value, this.authenticationService.groupSep, this.authenticationService.decimalSep, numberDecimals);
    }

}


@Pipe({ name: 'protectBadge' })
export class ProtectBadge implements PipeTransform {
    constructor(private injector: Injector) {
    }

    transform(value: number | null | undefined): string {
        if (value === null || value === undefined) {
            return '';
        }
        if (value > 99) {
            return '99+';
        } else {
            return value.toString();
        }
    }
}

@Pipe({ name: 'formatDuration' })
export class FormatDurationPipe implements PipeTransform {
    private authenticationService: AuthenticationService;
    private utilityService: UtilityService;

    constructor(private injector: Injector) {
        this.authenticationService = injector.get(AuthenticationService);
        this.utilityService = injector.get(UtilityService);
    }

    transform(value: number, shouldNOTShowMinutesUnit? ): string {
        return this.utilityService.transformDurationToString(value, shouldNOTShowMinutesUnit);
    }
}

