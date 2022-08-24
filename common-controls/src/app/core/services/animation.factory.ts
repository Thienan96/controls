import {
    AnimationDriver,
    ɵcontainsElement, ɵinvokeQuery,
    ɵmatchesElement,
    ɵvalidateStyleProperty,
    ɵWebAnimationsDriver
} from '@angular/animations/browser';

export function animationFactory(): any {
    const noop = AnimationDriver.NOOP;
    const driver = new ɵWebAnimationsDriver();
    return {
        animate: (element: any, keyframes: { [key: string]: string | number; }[],
                  duration: number, delay: number, easing: string, previousPlayers?: any[]) => {
            if ($(element).is('mat-dialog-container') && $(element).parent().hasClass('no-animation')) {
                return noop.animate(element, keyframes, duration, delay, easing, previousPlayers);
            } else {
                return driver.animate(element, keyframes, duration, delay, easing, previousPlayers);
            }
        },

        validateStyleProperty: (prop) => {
            return ɵvalidateStyleProperty(prop);
        },

        matchesElement: (element, selector) => {
            return ɵmatchesElement(element, selector);
        },
        containsElement: (elm1, elm2) => {
            return ɵcontainsElement(elm1, elm2);
        },

        query: (element, selector, multi) => {
            return ɵinvokeQuery(element, selector, multi);
        },

        computeStyle: (element, prop, defaultValue) => {
            return /** @type {?} */ ((/** @type {?} */ (window.getComputedStyle(element)))[prop]);
        },
        overrideWebAnimationsSupport: (supported) => {
            this._isNativeImpl = supported;
        }

    }
}
