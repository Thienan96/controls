import { Injectable } from '@angular/core';

@Injectable()
export class Comunication {
  [key: string]: any;
}


export function ComunicationFactory(i: any) {
  return i.get('comunicate');
}

export const ComunicationProvider = {
  provide: Comunication,
  useFactory: ComunicationFactory,
  deps: ['$injector']
};
