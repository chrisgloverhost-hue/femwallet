import Svg, { Path, Text } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
const SvgOnekeyBrandingPill = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 88 22" accessibilityRole="image" {...props}>
    {/* Pill background */}
    <Path
      fill="#fff"
      d="M0 11C0 4.925 4.925 0 11 0h66c6.075 0 11 4.925 11 11s-4.925 11-11 11H11C4.925 22 0 17.075 0 11"
    />
    {/* Green circle icon */}
    <Path
      fill="#44D62C"
      d="M23.62 11c0 5.695-2.574 8.25-8.31 8.25S7 16.695 7 11s2.573-8.25 8.31-8.25c5.736 0 8.31 2.555 8.31 8.25"
    />
    {/* F lettermark */}
    <Path
      fill="#000"
      d="M11.1 5.6h7v1.9H13v1.9h3.3v1.9H13v3.5H11.1Z"
    />
    {/* FEM Wallet text */}
    <Text
      x="27"
      y="15"
      fontSize="10"
      fontWeight="600"
      fill="#000"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      FEM Wallet
    </Text>
  </Svg>
);
export default SvgOnekeyBrandingPill;
