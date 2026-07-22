import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgOnekeyLogo = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 28 28" accessibilityRole="image" {...props}>
    <G clipPath="url(#clip0_fem_logo)">
      {/* Green circle background */}
      <Path
        fill="#44D62C"
        d="M27.91 13.955c0 9.634-4.321 13.955-13.955 13.955S0 23.589 0 13.955 4.321 0 13.955 0 27.91 4.321 27.91 13.955"
      />
      {/* F lettermark */}
      <Path
        fill="#000"
        d="M7.8 6.2h11.9v3.1H11.4v3.1h5.2v3.1H11.4v6.2H7.8Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_fem_logo">
        <Path fill="#fff" d="M0 0h28v28H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgOnekeyLogo;
