import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgOnekey = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 24 24" accessibilityRole="image" {...props}>
    {/* Green circle background */}
    <Path
      fill="#44D62C"
      d="M23 12c0 7.594-3.406 11-11 11S1 19.594 1 12 4.406 1 12 1s11 3.406 11 11"
    />
    {/* F lettermark */}
    <Path
      fill="#000"
      d="M6.7 5.3h10.2v2.7H9.8v2.7h4.4v2.7H9.8v5.3H6.7Z"
    />
  </Svg>
);
export default SvgOnekey;
