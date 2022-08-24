import { Component, Input, Output, ContentChild, TemplateRef, EventEmitter, AfterContentInit } from '@angular/core';
import { Folder } from '../../shared/document.model';
import { HelperService } from '../../../core/services/helper.service';
@Component({
  selector: 'ntk-folder-tree-row',
  templateUrl: './folder-tree-row.component.html',
  styleUrls: ['./folder-tree-row.component.scss']
})
export class FolderTreeRowComponent implements AfterContentInit {

  @Output('onCheckedChange') checkedChange =  new EventEmitter<any>();
  @Output('selectedChange') selectedChange = new EventEmitter<any>();
  @Output() expandedChange = new EventEmitter();
  @Output() showConnectorInfo = new EventEmitter();

  @Input() hasChecked: boolean;
  @Input() isSelected: boolean;
  @Input() calculateMiddleLines: [];
  @Input() isFirstItemInLevel: boolean;
  @Input() isSelectedAll: boolean;
  @Input() row: Folder;
  @Input() treeNodePaddingIndent = 24;
  @Input() listWidth: number[];
  @Input() scrollLeft: number;
  normalFolder = ['Custom'];
  systemFolderArchive = ['Attachments', 'GeneratedDocuments'];
  systemFolderActive = ['SavedReports', 'SavedInspectionReports'];
  externalFolder = 'IsManagedExternally';
  lbConnectorsInformation: string;
  isIE: boolean;

  constructor(private _heplerService: HelperService) {
    this._heplerService.TranslationService.getTranslation('lbConnectorsInformation');
    this.isIE = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
   }
  ngAfterContentInit(): void {
  }

  onToggleButtonClick() {
    this.row.isExpanding = true;
    this.row.expanded = !this.row.expanded;
    this.expandedChange.emit(this.row);
  }

  onSelectedChanged() {
    this.selectedChange.emit(this.row);
  }

  onCheckedChanged() {
    this.checkedChange.emit(this.row);
  }

  showConnectroInfo() {
    this.showConnectorInfo.emit(this.row);
  }

  get typeOfFolder() {
    if (this.systemFolderActive.findIndex(f => f === this.row.Type ) > -1 ) {
      return 'systemFolderActive';
    } else if (this.systemFolderArchive.findIndex(f => f === this.row.Type) > -1) {
      return 'systemFolderArchive';
    } else {
      return 'normalFolder';
    }
  }

  get isTextItalic() {
    return this.row.IsArchived;
  }
}
