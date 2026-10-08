import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const source = 'D:/maoshang/水面无人艇集群项目汇报_高保真可编辑版_箭头修正.pptx';
const deck = await PresentationFile.importPptx(await FileBlob.load(source));
const snapshot = await deck.inspect({ kind: 'slide,textbox,shape,image,layout', maxChars: 30000 });
await fs.writeFile('D:/maoshang/ppt-build/reference_match/import-inspect.ndjson', snapshot.ndjson);
const slide = deck.slides.getItem(3);
console.log(await deck.help('delete remove slide shape element collection', { maxChars: 6000 }));
console.log('SLIDE', slide.frame, slide.shapes.items?.length, slide.images.items?.length);
console.log('IMAGE KEYS', Object.keys(slide.images.items[0] ?? {}), slide.images.items[0]);
