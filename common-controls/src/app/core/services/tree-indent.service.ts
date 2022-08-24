import {Injectable} from '@angular/core';
import * as _ from 'underscore';

@Injectable({
    providedIn: 'root'
})
export class TreeIndentService {
    /**
     * This is to serve the gid which need display like a tree
     * The method return if the line is the fist line in its level
     * @param index : row index in list
     */
    isFirstItemInLevel(items: any[], index: number, level = 'Level'): boolean {
        let item = items[index];
        let pre = items[index - 1];
        if (item && pre) {
            return pre[level] < item[level];
        }
    }


    /**
     * This is to serve the gid which need display like a tree
     * The method return an array of indent level which tru/false depend on if need to draw the line on that level or not
     * @param items
     * @param index : row index in list
     */
    calculateIndentLines(items: any[], index: number, level = 'Level', startLevel = 0): boolean[] {
        let item = items[index],
            itemLevel = item[level] + startLevel;

        // in case the line not yet perofomr lazy load finish
        if (!_.has(item, level)) {
            return [];
        }

        let result: boolean[] = new Array(itemLevel > 0 ? itemLevel - 1 : 0).fill(false);

        // console.log('item =', item.Name, ' level=', item.Level);
        let lastLevel = itemLevel;

        if (itemLevel > 1) {
            for (let i = +index + 1; i < items.length; i++) {
                let currentItem = items[i],
                    currentLevel = currentItem[level] + startLevel;
                if (currentLevel < lastLevel) {
                    if (currentLevel === 1) {
                        return result;
                    } else {
                        result[currentLevel - 2] = true;
                    }

                    lastLevel = currentLevel;
                }
            }
        }
        return result;

    }

}
