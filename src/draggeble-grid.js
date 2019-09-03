import * as React from 'react';
import { PanResponder, Animated, StyleSheet, } from 'react-native';
import { Block } from './block';
import { findKey, findIndex, differenceBy } from './utils';
;
export class DraggableGrid extends React.Component {
  constructor(props) {
    super(props);
    this.orderMap = {};
    this.items = [];
    this.blockPositions = [];
    this.activeBlockOffset = { x: 0, y: 0 };
    this.resetGridHeight = () => {
      const { props } = this;
      const rowCount = Math.ceil(props.data.length / props.numColumns);
      this.state.gridHeight.setValue(rowCount * this.state.blockHeight);
    };
    this.addItem = (item, index) => {
      this.blockPositions.push(this.getBlockPositionByOrder(this.items.length));
      this.orderMap[item.key] = {
        order: index,
      };
      this.items.push({
        key: item.key,
        itemData: item,
        currentPosition: new Animated.ValueXY(this.getBlockPositionByOrder(index)),
      });
    };
    this.removeItem = (item) => {
      const itemIndex = findIndex(this.items, (curItem) => curItem.key === item.key);
      this.items.splice(itemIndex, 1);
      this.blockPositions.pop();
      delete this.orderMap[item.key];
    };
    this.getBlockStyle = (itemIndex) => {
      return [
        {
          justifyContent: 'center',
          alignItems: 'center',
        },
        this.state.hadInitBlockSize && {
          width: this.state.blockWidth,
          height: this.state.blockHeight,
          position: 'absolute',
          top: this.items[itemIndex].currentPosition.getLayout().top,
          left: this.items[itemIndex].currentPosition.getLayout().left,
        },
      ];
    };
    this.setActiveBlock = (itemIndex) => {
      console.log("long press");
      this.panResponderCapture = true;
      this.setState({
        activeItemIndex: itemIndex,
      }, () => {
        this.startDragStartAnimation();
      });
    };
    this.getDragStartAnimation = (itemIndex) => {
      if (this.state.activeItemIndex != itemIndex) {
        return;
      }
      let dragStartAnimation;
      if (this.props.dragStartAnimation) {
        dragStartAnimation = this.props.dragStartAnimation;
      }
      else {
        dragStartAnimation = this.getDefaultDragStartAnimation();
      }
      return Object.assign({ zIndex: 3 }, dragStartAnimation);
    };
    this.getDefaultDragStartAnimation = () => {
      return {
        transform: [
          {
            scale: this.state.dragStartAnimatedValue,
          }
        ],
        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {
          width: 1,
          height: 1,
        },
      };
    };
    this.startDragStartAnimation = () => {
      if (!this.props.dragStartAnimation) {
        this.state.dragStartAnimatedValue.setValue(1);
        Animated.timing(this.state.dragStartAnimatedValue, {
          toValue: 1.1,
          duration: 10,
        }).start();
      }
    };
    this.getBlockPositionByOrder = (order) => {
      if (this.blockPositions[order]) {
        return this.blockPositions[order];
      }
      const { blockWidth, blockHeight } = this.state;
      const columnOnRow = order % this.props.numColumns;
      const y = blockHeight * Math.floor(order / this.props.numColumns);
      const x = columnOnRow * blockWidth;
      return {
        x, y
      };
    };
    this.assessGridSize = (event) => {
      if (!this.state.hadInitBlockSize) {
        let blockWidth, blockHeight;
        blockWidth = event.nativeEvent.layout.width / this.props.numColumns;
        blockHeight = this.props.itemHeight || blockWidth;
        this.setState({
          blockWidth,
          blockHeight,
          gridLayout: event.nativeEvent.layout,
        }, () => {
          this.initBlockPositions();
          this.resetGridHeight();
        });
      }
    };
    this.initBlockPositions = () => {
      this.items.forEach((item, index) => {
        this.blockPositions[index] = this.getBlockPositionByOrder(index);
      });
      this.items.forEach((item) => {
        item.currentPosition.setOffset(this.blockPositions[this.orderMap[item.key].order]);
      });
      this.setState({ hadInitBlockSize: true });
    };
    this.getActiveItem = () => {
      if (this.state.activeItemIndex === undefined)
        return false;
      return this.items[this.state.activeItemIndex];
    };
    this.getDistance = (startOffset, endOffset) => {
      const xDistance = startOffset.x + this.activeBlockOffset.x - endOffset.x;
      const yDistance = startOffset.y + this.activeBlockOffset.y - endOffset.y;
      return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
    };
    this.resetBlockPositionByOrder = (startOrder, endOrder) => {
      if (startOrder > endOrder) {
        for (let i = startOrder - 1; i >= endOrder; i--) {
          const key = this.getKeyByOrder(i);
          this.orderMap[key].order++;
          this.moveBlockToBlockOrderPosition(key);
        }
      }
      else {
        for (let i = startOrder + 1; i <= endOrder; i++) {
          const key = this.getKeyByOrder(i);
          this.orderMap[key].order--;
          this.moveBlockToBlockOrderPosition(key);
        }
      }
    };
    this.moveBlockToBlockOrderPosition = (itemKey) => {
      const itemIndex = findIndex(this.items, (item) => item.key === itemKey);
      this.items[itemIndex].currentPosition.flattenOffset();
      Animated.timing(this.items[itemIndex].currentPosition, {
        toValue: this.blockPositions[this.orderMap[itemKey].order],
        duration: 200,
      }).start();
    };
    this.getKeyByOrder = (order) => {
      return findKey(this.orderMap, (item) => item.order === order);
    };
    this.panResponderCapture = false;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => this.panResponderCapture,
      onMoveShouldSetPanResponderCapture: () => this.panResponderCapture,
      onShouldBlockNativeResponder: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: this.onStartDrag.bind(this),
      onPanResponderMove: this.onHandMove.bind(this),
      onPanResponderRelease: this.onHandRelease.bind(this),
    });
    this.state = {
      blockHeight: 0,
      blockWidth: 0,
      gridHeight: new Animated.Value(0),
      hadInitBlockSize: false,
      dragStartAnimatedValue: new Animated.Value(1),
      gridLayout: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    };
  }
  componentWillReceiveProps(nextProps) {
    nextProps.data.forEach((item, index) => {
      if (this.orderMap[item.key]) {
        if (this.orderMap[item.key].order != index) {
          this.orderMap[item.key].order = index;
          this.moveBlockToBlockOrderPosition(item.key);
        }
        const currentItem = this.items.find(i => i.key === item.key);
        if (currentItem) {
          currentItem.itemData = item;
        }
      }
      else {
        this.addItem(item, index);
      }
    });
    const deleteItems = differenceBy(this.items, nextProps.data, 'key');
    deleteItems.forEach((item) => {
      this.removeItem(item);
    });
  }
  componentDidUpdate() {
    this.resetGridHeight();
  }
  componentWillMount() {
    this.items = this.props.data.map((item, index) => {
      this.orderMap[item.key] = {
        order: index,
      };
      return {
        key: item.key,
        itemData: item,
        currentPosition: new Animated.ValueXY()
      };
    });
  }
  render() {
    return (<Animated.View style={[
      styles.draggableGrid,
      this.props.style,
      {
        height: this.state.gridHeight,
      },
    ]} onLayout={this.assessGridSize}>
      {this.state.hadInitBlockSize
        &&
        this.items.map((item, itemIndex) => {
          return (<Block onPress={this.onBlockPress.bind(this, itemIndex)} onLongPress={this.setActiveBlock.bind(this, itemIndex)} panHandlers={this.panResponder.panHandlers} style={this.getBlockStyle(itemIndex)} dragStartAnimationStyle={this.getDragStartAnimation(itemIndex)} key={item.key}>
            {this.props.renderItem(item.itemData, this.orderMap[item.key].order)}
          </Block>);
        })}
    </Animated.View>);
  }
  onBlockPress(itemIndex) {
    this.props.onItemPress && this.props.onItemPress(this.items[itemIndex].itemData);
  }
  onStartDrag(nativeEvent, gestureState) {
    const activeItem = this.getActiveItem();
    if (!activeItem)
      return false;
    this.props.onDragStart && this.props.onDragStart(activeItem.itemData);
    const { x0, y0, moveX, moveY } = gestureState;
    const activeOrigin = this.blockPositions[this.orderMap[activeItem.key].order];
    const x = activeOrigin.x - x0;
    const y = activeOrigin.y - y0;
    activeItem.currentPosition.setOffset({
      x,
      y,
    });
    this.activeBlockOffset = {
      x,
      y
    };
    activeItem.currentPosition.setValue({
      x: moveX,
      y: moveY,
    });
  }
  onHandMove(nativeEvent, gestureState) {
    const activeItem = this.getActiveItem();
    if (!activeItem)
      return false;
    const { moveX, moveY } = gestureState;
    const xChokeAmount = Math.max(0, (this.activeBlockOffset.x + moveX) - (this.state.gridLayout.width - this.state.blockWidth));
    const xMinChokeAmount = Math.min(0, this.activeBlockOffset.x + moveX);
    const dragPosition = {
      x: moveX - xChokeAmount - xMinChokeAmount,
      y: moveY,
    };
    const originPosition = this.blockPositions[this.orderMap[activeItem.key].order];
    const dragPositionToActivePositionDistance = this.getDistance(dragPosition, originPosition);
    activeItem.currentPosition.setValue(dragPosition);
    let closetItemIndex = this.state.activeItemIndex;
    let closetDistance = dragPositionToActivePositionDistance;
    this.items.forEach((item, index) => {
      if (index != this.state.activeItemIndex) {
        const dragPositionToItemPositionDistance = this.getDistance(dragPosition, this.blockPositions[this.orderMap[item.key].order]);
        if (dragPositionToItemPositionDistance < closetDistance
          && dragPositionToItemPositionDistance < this.state.blockWidth) {
          closetItemIndex = index;
          closetDistance = dragPositionToItemPositionDistance;
        }
      }
    });
    if (this.state.activeItemIndex != closetItemIndex) {
      const closetOrder = this.orderMap[this.items[closetItemIndex].key].order;
      this.resetBlockPositionByOrder(this.orderMap[activeItem.key].order, closetOrder);
      this.orderMap[activeItem.key].order = closetOrder;
    }
  }
  onHandRelease() {
    const activeItem = this.getActiveItem();
    if (!activeItem)
      return false;
    if (this.props.onDragRelease) {
      const dragReleaseResult = [];
      this.items.forEach((item) => {
        dragReleaseResult[this.orderMap[item.key].order] = item.itemData;
      });
      this.props.onDragRelease(dragReleaseResult);
    }
    this.panResponderCapture = false;
    activeItem.currentPosition.flattenOffset();
    this.moveBlockToBlockOrderPosition(activeItem.key);
    this.setState({
      activeItemIndex: undefined,
    });
  }
}
const styles = StyleSheet.create({
  draggableGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
