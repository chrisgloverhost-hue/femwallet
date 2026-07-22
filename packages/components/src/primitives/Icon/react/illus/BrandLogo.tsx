import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgBrandLogo = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 27 27" accessibilityRole="image" {...props}>
    {/* Green circle background */}
    <Path
      fill="#44D62C"
      d="M27 13.5C27 22.82 22.82 27 13.5 27S0 22.82 0 13.5 4.18 0 13.5 0 27 4.18 27 13.5"
    />
    {/* F lettermark */}
    <Path
      fill="#000"
      d="M7.5 6h11.5v3H11v3h5v3H11v6H7.5Z"
    />
  </Svg>
);
export default SvgBrandLogo;
