import React, { useEffect, useState } from "react";
import Konva from "konva";
import { Image } from "react-konva";

// Adapter from: https://github.com/konvajs/use-image/blob/master/index.js
const useImage = (url, crossOrigin, onLoad, onError) => {
  var defaultState = { image: undefined, status: 'loading' };
  var [res, setRes] = useState(defaultState);

  useEffect(
    () => {
      if (!url) return;
      var img = document.createElement('img');

      function onLoadWrapper(e) {
        setRes({ image: img, status: 'loaded' });
        onLoad(e);
      }

      function onErrorWrapper() {
        setRes({ image: undefined, status: 'failed' });
        onError();
      }

      img.addEventListener('load', onLoadWrapper);
      img.addEventListener('error', onErrorWrapper);

      // https://konvajs.org/docs/posts/Tainted_Canvas.html
      crossOrigin && (img.crossOrigin = crossOrigin);
      // CORS error: https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome
      const fixedUrl = `${url.toString()}?time=${Date.now().toString()}`;

      img.src = fixedUrl;

      return function cleanup() {
        img.removeEventListener('load', onLoadWrapper);
        img.removeEventListener('error', onErrorWrapper);
        setRes(defaultState);
      };
    },
    [url, crossOrigin],
  );

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
  const [image, status] = useImage(url, crossOrigin || 'anonymous', onLoad, onError);

  // const getBase64 = async (url) => {
  //   try {
  //     let image = await axios.get(url, { responseType: 'arraybuffer' });
  //     let raw = Buffer.from(image.data).toString('base64');

  //     return "data:" + image.headers["content-type"] + ";base64," + raw;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // when image is loaded we need to cache the shape
  React.useEffect(() => {
    console.log("image changed, val: " + image);
    if (image) {
      // you many need to reapply cache on some props changes like shadow, stroke, etc.
      console.log("Cache image: " + image);
      console.log("Image loaded: " + image.complete);
      imageRef.current.cache();
      //imageRef.current.getLayer().draw();
    }
  }, [image]);

  React.useEffect(() => {
    console.log(status);
  }, [status]);

  return (
    <>
      {url !== undefined && image !== undefined && (
        <Image
          ref={imageRef}
          x={0}
          y={0}
          image={image}
          filters={filters || [Konva.Filters.Grayscale]}
          {...props}
        />
      )}
    </>
  );
};

export default FilterImage;