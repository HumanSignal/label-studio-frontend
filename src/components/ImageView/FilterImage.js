import React, { useEffect, useState } from "react";
import Konva from "konva";
import { Image } from "react-konva";

Konva.pixelRatio = 1;

// Adapter from: https://github.com/konvajs/use-image/blob/master/index.js
const useImage = (url, crossOrigin, onLoad, onError) => {
  const defaultState = { image: undefined, status: "loading" };
  const [res, setRes] = useState(defaultState);

  useEffect(() => {
    if (!url) return;
    const img = document.createElement("img");

    function onLoadWrapper(e) {
      setRes({ image: img, status: "loaded" });
      if (onLoad) onLoad(e);
    }

    function onErrorWrapper() {
      setRes({ image: undefined, status: "failed" });
      if (onError) onError();
    }

    img.addEventListener("load", onLoadWrapper);
    img.addEventListener("error", onErrorWrapper);

    // https://konvajs.org/docs/posts/Tainted_Canvas.html
    crossOrigin && (img.crossOrigin = crossOrigin);

    const urlObject = new URL(url);

    // CORS error: https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome
    urlObject.searchParams.set('time', Date.now().toString());
    const fixedUrl = urlObject.toString();

    img.src = fixedUrl;

    return function cleanup() {
      img.removeEventListener("load", onLoadWrapper);
      img.removeEventListener("error", onErrorWrapper);
      setRes(defaultState);
    };
  }, [url, crossOrigin]);

  // return array because it it better to use in case of several useImage hooks
  // const [background, backgroundStatus] = useImage(url1);
  // const [patter] = useImage(url2);
  return [res.image, res.status];
};

// Examples:
// https://codesandbox.io/s/jzj9o60m3v?file=/index.js:0-311
// https://konvajs.org/docs/react/Filters.html
export const FilterImage = ({ url, crossOrigin, onLoad, onError, filters, ...props }) => {
  const imageRef = React.useRef();

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin
  const [image, status] = useImage(url, crossOrigin || "anonymous", onLoad, onError);

  // when image is loaded we need to cache the shape
  React.useEffect(() => {
    if (image) {
      // you many need to reapply cache on some props changes like shadow, stroke, etc.
      imageRef.current.cache();
      //imageRef.current.getLayer().draw();
    }
  }, [image]);

  React.useEffect(() => {
    // Status callback
    //console.log(status);
  }, [status]);

  return (
    <>
      {url !== undefined && image !== undefined && (
        <Image ref={imageRef} x={0} y={0} image={image} filters={filters} {...props} />
      )}
    </>
  );
};

export default FilterImage;
