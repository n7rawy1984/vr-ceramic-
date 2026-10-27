/** Read encoded dimensions, without decoding/resampling an image or creating another bitmap. */
export async function imageDimensions(blob:Blob):Promise<{pixelWidth:number;pixelHeight:number}|null>{
  const a=new Uint8Array(await blob.arrayBuffer()),v=new DataView(a.buffer);
  if(a.length>=24&&v.getUint32(0)===0x89504e47&&v.getUint32(4)===0x0d0a1a0a)return {pixelWidth:v.getUint32(16),pixelHeight:v.getUint32(20)};
  if(a.length>=4&&a[0]===255&&a[1]===216){
    let i=2;while(i+9<a.length){if(a[i]!==255){i++;continue;}const marker=a[i+1];if(marker===255){i++;continue;}if(marker===0xd9||marker===0xda)break;const size=v.getUint16(i+2);if(size<2)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {pixelWidth:v.getUint16(i+7),pixelHeight:v.getUint16(i+5)};i+=2+size;}
  }
  if(a.length>=30&&String.fromCharCode(...a.slice(0,4))==='RIFF'&&String.fromCharCode(...a.slice(8,12))==='WEBP'){
    const chunk=String.fromCharCode(...a.slice(12,16));
    if(chunk==='VP8X')return {pixelWidth:1+a[24]+(a[25]<<8)+(a[26]<<16),pixelHeight:1+a[27]+(a[28]<<8)+(a[29]<<16)};
    if(chunk==='VP8 '&&a[23]===0x9d&&a[24]===1&&a[25]===0x2a)return {pixelWidth:v.getUint16(26,true)&0x3fff,pixelHeight:v.getUint16(28,true)&0x3fff};
    if(chunk==='VP8L'&&a[20]===0x2f)return {pixelWidth:1+a[21]+((a[22]&63)<<8),pixelHeight:1+(a[22]>>6)+(a[23]<<2)+((a[24]&15)<<10)};
  }
  return null;
}
