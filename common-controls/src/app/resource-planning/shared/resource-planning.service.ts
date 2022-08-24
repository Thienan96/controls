import {Injectable} from '@angular/core';
import moment from 'moment-es6';
import {
    IResourcePlanningChanged,
    IResourcePlanningDroppableEventUIParam,
    IResourcePlanningEvent,
    IResourcePlanningHeaderColumn,
    ResourcePlanningViewMode
} from './resource-planning.model';
import * as _ from 'underscore';
import {ResourcePlanningConfigService} from './resource-planning-config.service';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

@Injectable({
    providedIn: 'root'
})
export class ResourcePlanningService {
    _itemSelectedSubject = new Subject();
    _resizeSubject = new Subject();
    _disabledDroppableSubject = new Subject();
    _updateResourceSubject = new Subject();


    constructor(private $ConfigService: ResourcePlanningConfigService) {
    }

    // Select event
    getSelectedEvent(): Observable<any> {
        return this._itemSelectedSubject.asObservable();
    }

    selectEvents(events: IResourcePlanningEvent[]) {
        this._itemSelectedSubject.next(events);
    }

    // Control resize
    getResize() {
        return this._resizeSubject.asObservable();
    }

    raiseResize(width: number) {
        this._resizeSubject.next(width);
    }

    // Droppable is disabled
    getDisabledDroppable(): Observable<any> {
        return this._disabledDroppableSubject.asObservable();
    }

    raiseDisabledDroppable(status: boolean) {
        this._disabledDroppableSubject.next(status);
    }

    // Resource was updated
    onResourceChange() {
        return this._updateResourceSubject.asObservable();
    }

    raiseResourceChange(data) {
        this._updateResourceSubject.next(data);
    }

    getShortDurationFromDuration(hour: number): string {
        let duration = moment.duration(hour, 'hours'),
            h = duration.days() * 24 + duration.hours(),
            m = duration.minutes();
        return h + 'h' + (m === 0 ? '' : m);
    }


    getShortDurationFromDurationWithSpacing(hour): string {
        let duration = moment.duration(hour, 'hours'),
            h = duration.days() * 24 + duration.hours(),
            m = duration.minutes();
        return h + ' H ' + (m === 0 ? '' : m);
    }

    getRoundTimeQuarterHour(time): Date {
        let timeToReturn = new Date(time);
        timeToReturn.setMilliseconds(Math.round(time.getMilliseconds() / 1000) * 1000);
        timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
        timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
        return timeToReturn;
    }

