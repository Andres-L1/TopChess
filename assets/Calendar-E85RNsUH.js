import{c as d,r as p,j as e,R as b}from"./index-DUG-Qxq2.js";import{C as m}from"./check-DpRcm0c7.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=d("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=d("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=d("Video",[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=d("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),g=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"],y=["09:00","10:00","11:00","12:00","16:00","17:00","18:00","19:00","20:00"],H=({mode:a="view",availability:o=[],bookings:j=[],onSlotClick:x,onSaveAvailability:n})=>{const[l,h]=p.useState(o);p.useEffect(()=>{h(o)},[o]);const f=(t,r)=>{if(a==="edit"){const s=`${t}-${r}`,i=l.includes(s)?l.filter(c=>c!==s):[...l,s];h(i),n&&n(i)}else a==="view"&&x&&x({dayIndex:t,hour:r})},u=(t,r)=>{const s=`${t}-${r}`;return l.includes(s)};return e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2 text-gold",children:[e.jsx(v,{size:20}),e.jsx("h3",{className:"font-bold text-lg",children:a==="edit"?"Configurar Disponibilidad Semanal":"Próxima Semana"})]}),a==="edit"&&e.jsx("span",{className:"text-xs text-text-muted",children:"Haz clic en las horas para activar/desactivar."})]}),e.jsxs("div",{className:"grid grid-cols-8 gap-1 md:gap-2",children:[e.jsx("div",{className:"text-center font-bold text-text-muted text-xs py-2",children:"H"}),g.map((t,r)=>e.jsx("div",{className:"text-center font-bold text-white text-xs py-2 bg-white/5 rounded-t-lg",children:t},r)),y.map(t=>e.jsxs(b.Fragment,{children:[e.jsx("div",{className:"flex items-center justify-center text-[10px] text-text-muted font-mono",children:t}),g.map((r,s)=>{const i=u(s,t);let c="aspect-square rounded-lg border border-white/5 transition-all duration-200 flex items-center justify-center cursor-pointer ";return a==="edit"?i?c+="bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-500":c+="bg-black/20 hover:bg-white/5 text-transparent":i?c+="bg-white/5 hover:bg-gold/20 hover:border-gold/50 text-gold/0 hover:text-gold cursor-pointer":c+="bg-black/40 opacity-50 cursor-not-allowed",e.jsxs("div",{onClick:()=>f(s,t),className:c,children:[a==="edit"&&i&&e.jsx(m,{size:14,strokeWidth:3}),a==="view"&&i&&!0&&e.jsx("div",{className:"w-2 h-2 rounded-full bg-gold animate-pulse"})]},`${s}-${t}`)})]},t))]}),a==="edit"&&e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{onClick:()=>n&&n(l),className:"btn-primary flex items-center gap-2",children:[e.jsx(m,{size:16})," Guardar Horario"]})})]})};export{H as C,N as T,C as V,M as X,v as a};
