"use client";

import React, { useMemo, useEffect, useRef } from "react";

export function dataUrlToBlobUrl(dataUrl: string): string {
  try {
    const [header, base64] = dataUrl.split(",");
    if (!base64) return dataUrl;
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return dataUrl;
  }
}

export function useSafeUrl(src: string): string {
  const displayUrl = useMemo(() => {
    if (!src) return "";
    if (src.startsWith("data:")) return dataUrlToBlobUrl(src);
    return src;
  }, [src]);

  const prevUrlRef = useRef("");

  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== displayUrl && prevUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = displayUrl;
  }, [displayUrl]);

  return displayUrl;
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: React.ReactNode;
}

export const SafeImage = ({ src, fallback, ...props }: SafeImageProps) => {
  const displayUrl = useSafeUrl(src);

  if (!displayUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return <img {...props} src={displayUrl} />;
};
