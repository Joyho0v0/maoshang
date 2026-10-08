import { Presentation, PresentationFile } from '@oai/artifact-tool';
const p=Presentation.create({slideSize:{width:1280,height:720}}); const s=p.slides.add();
const a=s.shapes.add({geometry:'rect',position:{left:0,top:0,width:1280,height:720},fill:'#FFFFFF',line:{style:'solid',fill:'none',width:0}});
const t=s.shapes.add({geometry:'textbox',position:{left:30,top:30,width:1000,height:60},fill:'none',line:{style:'solid',fill:'none',width:0}});t.text='测试';t.text.style={fontSize:40,bold:true,color:'#075A98',alignment:'left'};
const o=await PresentationFile.exportPptx(p);await o.save('D:/maoshang/ppt-build/test.pptx');
