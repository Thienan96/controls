declare var Zone: any;

export const hsclZone = Zone.current.fork({
    name: 'hsclZone',
    onScheduleTask: (delegate, current, target, task) => {
        // let list = window['EventsList'] || {};
        // list[task.source] = (list[task.source] || 0) + 1;
        // window['EventsList'] = list;
        let zone_disable = false;
        if (window['__Zone_disable']) {
            let eventsTask: string[] = [
                // Mouse
                'addEventListener:mousedown',
                'addEventListener:mousemove',
                'addEventListener:mouseup',
                'addEventListener:mouseenter',
                'addEventListener:mouseleave',
                'addEventListener:mouseout',
                'addEventListener:mouseover',

                // Touch
                'addEventListener:touchstart',
                'addEventListener:touchmove',
                'addEventListener:touchend',

                // Pointer
                'pointerdown',
                'pointermove',
                'pointerup',
                'pointerenter',
                'pointerleave',
                'pointout',
                'pointerover',
                'dragstart',

                // Scroll
                'wheel',
                'mousewheel',
                'scroll',


                'blur',
                'focus',
                '$destroy',
                // 'click',
                '$md',
                'dragenter',
                'dragover',
                'keypress',
                'paste',
                'change',
                'dragleave',
                'transitionend',
                'webkitTransitionEnd',
                'requestAnimationFrame',
                'onLeave',
                'timeout',
                'animationstart'
            ];
            let events = [
                'setTimeout',
                'setInterval',
                'requestAnimationFrame',
                'Promise.then',
                'scheduleMicrotask'
            ];

            if (events.some((name) => task.source === name) ||
                (task.type === 'eventTask' && eventsTask.some((name) => task.source.indexOf(name) > -1))) {
                zone_disable = window['__Zone_disable'];
            }
        }
        // un-commented these 2 lines to test if some of components in Angular 2 may have problem
        // task.cancelScheduleRequest();
        // return Zone.root.scheduleTask(task);

        if (zone_disable) {
            task.cancelScheduleRequest();
            // Schedule task in root zone, note Zone.root != target,
            // "target" Zone is Angular. Scheduling a task within Zone.root will
            // prevent the infinite digest cycle from appearing.
            return Zone.root.scheduleTask(task);
        } else {
            // if (task.type === 'eventTask') {
            //     console.log('eventTask not disabled: ', task.source);
            // } else {
            //     console.log('task not disabled: ', task);
            // }

            return delegate.scheduleTask(target, task);
        }
    }
});
