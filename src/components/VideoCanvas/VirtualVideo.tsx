import { DetailedHTMLProps, forwardRef, useCallback, useEffect, useRef, VideoHTMLAttributes } from 'react';
import InfoModal from '../../components/Infomodal/Infomodal';


type VirtualVideoProps = DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement> & {
  canPlayType?: (supported: boolean) => void,
};

const DEBUG_MODE = false;

const canPlayUrl = async (url: string) => {
  const video = document.createElement('video');

  const fileMeta = await fetch(url, {
    method: 'GET',
    headers: {
      'Range': 'bytes=0-0',
    },
  });

  const fileType = fileMeta.headers.get('content-type');
  const supported = !!fileType && video.canPlayType(fileType) !== '';
  const modalExists = document.querySelector('.ant-modal');

  if (!supported && !modalExists) InfoModal.error('There has been an error rendering your video, please check the format is supported');
  return supported;
};

export const VirtualVideo = forwardRef<HTMLVideoElement, VirtualVideoProps>((props, ref) => {
  const video = useRef<HTMLVideoElement | null>(null);
  const source = useRef<HTMLSourceElement | null>(null);
  const attachedEvents = useRef<[string, any][]>([]);

  const canPlayType = useCallback(async (url: string) => {
    let supported = false;

    if (url) {
      supported = await canPlayUrl(url);
    }

    if (props.canPlayType) {
      props.canPlayType(supported);
    }
    return supported;
  }, [props.canPlayType]);

  const createVideoElement = useCallback(() => {
    const videoEl = document.createElement('video');

    videoEl.muted = !!props.muted;
    videoEl.controls = false;
    videoEl.preload = 'auto';

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

  const attachRef = useCallback((video: HTMLVideoElement | null) => {
    if (ref instanceof Function) {
      ref(video);
    } else if (ref) {
      ref.current = video;
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

    attachedEvents.current = attached;
  };

  const detachEventListeners = () => {
    if (!video.current) return;

    (attachedEvents.current ?? []).forEach(([evt, handler]) => {
      video.current?.removeEventListener(evt, handler);
    });

    attachedEvents.current = [];
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

    sourceEl.setAttribute('src', props.src ?? '');
    video.current?.appendChild(sourceEl);

    source.current = sourceEl;
  }, [props.src]);

  useEffect(() => {
    detachEventListeners();
    attachEventListeners();
  });

  // Create a video tag
  useEffect(() => {
    createVideoElement();
    attachEventListeners();
    canPlayType(props.src ?? '');
    attachSource();
    attachRef(video.current);

    document.body.append(video.current!);
  }, []);

  // Handle video cleanup
  useEffect(() => () => {
    detachEventListeners();
    unloadSource();
    attachRef(null);
    video.current?.remove();
    video.current = null;
  }, []);

  return null;
});
