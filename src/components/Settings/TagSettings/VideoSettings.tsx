import VideoProperties from '../../../core/settings/videosettings';
import { SettingsRenderer } from './SettingsRenderer';
import { Settings } from './Types';

export const VideoSettings: Settings = ({ store }) => {
  return (
    <SettingsRenderer
      store={store}
      settings={VideoProperties}
    />
  );
};

VideoSettings.displayName = 'VideoSettings';
VideoSettings.tagName = 'Video';
VideoSettings.title = 'Video';
