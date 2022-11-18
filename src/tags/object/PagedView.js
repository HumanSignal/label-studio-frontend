import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { isAlive, types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Types from "../../core/Types";
import Tree from "../../core/Tree";
import { Pagination } from "../../common/Pagination/Pagination";
import { Hotkey } from "../../core/Hotkey";
import { FF_DEV_1170, isFF } from "../../utils/feature-flags";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

const Model = types.model({
  id: types.identifier,
  type: "pagedview",
  hydrated: false,
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
})
  .actions(self => ({
    setHydrated(hydrated) {
      self.hydrated = hydrated;
    },
    addChild(child) {
      if (isAlive(self)) {
        self.children.push(child);
      }
    },
  }));
const PagedViewModel = types.compose("PagedViewModel", Model, AnnotationMixin);
const hotkeys = Hotkey("Repeater");
const DEFAULT_PAGE_SIZE = 1;
const PAGE_SIZE_OPTIONS = [1, 5, 10, 25, 50, 100];

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

const getQueryPage = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  if (page) {
    return parseInt(page);
  }

  return 1;
};

const updateQueryPage = page => {
  const params = new URLSearchParams(window.location.search);

  params.set("page", page.toString());
  window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
};

const HtxPagedView = observer(({ item }) => {
  const [page, _setPage] = useState(getQueryPage);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const setPage = useCallback((_page) => {
    _setPage(_page);
    updateQueryPage(_page);
  },[]);

  const totalPages = useMemo(() => item.hydrated ?  Math.ceil(item.children.length / pageSize) : 1, [item.hydrated, pageSize]);

  useEffect(() => {
    setPageSize(getStoredPageSize('repeater', DEFAULT_PAGE_SIZE));
  }, []);

  useEffect(() => {
    if (!item.hydrated) return;

    const last = item.annotation.lastSelectedRegion;

    if (last) {
      const _pageNumber = parseFloat(last.object.name.split('_')[1]) + 1;

      setPage(Math.ceil(_pageNumber / pageSize));
    }
  }, [item.hydrated, item.annotation.lastSelectedRegion]);

  useEffect(() => {
    if (!item.hydrated) return;
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
  }, [item.hydrated, page]);

  const renderPage = useCallback(() => {
    const pageView = [];

    for (let i = 0; i < pageSize; i++) {
      pageView.push(Tree.renderChildren(item.children[i + (pageSize * (page - 1))], item.annotation));
    }

    return pageView;
  }, [item.hydrated, page, pageSize]);

  return (
    <div className={!item.hydrated ? "lsf-pagedview__loading" : ""}>
      {renderPage()}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={ PAGE_SIZE_OPTIONS }
        pageSizeSelectable={false}
        size={"medium"}
        onChange={(page, maxPerPage = pageSize) => {
          item.annotation.unselectAll();
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

Registry.addTag("pagedview", PagedViewModel, HtxPagedView);

export { HtxPagedView, PagedViewModel };

