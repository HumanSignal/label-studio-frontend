import { CSSProperties, FC } from 'react';
import { Block } from 'src/utils/bem';

type LoadingIndicatorProps = {
  className?: string,
  size?: 'small' | 'large',
  color?: string,
  style?: CSSProperties,
}

export const LoadingIndicator: FC<LoadingIndicatorProps> = (props) => {
  const {
    className,
    size = 'small',
    color = '#000',
    style,
  } = props;

  return (
    <Block name="loading" aria-label="loading-indicator" className={className} style={style}>
      <svg
        width={size === 'small' ? 16 : 32}
        height={size === 'small' ? 16 : 32}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        stroke={color}
      >
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>
      </svg>
    </Block>
  );
};
