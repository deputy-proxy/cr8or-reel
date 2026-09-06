export const BUILTIN_ANIMATIONS = [
  {id:'none',name:'None'},
  {id:'fadeOut',name:'Fade Out',controls:[['duration','Duration','range',.5,0,3,.05]]},{id:'fadeIn',name:'Fade In',controls:[['duration','Duration','range',.5,0,3,.05]]},
  {id:'slideInUp',name:'Slide Up',controls:[['duration','Duration','range',.6,.05,3,.05],['distance','Distance','range',80,0,600,5]]},
  {id:'slideInDown',name:'Slide Down',controls:[['duration','Duration','range',.6,.05,3,.05],['distance','Distance','range',80,0,600,5]]},
  {id:'slideInLeft',name:'Slide Left',controls:[['duration','Duration','range',.6,.05,3,.05],['distance','Distance','range',80,0,600,5]]},
  {id:'slideInRight',name:'Slide Right',controls:[['duration','Duration','range',.6,.05,3,.05],['distance','Distance','range',80,0,600,5]]},
  {id:'scaleIn',name:'Scale In',controls:[['duration','Duration','range',.5,.05,3,.05],['fromScale','Start scale','range',.7,.05,1,.01]]},
  {id:'springIn',name:'Spring In',controls:[['duration','Duration','range',.8,.05,3,.05],['damping','Damping','range',14,1,40,1],['stiffness','Stiffness','range',100,10,300,5]]},
  {id:'blurIn',name:'Blur In',controls:[['duration','Duration','range',.6,.05,3,.05],['blur','Blur','range',16,0,40,1]]},
  {id:'rotateIn',name:'Rotate In',controls:[['duration','Duration','range',.6,.05,3,.05],['degrees','Degrees','range',-12,-180,180,1]]},
  {id:'popIn',name:'Pop In',controls:[['duration','Duration','range',.45,.05,3,.05],['fromScale','Start scale','range',.65,.05,1,.01]]},
  {id:'wipeLeft',name:'Wipe Left',controls:[['duration','Duration','range',.6,.05,3,.05]]},
  {id:'wipeUp',name:'Wipe Up',controls:[['duration','Duration','range',.6,.05,3,.05]]},
  {id:'floatUp',name:'Float Up',controls:[['duration','Duration','range',.8,.05,3,.05],['distance','Distance','range',40,0,300,5]]}
];

export function animationDefinition(id, custom = []) {
  return BUILTIN_ANIMATIONS.find(a=>a.id===id) || custom.find(a=>a.id===id) || BUILTIN_ANIMATIONS[0];
}

export function evaluateCustomAnimation(animation, context) {
  try {
    const fn = new Function('return (' + animation.code + ')')();
    return fn(context) || {};
  } catch { return {}; }
}

export function animationStyle(element, frame, fps, customAnimations = []) {
  const a = typeof element.animation === 'string' ? {type:element.animation} : (element.animation || {});
  const type = a.type || 'none';
  const start = Number(element.start || 0) * fps;
  const end = Number(element.end ?? 999999) * fps;
  const duration = Math.max(1, Number(a.duration ?? .5) * fps);
  const raw = Math.max(0, Math.min(1, (frame-start)/duration));
  const p = a.easing === 'linear' ? raw : a.easing === 'easeIn' ? raw*raw : a.easing === 'easeInOut' ? (raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2) : 1-Math.pow(1-raw,3);
  let x=Number(element.x||0), y=Number(element.y||0), scale=Number(element.scale??1), opacity=Number(element.opacity??1), rotation=Number(element.rotation||0), filter='none', clipPath='none';
  if(frame<start || frame>=end) opacity=0;
  else if(type==='fadeIn') opacity*=p; else if(type==='fadeOut'){const fp=Math.max(0,Math.min(1,(frame-Math.max(start,end-duration))/duration));opacity*=1-fp;}
  else if(type==='slideInUp'){y+=(1-p)*Number(a.distance??80);opacity*=p;}
  else if(type==='slideInDown'){y-=(1-p)*Number(a.distance??80);opacity*=p;}
  else if(type==='slideInLeft'){x-=(1-p)*Number(a.distance??80);opacity*=p;}
  else if(type==='slideInRight'){x+=(1-p)*Number(a.distance??80);opacity*=p;}
  else if(type==='scaleIn'||type==='popIn'){scale*=Number(a.fromScale??(type==='popIn' ? .65 : .7)) + p*(1-Number(a.fromScale??(type==='popIn' ? .65 : .7)));opacity*=p;}
  else if(type==='springIn'){const sp=1-Math.exp(-8*Math.max(0,frame-start)/fps);scale*=.85+sp*.15;opacity*=sp;}
  else if(type==='blurIn'){filter=`blur(${(1-p)*Number(a.blur??16)}px)`;opacity*=p;}
  else if(type==='rotateIn'){rotation+=(1-p)*Number(a.degrees??-12);opacity*=p;}
  else if(type==='wipeLeft'){clipPath=`inset(0 ${100-p*100}% 0 0)`;opacity*=p;}
  else if(type==='wipeUp'){clipPath=`inset(${100-p*100}% 0 0 0)`;opacity*=p;}
  else if(type==='floatUp'){y+=(1-p)*Number(a.distance??40);opacity*=p;}
  else if(type.startsWith('custom:')) { const custom=evaluateCustomAnimation(customAnimations.find(c=>c.id===type.slice(7))||{}, {progress:p,rawProgress:raw,frame,fps,element,props:a}); x+=Number(custom.x||0); y+=Number(custom.y||0); scale*=Number(custom.scale??1); opacity*=Number(custom.opacity??1); rotation+=Number(custom.rotation||0); filter=custom.filter||filter; clipPath=custom.clipPath||clipPath; }
  return {x,y,scale,opacity,rotation,filter,clipPath};
}
