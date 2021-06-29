import { Menu } from "antd";
import { observer } from "mobx-react";
import { CalendarOutlined, ThunderboltOutlined } from "@ant-design/icons";

export const SortMenu = observer(({ regionStore }) => {
  return (
    <Menu selectedKeys={[regionStore.sort]}>
      <Menu.Item key="date">
        <div
          onClick={ev => {
            regionStore.setSort("date");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <span>
            <CalendarOutlined /> Date
          </span>
          <span>{regionStore.sort === "date" && (regionStore.sortOrder === "asc" ? "↓" : "↑")}</span>
        </div>
      </Menu.Item>
      <Menu.Item key="score">
        <div
          onClick={ev => {
            regionStore.setSort("score");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <span>
            <ThunderboltOutlined /> Score
          </span>
          <span>{regionStore.sort === "score" && (regionStore.sortOrder === "asc" ? "↓" : "↑")}</span>
        </div>
      </Menu.Item>
    </Menu>
  );
});
