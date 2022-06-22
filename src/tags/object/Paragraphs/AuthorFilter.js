import { observer } from "mobx-react";
import { useMemo } from "react";
import { Select } from "../../../common/Select/Select";
import styles from "./Paragraphs.module.scss";

const selectStyle = {
  backgroundColor: "#FFFFFF",
};
const dropdownStyle = {
  borderRadius: "4px",
  marginTop: "4px",
};

export const AuthorFilter = observer(({ item }) => {
  const value = item.filterByAuthor.slice();
  const options = useMemo(() => item._value.reduce((all, v) => all.includes(v[item.namekey]) ? all : [...all, v[item.namekey]], []).sort(), [item._value, item.namekey]);
  const filteredOptions = item.searchAuthor ? options.filter(o => o.toLowerCase().includes(item.searchAuthor.toLowerCase())) : options;

  return (
    <div className={styles.authorFilter}>
      <Select style={selectStyle} placeholder={<span className={styles.authorFilter__placeholder}>Show all authors</span>} value={value} options={options} onChange={(next) => {
        item.setAuthorFilter(!next || next?.includes(null) ? []: next);
      }} size="compact" dropdownStyle={dropdownStyle} multiple>
        <div className={styles.authorFilter__search}>
          <input
            autoComplete="off"
            className={styles.authorFilter__search__input}
            name="search_author"
            placeholder="Search"
            onInput={(e) => item.setAuthorSearch(e.target.value)}
          />
        </div>
        <Select.Option value={null} key="showAllAuthors" exclude>
            Show all authors
        </Select.Option>
        {filteredOptions.map(name => (
          <Select.Option value={name} key={name}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
});