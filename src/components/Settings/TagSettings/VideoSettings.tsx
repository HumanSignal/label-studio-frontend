import Input from "antd/lib/input/Input";
import { observer } from "mobx-react-lite";
import { Settings } from "./Types";


const VideoSettingsPure: Settings = ({ store }) => {
  return (
    <>
      <label>
        Video Hop Size
        <Input
          placeholder="Video Hop Size"
          min={1}
          max={100}
          type="number"
          value={store.settings.videoHopSize}
          onChange={e => store.settings.setVideoHopSize(Number(e.target.value))}
        />
      </label>
    </>
  );
};

VideoSettingsPure.displayName = "VideoSettings";
VideoSettingsPure.tagName = "Video";
VideoSettingsPure.title = "Video";

export const VideoSettings = observer(VideoSettingsPure);
