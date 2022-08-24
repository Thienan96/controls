import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualListComponent } from './virtual-list/virtual-list.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';



@NgModule({
  declarations: [VirtualListComponent],
  exports: [
    VirtualListComponent
  ],
  imports: [
    CommonModule,
    VirtualScrollerModule
  ]
})
export class VirtualListModule { }
