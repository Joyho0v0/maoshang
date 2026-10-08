import fs from 'node:fs/promises';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const OUT = 'D:/maoshang/水印引导美颜可逆流程图_可编辑版.pptx';
const SOURCE = 'D:/maoshang/build_workflow_ppt/portrait.png';
const W = 1680, H = 941;
const blue = '#003B94', lineBlue = '#074AC3', teal = '#006C6C', purple = '#4A22A4', green = '#2C7A37';

function pos(left, top, width, height) { return {left, top, width, height}; }
function addText(slide, text, left, top, width, height, size=16, color='#111111', bold=false, align='center') {
  const s = slide.shapes.add({geometry:'textbox', position:pos(left,top,width,height), fill:'none', line:{style:'solid',fill:'none',width:0}});
  s.text = text;
  s.text.style = {fontFace:'Microsoft YaHei', fontSize:size, color, bold, alignment:align, verticalAlignment:'middle', marginLeft:2, marginRight:2, marginTop:1, marginBottom:1};
  return s;
}
function rect(slide, left, top, width, height, fill='#FFFFFF', stroke=lineBlue, radius=12, name) {
  return slide.shapes.add({geometry:'roundRect', name, position:pos(left,top,width,height), fill, line:{style:'solid',fill:stroke,width:1.5}, borderRadius:radius});
}
function label(slide, text, left, top, width, height, size=20) {
  const s=rect(slide,left,top,width,height,blue,blue,6); s.text=text; s.text.style={fontFace:'Microsoft YaHei',fontSize:size,color:'#FFFFFF',bold:true,alignment:'center',verticalAlignment:'middle'}; return s;
}
function arrow(slide, x1,y1,x2,y2) {
  const a=slide.shapes.add({geometry:'line',position:pos(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1)),fill:'none',line:{style:'solid',fill:blue,width:2.5},});
  a.line.head={type:'triangle',width:'sm',length:'sm'}; return a;
}
function image(slide, bytes, crop, left,top,width,height) {
  return slide.images.add({blob:bytes,contentType:'image/png',alt:'Source workflow portrait',fit:'cover',crop:{left:0,top:0,right:0,bottom:0},geometry:'roundRect',borderRadius:10,position:pos(left,top,width,height)});
}
function info(slide, text, x,y,w,h) { const b=rect(slide,x,y,w,h,'#F8FBFF',lineBlue,8); addText(slide,'●  '+text,x+10,y+5,w-20,h-10,14,'#151515',false,'left'); return b; }

