import { AttachmentData } from '../../shared/models/common.info';
import { Subscription } from 'rxjs';


export interface IBackgroundUploadTask {
    restoreId: string; // intervention id
    siteId: string; // this is to create document after upload finish
    data: AttachmentData;
    subscribtion?: Subscription;
}
