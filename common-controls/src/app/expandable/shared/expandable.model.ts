import {IEntityItem, ILazyItem} from '../../shared/models/common.info';
import {InjectionToken} from '@angular/core';
import {HierarchyItem} from './HierarchyItem';
import * as _ from 'underscore';

export const NTK_EXPANDABLE = new InjectionToken('NTK_EXPANDABLE');

export interface ILine extends ILazyItem {
    item: any;
    itemWrapper: ExpandableItemWrapper;
}

export interface IExpandableOption {
    itemHeight: number;
    indent: number;
}

export enum IExpandableDropPosition {
    Middle = 'Middle',
    Top = 'Top',
    Bottom = 'Bottom'
}

export class ExpandableItemWrapper extends HierarchyItem {
    // [propName: string]: any;

    // Height of boundary
    contentHeight: number; // height of content for draw line
    childrenHeight: number; // height of children of line


    isSelected = false; // Check item is selected, if item is selected , content will expand
    isVisible = true; // Check item visible on screen
    itemId: string; // uniqueId for line
    level: number; // Level of item
    itemNumber: string; // Only line 1.1.2

    hasChildren: boolean; // used for Section/Include items, to know whether there are some children items belong this section
    isCollapsed = false;  // only Section|Include, isCollapsed is true to know this item is Collapsed
    hasDirtyDescendant = false;
    isNew = false; // Check to show new text
    isDetailValueChanged = false;
    isDescendentOfIncludeItem: boolean;     // item is descendant of include item
    isConditionalLineItem = false;   // Item is ConditionalLine, is parent of sign enter
    isDescendentOfConditionalGroupItem: boolean; // children of  isConditionalGroupItem( sign enter)
    isFirstLineOfParent = false;
    canModify = true; // Check item can modify (Add, move, delete, clone)
    // Increase/Decrease level of section, include
    canDecreaseLevel = false; // Check item decrease level
    canIncreaseLevel = false; // Check item increase level
    isValidateAlready: boolean;
    _originalModel: any; //  Original model for check dirty

    constructor(itemModel, idPropertyName?: string, parentIdPropertyName?: string) {
        super(itemModel, idPropertyName, parentIdPropertyName);
        this._originalModel = this.clone(this.data);
        this.itemId = _.uniqueId('line-id-');
    }

    private clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    get isLineItem(): boolean {
        return false;
    }

    get isSectionItem(): boolean {
        return false;
    }


    get isIncludeItem(): boolean {
        return false;
    }

    get isConditionalGroupItem(): boolean { // have enter sign
        return false;
    }
}


export class CheckListItemWrapper extends ExpandableItemWrapper {

    constructor(itemModel) {
        super(itemModel, 'Id', 'ParentCheckListItemId');
    }

    get isLineItem(): boolean {
        return this.data.EntityDiscriminator === 'CheckListLine' || this.data.EntityDiscriminator === 'CheckListTemplateLine';
    }

    get isSectionItem(): boolean {
        return this.data.EntityDiscriminator === 'CheckListSection' || this.data.EntityDiscriminator === 'CheckListTemplateSection';
    }

    get isIncludeItem(): boolean {
        return this.data.EntityDiscriminator === 'CheckListInclude' || this.data.EntityDiscriminator === 'CheckListTemplateInclude';
    }

    get isConditionalGroupItem(): boolean { // have enter sign
        return this.data.EntityDiscriminator === 'ConditionalGroupItem';
    }


    get isValidateFail(): boolean {
        if (!this.isValidateAlready) {
            return false;
        }

        if (this.isConditionalGroupItem) {
            return !this.data.ConditionalVisibilityValueRange;
        }

        // NBSHD-4452 (1.57.2): [CL] The coefficient should not be negative in CheckListBaseItem
        return this.isInvalidName || this.isInvalidNameCoefficient;

    }

    get isInvalidName(): boolean {
        return !this.data.Name || (this.data.Name.length > 255);
    }

    // NBSHD-4452 (1.57.2): [CL] The coefficient should not be negative in CheckListBaseItem
    get isInvalidNameCoefficient(): boolean {
        return this.data && this.data.Coefficient < 0;
    }

    isDirty(isSkipStructureField: boolean = false): boolean {
        if (!this.data || !this._originalModel) {
            return false;
        }

        if (this.data.EntityVersion === 0) {
            return true;
        }


        let originalMode = this._originalModel;

        if ((this.data.Name || '') !== (originalMode.Name || '')) {
            return true;
        }
        if ((this.data.Code || '') !== (originalMode.Code || '')) {
            return true;
        }
        if ((this.data.Description || '') !== (originalMode.Description || '')) {
            return true;
        }
        if ((this.data.Coefficient || 0) !== (originalMode.Coefficient || 0)) {
            return true;
        }
        if ((this.data.PrintingType || '') !== (originalMode.PrintingType || '')) {
            return true;
        }
        if ((this.data.Visibility || '') !== (originalMode.Visibility || '')) {
            return true;
        }
        if (this.data.IsMandatory !== originalMode.IsMandatory) {
            return true;
        }

        if ((this.data.ParentCheckListItemId || '') !== (originalMode.ParentCheckListItemId || '')) {
            return true;
        }

        // detect changes on DisplayOrder and ConditionalVisibilityValueRange only when isSkipStructureField = false (default is false)
        if (!isSkipStructureField) {
            if ((this.data.ConditionalVisibilityValueRange || '') !== (originalMode.ConditionalVisibilityValueRange || '')) {
                return true;
            }
            if ((this.data.DisplayOrder || 0) !== (originalMode.DisplayOrder || 0)) {
                return true;
            }
        }

        if ((this.data.Room ? this.data.Room.Id : '') !== (originalMode.Room ? originalMode.Room.Id : '')) {
            return true;
        }
        if ((this.data.Equipment ? this.data.Equipment.Id : '') !== (originalMode.Equipment ? originalMode.Equipment.Id : '')) {
            return true;
        }

        if ((this.data.ValueType || '') !== (originalMode.ValueType || '')) {
            return true;
        }
        if (this.data.ValueType !== 'Custom' && (this.data.ExpectedValueRange || '') !== (originalMode.ExpectedValueRange || '')) {
            return true;
        }
        if ((this.data.CustomValueType ? this.data.CustomValueType.Id : '') !== (originalMode.CustomValueType ? originalMode.CustomValueType.Id : '')) {
            return true;
        }
        if ((this.data.Unit ? this.data.Unit.Id : '') !== (originalMode.Unit ? originalMode.Unit.Id : '')) {
            return true;
        }
        // if (this.difference(this.data.Attachments || [], originalMode.Attachments || [])) {
        //     return true;
        // }
        //
        // if (!angular.equals((this.data.Attachments || []), (originalMode.Attachments || []))) {
        //     return true;
        // }

        return false;
    }

}

export interface ILineEntityItem extends IEntityItem {
    EntityType: string;
    Id: string;
    Name: string;
    Attachments: any[];
    Description: string;
}


export interface IDocumentUpload {
    Id: string;
    Name: string;
    EntityVersion: string;
}

