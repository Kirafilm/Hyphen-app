import { View, type ViewProps } from "react-native";

import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

type WebContainerProps = ViewProps & {
  children: React.ReactNode;
};

/** Centers page content on desktop web with shared max width. */
export function WebContainer({ children, style, ...props }: WebContainerProps) {
  return (
    <View style={[{ flex: 1, width: "100%" }, style]} {...props}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: WEB_MAX_WIDTH,
          alignSelf: "center",
          paddingHorizontal: WEB_HORIZONTAL_PADDING,
        }}
      >
        {children}
      </View>
    </View>
  );
}
