import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[ntkDropDisable]'
})
export class DropDisableDirective {
  constructor() {
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: Event) {
    event.preventDefault();
    return false;
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: Event) {
    event.preventDefault();
    return false;
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: Event) {
    event.preventDefault();
    return false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: Event) {
    event.preventDefault();
    return false;
  }
}
