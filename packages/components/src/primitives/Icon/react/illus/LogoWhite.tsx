import Svg, { Path, Text } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgLogoWhite = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 104 25" accessibilityRole="image" {...props}>
    {/* Squircle icon shape */}
    <Path
      fill="#FFF"
      fillRule="evenodd"
      d="M11.801 24.755c8.147 0 11.801-3.678 11.801-11.88 0-8.2-3.654-11.878-11.8-11.878C3.653.997 0 4.675 0 12.876c0 8.2 3.654 11.879 11.801 11.879"
      clipRule="evenodd"
    />
    {/* F lettermark inside squircle */}
    <Path
      fill="#44D62C"
      d="M7.5 5h11.5v3H11v3.5h5.5v3H11v5.5H7.5Z"
    />
    {/* FEM Wallet wordmark */}
    <Text
      x="28"
      y="18"
      fontSize="13"
      fontWeight="500"
      fill="#FFF"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      FEM Wallet
    </Text>
  </Svg>
);
export default SvgLogoWhite;
