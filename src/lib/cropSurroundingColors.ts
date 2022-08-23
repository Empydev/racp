import trimImageData, { TrimOptions } from "trim-image-data";
import { loadImage } from "./loadImage";

export type RGB = [number, number, number];

export async function cropSurroundingColors(
  imageFile: File,
  colors: RGB[]
): Promise<File> {
  const image = await loadImage(URL.createObjectURL(imageFile));
  if (!image) {
    throw new Error("Could not load image");
  }
  const originalData = canvasToData(imageToCanvas(image));
  const croppedData = trimImageData(originalData, createTrimOptions(colors));
  const croppedCanvas = imageDataToCanvas(croppedData);
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      blob
        ? resolve(new File([blob], imageFile.name, { type: imageFile.type }))
        : reject();
    }, imageFile.type);
  });
}

const createTrimOptions = (colors: RGB[]): TrimOptions => ({
  trimColor: ({ red, green, blue }) =>
    !colors.some(([r, g, b]) => r === red && g === green && b === blue),
});

function imageToCanvas(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvasToContext(canvas).drawImage(image, 0, 0);
  return canvas;
}

function canvasToData(canvas: HTMLCanvasElement) {
  return canvasToContext(canvas).getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvasToContext(canvas).putImageData(imageData, 0, 0);
  return canvas;
}

function canvasToContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  return ctx;
}