import {HttpClient} from '@angular/common/http';
import {Component, OnInit} from '@angular/core';
import {map} from 'rxjs/operators';
import {IDocumentWrapper} from '../../shared/models/common.info';
import * as _ from 'underscore';


@Component({
  selector: 'ntk-add-comment-demo',
  templateUrl: './add-comment.component.html',
  styleUrls: ['./add-comment.component.css']
})
export class DemoAddCommentComponent implements OnInit {

  issueAttachments: IDocumentWrapper[] = [];
  urls = [
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg',
    'src/assets/images/pc.jpg'
  ];

  constructor(private _http: HttpClient) {
  }

  ngOnInit() {
    let doc = <any>{
      Id: '1',
      DocumentUrl: '',
      Name: 'test',
      EntityVersion: 1,
      UploadedBy: 'Test',
      UploadedDate: new Date(),
      Type: 'jpg',
      Status: 'Processed'
    };



    this.urls.forEach((url) => {
      let documentItem = _.clone(doc);
      documentItem.DocumentUrl = url.split(".")[0];
      this.issueAttachments.push({
        Id: _.uniqueId('id-'),
        ThumbnailUrl: url,
        Document: documentItem
      });
    });



    let docEML = <any>{
      Id: '1',
      DocumentUrl: '',
      Name: 'test',
      EntityVersion: 1,
      UploadedBy: 'Test',
      UploadedDate: new Date(),
      Type: 'EML',
      Status: 'Stored'
    };
    this.issueAttachments.push(
      <any>{
        Id: '1' + 11,
        ThumbnailUrl: '',
        Document: docEML
      }
    );

    let docEML2 = <any>{
      Id: '123232',
      DocumentUrl: '',
      Name: 'test',
      EntityVersion: 1,
      UploadedBy: 'Test',
      UploadedDate: new Date(),
      Type: 'EML',
      Status: 'Uploaded'
    };
    this.issueAttachments.push(
      <any>{
        Id: '123232',
        ThumbnailUrl: '',
        Document: docEML2
      }
    );
  }

  getContact() {
    return this._http.get('src/assets/data/comments-data/contact.json').pipe(map(
      (result: any) => {
        return result.HierarchicalData;
      }
    ));
  }

  onSaveComment($event) {
    console.log($event)
    this.issueAttachments = $event.uploadedDocs;
    // alert(JSON.stringify($event));
  }
}
