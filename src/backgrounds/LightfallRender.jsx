import React from "react";

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const validHex=(v,f)=>/^#[0-9a-f]{6}$/i.test(String(v||""))?String(v):f;

export default function LightfallRender({colors,color1="#A6C8FF",color2="#5227FF",color3="#FF9FFC",backgroundColor="#0A29FF",speed=.5,streakCount=4,streakWidth=1,streakLength=1,glow=1,density=.6,twinkle=1,zoom=3,backgroundGlow=.5,opacity=1,lightMode=false,width=1080,height=1920,time=0}){
 const w=Math.max(1,Number(width)||1080),h=Math.max(1,Number(height)||1920),t=Number(time)||0;
 const sp=Number(speed)||0,den=clamp(Number(density)||.6,.05,2),gl=clamp(Number(glow)||1,0,3),len=clamp(Number(streakLength)||1,.2,3),sw=clamp(Number(streakWidth)||1,.1,3),tw=clamp(Number(twinkle)||0,0,2),zoomN=clamp(Number(zoom)||3,.5,6);
 const palette=(colors?.length?colors:[color1,color2,color3]).slice(0,8).map((c,i)=>validHex(c,[color1,color2,color3][i%3]));
 const bg=validHex(backgroundColor,"#0A29FF"),base=lightMode?"#ffffff":bg,op=clamp(Number(opacity)||1,.05,1);
 const n=Math.max(8,Math.min(96,Math.round((Number(streakCount)||4)*(5+den*3))));
 const shift=t*sp*(12+den*14),cx=50+Math.sin(t*.22*sp+zoomN)*10,cy=30+Math.cos(t*.17*sp)*8;
 const glowOpacity=clamp((Number(backgroundGlow)||0)*.34,0,.72);
 const lines=Array.from({length:n},(_,i)=>{
  const q=i/Math.max(1,n-1),x=((i*41.73+Math.sin(i*6.17)*17)%100+100)%100;
  const phase=(shift*(.55+(i%9)*.065)+i*11.7)%150,top=phase-45;
  const tail=(32+len*50)*(.72+den*.3),curve=(cx-x)*(.22+.035*zoomN)+Math.sin(i*2.07+t*.3)*(3+den*5);
  const y2=Math.min(122,top+tail),x2=x+curve,widthPx=(.55+sw*1.15)*(1+Math.sin(t*2+i)*.1*tw),c=palette[i%palette.length];
  const o=op*clamp(.35+.65*(.5+.5*Math.sin(i*1.83+t*2*sp)),.12,1);
  return <path key={i} d={`M ${x} ${top} C ${x+curve*.15} ${top+tail*.28}, ${x+curve*.78} ${top+tail*.7}, ${x2} ${y2}`} fill="none" stroke={c} strokeWidth={widthPx} strokeLinecap="round" opacity={o}/>;
 });
 return <div style={{position:"absolute",inset:0,width:"100%",height:"100%",minWidth:1,minHeight:1,overflow:"hidden",background:base}}>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"}} aria-hidden="true">
   <defs>
    <radialGradient id="lf-g1"><stop offset="0%" stopColor={palette[0]} stopOpacity={glowOpacity}/><stop offset="100%" stopColor={palette[0]} stopOpacity="0"/></radialGradient>
    <radialGradient id="lf-g2"><stop offset="0%" stopColor={palette[1%palette.length]} stopOpacity={glowOpacity*.85}/><stop offset="100%" stopColor={palette[1%palette.length]} stopOpacity="0"/></radialGradient>
    <filter id="lf-soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={Math.max(1,7*gl)}/></filter>
    <filter id="lf-line" x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation={Math.max(.25,.8*gl)}/></filter>
   </defs>
   <rect width="100" height="100" fill={base}/>
   <ellipse cx={cx} cy={cy} rx={55+den*18} ry={48+den*14} fill="url(#lf-g1)" filter="url(#lf-soft)"/>
   <ellipse cx={100-cx*.5} cy={65+Math.sin(t*.25*sp)*12} rx={50+den*15} ry={42+den*12} fill="url(#lf-g2)" filter="url(#lf-soft)"/>
   <g filter={gl>.7?'url(#lf-line)':undefined}>{lines}</g>
  </svg>
 </div>;
}
