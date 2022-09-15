import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Waveform, WaveformOptions } from "../Waveform";

export const useWaveform = (
  containter: MutableRefObject<HTMLElement | null | undefined>,
  options: Omit<WaveformOptions, "container">,
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


  useEffect(() => {
    const wf = new Waveform({
      ...(options ?? {}),
      container: containter.current!,
    });

    waveform.current = wf;

    wf.load();

    wf.on("load", () => {
      setDuration(wf.duration);
    });

    wf.on("play", () => setPlaying(true));
    wf.on("pause", () => setPlaying(false));
    wf.on("playing", setCurrentTime);
    wf.on("seek", setCurrentTime);
    wf.on("zoom", setZoom);
    wf.on("muted", setMuted);
    wf.on("volumeChange", setVolume);
    wf.on("rateChanged", setRate);

    Object.assign(window, { wf });

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
      waveform.current?.play();
    } else {
      waveform.current?.pause();
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
  };
};
