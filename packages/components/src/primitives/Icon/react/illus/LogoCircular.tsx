import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgLogoCircular = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 32 32" accessibilityRole="image" {...props}>
    {/* Circle with F cutout (evenodd) */}
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0M8.9 7.1h13.6v3.6H13v3.6h5.9v3.6H13v7.1H8.9Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgLogoCircular;
