import {Injectable, Injector} from '@angular/core';
import {HttpErrorResponse, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpEvent, HttpResponse, HttpEventType} from '@angular/common/http';

import {Observable} from 'rxjs/Observable';
import * as _ from 'underscore';
import {IDataItems} from '../../shared/models/common.info';
import {Subscriber, of, throwError, Subscription} from 'rxjs';
import {HelperService} from './helper.service';

import { interval } from 'rxjs';
import { delay } from 'rxjs/operators';

export class pendingCall {
    request: HttpRequest<any>;
    handler: HttpHandler;
    subcriber: Subscriber<any>;
}


@Injectable()
export class DummyHttpInterceptor implements HttpInterceptor {

    private notification = [];

    private documents = [];

    private pendingCalls: pendingCall[] = [];

    private uplloadSub: Subscription;

    constructor(private helperService: HelperService) {
        let n = {
            'Sender': {
                'Id': '98d3e3e5-4a58-4c6d-a571-53fe787872af',
                'Code': null,
                'Name': 'Ha Admin Netika(SD)'
            },
            'Type': 'VisitManagedByMeCompleted',
            'Sent': '2019-05-03T08:40:16.623Z',
            'Message': 'The inspection H01/84 HA - CL01 has been \"completed at 15:40 xxx xxxxxx dsds ds ds ds fdsf dfdfdf dfd fdf xxx xxxxxx dsds ds ds ds fdsf dfdfdf dfd fdf xxx xxxxxx dsds ds ds ds fdsf dfdfdf dfd fdf end.\"',
            'MessageKey': 'VisitManagedByMeCompleted',
            'KeyValueData': null,
            'LinkedEntityId': '902d119c-0a96-45c3-95d5-704105b7b756',
            'Id': 'c0a11b78-0ead-417c-9149-44cb071d1969'
        };

        this.notification.push(n);

        for (let i = 0; i < 100; i++) {
            let n1 = _.clone(n);

            n1.Message = 'Message ' + i;
            this.notification.push(n1);
        }

        // this.notification = []; // test empty

        let doc = {
            'EntityVersion': 1,
            'Name': '2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 2891f3e_20 ',
            'UploadedBy': {
                'Id': '98d3e3e5-4a58-4c6d-a571-53fe787872af',
                'Name': 'Ha Admin Netika(SD)'
            },
            'Folder': {
                'ParentFolderId': null,
                'Name': '2515',
                'Site': null,
                'Room': null,
                'VisibleBy': 'Admin',
                'IsPhotoFolder': false,
                'IsGeneratedDocumentFolder': false,
                'IsArchived': false,
                'IsManagedExternally': false,
                'DocumentCount': 0,
                'AccessRights': null,
                'Connectors': null,
                'DisplayOrder': 0,
                'Level': 0,
                'Id': '2afcf3de-5dc4-4e50-ac5c-742767a41e8c'
            },
            'UploadedDate': '2018-12-26T05:01:39.537Z',
            'Type': 'JPG',
            'Status': 'Processed',
            'NbrPages': 1,
            'IsArchived': false,
            'AccessRights': {
                'CanAdd': true,
                'CanEdit': true,
                'CanDelete': true,
                'CanArchive': true
            },
            'DocumentUrl': 'document/test',
            'Id': '3fc9cd38-e8b5-46e3-b982-7e41b432e4be'
        }

        for (let i = 0; i < 100; i++) {
            let d1 = _.clone(doc);

            if (i < 20) {
                d1.Name = 'just simple name';
            }
            d1.Id = 'document ' + i;
            this.documents.push(d1);
        }

    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('----------------------------------------------intercept request: ', request.url);

        if (request.body) {
            console.log('request body: ', request.body);
        }

        // if (request.params) {
        //     console.log('request params: ', request.params);
        // }
        if ('/src/assets/images/pc.jpg' === request.url) {
            console.log('-- testing delay load in 2s');            
            return next.handle(request).pipe(
                delay(2000)
            );
        }
        if (request.url === 'testWaitCall') {
            return new Observable<HttpEvent<any>>(x => {
                // this.pendingCalls.push(
                //     {
                //         request: request,
                //         handler: next,
                //         subcriber: x
                //     }
                // );

                setTimeout(() => {
                    x.next(new HttpResponse(
                        {
                            body: 'Hello finish request',
                            status: 200
                        }
                    ));
                    x.complete();
                }, 1000);


                return {
                    unsubscribe() {
                        console.log('--- testWaitCall canceled from caller');
                    }
                };
                // return (() => {
                //     console.log('--- testWaitCall canceled');
                // });
            });
        }

        if (request.url === 'testReleaseCalls') {

            for (let i = 0; i < this.pendingCalls.length; i++) {

                this.pendingCalls[i].subcriber.next(
                    new HttpResponse(
                        {
                            body: 'Pending call ' + i + ' data',
                            status: 200
                        }
                    )
                );

                this.pendingCalls[i].subcriber.complete();
            }
            this.pendingCalls.splice(0, this.pendingCalls.length);

            return of(new HttpResponse(
                {
                    body: 'OK',
                    status: 200
                }
            ));
        }

        if (request.url.indexOf('/assest/') >= 0 || request.url.indexOf('/assets/') >= 0) {
            return next.handle(request);
        }
        
        if (request.url.indexOf('Document/UploadFile') >= 0) {
            if (request.url.indexOf('fakeImage') >= 0) {
                console.log('Detect upload fake image');

                return throwError(new HttpResponse(
                    {
                        body: '{"code":"InvalidImageException","message":"fakeImage.jpg"}',
                        status: 403
                    }
                ));
            } else {
                return new Observable<HttpEvent<any>>((ob) => {
                    let e = {
                        type: HttpEventType.Sent,
                        loaded: 0,
                        total: 100
                    };

                    ob.next(<HttpEvent<any>> e);

                    e.type = HttpEventType.UploadProgress;
                    const source = interval(100);
                    this.uplloadSub = source.subscribe(val => {
                        e.loaded++;

                        // console.log('---dummy upload process =', e.loaded);
                        ob.next(<HttpEvent<any>> e);

                        if (e.loaded >= 100) {
                            ob.complete();
                            this.uplloadSub.unsubscribe();
                        }
                    });
                });



                // return of(new HttpResponse(
                //     {
                //         body: 'OK',
                //         status: 200
                //     }
                // ));
            }
        }


        // CustomFilter
        if (request.url === 'CustomFilter/GetList') {
            let items: any[] = this.helperService.StorageService.getUserValue('CustomFilter') || [],
                module = request.params.get('Module');
            return of(new HttpResponse(
                {
                    body: items.filter((item) => {
                        return item.Module === module;
                    }),
                    status: 200
                }
            ));
        }
        if (request.url === 'CustomFilter/Save') {
            let key = 'CustomFilter';
            let items: any[] = this.helperService.StorageService.getUserValue(key) || [],
                body = request.body;
            if (!body.Id) {
                body.Id = new Date().getTime();
            }
            let pos = items.findIndex((item) => {
                return item.Id === body.Id;
            });
            if (pos === -1) {
                items.push(body);
            } else {
                items[pos] = body;
            }
            this.helperService.StorageService.setLocalUserValue(key, items);
            return of(new HttpResponse(
                {
                    body: body.Id,
                    status: 200
                }
            ));
        }
        if (request.url === 'CustomFilter/Delete') {
            let items: any[] = this.helperService.StorageService.getUserValue('CustomFilter') || [],
                pos = items.findIndex((item) => {
                    return item.Id === request.body.Id;
                });
            if (pos !== -1) {
                items.splice(pos, 1);
            }
            this.helperService.StorageService.setLocalUserValue('CustomFilter', items);
            return of(new HttpResponse(
                {
                    body: [],
                    status: 200
                }
            ));
        }

        return new Observable<any>((ob) => {

            let result: any | undefined;
            if (request.url === 'notification/getnotificationscount') {
                console.log('return valuye for notification/getnotificationscount');
                result = this.notification.length;
            } else if ('notification/getnotificationslist' === request.url) {
                let param = request.body;

                let startIndex = param['StartIndex'];
                let pageSize = param['PageSize'];

                // console.log('return valuye for notification/getnotificationslist startIndex=', startIndex, ' pagesize=', pageSize);
                result = <IDataItems<any>>{
                    Count: this.notification.length,
                    ListItems: this.notification.slice(startIndex, startIndex + pageSize)
                };
            } else if ('folder/GetListFoldersBySite' === request.url) {
                console.log('return folters');

                result = [{Id: 'folder1', Name: 'folder 1'}];
                // result = <IDataItems<any>>{
                //     Count: 1,
                //     ListItems: [{Id: 'folder1', Name: 'folder 1'}]
                // };
            } else if ('document/GetList' === request.url) {
                let param = request.body;

                let startIndex = param['StartIndex'];
                let pageSize = param['PageSize'];

                console.log('return valuye for document/GetList startIndex=', startIndex, ' pagesize=', pageSize);
                result = <IDataItems<any>>{
                    Count: this.documents.length,
                    ListItems: this.documents.slice(startIndex, startIndex + pageSize)
                };
            } else if ('EquipmentType/GetHierarchicalOfEquipmentTypes' === request.url) {
                let data = `{
                    "TotalRowCount": 53,
                    "HierarchicalData": [
                        {
                            "Id": "6859f99d-08b0-9373-72af-622e633a138a",
                            "Name": "CAR 1e",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "8ac7933e-6d35-110e-cdd7-ad56397db93e",
                            "Name": "CAR Documents ",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "13cfec3e-0b70-e469-badd-b021eace857a",
                            "Name": "Car elements",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "fe683bc8-b227-4bf6-8acb-dfcc29048338",
                            "Name": "Car UI",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "25eb84f2-ee69-484c-ad2e-aaab47d959d6",
                            "Name": "Car UX",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "4b7fe69c-4c89-4451-a567-bbacd2fe5559",
                            "Name": "Car UY",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "32c7deff-f32b-4daf-a5e9-ca7f13f026e4",
                            "Name": "device",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "0cf1dc7b-05a0-4a15-8e1e-106c086fe584",
                            "Name": "Education",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "cdd7182d-8d54-4695-8ae4-b94f84c08e40",
                            "Name": "board",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "a01ac7f9-4972-47d3-b71e-b2e4bab48284",
                            "Name": "book",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "d692047e-029c-4fa5-9f7e-184376c61536",
                            "Name": "book",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "0cc3286c-10e4-499f-96c2-00c62171d9ea",
                            "Name": "book1",
                            "IsArchived": false,
                            "Level": 4
                        },
                        {
                            "Id": "39311156-bbae-41d4-9190-d0b39ab5df47",
                            "Name": "book1.1",
                            "IsArchived": false,
                            "Level": 5
                        },
                        {
                            "Id": "5f352a75-f8a0-4bde-aa88-fad73f5587e4",
                            "Name": "book1.2",
                            "IsArchived": false,
                            "Level": 6
                        },
                        {
                            "Id": "5a5529f6-bf44-4c54-8904-a24c1171d55a",
                            "Name": "book1",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "1f2901a4-cb29-4298-9c86-dd476b3a038f",
                            "Name": "book2.1",
                            "IsArchived": false,
                            "Level": 4
                        },
                        {
                            "Id": "c60f808e-0019-4b2e-819b-776fb6d7c2d6",
                            "Name": "erase",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "957d17fd-7675-4d4f-973e-d8a25f6aabfe",
                            "Name": "arese1",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "355f8622-fec1-42cd-a8db-17984fce1073",
                            "Name": "arese1.1",
                            "IsArchived": false,
                            "Level": 4
                        },
                        {
                            "Id": "5bed7e86-4fd3-4d06-b0dd-22017453d0d0",
                            "Name": "note book",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "74a68bfd-d38e-4260-a46d-a5dcfc5e3e26",
                            "Name": "paper",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "b605ead0-22d5-4be9-9ba6-d29728de393c",
                            "Name": "pen",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "7e543621-4240-4b78-84f7-631140271279",
                            "Name": "pencial",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "b3b7969e-7449-4ed8-ba49-63e4260d0e6f",
                            "Name": "ruler",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "202494eb-4ff9-4957-aba5-fb8341771fd1",
                            "Name": "Keyboard",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "d08aceee-db4a-4f2e-8a91-00f376a79350",
                            "Name": "eq3081",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "a359a3e7-5dbd-42bd-87bc-c18822b2362a",
                            "Name": "keyboard",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "b7cb6bed-44db-4d25-a40a-f5ac49efd2ea",
                            "Name": "test119",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "c5e76523-c74c-4ce5-a99b-9f224325429b",
                            "Name": "X button",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "8ce26f21-2a5d-496e-b93b-86238d145dfe",
                            "Name": "A button",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "6fda3d2e-606b-4b1b-8830-64da99b5d6f7",
                            "Name": "A button",
                            "IsArchived": false,
                            "Level": 4
                        },
                        {
                            "Id": "48ba42da-3a9a-4fd7-992b-1327334cee7d",
                            "Name": "test119",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "25190486-373e-450f-834a-e433b9796589",
                            "Name": "Mouse-Wireless",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "efdcf734-bdc7-4752-8359-5dce0b2357b4",
                            "Name": "PC",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "c795e0ef-864c-4771-a449-df87eba43534",
                            "Name": "Furniture",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "6b312008-ca67-4e16-bba6-6514c2791597",
                            "Name": "pc11",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "cdbe464b-faa6-4d62-adcd-d53f683c3cd7",
                            "Name": "pc12",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "023a0876-e011-4f9b-bc18-c7667b0814ea",
                            "Name": "pc13",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "93f3c0c9-f011-4fe3-99af-eb443f37c3f5",
                            "Name": "Sub PC",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "c0858329-fc23-4450-a592-b3b3e2dd9959",
                            "Name": "pc11",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "aaa061c5-b569-4481-ac81-beba51790cc3",
                            "Name": "Smartphone",
                            "IsArchived": false,
                            "Level": 1
                        },
                        {
                            "Id": "4e143be4-c950-41be-8594-6e98e91b5273",
                            "Name": "android",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "dca4067d-f68b-4f31-bc07-7900106893c5",
                            "Name": "keyboard",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "15335749-5d78-4b36-a134-df5f6f728719",
                            "Name": "ios",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "6248081e-288f-4955-a94e-fd629bf78da2",
                            "Name": "ios 10",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "c7c8367a-ac10-476c-a483-759598c29165",
                            "Name": "ios 11",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "118bf5e2-bc29-4291-9bb9-432ec352e2f2",
                            "Name": "ios 12",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "698e8bc4-f999-46bc-b8a7-89a166d94b69",
                            "Name": "ios 7",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "30effbf6-abb1-4845-9604-8f4777760e64",
                            "Name": "ios 8",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "675edfd8-7149-48ee-989e-4ce2e0a99ca4",
                            "Name": "ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ios 9 ",
                            "IsArchived": false,
                            "Level": 3
                        },
                        {
                            "Id": "6316ad35-0b67-48fb-b0c9-9490dcb5c898",
                            "Name": "LG",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "577c1b94-2482-4108-a3ce-93a3a792cef9",
                            "Name": "Samsung",
                            "IsArchived": false,
                            "Level": 2
                        },
                        {
                            "Id": "2c62afd8-25dc-4c82-a124-f1be388104b4",
                            "Name": "window",
                            "IsArchived": false,
                            "Level": 2
                        }
                    ],
                    "Index": 0
                }`;

                let param = request.body;
                let fullData = JSON.parse(data);

                let startIndex = param['StartIndex'];
                let pageSize = param['PageSize'];

                result = {
                    TotalRowCount: fullData.TotalRowCount,
                    HierarchicalData: fullData.HierarchicalData.slice(startIndex, startIndex + pageSize)
                };
            }

            setTimeout(() => {
                console.log('result to response=', result);

                ob.next(new HttpResponse<string>({
                    body: result,
                    status: 200
                }));
                ob.complete();
            }, 100);
        });
    }
}
