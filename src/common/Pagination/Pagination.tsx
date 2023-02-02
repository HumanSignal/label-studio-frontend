import {
  ChangeEvent,
  FC,
  forwardRef,
  KeyboardEvent,
  useState
} from 'react';
import { Block, Elem } from '../../utils/bem';
import './Pagination.styl';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  pageSizeOptions?: [];
  pageSizeSelectable: boolean;
  outline?: boolean;
  align?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  noPadding?: boolean;
  onChange?: (pageNumber: number, maxPerPage?: number | string) => void;
}

const isSystemEvent = (e: KeyboardEvent<HTMLInputElement>): boolean => {
  return (
    (e.code.match(/arrow/i) !== null) ||
    (e.shiftKey && e.code.match(/arrow/i) !== null) ||
    (e.metaKey || e.ctrlKey || e.code === 'Backspace')
  );
};

export const Pagination: FC<PaginationProps> = forwardRef<any, PaginationProps>(({
  size = 'medium',
  pageSizeOptions = [1, 25, 50, 100],
  currentPage,
  pageSize,
  totalPages,
  outline = true,
  align = 'right',
  noPadding = false,
  pageSizeSelectable = true,
  onChange,
}) => {
  const [inputMode, setInputMode] = useState(false);

  const handleChangeSelect = (e:ChangeEvent<HTMLSelectElement>) => {
    onChange?.(1, e.currentTarget.value);
  };

  const renderOptions = () => {
    return pageSizeOptions.map((obj: number, index: number) => {
      return <option value={obj} key={index}>{obj} per page</option>;
    });
  };

  return (
    <Block name="pagination" mod={{ size, outline, align, noPadding }}>
      <Elem name="navigation">
        <>
          <NavigationButton
            mod={['arrow-left', 'arrow-left-double']}
            onClick={() => onChange?.(1)}
            disabled={currentPage === 1}
          />
          <Elem name="divider" />
        </>
        <NavigationButton
          mod={['arrow-left']}
          onClick={() => onChange?.(currentPage - 1)}

          disabled={currentPage === 1}
        />
        <Elem name="input">
          {inputMode ? (
            <input
              type="text"
              autoFocus
              defaultValue={currentPage}
              pattern="[0-9]"
              onKeyDown={(e) => {
                const _value = parseFloat(e.currentTarget.value);

                if (e.code === 'Escape') {
                  setInputMode(false);
                } else if (e.code === 'Enter') {
                  if (_value <= totalPages && _value >= 1) {
                    onChange?.(_value);
                  }

                  setInputMode(false);
                } else if (e.code.match(/[0-9]/) === null && !isSystemEvent(e)) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onBlur={(e) => {
                const _value = parseFloat(e.currentTarget.value);

                if (_value <= totalPages && _value >= 1) {
                  onChange?.(_value);
                }

                setInputMode(false);
              }}
            />
          ) : (
            <Elem
              name="page-indicator"
              onClick={() => {
                setInputMode(true);
              }}
            >
              {currentPage}{' '}<span>of {totalPages}</span>
              <div onClick={() => { /*  */ }}></div>
            </Elem>
          )}
        </Elem>
        <NavigationButton
          mod={['arrow-right']}
          onClick={() => onChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <>
          <Elem name="divider" />
          <NavigationButton
            mod={['arrow-right', 'arrow-right-double']}
            onClick={() => onChange?.(totalPages)}
            disabled={currentPage === totalPages}
          />
        </>
      </Elem>
      {pageSizeSelectable && (
        <Elem name="page-size">
          <select value={pageSize} onChange={handleChangeSelect}>
            {renderOptions()}
          </select>
        </Elem>
      )}
    </Block>
  );
});

const NavigationButton: FC<{
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void,
  mod: string[],
  disabled?: boolean,
}> = (props) => {
  const mod = Object.fromEntries(props.mod.map(m => [m, true]));

  mod.disabled = props.disabled === true;

  return (
    <Elem name="btn" mod={mod} onClick={props.onClick}/>
  );
};
