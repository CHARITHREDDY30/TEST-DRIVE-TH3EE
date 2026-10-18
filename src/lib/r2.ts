import React from 'react';

export const DEFAULT_R2_PUBLIC_BASE_URL = "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev";
export const GLOBAL_DEFAULT_IMAGE = "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png";

export function getR2PublicBaseUrl(): string {
  const envUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_R2_PUBLIC_BASE_URL : undefined;
  return (envUrl && envUrl.trim() !== "") ? envUrl.trim() : DEFAULT_R2_PUBLIC_BASE_URL;
}

export function resolveProductImageUrl(imageRef?: string | null): string {
  if (!imageRef || typeof imageRef !== "string" || imageRef.trim() === "") {
    return GLOBAL_DEFAULT_IMAGE;
  }
  const cleanRef = imageRef.trim();

  if (
    cleanRef.indexOf("http://") === 0 || 
    cleanRef.indexOf("https://") === 0 || 
    cleanRef.indexOf("data:") === 0 || 
    cleanRef.indexOf("blob:") === 0
  ) {
    return cleanRef;
  }

  let relativePath = cleanRef.replace(/^\/+/, "");

  const knownTshirtsFiles = [
    "IMg 1.jpeg", "img 2.jpeg", "img 4.jpeg", "img 5.jpeg", "img 6.jpeg", "img3.jpeg",
    "21.jpeg", "22.jpeg", "23.jpeg", "24.jpeg", "25.jpeg", "27.jpeg", "29.jpeg"
  ];
  if (relativePath.indexOf("/") === -1 && knownTshirtsFiles.indexOf(relativePath) !== -1) {
    relativePath = "tshirts/" + relativePath;
  }

  const encodedSegments = relativePath.split("/").map(function(seg) {
    return encodeURIComponent(decodeURIComponent(seg));
  });

  return getR2PublicBaseUrl().replace(/\/+$/, "") + "/" + encodedSegments.join("/");
}

export function handleImageLoadError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target && target.src && target.src !== GLOBAL_DEFAULT_IMAGE) {
    target.src = GLOBAL_DEFAULT_IMAGE;
  }
}
