import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatDisplayDate' })

export class FormatDisplayDatePipe implements PipeTransform {
    transform(startDate: string, endDate: string): string {
        let result;
        if (startDate && endDate) {
            result = startDate === endDate
            ? startDate : `${startDate} - ${endDate}`;
        } else {
            result = startDate || endDate || '';
        }
        return result;
    }
}
