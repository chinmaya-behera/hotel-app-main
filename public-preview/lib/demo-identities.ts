import {roleInfo,type Role} from './hotel-domain.ts';
export const demoPeople:Record<string,string>={'finance-review.demo':'Avery Shah','spa.demo':'T. Brandt','engineering.demo':'Wayne Chen','dining.demo':'Kabir Sen','attendant.demo':'Sana Sheikh','maintenance.demo':'Rohan Verma','housekeeping-dispatch.demo':'S. Iyer'};
export const referenceRoles:Record<string,Role>={platform_admin:'admin',front_desk_coordinator:'frontdesk',task_fulfiller:'fulfiller',department_dispatcher:'dispatcher',department_supervisor:'supervisor',department_manager:'manager',financial_operator:'finance',security_responder:'security',executive_viewer:'executive'};
export function demoIdentity(username:string,role:Role,displayName?:string){return displayName||demoPeople[username]||roleInfo(role).person;}
