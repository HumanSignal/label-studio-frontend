import MediaInfo from "mediainfo.js/dist/mediainfo";

const getHeaders = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      range: "bytes=0-0",
    },
  });

  const range = response.headers.get("Content-Range") ?? "";

  const contentLength = parseInt(range.split("/")[1], 10);
  const contentType = response.headers.get("Content-Type");

  return { contentLength, contentType };
};

const getMedia = async (url: string) => {
  const headers = await getHeaders(url);

  // Limit body size by 100 kb or by the length of the file,
  // if it's smaller than the limit
  const maxLength = 1_500_000;

  const response = await fetch(url, {
    headers: {
      range: `bytes=${headers.contentLength - 500_000}-${headers.contentLength}`,
    },
  });

  const buffer = await response.arrayBuffer();

  const getSize = () => headers.contentLength;

  const readChunk = async (chunkSize: number, offset: number) => {
    const chunk = buffer.slice(offset, offset + chunkSize);

    return new Uint8Array(chunk);
  };

  return { getSize, readChunk };
};

export const readMedia = (url: string) => {
  const read = () => {
    return new Promise((resolve) => {
      MediaInfo({ format: "JSON" }, (mediainfo) => {
        getMedia(url).then(async ({ getSize, readChunk }) => {
          const output = {
            value: null,
            error: null,
          };

          try {
            const analyzed = await mediainfo.analyzeData(getSize, readChunk);

            output.value = JSON.parse(analyzed);
          } catch (err) {
            output.error = `An error occured:\n${err.stack}`;
          }

          resolve(output);
          console.log("finished");
        });
      }, (err) => {
        console.log('fail', err);
      });
    });
  };

  return {
    read,
  };
};
