import {Injectable, Output} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {StorageLocation, StorageService} from '../../core/services/storage.service';
import {ModuleDefinition} from './model';

@Injectable({
    providedIn: 'root'
})
export class ModuleBarService {
    @Output() moduleBarCollapsedChanged = new Subject();
    @Output() updateModulesAccessRights = new Subject();
    private ready = new Subject();

    constructor(private storageService: StorageService) {
    }

    raiseCollapsed(val) {
        this.moduleBarCollapsedChanged.next(val);
    }

    onCollapsedChanged() {
        return this.moduleBarCollapsedChanged.asObservable();
    }

    onReady() {
        return this.ready.asObservable();
    }

    raiseReady(val?) {
        this.ready.next(val);
    }

    raiseUpdateModulesAccessRights(val) {
        this.updateModulesAccessRights.next(val);
    }

    onUpdateModulesAccessRights() {
        return this.updateModulesAccessRights.asObservable();
    }

    getStorageKey(): string {
        return 'ModuleBar';
    }

    getStorage() {
        return this.storageService.getValue(this.getStorageKey(), StorageLocation.Session) || {};
    }

    setStorage(data: any) {
        this.storageService.setSessionValue(this.getStorageKey(), data);
    }

    storeScrollBarPosition(top: number) {
        let modulesBar = this.getStorage();
        modulesBar.scrollbarPosition = top;
        this.setStorage(modulesBar);
    }

    getScrollBarPosition(): number {
        return this.getStorage().scrollbarPosition || 0;
    }

    storeCollapsed(value: boolean) {
        let modulesBar = this.getStorage();
        modulesBar.collapsed = value;
        this.setStorage(modulesBar);
    }

    getCollapsed(): boolean {
        return this.getStorage().collapsed || false;
    }


    /**
     * Travel the child of node
     * @param node
     * @param callback
     */
    travelNode(node: ModuleDefinition, callback) {
        callback(node);
        if (node.children) {
            node.children.forEach((child) => {
                if (!child.isSeparate) {
                    this.travelNode(child, callback);
                }
            });
        }
    }

    /**
     * Travel the menu
     * @param modulesDef
     * @param callback
     * @param node
     */
    travelMenu(modulesDef: ModuleDefinition[], callback, node?: ModuleDefinition) {
        if (!node) {
            modulesDef.forEach((n) => {
                if (!n.isSeparate) {
                    this.travelNode(n, callback);
                }
            });
        } else {
            this.travelNode(node, callback);
        }
    }

}
