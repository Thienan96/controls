import {DragRef, DragRefConfig} from '@angular/cdk/drag-drop';
import {ElementRef, Inject, NgZone} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {KanbanDragDropRegistry} from './drag-drop.registry';
import {KanbanDropListRef} from './drop-list-ref';
import {KanbanDrag} from './drag';
import {KanbanService} from './kanban.service';
import {KanbanDragDropContainer} from './drag-drop';
import {Subject, Subscription} from 'rxjs';
import {KanbanColumn, KanbanDragStart} from './kanban.model';

function parseCssPropertyValue(computedStyle, name) {
    let value = computedStyle.getPropertyValue(name);
    return value.split(',').map((part) => {
        return part.trim();
    });
}

/**
 * Parses a CSS time value to milliseconds.
 * @param {?} value
 * @return {?}
 */
function parseCssTimeUnitsToMs(value) {
    // Some browsers will return it in seconds, whereas others will return milliseconds.
    let multiplier = value.toLowerCase().indexOf('ms') > -1 ? 1 : 1000;
    return parseFloat(value) * multiplier;
}

function getTransformTransitionDurationInMs(element) {
    let computedStyle = getComputedStyle(element);
    let transitionedProperties = parseCssPropertyValue(computedStyle, 'transition-property');
    let property = transitionedProperties.find(
        (prop) => {
            return prop === 'transform' || prop === 'all';
        });
    // If there's no transition for `all` or `transform`, we shouldn't do anything.
    if (!property) {
        return 0;
    }
    // Get the index of the property that we're interested in and match
    // it up to the same index in `transition-delay` and `transition-duration`.

    let propertyIndex = transitionedProperties.indexOf(property);

    let rawDurations = parseCssPropertyValue(computedStyle, 'transition-duration');
    let rawDelays = parseCssPropertyValue(computedStyle, 'transition-delay');
    return parseCssTimeUnitsToMs(rawDurations[propertyIndex]) +
        parseCssTimeUnitsToMs(rawDelays[propertyIndex]);
}

function getTransform(x: number, y: number) {
    // Round the transforms since some browsers will
    // blur the elements for sub-pixel transforms.
    return 'translate3d(' + Math.round(x) + 'px, ' + Math.round(y) + 'px, 0)';
}

export class KanbanDragRef extends DragRef<KanbanDrag> {
    superPointerDown: any;
    superPointerUp: any;
    id: string;
    animatePreviewToPlaceholderSub = new Subject();
    animatePreviewToPlaceholderSubscription: Subscription | any;

    constructor(private element: ElementRef,
                private config: DragRefConfig,
                @Inject(DOCUMENT) document: Document,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler,
                private dragDropRegistry: KanbanDragDropRegistry,
                private kanbanService: KanbanService) {
        super(element, config, document, ngZone, viewportRuler, dragDropRegistry);

        this.removeRootElementListeners(element.nativeElement);
        this.rootElement = null;

        this.superPointerDown = this['_pointerDown'];
        this['_pointerDown'] = this.pointerDown.bind(this);

        this.superPointerUp = this['_pointerUp'];
        this['_pointerUp'] = this.pointerUp.bind(this);

        this['_animatePreviewToPlaceholder'] = this.animatePreviewToPlaceholder.bind(this);


        this.withRootElement(element);
    }

    get rootElement() {
        return this['_rootElement'];
    }

    set rootElement(value) {
        this['_rootElement'] = value;
    }

    get dropContainer(): KanbanDropListRef {
        return this['_dropContainer'];
    }

    get initialContainer(): KanbanDropListRef {
        return this['_initialContainer'];
    }

    private get nextSibling() {
        return this['_nextSibling'];
    }

    private get placeholder(): HTMLElement {
        return this['_placeholder'];
    }

    private set placeholder(value: HTMLElement) {
        this['_placeholder'] = value;
    }

    private get preview() {
        return this['_preview'];
    }

    private get hasStartedDragging() {
        return this['_hasStartedDragging'];
    }

    private get getPointerPositionOnPage() {
        return this['_getPointerPositionOnPage'];
    }

    private get hasMoved() {
        return this['_hasMoved'];
    }

    private get scroller(): JQuery {
        return $(this.placeholder).closest('.scroll-viewport');
    }

    removeRootElementListeners(rootElement: Element) {
        this['_removeRootElementListeners'](rootElement);
    }

    /* Animates the preview element from its current position to the location of the drop placeholder.
    * @private
    * @return {?} Promise that resolves when the animation completes.
    */
    animatePreviewToPlaceholder() {
        if (!this.hasMoved) {
            return Promise.resolve();
        }
        let placeholderRect = this.placeholder.getBoundingClientRect();
        // Apply the class that adds a transition to the preview.
        this.preview.classList.add('cdk-drag-animating');
        // Move the preview to the placeholder position.
        this.preview.style.transform = getTransform(placeholderRect.left, placeholderRect.top);
        // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
        // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
        // apply its style, we take advantage of the available info to figure out whether we need to
        // bind the event in the first place.
        let duration = getTransformTransitionDurationInMs(this.preview);
        if (duration === 0) {
            return Promise.resolve();
        }
        return this.ngZone.runOutsideAngular((() => {
            return new Promise(((resolve) => {
                let dropContainer = this.dropContainer.element;
                this.kanbanService.lockApp(dropContainer);
                let timeout;
                let handler = (event) => {
                    if (!event || (event.target === this.preview && event.propertyName === 'transform')) {
                        if (this.preview) {
                            this.preview.removeEventListener('transitionend', handler);
                        }
                        clearTimeout(timeout);
                        this.kanbanService.unlockApp(dropContainer);

                        resolve();


                        this.animatePreviewToPlaceholderSub.next();

                    }
                };
                // If a transition is short enough, the browser might not fire the `transitionend` event.
                // Since we know how long it's supposed to take, add a timeout with a 50% buffer that'll
                // fire if the transition hasn't completed when it was supposed to.
                timeout = setTimeout(((handler)), duration * 1.5);
                this.preview.addEventListener('transitionend', handler);
            }));
        }));
    }

