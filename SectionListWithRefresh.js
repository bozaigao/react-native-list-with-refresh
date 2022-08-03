import React, { Component } from 'react'
import { ActivityIndicator, Animated, Dimensions, Easing, SectionList, Text, View, FlatList } from 'react-native'
const { width } = Dimensions.get('window')
class SectionListWithRefresh extends Component {
    constructor(props) {
        super(props)
        this._scrollViewRef = null
        this.endDrag = false
        this.timer
        this.gotoTop = false
        this.onScrollEndDrag = (e) => {
            let target = e.nativeEvent
            let y = target.contentOffset.y
            this.dragFlag = false
            if (y <= this.refreshHeight && y >= 10) {
                this.scrollToOffset(this.refreshHeight)
            }
            if (this.state.prState) {
                this.scrollToOffset(-70)
                this.setState({
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0),
                    prState: 0,
                })
                if (this.props.onCustomRefresh) {
                    this.props.onCustomRefresh(this)
                    this.refreshing = true
                }
            }
            let offsetY = e.nativeEvent.contentOffset.y
            let contentSizeHeight = e.nativeEvent.contentSize.height
            let originScrollHeight = e.nativeEvent.layoutMeasurement.height
            if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
                this.props.onEndReached && this.props.onEndReached()
            }
        }
        this.onScrollBeginDrag = () => {
            this.setState({
                beginScroll: true,
            })
            this.dragFlag = true
        }
        this._onScroll = (event) => {
            let target = event.nativeEvent
            let y = target.contentOffset.y
            if (this.dragFlag) {
                if (y <= 10) {
                    this.upState()
                } else {
                    this.downState()
                }
            } else if (y === 0) {
                this.setState({
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0),
                })
            }
        }
        this.dragFlag = false
        this.refreshHeight = 60
        this.refreshing = false
        this.state = {
            showLoadIndicator: false,
            prArrowDeg: new Animated.Value(0),
            prLoading: false,
            prState: 0,
            beginScroll: false,
            spinValue: new Animated.Value(0),
        }
        this._onScroll = this._onScroll.bind(this)
        this.onScrollEndDrag = this.onScrollEndDrag.bind(this)
        this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this)
    }

    componentDidMount() {
        if (this.props.onCustomRefresh) {
            this.setState({
                prLoading: true,
                prArrowDeg: new Animated.Value(0),
            })
            this.timer = setTimeout(() => {
                this.scrollToOffset(this.refreshHeight)
                this.timer && clearTimeout(this.timer)
            }, 1000)
        }
    }

    goToTop() {
        this.props.onCustomRefresh && this.props.onCustomRefresh()
        this.timer && clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.gotoTop = false
            this.hideRefresh()
            this.timer && clearTimeout(this.timer)
        }, 2000)
    }

    componentWillUnmount() {
        this.timer && clearTimeout(this.timer)
        this.initScrollViewRefresh && this.initScrollViewRefresh.remove()
    }
    renderIndicatorContent() {
        return (
            <View
                style={{
                    width,
                    height: this.refreshHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {this.renderRefreshContent()}
            </View>
        )
    }
    renderRefreshContent() {
        this.transform = [
            {
                rotate: this.state.prArrowDeg.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-180deg'],
                    useNativeDriver: true,
                }),
            },
        ]
        let arrowStyle = {
            width: 20,
            height: 20,
            transform: this.transform,
        }
        if (this.state.prLoading) {
            if (!this.refreshing && !this.gotoTop) {
                this.goToTop()
                this.gotoTop = true
            }
            return <LoadingView />
        } else {
            return <Animated.Image style={arrowStyle} resizeMode={'contain'} source={require('img/ico_refresh_down.png')} />
        }
    }
    onRefreshEnd() {
        this.setState({
            prLoading: false,
            beginScroll: false,
        })
        this.refreshing = false
        this.scrollToOffset(this.refreshHeight)
    }

    scrollToOffset(offset) {
        this._scrollViewRef.scrollToOffset({ offset, animated: true })
    }

    upState() {
        this.setState({
            prState: 1,
        })
        Animated.timing(this.state.prArrowDeg, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
        }).start()
    }
    downState() {
        this.setState({
            prState: 0,
        })
        Animated.timing(this.state.prArrowDeg, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
        }).start()
    }
    hideRefresh() {
        this.onRefreshEnd()
    }
    showLoading() {
        this.setState({ showLoadIndicator: true })
    }
    hideLoading() {
        this.setState({ showLoadIndicator: false })
    }

    renderContent() {
        return (
            <View>
                {this.renderIndicatorContent()}
                <View style={{ width: '100%' }}>
                    {<SectionList {...this.props} />}
                    {this.state.showLoadIndicator ? (
                        <View
                            style={{
                                width: '100%',
                                height: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f6f9fc',
                            }}
                        >
                            {
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ActivityIndicator
                                        style={{
                                            width: 16,
                                            height: 16,
                                        }}
                                        color={'gray'}
                                    />
                                    <Text style={{ marginLeft: 10, color: 'gray' }}>数据加载中...</Text>
                                </View>
                            }
                        </View>
                    ) : null}
                </View>
                <View
                    ref={(ref) => {
                        this.viewRef = ref
                    }}
                    style={{ width: '100%' }}
                />
            </View>
        )
    }

    render() {
        return (
            <FlatList
                ref={(scrollView) => {
                    this._scrollViewRef = scrollView
                    return this._scrollViewRef
                }}
                bounces={true}
                removeClippedSubviews={false}
                data={[1]}
                scrollEventThrottle={16}
                onScroll={this._onScroll}
                onScrollEndDrag={this.onScrollEndDrag}
                onScrollBeginDrag={this.onScrollBeginDrag}
                onMomentumScrollEnd={(e) => {
                    let offsetY = e.nativeEvent.contentOffset.y
                    let contentSizeHeight = e.nativeEvent.contentSize.height
                    let originScrollHeight = e.nativeEvent.layoutMeasurement.height
                    if (Math.abs(offsetY + originScrollHeight - contentSizeHeight) < 30) {
                        this.props.onEndReached && this.props.onEndReached()
                    }
                }}
                renderItem={this.renderContent.bind(this)}
            />
        )
    }
}

class LoadingView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            spinValue: new Animated.Value(0),
        }
    }

    componentDidMount() {
        this.loadingAnimal()
    }
    loadingAnimal() {
        const animationLoading = Animated.timing(this.state.spinValue, {
            toValue: 360,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: false,
        })
        Animated.loop(animationLoading).start()
    }

    render() {
        return (
            <Animated.Image
                style={[
                    {
                        width: 20,
                        height: 20,
                    },
                    {
                        transform: [
                            {
                                rotate: this.state.spinValue.interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                    useNativeDriver: true,
                                }),
                            },
                        ],
                    },
                ]}
                source={require('img/icon_loading.png')}
            />
        )
    }
}
export { SectionListWithRefresh }
