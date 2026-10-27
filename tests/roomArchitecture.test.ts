import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ARCHITECTURE,architectureErrors,wallSegments} from '../src/layout/roomArchitecture.ts';
import {roomSurface,roomSizeError} from '../src/layout/roomDimensions.ts';
import {compileLayout} from '../src/layout/compiler.ts';
import {defaultInstallation} from '../src/layout/model.ts';
test('broad room sizes and heights retain 600mm bodies and exact surface coverage',()=>{
 for(const [widthMm,lengthMm] of [[2800,3500],[5400,7200],[8000,10000],[15000,20000]])for(const heightMm of [2400,3000,4500]){
  const size={widthMm,lengthMm},architecture={...structuredClone(DEFAULT_ARCHITECTURE),heightMm};assert.deepEqual(architectureErrors(size,architecture),[]);
  const s=roomSurface(size),r=compileLayout(s,defaultInstallation(s.id,'tile','tile','tile'),[{id:'tile',widthMm:600,heightMm:600}]);assert(r.ok);if(!r.ok)throw Error('compile');
  assert(Math.abs(r.layout.tileAreaMm2+r.layout.jointAreaMm2-widthMm*lengthMm)<.1);assert(r.layout.placements.every(p=>p.tileBounds.widthMm===600&&p.tileBounds.heightMm===600));
 }
});
test('technical limits reject nonphysical/extreme values without imposing a normal-room range',()=>{
 assert.equal(roomSizeError({widthMm:1,lengthMm:100000}),null);
 for(const value of [0,-1,NaN,Infinity,100001])assert(roomSizeError({widthMm:value,lengthMm:7000}));
 for(const heightMm of [0,-1,NaN,50001])assert(architectureErrors({widthMm:6000,lengthMm:7000},{...DEFAULT_ARCHITECTURE,heightMm}).length);
});
test('window edits change physical wall subtraction and reject out-of-wall bounds',()=>{
 const size={widthMm:6000,lengthMm:7000};
 for(const window of [{enabled:true,widthMm:1200,heightMm:1500,sillMm:900,offsetMm:2000},{enabled:true,widthMm:1800,heightMm:1200,sillMm:500,offsetMm:-1500}]){
  assert.deepEqual(architectureErrors(size,{...DEFAULT_ARCHITECTURE,window}),[]);
  const o={width:window.widthMm/1000,height:window.heightMm/1000,bottom:window.sillMm/1000,centerOffset:window.offsetMm/1000};
  const segments=wallSegments(7,3,o);assert.equal(segments.length,4);assert(Math.abs(segments.reduce((n,s)=>n+s.w*s.h,0)-(21-o.width*o.height))<1e-9);
  for(const s of segments){assert(s.x-s.w/2>=-3.5-1e-9&&s.x+s.w/2<=3.5+1e-9);assert(s.y-s.h/2>=-1e-9&&s.y+s.h/2<=3+1e-9);}
 }
 for(const change of [{widthMm:8000},{heightMm:4000},{offsetMm:4000},{sillMm:-1},{sillMm:2500}])assert(architectureErrors(size,{...DEFAULT_ARCHITECTURE,window:{...DEFAULT_ARCHITECTURE.window,...change}}).length);
 assert(architectureErrors({widthMm:2800,lengthMm:2000},DEFAULT_ARCHITECTURE).length===0);
 assert(architectureErrors({widthMm:2800,lengthMm:1500},DEFAULT_ARCHITECTURE).length>0);
 assert.equal(wallSegments(7,3).reduce((n,s)=>n+s.w*s.h,0),21);
});
test('Simple/Gypsum settings validate proportions without changing floor geometry',()=>{
 const size={widthMm:2800,lengthMm:3500};
 for(const ceiling of [{style:'simple' as const,insetMm:550,dropMm:100},{style:'gypsum' as const,insetMm:300,dropMm:150}])assert.deepEqual(architectureErrors(size,{...DEFAULT_ARCHITECTURE,ceiling}),[]);
 for(const change of [{insetMm:1400},{dropMm:3000},{insetMm:0},{dropMm:NaN}])assert(architectureErrors(size,{...DEFAULT_ARCHITECTURE,ceiling:{style:'gypsum',insetMm:550,dropMm:100,...change}}).length);
});
test('camera presets stay inside variable room heights and Top fits both axes',async()=>{
 const {presetPose}=await import('../src/scene/cameraPresets.ts');
 for(const [width,length] of [[2.8,3.5],[5.4,7.2],[8,10],[15,20]])for(const height of [2.4,3,4.5])for(const aspect of [.5,1.5]){
  const room={width,length,height};
  for(const mode of ['room','floor','detail']){
   const pose=presetPose(mode,aspect,room);assert(pose.position.y>0&&pose.position.y<height);assert(Math.abs(pose.position.x)<width/2&&Math.abs(pose.position.z)<length/2);
  }
  const top=presetPose('top',aspect,room);const span=top.position.y*Math.tan(top.fov*Math.PI/360);assert(span>=length/2&&span*aspect>=width/2);
 }
});
