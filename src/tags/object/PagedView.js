import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Types from "../../core/Types";
import Tree from "../../core/Tree";
import { Pagination } from "../../common/Pagination/Pagination";
import { Hotkey } from "../../core/Hotkey";
import { FF_DEV_1170, isFF } from "../../utils/feature-flags";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

const Model = types.model({
  type: "pagedview",
  children: Types.unionArray([
    "view",
    "header",
    "labels",
    "label",
    "table",
    "taxonomy",
    "choices",
    "choice",
    "collapse",
    "datetime",
    "number",
    "rating",
    "ranker",
    "rectangle",
    "ellipse",
    "polygon",
    "keypoint",
    "brush",
    "rectanglelabels",
    "ellipselabels",
    "polygonlabels",
    "keypointlabels",
    "brushlabels",
    "hypertextlabels",
    "timeserieslabels",
    "text",
    "audio",
    "image",
    "hypertext",
    "richtext",
    "timeseries",
    "audioplus",
    "list",
    "dialog",
    "textarea",
    "pairwise",
    "style",
    "label",
    "relations",
    "filter",
    "timeseries",
    "timeserieslabels",
    "pagedview",
    "paragraphs",
    "paragraphlabels",
    "video",
    "videorectangle",
  ]),
});
const PagedViewModel = types.compose("PagedViewModel", Model, AnnotationMixin);
const hotkeys = Hotkey("Repeater");
const DEFAULT_PAGE_SIZE = 1;
const PAGE_SIZE_OPTIONS = [1, 5, 10, 25, 50, 100];

const HtxPagedView = observer(({ item }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.ceil(item.children.length / pageSize);

  useEffect(() => {
    setPageSize(getStoredPageSize('repeater', DEFAULT_PAGE_SIZE));
  }, []);

  useEffect(() => {
    item.annotation.regions.map((obj) => {
      if (obj.selected) {
        const _pageNumber = parseFloat(obj.object.name.split('_')[1]) + 1;

        setPage(Math.ceil(_pageNumber / pageSize));
      }
    });
  }, [JSON.stringify(item)]);

  useEffect(() => {
    if (isFF(FF_DEV_1170)) {
      document.querySelector('.lsf-sidepanels__content')?.scrollTo(0, 0);
    } else {
      document.querySelector('#label-studio-dm')?.scrollTo(0, 0);
    }

    setTimeout(() => {
      hotkeys.addNamed("repeater:next-page", () => {
        if (page < totalPages) {
          setPage(page + 1);
        }
      });

      hotkeys.addNamed("repeater:previous-page", () => {
        if (page > 1) {
          setPage(page - 1);
        }
      });
    });

    return () => {
      hotkeys.removeNamed("repeater:next-page");
      hotkeys.removeNamed("repeater:previous-page");
    };
  }, [page]);

  const renderPage = () => {
    const pageView = [];

    for (let i = 0; i < pageSize; i++) {
      pageView.push(Tree.renderChildren(item.children[i + (pageSize * (page - 1))]));
    }

    return pageView;
  };

  return (
    <div>
      {renderPage()}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={ PAGE_SIZE_OPTIONS }
        pageSizeSelectable={false}
        size={"medium"}
        onChange={(page, maxPerPage = pageSize) => {
          setPage(page);
          if (maxPerPage !== pageSize) {
            setStoredPageSize('repeater', maxPerPage);
            setPageSize(maxPerPage);
          }
        }}
      />
    </div>
  );
});

const getStoredPageSize = (name, defaultValue) => {
  const value = localStorage.getItem(`pages:${name}`);

  if (value) {
    return parseInt(value);
  }

  return defaultValue ?? undefined;
};

const setStoredPageSize = (name, pageSize) => {
  localStorage.setItem(`pages:${name}`, pageSize.toString());
};

Registry.addTag("pagedview", PagedViewModel, HtxPagedView);

export { HtxPagedView, PagedViewModel };

