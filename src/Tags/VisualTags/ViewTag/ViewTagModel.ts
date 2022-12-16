import { FC } from 'react';
import { BaseVisualTagModel } from 'src/Tags/Base/BaseVisualTag/BaseVisualTagModel';

export class ViewTagModel extends BaseVisualTagModel {
  private view: FC;

  constructor(view: FC) {
    super();
    this.view = view;
  }

  getView() {
    return this.view;
  }
}
