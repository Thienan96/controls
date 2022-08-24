import {ModuleDefinition} from '../module-bar/shared/model';
import {STATES} from './consts';

export const globalModulesDef: ModuleDefinition[] = [
    {
        routeName: STATES.homepage, translationKey: 'default', svgIcon: 'home', effectedScreens: {HomePage: '*'}
    },
    {
        routeName: STATES.virtualScroll, translationKey: 'virtualScroll', svgIcon: 'view_list', effectedScreens: {virtualScroll: '*'}
    },
    {
        routeName: STATES.toolbar, translationKey: 'toolbar', svgIcon: 'dns', effectedScreens: {Toolbar: '*'}
    },
    {
        routeName: STATES.resourcePlanning,
        translationKey: 'resourcePlanning',
        svgIcon: 'view_week',
        effectedScreens: {ResourcePlanning: '*'}
    },
    {
        routeName: STATES.shuffle, translationKey: 'shuffle', svgIcon: 'reorder', effectedScreens: {Shuffle: '*'}
    },
    {
        routeName: STATES.ngxGrid, translationKey: 'ngxGrid', svgIcon: 'table_chart', effectedScreens: {NgxGrid: '*'}
    },
    {
        routeName: STATES.tableEditable, translationKey: 'tableEditable', svgIcon: 'create', effectedScreens: {TableEditable: '*'}
    },
    {
        routeName: STATES.datatable, translationKey: 'datatable', svgIcon: 'table_chart', effectedScreens: {Datatable: '*'}
    },

    {
        routeName: STATES.documents, translationKey: 'documents', svgIcon: 'pageview', effectedScreens: {Documents: '*'}
    },
    {
        routeName: STATES.lines, translationKey: 'lines', svgIcon: 'pageview', effectedScreens: {Lines: '*'}
    },
    {
        routeName: STATES.charts, translationKey: 'charts', svgIcon: 'bar_chart', effectedScreens: {Charts: '*'}
    },
    {
        isSeparate: true
    },
    {
        routeName: STATES.chip,
        svgIcon: 'label',
        translationKey: 'chip'
    },
    {
        routeName: STATES.dialog,
        svgIcon: 'calendar_today',
        translationKey: 'dialog'
    },
    {
        routeName: STATES.duration,
        svgIcon: 'calendar_today',
        translationKey: 'duration'
    },
    {
        routeName: STATES.kanban,
        svgIcon: 'calendar_today',
        translationKey: 'kanban'
    },
    {
        routeName: STATES.DetailsCalendar,
        svgIcon: 'calendar_today',
        translationKey: 'DetailsCalendar'
    },
    {
        routeName: STATES.AddComment,
        svgIcon: 'calendar_today',
        translationKey: 'AddComment'
    },
    {
        routeName: STATES.WeekTs,
        svgIcon: 'calendar_today',
        translationKey: 'WeekTs'
    }
];
