import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
import JSZip from 'jszip';

const source = 'D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版_箭头修正.pptx';
const output = 'D:/maoshang/水面无人艇集群项目汇报_研究思路参考图优化版.pptx';
const previewDir = 'D:/maoshang/ppt-build/reference_match/final-preview';

async function saveBlob(path, blob) {
  await fs.mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

const deck = await PresentationFile.importPptx(await FileBlob.load(source));
const slide = deck.slides.getItem(3);
const sourceImageRefs = slide.images.items.map((image) => image.data.imageReference.id);
const sourceZip = await JSZip.loadAsync(await fs.readFile(source));
async function sourceImage(ref) {
  const entry = sourceZip.file(ref.replace(/^\//, ''));
  if (!entry) throw new Error(`Missing source media: ${ref}`);
  const bytes = await entry.async('uint8array');
  const extension = ref.split('.').pop().toLowerCase();
  return { bytes, contentType: extension === 'png' ? 'image/png' : 'image/jpeg' };
}
const sourceImages = await Promise.all(sourceImageRefs.map(sourceImage));
slide.background.fill = '#FFFFFF';

// Keep the original editable media but rebuild the slide-local composition around it.
slide.shapes.deleteAll();

const C = { blue: '#0E5E9D', navy: '#0A4F82', lightBlue: '#E8F4FB', red: '#A7121B', paleRed: '#FDF6F6', paleGray: '#F3F3F3', grayLine: '#D4DDE1', text: '#111111', muted: '#244F67' };
function rect(name, left, top, width, height, fill, line = { style: 'solid', fill: 'none', width: 0 }, geometry = 'rect') {
  return slide.shapes.add({ geometry, name, position: { left, top, width, height }, fill, line });
}
function text(name, value, left, top, width, height, fontSize, color = C.text, bold = false, align = 'left') {
  const s = rect(name, left, top, width, height, 'none');
  s.text = value;
  s.text.style = { fontFace: 'Microsoft YaHei', fontSize, color, bold, alignment: align, verticalAlignment: 'middle', marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 };
  return s;
}

// Header chrome.
text('slide-title', '2.1  研究思路', 38, 14, 720, 48, 34, C.blue, true);
text('brand', '▣ 像素答辩', 1052, 18, 190, 35, 23, C.navy, true, 'right');
rect('header-rule', 0, 72, 1280, 7, '#D7EDF9');

// Project-goal strip.
rect('goal-band', 40, 94, 1200, 62, C.paleRed, { style: 'solid', fill: '#E8C7C7', width: 1 });
rect('goal-label', 40, 94, 158, 62, C.red);
rect('goal-arrow', 185, 94, 42, 62, C.red, { style: 'solid', fill: 'none', width: 0 }, 'rightArrow');
text('goal-label-text', '课题目标', 50, 107, 125, 34, 25, '#FFFFFF', true, 'center');
text('goal-copy', '掌握基础数据，阐明“质-能-碳”耦合代谢规律，提出路径重构方法', 250, 103, 930, 40, 24, '#9C1A21', true, 'center');

// Scientific-question block: reference uses a left arrow label, a light outlined container,
// stacked category tags, down-arrows, and three horizontal question bars.
rect('question-shell', 200, 180, 1040, 232, '#FFFFFF', { style: 'solid', fill: '#D5DEE2', width: 1 });
rect('question-label', 40, 265, 150, 62, C.navy, { style: 'solid', fill: 'none', width: 0 }, 'rightArrow');
text('question-label-text', '科学问题', 45, 278, 122, 30, 21, '#FFFFFF', true, 'center');
const topics = ['动态性', '不确定性', '规模性'];
const questions = ['如何在通信受限、拓扑动态变化的条件下实现分布式一致性感知？', '如何在高动态威胁环境中实现实时、鲁棒的任务分配？', '态势感知与任务分配如何形成闭环优化？'];
for (let i = 0; i < 3; i++) {
  const y = 194 + i * 77;
  rect(`topic-${i}`, 214, y, 175, 49, '#FDFEFE', { style: 'solid', fill: '#8EB6C9', width: 1 });
  text(`topic-text-${i}`, topics[i], 220, y + 9, 163, 30, 22, C.blue, true, 'center');
  rect(`question-bar-${i}`, 402, y, 830, 49, C.paleGray);
  text(`question-text-${i}`, questions[i], 425, y + 10, 780, 27, 18, C.text, true, 'center');
  if (i < 2) {
    const c = rect(`down-arrow-circle-${i}`, 289, y + 51, 23, 23, '#FFFFFF', { style: 'solid', fill: C.muted, width: 1 }, 'ellipse');
    text(`down-arrow-${i}`, '↓', 289, y + 49, 23, 23, 19, C.muted, true, 'center');
  }
}

// Research-content group and lower content frames.
rect('content-label', 40, 550, 150, 62, C.navy, { style: 'solid', fill: 'none', width: 0 }, 'rightArrow');
text('content-label-text', '研究内容', 45, 563, 122, 30, 21, '#FFFFFF', true, 'center');
rect('content-band', 200, 435, 1040, 48, C.blue);
text('content-one', '①  通信受限下的分布式任务分配', 250, 442, 430, 34, 23, '#FFFFFF', true, 'center');
text('content-two', '②  动态任务插入与重分配', 810, 442, 380, 34, 23, '#FFFFFF', true, 'center');
rect('under-one', 215, 494, 480, 2, C.muted);
rect('under-two', 747, 494, 480, 2, C.muted);
rect('pointer-one', 450, 494, 11, 8, C.muted, { style: 'solid', fill: 'none', width: 0 }, 'downArrow');
rect('pointer-two', 982, 494, 11, 8, C.muted, { style: 'solid', fill: 'none', width: 0 }, 'downArrow');

// Image mats preserve the original media as fully editable image elements.
const cardA = rect('card-a', 200, 507, 510, 173, '#F8F8F8');
const cardB = rect('card-b', 735, 507, 505, 173, '#F8F8F8');
slide.images.add({ blob: sourceImages[0].bytes, contentType: sourceImages[0].contentType, alt: '多艇协同场景', fit: 'cover', position: { left: 215, top: 517, width: 235, height: 125 } });
slide.images.add({ blob: sourceImages[1].bytes, contentType: sourceImages[1].contentType, alt: '通信拓扑示意', fit: 'cover', position: { left: 464, top: 517, width: 230, height: 125 } });
slide.images.add({ blob: sourceImages[2].bytes, contentType: sourceImages[2].contentType, alt: '算法流程图', fit: 'cover', position: { left: 747, top: 517, width: 478, height: 125 } });
rect('img-one-caption', 215, 642, 235, 26, '#FFFFFF');
rect('img-two-caption', 464, 642, 230, 26, '#FFFFFF');
text('img-one-title', '多艇协同场景', 216, 645, 233, 20, 14, '#17364A', true, 'center');
text('img-two-title', '通信拓扑示意', 465, 645, 228, 20, 14, '#17364A', true, 'center');
text('flow-title', '算法流程图', 747, 645, 478, 20, 14, '#17364A', true, 'center');
// Image elements imported from the source sit above the card backgrounds.
cardA.sendToBack();
cardB.sendToBack();

slide.speakerNotes.text = '[Sources]\n- Reference composition supplied by the user in the task attachment.\n- Images retained from the source presentation.\n[/Sources]';

const qa = await deck.inspect({ kind: 'slide,textbox,shape,image,notes', maxChars: 14000 });
await fs.writeFile('D:/maoshang/ppt-build/reference_match/final-inspect.ndjson', qa.ndjson);
await saveBlob(`${previewDir}/slide-4.png`, await slide.export({ format: 'png', scale: 2 }));
await saveBlob(`${previewDir}/slide-4-layout.json`, await slide.export({ format: 'layout' }));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(output);