    private destroyPlaceholder() {
        this['_destroyPlaceholder']();
    }

    private createPlaceholderElement() {
        return this['_createPlaceholderElement']();
    }

    private pointerDown(ev) {
        let sub = new Subject<KanbanColumn[]>();
        sub.subscribe((result) => {
            if (result) {
                this.superPointerDown(ev);
            }
        });
        let data: KanbanDragStart = {
            subscriber: sub,
            item: this.data.data,
            column: this.dropContainer.data.data,
            dragRef: this
        };
        this.data.dragStart(data);
    }

    private pointerUp(ev) {
        if (!this.dragDropRegistry.isDragging(this)) {
            return;
        }

        if (this.hasStartedDragging) {
            let pointerPosition = this.getPointerPositionOnPage(ev);
            let isPointerOverContainer = this.dropContainer._isOverContainer(pointerPosition.x, pointerPosition.y);

            if (this.dropContainer === this.initialContainer && !this.dropContainer.data.canSort) { // sort is disabled
                this.superPointerUp(ev);
                return;
            }
            if (this.animatePreviewToPlaceholderSubscription) {
                this.animatePreviewToPlaceholderSubscription.unsubscribe();
            }
            if (!isPointerOverContainer) { // drag is outside drop, revert
                this.restorePlaceholder();
                this.dropContainer.reset(); // Restore position of items on ActiveDrop
                this.superPointerUp(ev);
            } else { // drag in inside container, we check drag
                this.dragDropRegistry.clearGlobalListeners();
                let previousContainer = this.initialContainer,
                    container = this.dropContainer,
                    currentIndex = container.getItemIndex(this), // new position
                    previousIndex = this.initialContainer.getItemIndex(this); // old position

                let dragDropContainer: KanbanDragDropContainer = {
                    id: container.data.id,
                    items: [].concat(container.data.data.Items)
                };
                let previousDragDropContainer: KanbanDragDropContainer = {
                    id: previousContainer.data.id,
                    items: [].concat(previousContainer.data.data.Items)
                };

                if (this.dropContainer === this.initialContainer) {
                    previousIndex = this.initialContainer.getOldPositionSort(this);
                    dragDropContainer = previousDragDropContainer;
                }


                this.dropContainer
                    .checkDragDrop({
                        previousIndex: previousIndex,
                        currentIndex: currentIndex,
                        item: this.data,
                        container: dragDropContainer,
                        previousContainer: previousDragDropContainer,
                        isPointerOverContainer: isPointerOverContainer,
                        distance: {
                            x: 0,
                            y: 0
                        }
                    })
                    .subscribe(() => {
                        this.animatePreviewToPlaceholderSubscription = this.animatePreviewToPlaceholderSub.asObservable().subscribe(() => {
                            container.data.data.Items.splice(0, container.data.data.Items.length);
                            dragDropContainer.items.forEach((item) => {
                                container.data.data.Items.push(item);
                            });


                            previousContainer.data.data.Items.splice(0, previousContainer.data.data.Items.length);
                            previousDragDropContainer.items.forEach((item) => {
                                previousContainer.data.data.Items.push(item);
                            });
                        });

                        this.superPointerUp(ev);

                        if (!this.isItemInScrollView(this.placeholder)) {
                            this.scrollToElement(this.placeholder);
                        }

                    }, () => {
                        this.restorePlaceholder();
                        this.dropContainer.reset(); // Restore position of items on ActiveDrop

                        this.superPointerUp(ev);
                    });
            }
        } else {
            this.superPointerUp(ev);
        }
    }

    private restorePlaceholder() {
        if (this.placeholder) {
            this.destroyPlaceholder();

            this.placeholder = this.createPlaceholderElement();
            this.placeholder.style.display = '';

            this.nextSibling.parentNode.insertBefore(this.placeholder, this.nextSibling);
        }
    }

    private scrollToElement(element: Element, animation = true) {
        let top = $(element).offset().top + this.scroller[0]['scrollTop'] - this.scroller.offset().top;
        if (animation) {
            this.scroller.animate({
                scrollTop: top
            }, 500);
        } else {
            this.scroller.scrollTop(top);
        }
    }

    private isItemInScrollView(element: Element) {
        let itemEl = $(element);
        return itemEl.offset().top >= this.scroller.offset().top && itemEl.offset().top < this.scroller.offset().top + this.scroller.height();
    }
}
