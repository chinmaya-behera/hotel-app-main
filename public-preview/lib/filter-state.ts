import {visibleTasks,type HotelState,type Role} from "./hotel-domain";
export function filterState(s:HotelState,role:Role):HotelState{
 const tasks=visibleTasks(s,role),roomAccess=["frontdesk","executive","admin"].includes(role),money=["frontdesk","executive","finance","manager"].includes(role);
 const rooms=roomAccess?s.rooms:[];
 return {...s,tasks,rooms,financials:money?(role==="manager"?s.financials.filter(f=>tasks.some(t=>t.room===f.room)):s.financials):[],incidents:role==="security"?s.incidents:[],audit:role==="admin"?s.audit:[],staff:["fulfiller","finance","security"].includes(role)?[]:s.staff,connectors:role==="admin"?s.connectors:[],policies:["manager","admin"].includes(role)?s.policies:[],messages:["frontdesk","dispatcher"].includes(role)?s.messages.filter(m=>role==="frontdesk"||tasks.some(t=>t.room===m.room)):[],handovers:s.handovers.filter(h=>["executive","frontdesk"].includes(role)||h.department===(role==="security"?"Security":"Housekeeping"))};
}