    /**
     * get contrast of color
     * @param {string} color
     * @returns {string}
     */
    getContrastColor(color: string): string {
        let hexColor = color && color.length > 0 && color[0] === '#' ? color.substring(1, color.length) : color;
        let DARK = '#000000';
        let LIGHT = '#FFFFFF';
        let r = parseInt(hexColor.substr(0, 2), 16);
        let g = parseInt(hexColor.substr(2, 2), 16);
        let b = parseInt(hexColor.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? DARK : LIGHT;
    }

    canModify(event, oi) {
        let canModify = true;
        if ((_.findWhere(oi, {Id: event.Id}) !== undefined) && !event.canMoveInside && !event.canResize) {
            canModify = false;
        }
        return canModify;
    }


    /**
     * Merge items if have 2 items same taskId
     * @param {IResourcePlanningEvent[]} items
     * @param {IResourcePlanningChanged} change
     */
    mergeItems(items: IResourcePlanningEvent[], change: IResourcePlanningChanged) {
        let eventParentIdProperty = this.$ConfigService.get('eventParentIdProperty');
        for (let i = 0; i < items.length; i++) {
            for (let j = i - 1; j >= 0; j--) {
                if (items[i][eventParentIdProperty] === items[j][eventParentIdProperty]) {

                    // merge duration
                    let item = items[j];
                    item.Duration = item.Duration + items[i].Duration;
                    change.updated.push(item);


                    // set up remove item
                    change.deleted.push(items[i]);

                    // remove item
                    items.splice(i, 1);
                    i--;

                    break;
                }
            }
        }

    }

    canMerge(item1, item2, oi) {
        let eventParentIdProperty = this.$ConfigService.get('eventParentIdProperty');
        return item1[eventParentIdProperty] === item2[eventParentIdProperty] && this.canModify(item1, oi);
    }

    /**
     * Move item in destination column to source column and merge duration
     * @param sourceItems
     * @param sourceIndex
     * @param destinationItems
     * @param destinationIndex
     * @param change
     * @param oi
     */
    mergeItemFromIndex(sourceItems, sourceIndex, destinationItems, destinationIndex, change, oi) {
        let sourceItem = sourceItems[sourceIndex],
            destinationItem = destinationItems[destinationIndex];
        if (this.canMerge(destinationItem, sourceItem, oi)) {
            // merge duration
            destinationItem.Duration = destinationItem.Duration + sourceItem.Duration;
            change.updated.push(destinationItem);

            // delete item out source
            let removedItem = sourceItems.splice(sourceIndex, 1);
            change.deleted.push(removedItem[0]);
        }
    }

    moveItems(sourceItems, destinationItems, change, index, oi) {
        if (sourceItems.length > 0 && index - 1 < destinationItems.length && index - 1 >= 0) {
            this.mergeItemFromIndex(sourceItems, 0, destinationItems, index - 1, change, oi);
        }
        if (sourceItems.length > 0 && index < destinationItems.length && index >= 0) {
            this.mergeItemFromIndex(sourceItems, sourceItems.length - 1, destinationItems, index, change, oi);
        }
    }

    insertItems(sourceItems, destinationItems, index) {
        for (let i = 0; i < sourceItems.length; i++) {
            destinationItems.splice(index + i, 0, sourceItems[i]);
        }
    }

    updateChange(change: IResourcePlanningChanged, si, oi) {
        // remove items in deleted list out added, updated
        change.added = _.reject(change.added, (item) => {
            return _.find(change.deleted, item) !== undefined;
        });
        change.updated = _.reject(change.updated, (item) => {
            return _.find(change.deleted, item) !== undefined;
        });

        // remove items in added list out updated
        change.updated = _.reject(change.updated, (item) => {
            return _.find(change.added, item) !== undefined;
        });

        // Updated only contain items have to have Id
        change.updated = change.updated.filter((item) => {
            return !!item.Id;
        });

        // Deleted only contain items have to have Id
        change.deleted = change.deleted.filter((item) => {
            return !!item.Id;
        });

        // Uniq added
        for (let i = 0; i < change.added.length; i++) {
            let matched = false;
            for (let j = i - 1; j >= 0; j--) {
                if (change.added[j] === change.added[i]) {
                    matched = true;
                }
            }
            if (matched) {
                change.added.splice(i, 1);
                i--;
            }
        }
        // Uniq updated
        for (let i = 0; i < change.updated.length; i++) {
            let matched = false;
            for (let j = i - 1; j >= 0; j--) {
                if (change.updated[j] === change.updated[i]) {
                    matched = true;
                }
            }
            if (matched) {
                change.updated.splice(i, 1);
                i--;
            }
        }

        // Remove updated
        let mergedItems = Array.prototype.concat(si, oi);
        for (let i = 0; i < change.updated.length; i++) {
            let updatedItem = change.updated[i];
            let matched = _.findWhere(mergedItems, {
                Id: updatedItem.Id
            });
            if (matched) {
                if (!this.isModifiedItem(updatedItem, matched)) {
                    change.updated.splice(i, 1);
                    i--;
                }
            }

        }
    }

    setIndex(events, position, change, maxIndex, oi) {
        let eventIndexProperty = this.$ConfigService.get('eventIndexProperty');
        for (let i = position; i < events.length; i++) {
            let event = events[i];
            if (!this.canModify(event, oi)) {
                maxIndex = event[eventIndexProperty];
            } else {
                event[eventIndexProperty] = maxIndex;
                change.updated.push(event);
            }
            maxIndex++;
        }
    }

    getNewEventsFromChange(change: IResourcePlanningChanged, si, oi, newEvents, oldEvents) {
        // remove
        _.map(change.deleted, (item) => {
            let oldEvent = _.findWhere(Array.prototype.concat(si, oi), {
                Id: item.Id
            });
            oldEvents.push(oldEvent);
        });
        // add
        _.map(change.added, (item) => {
            newEvents.push(item);
        });
        // update
        _.map(change.updated, (item) => {
            newEvents.push(item);
            let oldEvent = _.findWhere(Array.prototype.concat(si, oi), {
                Id: item.Id
            });
            oldEvents.push(oldEvent);
        });
    }


    isModifiedItem(item1, item2) {
        let eventIndexProperty = this.$ConfigService.get('eventIndexProperty');
        return (item1.Date !== item2.Date) ||
            (item1.ResourceId !== item2.ResourceId) ||
            (item1.GroupId !== item2.GroupId) ||
            (item1.Duration !== item2.Duration) ||
            (item1[eventIndexProperty] !== item2[eventIndexProperty]);
    }

    // In Source column , Swap items  to top if the items is exist in des column
    swapItemsToTop(sourceItems: IResourcePlanningEvent[], destinationItems: IResourcePlanningEvent[]) {
        let eventParentIdProperty = this.$ConfigService.get('eventParentIdProperty');
        _.each(sourceItems, (sourceItem, i) => {
            for (let j = 0; j < i; j++) {
                if (sourceItem[eventParentIdProperty] === sourceItems[j][eventParentIdProperty] && _.findWhere(destinationItems, {Id: sourceItem.Id})) {
                    let temp = sourceItems[i];
                    sourceItems[i] = sourceItems[j];
                    sourceItems[j] = temp;
                }
            }
        });
    }

    getAction(ui) {
        // detect action
        let action = '';
        if (ui.helper.hasClass('ntk-resources-events-dragging-wrapper')) {
            action = 'move';
            if (this.getCtrlKey(ui) || this.getAltKey(ui)) {
                action = 'add';
            }
        } else {
            action = 'add';
        }
        return action;
    }

    getCtrlKey(ui) {
        return ui.helper.data('ctrlKey');
    }

    getAltKey(ui) {
        return ui.helper.data('altKey');
    }

    getDrop(si: IResourcePlanningEvent[], oi: IResourcePlanningEvent[], index: number, ui: IResourcePlanningDroppableEventUIParam, options: {
        Date: string;
        ResourceId: string;
        GroupId: string;
    }) {
        let sourceItems: IResourcePlanningEvent[] = <IResourcePlanningEvent[]>_.map(si, _.clone),
            destinationItems: IResourcePlanningEvent[] = <IResourcePlanningEvent[]>_.map(oi, _.clone),
            action = this.getAction(ui),
            ctrlKey = this.getCtrlKey(ui),
            altKey = this.getAltKey(ui),
            change = {
                added: [],
                updated: [],
                deleted: []
            };

        // Update data for sourceItems
        _.each(sourceItems, (item) => {
            item.Date = options.Date;
            item.ResourceId = options.ResourceId;
            item.GroupId = options.GroupId;
        });


        // Push item to the add list and remove Id if action is add
        if (action === 'add') {
            _.each(sourceItems, (item) => {
                delete item.Id;
                change.added.push(item);
            });
        }

        // Swap items in Source column  to top if the items is exist in destination column (sort)
        this.swapItemsToTop(sourceItems, destinationItems);

        // Decrease index if a item in sourceItems and this.items (sort)
        let oldIndex: any;
        oldIndex = index;
        for (let i = 0; i < oldIndex; i++) {
            let result = _.findWhere(sourceItems, {
                Id: destinationItems[i].Id
            });
            if (result) {
                index--;
            }
        }

        // Remove selected items in destination column (sort)
        for (let i = 0; i < destinationItems.length; i++) {
            let result = _.findWhere(sourceItems, {
                Id: destinationItems[i].Id
            });
            if (result) {
                destinationItems.splice(i, 1);
                i--;
            }
        }


        // Step 1: Merge the events have same taskId
        this.mergeItems(sourceItems, change);

        // Step 2: Move first,last of sources column to destination column
        this.moveItems(sourceItems, destinationItems, change, index, oi);

        // Step 3: Move the events from sources column to destination column
        this.insertItems(sourceItems, destinationItems, index);


        let maxIndex = this.getMaxIndex(destinationItems.slice(0, index)) + 1;

        // Step 4:Sort item by Index
        this.sortEventsByIndex(destinationItems, index, maxIndex, oi);

        // Step 5: Update index
        this.setIndex(destinationItems, index, change, maxIndex, oi);


        _.each(sourceItems, (item) => {
            change.updated.push(item);
        }, this);

        // Compute change
        this.updateChange(change, si, oi);


        // Convert change to newEvents,oldEvents
        let newEvents = [],
            oldEvents = [];
        this.getNewEventsFromChange(change, si, oi, newEvents, oldEvents);

        return {
            newValues: newEvents,
            oldValues: oldEvents,
            options: {
                ctrlKey: ctrlKey,
                altKey: altKey,
                changeType: action,
                sourceId: ui.helper.data('data').Id
            }
        };
    }


    getMaxIndex(events) {
        let eventIndexProperty = this.$ConfigService.get('eventIndexProperty');
        // get MaxIndex
        let maxIndex = -1;
        _.each(events, (item) => {
            if (item[eventIndexProperty] > maxIndex) {
                maxIndex = item[eventIndexProperty];
            }
        });
        return maxIndex;
    }

    sortEventsByIndex(events, position, displayOrder, oi) {
        let eventIndexProperty = this.$ConfigService.get('eventIndexProperty');
        for (let i = position; i < events.length; i++) {
            let item = events[i];
            if (!this.canModify(item, oi)) {
                displayOrder = item[eventIndexProperty];
            } else {
                for (let k = i + 1; k < events.length; k++) {
                    let event = events[k];
                    if (event[eventIndexProperty] === displayOrder && !this.canModify(event, oi)) {
                        let removed = events.splice(k, 1);
                        events.splice(i, 0, removed[0]);
                    }
                }

            }
            displayOrder = displayOrder + 1;
        }
    }

    getDatesPosition(dates: string[], viewMode: ResourcePlanningViewMode, daysOfWeek: number): IResourcePlanningHeaderColumn[] {
        let formatedDates: IResourcePlanningHeaderColumn[] = [],
            spacing = 0,
            width = (100 / dates.length),
            currentDate = moment().format('YYYY-MM-DD');
        if (viewMode === ResourcePlanningViewMode.Week) {
            width = ((100 - (dates.length / daysOfWeek) + 1) / dates.length);
        }
        dates.forEach((date, $index) => {
            let mDate = moment(date, 'YYYY-MM-DD'),
                day: number = parseInt(mDate.format('d'), 10),
                isWeekend = (day === 6) || (day === 0);    // 6 = Saturday, 0 = Sunday
            if ((viewMode === ResourcePlanningViewMode.Week) &&
                ($index + 1) % daysOfWeek === 0 &&
                $index < dates.length - 1) {
                spacing++;
            }
            formatedDates.push({
                date: date,
                shortDay: mDate.format('dd'),
                fullDay: mDate.format('dddd'),
                dayOfMonth: mDate.format('D'),
                isToday: date === currentDate,
                left: spacing + width * $index,
                isWeekend: isWeekend,
                width: width
            });
        });
        return formatedDates;
    }
}
