import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const p=await PresentationFile.importPptx(await FileBlob.load('D:/maoshang/水面无人艇集群项目汇报_可编辑精修版.pptx'));
const b=await p.export({slide:p.slides.items[3],format:'png',scale:1});
await fs.writeFile('D:/maoshang/ppt-build/slide-4-refined.png',new Uint8Array(await b.arrayBuffer()));
