/* global inject */
const { I } = inject();
const assert = require('assert');

const Helpers = require('../tests/helpers');

module.exports = {
  _stageSelector: '#waveform-layer-main',
  _progressBarSelector: 'loading-progress-bar',
  _controlMenuSelector: '.lsf-audio-control',
  _settingsMenuSelector: '.lsf-audio-config',
  _volumeSliderSelector: '.lsf-audio-slider__range',
  _volumeInputSelector: '.lsf-audio-slider__input',
  _muteButtonSelector: '.lsf-audio-control__mute-button',
  _playbackSpeedSliderSelector: '.lsf-audio-config__modal > .lsf-audio-slider:nth-child(1) .lsf-audio-slider__range',
  _playbackSpeedInputSelector: '.lsf-audio-config__modal > .lsf-audio-slider:nth-child(1) .lsf-audio-slider__input',
  _amplitudeSliderSelector: '.lsf-audio-config__modal > .lsf-audio-slider:nth-child(2) .lsf-audio-slider__range',
  _amplitudeInputSelector: '.lsf-audio-config__modal > .lsf-audio-slider:nth-child(2) .lsf-audio-slider__input',
  _hideTimelineButtonSelector: '.lsf-audio-config__buttons > .lsf-audio-config__menu-button:nth-child(1)',
  _hideWaveformButtonSelector: '.lsf-audio-config__buttons > .lsf-audio-config__menu-button:nth-child(2)',
  _audioElementSelector: '[data-testid="waveform-audio"]',
  _seekBackwardButtonSelector: '.lsf-audio-tag .lsf-timeline-controls__main-controls > .lsf-timeline-controls__group:nth-child(2) > button:nth-child(1)',
  _playButtonSelector: '.lsf-audio-tag .lsf-timeline-controls__main-controls > .lsf-timeline-controls__group:nth-child(2) > button:nth-child(2)',
  _seekForwardButtonSelector: '.lsf-audio-tag .lsf-timeline-controls__main-controls > .lsf-timeline-controls__group:nth-child(2) > button:nth-child(3)',
  _choiceSelector: '.lsf-choices.lsf-choices_layout_inline',

  _stageBbox: { x: 0, y: 0, width: 0, height: 0 },

  async lookForStage() {
    I.scrollPageToTop();
    const bbox = await I.grabElementBoundingRect(this._stageSelector);

    this._stageBbox = bbox;
  },
  async waitForAudio() {
    await I.executeScript(Helpers.waitForAudio);
    I.waitForInvisible(this._progressBarSelector);
  },
  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
  },
  /**
   * Mousedown - mousemove - mouseup drawing on the AudioView. Works in couple of lookForStage.
   * @example
   * await AtAudioView.lookForStage();
   * AtAudioView.dragAudioRegion(50, 200);
   * @param x {number}
   * @param shiftX {number}
   */
  dragAudioRegion(x, shiftX) {
    I.scrollPageToTop();
    I.moveMouse(this._stageBbox.x + x, this._stageBbox.y + this._stageBbox.height / 2);
    I.pressMouseDown();
    I.moveMouse(this._stageBbox.x + x + shiftX, this._stageBbox.y + this._stageBbox.height / 2, 3);
    I.pressMouseUp();
    I.wait(1);
  },

  clickAt(x) {
    I.scrollPageToTop();
    I.clickAt(this._stageBbox.x + x, this._stageBbox.y + this._stageBbox.height / 2);
    I.wait(1); // We gotta  wait here because clicks on the canvas are not processed immediately
  },

  toggleControlsMenu() {
    I.click(this._controlMenuSelector);
  },

  toggleSettingsMenu() {
    I.click(this._settingsMenuSelector);
  },

  async seeVolume(value) {
    this.toggleControlsMenu();
    I.seeInField(this._volumeInputSelector, value);
    I.seeInField(this._volumeSliderSelector, value);
    const volume = await I.grabAttributeFrom(this._audioElementSelector, 'volume');
    const muted = await I.grabAttributeFrom(this._audioElementSelector, 'muted');

    if (muted) {
      assert.equal(volume, null, 'Volume doesn\'t match in audio element');
    } else {
      assert.equal(volume, value / 100, 'Volume doesn\'t match in audio element');
    }
    this.toggleControlsMenu();
  },

  setVolumeInput(value) {
    this.toggleControlsMenu();
    I.fillField(this._volumeInputSelector, value);
    this.toggleControlsMenu();
  },

  async seePlaybackSpeed(value) {
    this.toggleSettingsMenu();

    I.seeInField(this._playbackSpeedInputSelector, value);
    I.seeInField(this._playbackSpeedSliderSelector, value);
    const playbackSpeed = await I.grabAttributeFrom(this._audioElementSelector, 'playbackRate');

    assert.equal(playbackSpeed, value, 'Playback speed doesn\'t match in audio element');

    this.toggleSettingsMenu();
  },

  setPlaybackSpeedInput(value) {
    this.toggleSettingsMenu();
    I.fillField(this._playbackSpeedInputSelector, value);
    this.toggleSettingsMenu();
  },

  async seeAmplitude(value) {
    this.toggleSettingsMenu();

    I.seeInField(this._amplitudeInputSelector, value);
    I.seeInField(this._amplitudeSliderSelector, value);

    this.toggleSettingsMenu();
  },

  setAmplitudeInput(value) {
    this.toggleSettingsMenu();
    I.fillField(this._amplitudeInputSelector, value);
    this.toggleSettingsMenu();
  },

  clickMuteButton() {
    this.toggleControlsMenu();
    I.click(this._muteButtonSelector);
    this.toggleControlsMenu();
  },

  clickPlayButton() {
    I.click(this._playButtonSelector);
  },

  clickPauseButton() {
    I.click(this._playButtonSelector);
  },

  async dontSeeGhostRegion() {
    const selectedChoice = await I.grabTextFrom(this._choiceSelector);

    assert.equal(selectedChoice, 'Positive');
  },

  async seeIsPlaying(playing) {
    const isPaused = await I.grabAttributeFrom(this._audioElementSelector, 'paused');

    assert.equal(!isPaused, playing, 'Audio is not playing');
  },
};
