export class ModuleDefinition {
    routeName?: any;
    translationKey?: string;
    svgIcon?: string;
    customSvgIcon?: string;
    activeImageIcon?: string;
    inActiveImageIcon?: string;
    children?: ModuleDefinition[];
    parent?: ModuleDefinition;
    className?: string;
    parameter?: string;
    moduleName?: string;
    /**
     * Eeach menu item is effected by some or one screen accessright from server to check if it can display or not
     * If this property is not specified mean that it alsways display
     * If there is children and not of child is display then the item will hide also
     */
    effectedScreens?: { [index: string]: any };
    requiredRoles?: string[];
    isExpanded ? = false;
    level ? = 0;
    id?: string;
    isSeparate ? = false;
    isActive ? = false;
    isCommand ? = false;

    constructor(properties) {
        Object.assign(this, properties);
        this.id = this.routeName + '_' + this.level;
    }

}
