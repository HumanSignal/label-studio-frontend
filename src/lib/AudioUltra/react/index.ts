import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Waveform, WaveformOptions } from "../Waveform";
import { Layer } from "../Visual/Layer";
import { AudioModel } from "../../../tags/object";

export const useWaveform = (
  containter: MutableRefObject<HTMLElement | null | undefined>,
  options: Omit<WaveformOptions, "container"> & { onLoad?: (wf: Waveform) => void },
  item: AudioModel,
) => {
  const waveform = useRef<Waveform>();

  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [amp, setAmp] = useState(1);
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [layerVisibility, setLayerVisibility] = useState(new Map());


  useEffect(() => {
    const wf = new Waveform({
      ...(options ?? {}),
      container: containter.current!,
    });

    waveform.current = wf;

    wf.load();

    wf.on("load", () => {
      setDuration(item?.duration ?? wf.duration);
      options?.onLoad?.(wf);
    });

    wf.on("play", () => {
      if (!playing) {
        item?.triggerSyncPlay();
      }
    });
    wf.on("pause", () => {
      if (playing) {
        item?.triggerSyncPause();
      }
    });
    
    /* between here and ... */
    wf.on("playing", (time: number) => {
      console.log("playing", playing, time);
      if(playing) {
        item?.triggerSyncSeek(time);
      }
      setCurrentTime(time);
    });
    wf.on("seek", (time: number) => {
      item?.triggerSyncSeek(time);
      setCurrentTime(time);
    });
    /* here - this can cause issues issues when playing selected region in audio */

    wf.on("zoom", setZoom);
    wf.on("muted", setMuted);
    wf.on("volumeChange", setVolume);
    wf.on("rateChanged", setRate);
    wf.on("layersUpdated", (layers) => {
      const layersArray = [];
      const layerVis = new Map();

      for (const layer of layers.values()) {
        layersArray.push(layer);
        layerVis.set(layer.name, layer.isVisible);
      }
      setLayers(layersArray);
      setLayerVisibility(layerVis);
    });

    return () => {
      wf.destroy();
    };
  }, []);

  useEffect(() => {
    const wf = waveform.current;

    if (wf && wf.loaded) {
      wf.zoom = zoom;
    }
  }, [zoom]);

  useEffect(() => {
    const wf = waveform.current;

    if (wf && wf.loaded) {
      wf.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const wf = waveform.current;

    if (wf && wf.loaded) {
      wf.rate = rate;
    }
  }, [rate]);

  useEffect(() => {
    const wf = waveform.current;

    if (wf && wf.loaded) {
      wf.amp = amp;
    }
  }, [amp]);

  useEffect(() => {
    if (playing) {
      item?.triggerSyncPlay();
    } else {
      item?.triggerSyncPause();
    }
  }, [playing]);

  useEffect(() => {
    if (waveform.current) {
      waveform.current.muted = muted;
    }
  }, [muted]);

  return {
    waveform,
    zoom,
    setZoom,
    volume,
    setVolume,
    playing,
    setPlaying,
    duration,
    currentTime,
    setCurrentTime,
    amp,
    setAmp,
    rate,
    setRate,
    muted,
    setMuted,
    layers,
    layerVisibility,
  };
};
