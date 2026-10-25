// Normalised, deterministic four-level teaching model. One time unit is NOT one day.
export const NAMES=['草','蚱蜢','成年青蛙','蛇'];
export const START=[100,40,16,6];
export function rates([g,h,f,s]){return [.35*g*(1-g/2)-.175*g*h, .16*g*h-.12*h*f-.04*h-.08*h*(h-1), .09*h*f-.06*f*s-.03*f-.035*f*(f-1), .04*f*s-.04*s-.025*s*(s-1)];}
export function step(x,dt=.1){const a=rates(x),b=rates(x.map((v,i)=>v+dt*a[i]/2)),c=rates(x.map((v,i)=>v+dt*b[i]/2)),d=rates(x.map((v,i)=>v+dt*c[i]));return x.map((v,i)=>Math.max(0,Math.min(20,v+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6)));}
export function advance(x,units=1){let a=[...x];for(let i=0;i<Math.round(units*10);i++)a=step(a);return a;}
export function values(x){return x.map((v,i)=>Math.round(v*START[i]*10)/10);}
