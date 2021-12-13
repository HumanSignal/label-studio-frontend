import { DetailedHTMLProps, forwardRef, useCallback, useEffect, useRef, useState, VideoHTMLAttributes } from "react";

type VirtualVideoProps = DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;

const DEBUG_MODE = false;

export const VirtualVideo = forwardRef<HTMLVideoElement, VirtualVideoProps>((props, ref) => {
  const video = useRef<HTMLVideoElement | null>(null);
  const source = useRef<HTMLSourceElement | null>(null);
  const attachedEvets = useRef<[string, any][]>([]);

  const createVideoElement = useCallback(() => {
    const videoEl = document.createElement('video');

    videoEl.muted = !!props.muted;
    videoEl.controls = false;
    videoEl.preload = "auto";

    Object.assign(videoEl.style, {
      top: '-9999px',
      width: 0,
      height: 0,
      position: 'absolute',
    });

    if (DEBUG_MODE) {
      Object.assign(videoEl.style, {
        top: 0,
        zIndex: 10000,
        width: '200px',
        height: '200px',
        position: 'absolute',
      });
    }

    video.current = videoEl;
  }, []);

  const attachRef = useCallback(() => {
    if (ref instanceof Function) {
      ref(video.current);
    } else if (ref) {
      ref.current = video.current;
    }
  }, []);

  const attachEventListeners = () => {
    const eventHandlers = Object
      .entries(props)
      .filter(([key]) => key.startsWith('on'))
      .map(([evt, handler]) => [evt.toLowerCase(), handler]);

    const attached: [string, any][] = [];

    eventHandlers.forEach(([evt, handler]) => {
      const evtName = evt.replace(/^on/, '');

      video.current?.addEventListener(evtName, handler);
      attached.push([evtName, handler]);
    });

    attachedEvets.current = attached;
  };

  const detachEventListeners = () => {
    if (!video) return;

    (attachedEvets.current ?? []).forEach(([evt, handler]) => {
      video.current?.removeEventListener(evt, handler);
    });

    attachedEvets.current = [];
  };

  const unloadSource = () => {
    if (source && video) {
      video.current?.pause();
      source.current?.setAttribute('src', '');
      video.current?.load();
      video.current = null;
    }
  };

  const attachSource = useCallback(() => {
    if (!video.current) return;

    video.current?.pause();

    if (source.current) unloadSource();

    const sourceEl = document.createElement('source');

    sourceEl.setAttribute('src', props.src ?? "");
    video.current?.appendChild(sourceEl);

    source.current = sourceEl;

  }, [props.src]);

  useEffect(() => {
    detachEventListeners();
    attachEventListeners();
  }, [props, video]);

  // Create a video tag
  useEffect(() => {
    createVideoElement();
    attachEventListeners();
    attachSource();
    attachRef();

    document.body.append(video.current!);
  }, []);

  // Handle video cleanup
  useEffect(() => () => {
    detachEventListeners();
    unloadSource();
    video?.current?.remove();
    video.current = null;
  }, []);

  return null;
});
