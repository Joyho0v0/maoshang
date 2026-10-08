import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const source='D:/maoshang/水面无人艇集群项目汇报_可编辑精修版.pptx';
const output='D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版.pptx';
const deck=await PresentationFile.importPptx(await FileBlob.load(source));
const files=['D:/maoshang/ppt-build/assets/usv-blue.jpg','D:/maoshang/ppt-build/assets/usv-red.jpg','D:/maoshang/ppt-build/assets/ocean-boat.jpg','D:/maoshang/ppt-build/assets/ship-bow.jpg'];
const bytes=await Promise.all(files.map(async f=>{const b=await fs.readFile(f);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}));
function pic(slide,n,x,y,w,h){slide.images.add({blob:bytes[n%4],contentType:'image/jpeg',alt:'公开海事与无人艇素材',fit:'cover',position:{left:x,top:y,width:w,height:h}})}
function cap(slide,v,x,y,w){const t=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:24},fill:'none',line:{style:'solid',fill:'none',width:0}});t.text=v;t.text.style={fontSize:15,color:'#142A3A',bold:true,alignment:'center'}}
// 1.1: policy/context image and three supporting evidence windows
{const s=deck.slides.items[1];pic(s,1,47,177,186,240);pic(s,0,57,490,356,75);pic(s,2,462,490,356,75);pic(s,3,867,490,356,75)}
// 2.1: three research-content visual frames
{const s=deck.slides.items[3];pic(s,2,222,524,216,105);pic(s,0,472,524,216,105);pic(s,3,762,524,426,105)}
// 2.2: four images, keeping captions editable
{const s=deck.slides.items[4];[[0,47,242],[1,322,242],[2,712,242],[3,987,242]].forEach(([n,x,y])=>pic(s,n,x,y,246,125))}
// 2.3: three task images plus a wide maritime-sensing composition
{const s=deck.slides.items[5];[[0,107,204],[1,107,344],[2,107,484]].forEach(([n,x,y])=>pic(s,n,x,y,161,72));pic(s,3,370,215,835,190)}
// 2.4: three technology-route visual frames
{const s=deck.slides.items[6];[[0,105,269],[2,500,269],[3,895,269]].forEach(([n,x,y])=>pic(s,n,x,y,255,120))}
// 3.1: two hero visual panels
{const s=deck.slides.items[7];pic(s,0,47,245,560,260);pic(s,3,672,245,560,260)}
// 4.1: publication/patent/book evidence panels
{const s=deck.slides.items[8];[[2,47,382],[0,452,382],[3,857,382]].forEach(([n,x,y])=>pic(s,n,x,y,356,165))}
// 5.1: institution/platform image strip
{const s=deck.slides.items[9];[[3,52,497],[2,352,497],[0,652,497],[1,952,497]].forEach(([n,x,y])=>pic(s,n,x,y,266,95))}
const out=await PresentationFile.exportPptx(deck);await out.save(output);
