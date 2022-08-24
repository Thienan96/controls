import {Injectable, TemplateRef} from '@angular/core';
import {ResourcePlanningTemplate} from './resource-planning.model';

@Injectable({
  providedIn: 'root'
})
export class ResourcePlanningConfigService {
  private config = {};

  get(key: string) {
    return this.config[key];
  }

  set(config) {
    Object.assign(this.config, config);
  }

  getTemplate(template: ResourcePlanningTemplate): TemplateRef<any> {
    let templates: TemplateRef<any> = this.get('templates');
    return templates[template];
  }
}
