import {
  Document,
  IDocumentWrapper,
  IFolder
} from '../../shared/models/common.info';

export class IssueAttachment implements IDocumentWrapper {
  Id: string;
  EntityVersion: number;
  HasDrawing: boolean;
  Type: string;
  DrawingPageIndex: number;
  Shapes: any[];
  Document: Document;
  IsPrivateComment?: boolean;
}

export class SumitIssueAttachment {
  IssueId: string;
  DocumentId: string;
  DocumentName: string;
}

export interface Folder extends IFolder {
  HasChildren: boolean;
  // property for folder tree
  uniqueKey?: number;
  expanded?: boolean;
  isExpanding?: boolean;
  isChecked?: boolean;
  countChildren?: number;
  parentRole?: string;
}