async function main(){
 const p=Presentation.create({slideSize:{width:W,height:H}}); const s=p.slides.add(); s.background.fill='#FFFFFF';
 const bytes=await fs.readFile(SOURCE); const buf=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 // header
 addText(s,'我们当前构想的整体流程图（Watermark-Guided Face Retouching Reversal）',35,5,1610,62,42,'#001C62',true,'center');
 addText(s,'目标：在美颜前主动保存可恢复的原图信息，在美颜后显式估计形变并恢复原图',270,70,1140,35,27,'#001C62',false,'center');
 const rule=s.shapes.add({geometry:'line',position:pos(20,91,1625,0),fill:'none',line:{style:'solid',fill:lineBlue,width:2}}); rule.line.head={type:'oval',width:'sm',length:'sm'}; rule.line.tail={type:'oval',width:'sm',length:'sm'};
 // outer stage containers
 rect(s,18,118,145,371,'#FFFFFF',lineBlue,18); rect(s,185,118,310,371,'#FFFFFF',lineBlue,18); rect(s,513,118,327,365,'#FFFFFF',lineBlue,18); rect(s,860,118,340,355,'#FFFFFF',lineBlue,18); rect(s,1217,118,430,355,'#FFFFFF',lineBlue,18);
 label(s,'0) 输入',28,126,125,34,21); label(s,'1) Payload 生成',235,128,205,33,20); label(s,'2) 自隐写 / 可逆嵌入',570,128,214,33,20); label(s,'3) 固定美颜算子',927,128,190,33,20); label(s,'4) 信息恢复 / 解码',1297,128,205,33,19);
 // stage 0
 image(s,buf,{left:.020,top:.195,right:.910,bottom:.665},34,190,114,124); addText(s,'原图  Iₒ',45,318,90,24,17,'#111111',true); arrow(s,90,350,90,382); rect(s,35,387,112,91,'#FFFFFF',lineBlue,10); addText(s,'DWT /\n编码预处理',47,399,88,45,16,'#111111',false); addText(s,'〰〰〰',52,441,78,25,24,lineBlue,false);
 // stage 1 cards
 rect(s,198,170,285,86,'#FFFFFF','#2E67D2',10); addText(s,'Coordinate Watermark C',310,182,160,22,15,teal,true,'left'); addText(s,'提供稠密位置置信息',313,215,155,23,15,'#111111',false,'left');
 // grid
 for(let i=0;i<8;i++){ const l=slideLine(s,210+i*12,178,210+i*12,244,'#2257B6'); const q=slideLine(s,210,178+i*9.3,294,178+i*9.3,'#2257B6'); }
 rect(s,198,267,285,86,'#FFFFFF','#2E67D2',10); image(s,buf,{left:.185,top:.195,right:.720,bottom:.625},207,273,91,75); addText(s,'原图低频参考图  Iᶫᶫₒ',315,275,154,23,15,teal,true,'left'); addText(s,'保留轮廓 /\n五官结构 / 光照',318,302,150,42,14,'#111111',false,'left');
 rect(s,198,365,285,80,'#FFFFFF','#2E67D2',10); addText(s,'高频细节压缩 latent zᴴ',314,374,157,20,15,teal,true,'left'); addText(s,'毛孔 / 痣 /\n局部细节',317,401,150,36,14,'#111111',false,'left');
 // noise visual
 for(let i=0;i<100;i++){const xx=207+(i%14)*6, yy=375+Math.floor(i/14)*8; const q=s.shapes.add({geometry:'ellipse',position:pos(xx,yy,2,2),fill:(i%3?'#3A71C9':'#FFFFFF'),line:{style:'solid',fill:'none',width:0}})}
 rect(s,198,454,285,30,'#FFFFFF',lineBlue,8); addText(s,'Payload  P = [ C, Iᶫᶫₒ, zᴴ ]',211,458,260,20,16,'#001C62',true);
 // stage 2
 image(s,buf,{left:.020,top:.195,right:.910,bottom:.665},521,190,74,72); addText(s,'原图  Iₒ',519,266,79,20,15,'#111111',false); rect(s,508,320,106,55,'#FFFFFF',green,8); addText(s,'Payload  P',515,331,92,32,15,green,true); rect(s,626,213,116,164,'#EAF1FF',lineBlue,12); addText(s,'🔒\nINN /\nSelf-\nSteganography\nEncoder',634,225,100,139,12,'#002D8F',true);
 image(s,buf,{left:.020,top:.195,right:.910,bottom:.665},765,271,70,77); addText(s,'水印图\nIʷ',768,242,65,35,15,'#111111',false); arrow(s,596,225,637,272); arrow(s,602,348,637,311); arrow(s,744,294,763,294); info(s,'作用：尽可能不可见地把\nside information 藏回原图',529,402,260,55);
 // stage 3
 rect(s,906,211,163,153,'#F4FFFC',teal,16); addText(s,'◉\nBeauty API /\nScript B(·)',920,226,136,118,19,teal,true); image(s,buf,{left:.020,top:.195,right:.910,bottom:.665},1114,271,67,75); addText(s,'美颜后水印图  Iᵇ',1074,210,122,30,15,'#111111',false); arrow(s,841,280,903,280); arrow(s,1070,280,1111,280); info(s,'实验初期：固定接口 +\n固定参数',905,401,244,55);
 // stage 4
 rect(s,1303,190,160,141,'#E8F8F4',teal,17); addText(s,'🔓\nBeauty-Robust\nDecoder /\nINN Inverse',1310,201,146,119,16,teal,true); addText(s,'Iᵇ',1235,244,50,28,22,'#111111',true); arrow(s,1272,260,1299,260);
 for(const [yy,tx] of [[179,'Ĉ'],[239,'Îᶫᶫₒ'],[299,'ẑᴴ']]){rect(s,1543,yy,83,40,'#FFFFFF',green,10); addText(s,tx,1550,185+(yy-179),68,26,19,'#111111',false); arrow(s,1455,yy+20,1527,yy+20);}
 rect(s,1252,365,274,77,'#F7FBF5',green,10); addText(s,'✓  这一部分借鉴 SSD / 可逆隐写\n思想，但指标改成对\nbeauty 友好',1265,374,248,60,15,'#111111',false,'left');
 // Bottom pipeline
 rect(s,21,501,694,317,'#FFFFFF',lineBlue,18); rect(s,735,501,312,317,'#FFFFFF',lineBlue,18); rect(s,1065,501,584,285,'#FFFFFF',lineBlue,18); label(s,'5) 形变场估计',176,509,282,30,19); label(s,'6) 显式逆几何恢复',782,509,212,30,19); label(s,'7) 外观细节恢复',1230,509,185,30,19);
 // 5 routes
 rect(s,37,542,292,151,'#F8FFF8',green,12); addText(s,'Route A: Coordinate-based',68,548,230,22,14,green,true); drawGrid(s,61,568,78,60); addText(s,'Ĉ     →    Fcoord',96,639,171,22,17,'#111111',false); addText(s,'直接从恢复坐标估计形变',62,665,230,20,14,'#111111',true);
 rect(s,346,542,318,151,'#F9FBFF',lineBlue,12); addText(s,'Route B: Registration-based',382,548,240,22,14,'#001C62',true); image(s,buf,{left:.185,top:.195,right:.720,bottom:.625},355,573,72,56); image(s,buf,{left:.185,top:.195,right:.720,bottom:.625},573,573,72,56); addText(s,'Îᶫᶫₒ',368,632,50,16,12,'#111111'); addText(s,'Iᶫᶫᵇ',585,632,50,16,12,'#111111'); addText(s,'FlowNet (Îᶫᶫₒ, Iᶫᶫᵇ)  →  Fimg',379,648,250,21,14,'#111111',false); addText(s,'恢复参考图与当前低频图做配准 / 光流',357,672,295,16,12,'#111111',false);
 rect(s,228,723,227,49,'#FBF7FF',purple,10); addText(s,'Flow Fusion /\nConfidence Merge',241,727,202,39,16,purple,true); rect(s,266,783,141,29,'#FFFFFF',lineBlue,8); addText(s,'F̂',315,785,45,22,18,'#111111',false); arrow(s,184,693,315,720); arrow(s,510,693,337,720); arrow(s,341,772,341,780); info(s,'推荐：A + B 联合，\n提高稳健性',36,741,160,50);
 // stage6
 rect(s,810,549,146,37,'#FFFFFF',lineBlue,8); addText(s,'Iᵇ + F̂',830,553,106,25,19,'#111111',false); arrow(s,883,586,883,603); rect(s,795,607,176,112,'#FCF9FF',purple,10); addText(s,'Inverse Warp /\ngrid_sample\n⌁⌁⌁',805,616,156,82,18,purple,true); arrow(s,883,720,883,738); rect(s,821,724,125,34,'#FFFFFF',lineBlue,8); addText(s,'Igeo',856,728,56,23,18,'#111111',false); info(s,'先还原瘦脸 / 大眼等\n空间变形',796,760,172,39);
 // Repair the stage-6 note as a one-line editable callout (kept above the innovation banner).
 rect(s,784,759,194,28,'#F8FBFF',lineBlue,8); addText(s,'● 先还原瘦脸 / 大眼等空间变形',790,764,182,17,11,'#111111',false,'left');
 // stage7 inputs and model
 for(const [yy,tx,co] of [[519,'Igeo',purple],[587,'Îₒᴸᴸ',green],[652,'ẑᴴ',green]]){rect(s,1085,yy,93,42,'#FFFFFF',co,8); addText(s,tx,1093,yy+7,77,26,18,'#111111',false);}
 rect(s,1258,550,232,130,'#EDFBF9',teal,17); addText(s,'●◉●\nRestoration\nNetwork /\nCNN /\nRestormer',1272,563,204,106,19,teal,true); arrow(s,1180,540,1254,570); arrow(s,1180,608,1254,608); arrow(s,1180,673,1254,645); image(s,buf,{left:.020,top:.195,right:.910,bottom:.665},1538,581,74,95); addText(s,'恢复原图\nÎₒ',1519,534,110,38,16,'#111111',true); arrow(s,1492,615,1535,615); rect(s,1184,700,370,78,'#F7FBF5',green,10); addText(s,'•  几何已对齐后，再恢复磨皮 / 美白等外观变化\n•  可选 CNN / Transformer / conditional INN\n•  最终输出尽可能接近原图',1198,706,340,63,15,'#111111',false,'left');
 // innovation banner / validation
 rect(s,537,790,549,42,'#FFFFFF','#FF0000',10); addText(s,'★  创新点：主动 side-channel + 显式形变估计 + 逆恢复',550,797,523,28,18,'#E00000',true);
 rect(s,20,833,1628,92,'#FFFFFF',lineBlue,16); rect(s,37,846,516,64,'#F7FBF5',green,12); addText(s,'◎  A. 阶段1验证：Payload 是否能穿过 Beauty？\nMetrics：PSNR / SSIM / Bit accuracy',58,854,475,46,16,green,true,'left'); rect(s,572,846,510,64,'#F7FAFF',lineBlue,12); addText(s,'⌁  B. 阶段2验证：形变场是否可恢复？\nMetrics：EPE / Flow error / Landmark error',591,854,472,46,16,'#001C62',true,'left'); rect(s,1099,846,529,64,'#FFF9F0','#E87D00',12); addText(s,'◯  C. 阶段3验证：原图恢复是否提升？\nMetrics：PSNR / LPIPS / ID similarity',1120,854,490,46,16,'#C35B00',true,'left');
 const pptx=await PresentationFile.exportPptx(p); await pptx.save(OUT); const preview=await p.export({slide:s,format:'png',scale:1}); await fs.writeFile('D:/maoshang/build_workflow_ppt/preview.png',new Uint8Array(await preview.arrayBuffer()));
}
function slideLine(s,x1,y1,x2,y2,color){return s.shapes.add({geometry:'line',position:pos(x1,y1,x2-x1,y2-y1),fill:'none',line:{style:'solid',fill:color,width:0.6}})}
function drawGrid(s,x,y,w,h){for(let i=0;i<7;i++){slideLine(s,x+i*w/6,y,x+i*w/6,y+h,'#2358A6');slideLine(s,x,y+i*h/6,x+w,y+i*h/6,'#2358A6')}}
main().catch(e=>{console.error(e);process.exitCode=1});
