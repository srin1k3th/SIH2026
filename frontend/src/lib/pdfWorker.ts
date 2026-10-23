import { pdfjs } from 'react-pdf';
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjs };
