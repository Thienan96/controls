import {DragRef, DragRefConfig} from '@angular/cdk/drag-drop';
import {Subject, Subscription} from 'rxjs';
import {NtkDropListRef} from './drop-list-ref';
import {NtkDragDropContainer, NtkDragDropItem, NtkDragDropParams, NtkDragStart} from './drag-drop.model';
import {finalize} from 'rxjs/operators';
import {NtkDrag} from './drag';
import {ElementRef, Inject, NgZone} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {NtkDragDropRegistry} from './drag-drop-registry';
import {DOCUMENT} from '@angular/common';


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


export class NtkDragRef extends DragRef<NtkDrag<NtkDragDropItem>> {
    onAfterDragDrop: any;
    onBeforeDragDrop: any;
    lockApp: any;
    unlockApp: any;
    onMouseDown: any;
    onMouseUp: any;
    onMouseMove: any;
    id: string;
    animatePreviewToPlaceholderSub = new Subject();
    animatePreviewToPlaceholderSubscription: Subscription | any;
    private readonly superPointerDown: any;
    private readonly superPointerUp: any;
    private readonly superPointerMove: any;

    constructor(public element: ElementRef,
                private config: DragRefConfig,
                @Inject(DOCUMENT) document: Document,
                private ngZone: NgZone,
                private viewportRuler: ViewportRuler,
                private dragDropRegistry: NtkDragDropRegistry<NtkDragRef, NtkDropListRef>) {
        super(element, config, document, ngZone, viewportRuler, dragDropRegistry);

        this.removeRootElementListeners(element.nativeElement);
        this.rootElement = null;


        let superPointerDown = this['_pointerDown'];
        this['_pointerDown'] = this.pointerDown.bind(this);
        this.superPointerDown = (ev: MouseEvent) => {
            if (this.onMouseDown) {
                this.onMouseDown(ev, this);
            }
            superPointerDown(ev);
        };


        let superPointerMove = this['_pointerMove'];
        this['_pointerMove'] = this.pointerMove.bind(this);
        this.superPointerMove = (ev: MouseEvent) => {
            if (this.onMouseMove) {
                this.onMouseMove(ev, this);
            }
            superPointerMove(ev);
        };


        let superPointerUp = this['_pointerUp'];
        this['_pointerUp'] = this.pointerUp.bind(this);
        this.superPointerUp = (ev: MouseEvent) => {
            if (this.onMouseUp) {
                this.onMouseUp(ev, this, superPointerUp);
            }
            superPointerUp(ev);
        };


        this['_animatePreviewToPlaceholder'] = this.animatePreviewToPlaceholder.bind(this);


        this.withRootElement(element);
    }


    get dropContainer(): NtkDropListRef {
        return this['_dropContainer'];
    }

    get initialContainer(): NtkDropListRef {
        return this['_initialContainer'];
    }

    get preview(): HTMLElement {
        return this['_preview'];
    }

    set rootElement(value: HTMLElement) {
        this['_rootElement'] = value;
    }

