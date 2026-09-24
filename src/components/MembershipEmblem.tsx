import {useId} from 'react';

/** Decorative, resolution-independent artwork for the three membership tiers. */
export function MembershipEmblem({level}:{level:number}) {
 const id=`member-emblem-${useId().replace(/:/g,'')}`;
 const colors=[
  ['#fcf5ff','#b6aceb','#605485','#251d43'],
  ['#fff0fa','#ff9ddd','#db41b2','#4a1464'],
  ['#efffff','#83fff4','#27b8d1','#153c78'],
 ][level];
 const fill=(name:string)=>`url(#${id}-${name})`;
 return <div className={`recharge-emblem recharge-emblem-level-${level}`} aria-hidden="true">
  <svg viewBox="0 0 240 160" fill="none" focusable="false">
   <defs>
    <linearGradient id={`${id}-metal`} x1="65" y1="30" x2="162" y2="122" gradientUnits="userSpaceOnUse"><stop stopColor={colors[0]}/><stop offset=".23" stopColor={colors[1]}/><stop offset=".46" stopColor={colors[3]}/><stop offset=".58" stopColor={colors[1]}/><stop offset=".78" stopColor={colors[2]}/><stop offset="1" stopColor={colors[3]}/></linearGradient>
    <linearGradient id={`${id}-face`} x1="94" y1="40" x2="143" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor={colors[0]}/><stop offset=".35" stopColor={colors[1]}/><stop offset="1" stopColor={colors[2]}/></linearGradient>
    <linearGradient id={`${id}-dark`} x1="88" y1="38" x2="145" y2="117" gradientUnits="userSpaceOnUse"><stop stopColor={colors[2]} stopOpacity=".45"/><stop offset=".4" stopColor={colors[3]}/><stop offset="1" stopColor="#0e1127"/></linearGradient>
    <linearGradient id={`${id}-wing`} x1="43" y1="65" x2="94" y2="105" gradientUnits="userSpaceOnUse"><stop stopColor={colors[0]}/><stop offset=".32" stopColor={colors[1]}/><stop offset=".6" stopColor={colors[3]}/><stop offset="1" stopColor={colors[2]}/></linearGradient>
    <radialGradient id={`${id}-aura`}><stop stopColor={colors[2]} stopOpacity=".34"/><stop offset=".55" stopColor={colors[2]} stopOpacity=".1"/><stop offset="1" stopColor={colors[2]} stopOpacity="0"/></radialGradient>
    <radialGradient id={`${id}-floor`}><stop stopColor={colors[1]} stopOpacity=".32"/><stop offset=".5" stopColor={colors[2]} stopOpacity=".12"/><stop offset="1" stopColor={colors[2]} stopOpacity="0"/></radialGradient>
    <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5"/></filter>
   </defs>
   <ellipse className="emblem-aura" cx="120" cy="78" rx="108" ry="77" fill={fill('aura')}/>
   <ellipse cx="120" cy="141" rx="70" ry="12" fill={fill('floor')}/>
   <ellipse cx="120" cy="139" rx="52" ry="7" stroke={colors[1]} strokeOpacity=".35"/>
   <ellipse cx="120" cy="139" rx="35" ry="3.5" stroke={colors[1]} strokeOpacity=".2"/>
   <path d="M88 130 73 139h12m67-9 15 9h-12" stroke={colors[1]} strokeOpacity=".3" strokeWidth=".75"/>
   <g className="emblem-orbital-ring">
    <circle cx="120" cy="77" r="62" stroke={colors[1]} strokeOpacity=".13" strokeWidth=".6"/>
    <circle cx="120" cy="77" r="58" stroke={colors[1]} strokeOpacity=".38" strokeWidth="1" strokeDasharray="28 9 2 9 7 36"/>
    <path d="M120 15v6m0 112v6M58 77h6m112 0h6" stroke={colors[0]} strokeOpacity=".6"/>
    <circle cx="120" cy="19" r="2" fill={colors[0]}/><circle cx="120" cy="135" r="1.5" fill={colors[1]}/>
   </g>
   <ellipse className="emblem-orbit-cross" cx="120" cy="81" rx="99" ry="29" transform="rotate(-17 120 81)" stroke={colors[1]} strokeOpacity=".32" strokeWidth=".7"/>
   <g className="emblem-body">
    {level===0?<>
     <path d="m120 28 39 22 0 48-39 26-39-26V50Z" fill={fill('metal')} stroke={colors[1]} strokeWidth=".8"/>
     <path d="m120 33 34 20v42l-34 23-34-23V53Z" fill={fill('dark')} stroke={colors[0]} strokeOpacity=".45" strokeWidth=".7"/>
     <circle cx="120" cy="76" r="29" stroke={fill('metal')} strokeWidth="5"/>
     <circle cx="120" cy="76" r="25.5" stroke={colors[0]} strokeOpacity=".4" strokeWidth=".7"/>
     <circle cx="120" cy="76" r="21" fill={fill('dark')}/>
     <path d="m113 61 22 15-22 15Z" fill={fill('face')} stroke={colors[0]} strokeWidth=".8"/>
     <path d="m113 61 4 15-4 15m4-15h18" stroke={colors[0]} strokeOpacity=".5" strokeWidth=".7"/>
     <path d="m76 60-9 6v22l9 7m88-35 9 6v22l-9 7" stroke={colors[1]} strokeOpacity=".65" strokeWidth="2"/>
     <path d="m103 111 17 10 17-10" stroke={colors[0]} strokeOpacity=".55"/>
    </>:level===1?<>
     <path d="m83 71-31-13 12 28 24 15m-4-24L49 75l19 20 20 10m-3-12-24 3 20 15 13-2" fill={fill('wing')} stroke={colors[1]} strokeOpacity=".5" strokeWidth=".6"/>
     <path d="m83 71-31-13 12 28 24 15m-4-24L49 75l19 20 20 10m-3-12-24 3 20 15 13-2" transform="translate(240 0) scale(-1 1)" fill={fill('wing')} stroke={colors[1]} strokeOpacity=".5" strokeWidth=".6"/>
     <path d="m120 29 36 21v45l-36 27-36-27V50Z" fill={fill('dark')} stroke={fill('metal')} strokeWidth="2"/>
     <path d="m120 34 30 18v40l-30 23-30-23V52Z" stroke={colors[1]} strokeOpacity=".3" strokeWidth=".7"/>
     <path d="m84 62 21 13 15-31 15 31 21-13-9 37H93Z" fill={fill('metal')} stroke={colors[0]} strokeWidth="1.1" strokeLinejoin="round"/>
     <path d="m90 68 15 11 15-29 15 29 15-11-7 24H97Z" fill={fill('face')}/>
     <path d="m105 79 15-29v42H97Zm30 0 15-11-7 24h-23Z" fill={colors[3]} fillOpacity=".28"/>
     <path d="m120 65 7 14-7 10-7-10Z" fill={colors[3]} stroke={colors[0]} strokeWidth=".7"/>
     <path d="m120 68 4 11-4 7-4-7Z" fill={fill('face')}/>
     <path d="M93 99h54v7H93Z" fill={fill('metal')} stroke={colors[1]} strokeWidth=".8"/>
     <path d="M98 102h44" stroke={colors[0]} strokeOpacity=".8"/>
     <circle cx="84" cy="61" r="3" fill={fill('face')}/><circle cx="120" cy="43" r="3.5" fill={fill('face')}/><circle cx="156" cy="61" r="3" fill={fill('face')}/>
     <path d="m116 113 4 4 4-4-4-3Z" fill={colors[1]}/>
    </>:<>
     <path d="m87 70-42-19 12 26 31 15m-2-16-48-8 20 27 32 7m-2-17-40 5 24 21 25-4m-9-6-26 9 26 9 11-8" fill={fill('wing')} stroke={colors[1]} strokeOpacity=".65" strokeWidth=".6"/>
     <path d="m87 70-42-19 12 26 31 15m-2-16-48-8 20 27 32 7m-2-17-40 5 24 21 25-4m-9-6-26 9 26 9 11-8" transform="translate(240 0) scale(-1 1)" fill={fill('wing')} stroke={colors[1]} strokeOpacity=".65" strokeWidth=".6"/>
     <path d="m120 22 37 29v46l-37 31-37-31V51Z" fill={fill('dark')} stroke={fill('metal')} strokeWidth="2"/>
     <path d="m120 28 31 25v41l-31 27-31-27V53Z" stroke={colors[1]} strokeOpacity=".35" strokeWidth=".6"/>
     <path d="m98 51 44 0 16 22-38 39-38-39Z" fill={fill('face')} stroke={colors[0]} strokeWidth="1" strokeLinejoin="round"/>
     <path d="m98 51 9 22H82Zm44 0-9 22h25Zm-35 22 13 39-38-39Z" fill={colors[2]}/>
     <path d="m133 73-13 39 38-39Z" fill={colors[3]} fillOpacity=".65"/>
     <path d="m120 51-13 22h26Z" fill={colors[0]}/>
     <path d="m107 73 13 39 13-39Z" fill={colors[1]} fillOpacity=".55"/>
     <path d="m98 51 9 22 13 39 13-39 9-22M82 73h76m-51 0 13-22 13 22" stroke={colors[0]} strokeOpacity=".65" strokeWidth=".7"/>
     <path d="m115 34 5-8 5 8-5 7Z" fill={fill('face')}/>
     <path d="m109 120 11 9 11-9" stroke={colors[0]} strokeWidth="1"/>
    </>}
   </g>
   <g className="emblem-satellites" fill={colors[1]}>
    <circle cx="34" cy="91" r="2"/><circle cx="197" cy="48" r="2.5"/><circle cx="174" cy="120" r="1.5"/>
    <circle cx="61" cy="37" r="1"/><circle cx="204" cy="105" r="1"/>
   </g>
   <g className="emblem-glint" stroke={colors[0]} strokeLinecap="round">
    <path d={level===0?'M99 44v12m-6-6h12':level===1?'M151 51v14m-7-7h14':'M144 45v16m-8-8h16'} strokeWidth="3" filter={fill('glow')}/>
    <path d={level===0?'M99 44v12m-6-6h12':level===1?'M151 51v14m-7-7h14':'M144 45v16m-8-8h16'} strokeWidth="1.3"/>
   </g>
   <path className="emblem-tiny-glint" d="M72 116v8m-4-4h8M180 31v6m-3-3h6" stroke={colors[1]} strokeWidth=".9"/>
  </svg>
 </div>;
}

