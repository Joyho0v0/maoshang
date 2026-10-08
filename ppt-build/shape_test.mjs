import { Presentation, PresentationFile } from '@oai/artifact-tool';
const p=Presentation.create({slideSize:{width:1280,height:720}}),s=p.slides.add();
const a=s.shapes.add({geometry:'rightArrow',position:{left:50,top:50,width:150,height:50},fill:'#9D2525',line:{style:'solid',fill:'none',width:0}});a.text='目标';a.text.style={fontSize:20,bold:true,color:'#FFFFFF',alignment:'center'};
const x=await PresentationFile.exportPptx(p);await x.save('D:/maoshang/shape_test.pptx');
