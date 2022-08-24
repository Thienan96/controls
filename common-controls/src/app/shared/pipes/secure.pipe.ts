import {Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs';

@Pipe({
    name: 'secure'
})
export class SecurePipe implements PipeTransform {

    constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    }

    transform(url): Observable<SafeUrl> {
        // console.log('---secure transform url: ', url);

        if (!url || url === '') {
            return of('');
        }

        if (url && typeof url === 'string' && url.indexOf('data:image/') === 0) {
            return of(url);
        }

        if (typeof url === 'string') {
            return new Observable<SafeUrl>((observer) => {
                // This is a tiny blank image
                observer.next('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
                // observer.next('');

                this.http.get(url, {responseType: 'blob'}).subscribe(response => {
                    observer.next(this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(response)));
                });

                return {
                    unsubscribe() {
                    }
                };
            });
        } else {
            return of(url);
        }
    }

}
