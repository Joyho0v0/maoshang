import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const p=await PresentationFile.importPptx(await FileBlob.load('D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版.pptx'));
const s=p.slides.items[0];const b=await fs.readFile('D:/maoshang/ppt-build/assets/campus.jpg');
s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/jpeg',alt:'公开校园航拍图',fit:'cover',position:{left:0,top:595,width:1280,height:115}});
// Reintroduce the institute footer over the softened campus strip.
const t=s.shapes.add({geometry:'textbox',position:{left:340,top:550,width:600,height:88},fill:'none',line:{style:'solid',fill:'none',width:0}});t.text='像素船舶水运安全工程研究所\n像素理工大学智能交通系统研究中心';t.text.style={fontSize:24,color:'#151515',bold:true,alignment:'center'};
const out=await PresentationFile.exportPptx(p);await out.save('D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版_最终.pptx');
