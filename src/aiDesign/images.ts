import { AI_LIMITS, type AIImage, type AICandidate } from './protocol.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import { generateCeramicCanvas } from '../textures/generateCeramicTexture';

async function canvasBlob(canvas:HTMLCanvasElement,quality:number){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare an analysis image.')),'image/jpeg',quality));}
async function dataURL(blob:Blob){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('Could not read the analysis image.'));r.readAsDataURL(blob);});}
/** Transmission-only derivatives; never create asset records, texture objects or object URLs. */
export async function analysisImage(source:Blob|HTMLCanvasElement,signal:AbortSignal,transform?:MaterialProduct['imageTransform']):Promise<string>{
 signal.throwIfAborted();
 if(source instanceof Blob&&(!['image/jpeg','image/png','image/webp'].includes(source.type)||source.size>5_000_000))throw Error('Choose JPG, PNG or WebP images up to 5 MB.');
 const bitmap=source instanceof Blob?await createImageBitmap(source):null;
 const image=bitmap??source as HTMLCanvasElement;
 try{
  if(image.width*image.height>40_000_000||Math.max(image.width,image.height)>16384)throw Error('Resize the reference below 40 megapixels and 16,384 pixels per side.');
  const sideways=transform?.rotation===90||transform?.rotation===270,iw=sideways?image.height:image.width,ih=sideways?image.width:image.height;
  for(const edge of [1024,768,512]){
   signal.throwIfAborted();const ratio=Math.min(1,edge/Math.max(iw,ih)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(iw*ratio));canvas.height=Math.max(1,Math.round(ih*ratio));const c=canvas.getContext('2d');if(!c)throw Error('Image analysis is unavailable in this browser.');
   c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.translate(canvas.width/2,canvas.height/2);c.rotate((transform?.rotation??0)*Math.PI/180);c.scale(transform?.mirrorX?-1:1,transform?.mirrorY?-1:1);c.drawImage(image,-image.width*ratio/2,-image.height*ratio/2,image.width*ratio,image.height*ratio);
   const blob=await canvasBlob(canvas,.75);canvas.width=canvas.height=1;if(blob.size<=AI_LIMITS.imageBytes){signal.throwIfAborted();return dataURL(blob);}
  }
  throw Error('Image is too detailed for analysis. Choose a smaller image.');
 }finally{bitmap?.close();}
}
export async function prepareAIImages(options:{references:File[];includeMaterials:boolean;candidates:AICandidate[];products:MaterialProduct[];source:(p:MaterialProduct)=>Blob|undefined;signal:AbortSignal}):Promise<AIImage[]>{
 const {signal}=options;if(options.references.length>AI_LIMITS.references)throw Error('Choose up to 3 reference images.');const images:AIImage[]=[];
 for(const reference of options.references)images.push({purpose:'reference',candidateIds:[],dataUrl:await analysisImage(reference,signal)});
 if(options.includeMaterials){const ids=[...new Set(options.candidates.map(c=>c.variantId))];if(ids.length>AI_LIMITS.materialImages)throw Error('Choose at most 6 variants when including material images.');
  for(const id of ids){signal.throwIfAborted();const p=options.products.find(p=>p.id===id);if(!p)throw Error('A selected material is no longer available.');let source:Blob|HTMLCanvasElement|undefined=options.source(p);
   if(!source&&p.source!=='upload'){
    // Prefer a prepared local image. Built-in fallback is the same disclosed procedural swatch used by the room.
    if(p.texture.startsWith('/')){try{const response=await fetch(p.texture,{signal});if(response.ok&&response.headers.get('content-type')?.startsWith('image/'))source=await response.blob();}catch{signal.throwIfAborted();}}
    source??=generateCeramicCanvas(p.proceduralStyle,p.sourceAspect?.width??p.tileWidth,p.sourceAspect?.height??p.tileHeight,512);
   }
   if(!source)throw Error(`The prepared image for ${p.name} is unavailable. Retry without material images.`);
   images.push({purpose:'material',candidateIds:options.candidates.filter(c=>c.variantId===id).map(c=>c.id),dataUrl:await analysisImage(source,signal,p.imageTransform)});
  }
 }
 return images;
}
