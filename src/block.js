import * as React from "react";
import { Animated, TouchableWithoutFeedback, StyleSheet } from "react-native";

export default class Block extends React.Component {
  render() {
    return (
      <Animated.View
        style={[
          styles.blockContainer,
          this.props.style,
          this.props.dragStartAnimationStyle,
        ]}
        {...this.props.panHandlers}
      >
        <Animated.View>
          <TouchableWithoutFeedback
            delayLongPress={100}
            onPress={this.props.onPress}
            onLongPress={this.props.onLongPress}
          >
            {this.props.children}
          </TouchableWithoutFeedback>
        </Animated.View>
      </Animated.View>
    );
  }
}
const styles = StyleSheet.create({
  blockContainer: {
    alignItems: "center",
  },
});
