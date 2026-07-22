import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgOnekeyLogoMono = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 280 280" accessibilityRole="image" {...props}>
    {/* Circle with F cutout (evenodd) */}
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M140 0c96.65 0 140 43.35 140 140s-43.35 140-140 140S0 236.65 0 140 43.35 0 140 0M78 62h119v31H114v31h52v31H114v62H78Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgOnekeyLogoMono;
