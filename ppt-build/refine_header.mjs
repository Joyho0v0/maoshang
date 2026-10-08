import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const source='D:/maoshang/水面无人艇集群项目汇报_可编辑版.pptx';
const output='D:/maoshang/水面无人艇集群项目汇报_可编辑精修版.pptx';
const deck=await PresentationFile.importPptx(await FileBlob.load(source));
const s=deck.slides.items[3];
function add(geometry,x,y,w,h,fill='none',stroke='none',width=0){return s.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width}})}
function label(v,x,y,w,h,size,color,bold=false,align='left'){const t=add('textbox',x,y,w,h);t.text=v;t.text.style={fontSize:size,color,bold,alignment:align};return t}
// Cover the simplified original objective row and rebuild it as the reference's signature banner.
add('rect',38,88,1205,76,'#FFFFFF');
add('rect',40,94,1200,62,'#FFF8F8','#E8CCCC',1);
add('rect',41,95,1198,2,'#EFCFCF');
add('rect',41,153,1198,2,'#F0DADA');
add('rightArrow',42,96,150,58,'#A50D17');
label('课题目标',53,109,112,28,23,'#FFFFFF',true,'center');
label('掌握基础数据，阐明“质-能-碳”耦合代谢规律，提出路径重构方法',218,107,900,33,24,'#9D2525',true,'left');
// Add a refined micro-rule under the slide header, mirroring the source deck's pale blue separation.
add('rect',38,76,1204,3,'#CFEAF7');
const out=await PresentationFile.exportPptx(deck);await out.save(output);
