import { types } from 'mobx-state-tree';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ParagraphsModel } from '../model';

jest.mock('../../../../regions/ParagraphsRegion', () => ({}));

const MockStore = types
  .model({
    paragraphs: ParagraphsModel,
  })
  .volatile(() => ({
    task: { dataObj: {} },
    annotationStore: { addErrors: jest.fn() },
  }));

const phrases = [
  {
    author: 'Cheshire Cat',
    text: 'We\'re all mad here. I\'m mad. You\'re mad.',
    start: 1.2,
    end: 2.5,
  },
  {
    author: 'Alice',
    text: 'How do you know I\'m mad?',
    start: 3.2,
    duration: 1.5,
  },
  {
    author: 'Cheshire Cat',
    text: 'You must be, or you wouldn\'t have come here.',
    start: 6,
  },
];

describe('Paragraphs phrases', () => {
  // creating models can be a long one, so all tests will share one model
  const model = ParagraphsModel.create({ name: 'phrases', value: '$phrases' });
  const store = MockStore.create({ paragraphs: model });
  const duration = 10;

  store.task.dataObj = { phrases };
  model.updateValue(store);
  model.handleAudioLoaded({ target: { duration } });

  it('should update value from task', () => {
    expect(model._value).toEqual(phrases);
  });

  it('should calculate phrases times', () => {
    const expected = [
      {
        start: 1.2,
        end: 2.5,
      },
      {
        start: 3.2,
        end: 4.7,
      },
      {
        start: 6,
        end: duration,
      },
    ];

    expect(model.regionsStartEnd).toEqual(expected);
  });

  it('should detect phrase id by time', () => {
    expect(model.regionIdxByTime(1)).toEqual(-1);
    expect(model.regionIdxByTime(2)).toEqual(0);
    expect(model.regionIdxByTime(3)).toEqual(-1);
    expect(model.regionIdxByTime(4)).toEqual(1);
    expect(model.regionIdxByTime(5)).toEqual(-1);
    expect(model.regionIdxByTime(6)).toEqual(2);
    expect(model.regionIdxByTime(7)).toEqual(2);
  });
});
