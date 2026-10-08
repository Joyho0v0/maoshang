import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const src='D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版_最终.pptx';
const dst='D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版_箭头修正.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src)); const s=p.slides.items[3];
function add(g,x,y,w,h,fill='none',stroke='none',width=0){return s.shapes.add({geometry:g,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width}})}
function txt(v,x,y,w,h,size,color,bold=false){const q=add('textbox',x,y,w,h);q.text=v;q.text.style={fontSize:size,color,bold,alignment:'center'};return q}
// Redraw the complete objective band: the arrow occupies the same full height as the pale-red outer frame.
add('rect',38,88,1205,76,'#FFFFFF');
add('rect',40,94,1200,62,'#FFF8F8','#E8CCCC',1);
add('rect',40,94,1200,2,'#EFCFCF'); add('rect',40,154,1200,2,'#EFCFCF');
// Arrow is exactly y=94..156, therefore its point never exceeds the frame vertically.
add('rightArrow',40,94,160,62,'#A50D17');
txt('课题目标',51,109,118,28,23,'#FFFFFF',true);
const h=add('textbox',218,107,900,33);h.text='掌握基础数据，阐明“质-能-碳”耦合代谢规律，提出路径重构方法';h.text.style={fontSize:24,color:'#9D2525',bold:true,alignment:'left'};
const out=await PresentationFile.exportPptx(p);await out.save(dst);