    get scroller(): JQuery {
        return $(this.placeholder).closest('.scroll-viewport');
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

    private get hasStartedDragging() {
        return this['_hasStartedDragging'];
    }

    get getPointerPositionOnPage() {
        return this['_getPointerPositionOnPage'];
    }

    private get hasMoved() {
        return this['_hasMoved'];
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

        // Show placeholder when animation
        $(this.placeholder).show();

        let placeholderRect = this.placeholder.getBoundingClientRect();


        // Apply the class that adds a transition to the preview.
        this.preview.classList.add('cdk-drag-animating');
        // Move the preview to the placeholder position.
        this.preview.style.transform = getTransform(placeholderRect.left, placeholderRect.top);
        this.preview.style.width = placeholderRect.width + 'px';

        // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
        // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
        // apply its style, we take advantage of the available info to figure out whether we need to
        // bind the event in the first place.
        let duration = getTransformTransitionDurationInMs(this.preview);
        if (duration === 0) {
            this.animatePreviewToPlaceholderSub.next();
            return Promise.resolve();
        }
        return this.ngZone.runOutsideAngular((() => {
            return new Promise(((resolve) => {
                if (this.lockApp) {
                    this.lockApp();
                }
                let timeout;
                let handler = (event) => {
                    if (!event || (event.target === this.preview && event.propertyName === 'transform')) {
                        if (this.preview) {
                            this.preview.removeEventListener('transitionend', handler);
                        }
                        clearTimeout(timeout);
                        if (this.unlockApp) {
                            this.unlockApp();
                        }

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

    private pointerDown(ev: MouseEvent) {
        if (this.data.dragStart) {
            let sub = new Subject<any[]>();
            sub.subscribe((result) => {
                if (result) {
                    this.superPointerDown(ev);
                }
            });
            let data: NtkDragStart = {
                subscriber: sub,
                item: this.data.data,
                column: this.dropContainer.data.data
            };
            this.data.dragStart(data);
        } else {
            this.superPointerDown(ev);
        }

    }

    private pointerUp(ev) {
        if (!this.dragDropRegistry.isDragging(this)) {
            return;
        }

        if (this.hasStartedDragging) {
            if (!this.dropContainer) {
                this.superPointerUp(ev);
                return;
            }

            let pointerPosition = this.getPointerPositionOnPage(ev);
            let isPointerOverContainer = this.dropContainer.isOverContainer(pointerPosition.x, pointerPosition.y);
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

                let dragDropContainerData;
                if (container.data.data) {
                    dragDropContainerData = JSON.parse(JSON.stringify(container.data.data));
                }
                let dragDropContainer: NtkDragDropContainer = {
                    id: container.data.id,
                    data: dragDropContainerData,
                    dropListRef: container
                };
                let previousDragDropContainerData;
                if (previousContainer.data.data) {
                    previousDragDropContainerData = JSON.parse(JSON.stringify(previousContainer.data.data));
                }
                let previousDragDropContainer: NtkDragDropContainer = {
                    id: previousContainer.data.id,
                    data: previousDragDropContainerData,
                    dropListRef: previousContainer
                };
                if (this.dropContainer === this.initialContainer) {
                    previousIndex = this.initialContainer.getOldPositionSort(this);
                    dragDropContainer = previousDragDropContainer;
                }
                let previewOffset = $(this.preview).offset(),
                    scrollerOffset = this.scroller.offset(),
                    left = previewOffset.left - scrollerOffset.left,
                    top = (previewOffset.top - scrollerOffset.top) + this.scroller.scrollTop();
                let dragdrop: NtkDragDropParams = {
                    previousIndex: previousIndex,
                    currentIndex: currentIndex,
                    item: this.data,
                    container: dragDropContainer,
                    previousContainer: previousDragDropContainer,
                    isPointerOverContainer: isPointerOverContainer,
                    position: {
                        left: left,
                        top: top
                    }
                };
                this.dropContainer
                    .updateDragDrop(dragdrop)
                    .pipe(finalize(() => {
                        this.superPointerUp(ev, dragdrop);
                    }))
                    .subscribe((updateType: any) => {
                        if (this.onBeforeDragDrop) {
                            this.onBeforeDragDrop(dragdrop);
                        }
                        this.animatePreviewToPlaceholderSubscription = this.dropped.asObservable().subscribe(() => {
                            if (this.onAfterDragDrop) {
                                this.onAfterDragDrop({
                                    container: dragDropContainer,
                                    previousContainer: previousDragDropContainer
                                }, updateType);
                            }
                        });
                        // Scroll to view
                        if (this.scroller.length > 0 && !this.isItemInScrollView(this.placeholder)) {
                            this.scrollToElement(this.placeholder);
                        }
                    }, () => {
                        this.restorePlaceholder();
                        this.dropContainer.reset(); // Restore position of items on ActiveDrop
                    });
            }
        } else {
            this.superPointerUp(ev);
        }
    }


    private pointerMove(ev) {
        this.superPointerMove(ev);
    }

    private restorePlaceholder() {
        if (this.placeholder) {
            this.destroyPlaceholder();

            this.placeholder = this.createPlaceholderElement();
            this.placeholder.style.display = '';

            if (this.nextSibling) {
                this.nextSibling.parentNode.insertBefore(this.placeholder, this.nextSibling);
            }
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
