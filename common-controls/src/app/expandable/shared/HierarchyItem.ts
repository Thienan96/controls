export class HierarchyItem {
    get Id(): any {
        return this.data[this.idPropertyName] || null;
    }

    get parentId(): any {
        if (!this.parentIdPropertyName) {
            return null;
        }
        return this.data[this.parentIdPropertyName] || null;
    }

    set parentId(value) {
        this.data[this.parentIdPropertyName] = value;
    }

    constructor(public data: any,
                private readonly idPropertyName?: string,
                private readonly parentIdPropertyName?: string) {

        if (!idPropertyName) {
            this.idPropertyName = 'Id';
        }
        if (!parentIdPropertyName) {
            this.parentIdPropertyName = 'parentId';
        }
    }
}
