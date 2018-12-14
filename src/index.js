const {transformRpx, debounce} = require('./utils.js')

const imgHeight = transformRpx(248)

let scrollTop = 0 // 照片墙滚动高度
let startX = 0 // touch 事件起始 x 坐标
let startY = 0 // touch 事件起始 x 坐标
let moveStartX = 0 // move 事件起始 x 坐标
let scale = false // 是否缩放中
const interval = [-1, 0, 1] // 冗余
let moving = false // 移动中
// 当前图片状态
const curItem = {
  x: 0,
  y: 0,
  scale: 1
}

Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
  data: {
    data: [],
    itemIndex: 1, // 大图预览计数
    translateX: 0,
    previewData: [], // 预览内容
    animation: null, // 滚动动画
    moveAnimation: null, // 滚动动画
    curSrc: '', // 当前src
    lastTapTime: 0, // 记录双击时间
    curIndex: 0, // 当前 index
    initScale: true, // 是否重置缩放
    animationData: {},
    direction: 'all',
    disabled: false
  },
  ready() {
    const {list} = this.properties
    list.map((item, index) => {
      item.index = index
      item.scale = 1
      return true
    })
    this.setData({
      data: list
    })
    this.changeItem()

    const animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear',
    })
    const moveAnimation = wx.createAnimation({
      duration: 0,
      timingFunction: 'linear',
    })
    this.animation = animation
    this.moveAnimation = moveAnimation
  },
  methods: {
    // 双击还原缩放
    doubleClick(e) {
      const {timeStamp} = e
      const {dataset} = e.currentTarget
      if (timeStamp - dataset.time > 0) {
        if (timeStamp - dataset.time < 300) {
          this.setData({
            initScale: true
          })
        }
      }
      this.setData({
        lastTapTime: timeStamp
      })
    },
    // 标记缩放
    onScale(e) {
      const {detail} = e
      curItem.scale = detail.scale
      curItem.x = detail.x
      curItem.y = detail.y
      scale = true
    },
    touchstart(e) {
      if (e.touches.length === 1 && !moving) {
        const {pageX, pageY} = e.touches[0]
        startX = pageX
        startY = pageY
        moveStartX = pageX
        moving = true
      }
    },
    touchVerify(startX, startY, pageX, pageY) {
      if (!startX) {
        return false
      }

      if (Math.abs(startY - pageY) > Math.abs(startX - pageX)) {
        return false
      }

      return true
    },
    touchend(e) {
      const {pageX, pageY} = e.changedTouches[0]
      const {dataset} = e.currentTarget
      const curIndex = dataset.index
      const {itemIndex} = this.data

      if (scale) {
        setTimeout(() => {
          scale = false
        }, 500)

        moving = false
        return false
      }

      if (!this.touchVerify(startX, startY, pageX, pageY)) {
        moving = false
        return false
      }

      const delta = transformRpx(750) - transformRpx(750) * curItem.scale
      if (curItem.x > delta + 15 && curItem.x < 0) {
        moving = false
        return false
      }

      if (startX < pageX && pageX - startX > 50) {
      // 右滑
        this.rightScroll(curIndex)
      } else if (startX > pageX && startX - pageX > 50) {
      // 左滑
        this.leftScroll(curIndex)
      } else {
        this.animation.translateX(-1 * itemIndex * transformRpx(750) + transformRpx(750)).step()
        this.setData({
          animationData: this.animation.export(),
        })
        moving = false
      }

      startX = 0
      moveStartX = 0
      return true
    },
    // 左滑-显示下一张
    leftScroll(curIndex) {
      const {data, previewData} = this.data
      const {itemIndex} = this.data

      const delta = transformRpx(750) - transformRpx(750) * curItem.scale
      if (curItem.x > delta + 15) {
        return false
      }

      if (itemIndex < data.length) {
        this.animation.translateX(-1 * itemIndex * transformRpx(750)).step()

        this.setData({
          previewData,
          itemIndex: itemIndex + 1,
          animationData: this.animation.export(),
          translateX: -1 * itemIndex * transformRpx(750)
        })

        setTimeout(() => {
          if (itemIndex > 1) {
            if (data[itemIndex + 1]) {
              const transformIndex = curIndex ? (curIndex - 1) % 3 : 2
              const deltaX = previewData[transformIndex].translateX + 3 * transformRpx(750)
              previewData[transformIndex] = data[itemIndex + 1]
              previewData[transformIndex].translateX = deltaX
            }
            // else {
            //   const transformIndex = curIndex ? (curIndex - 1) % 3 : 2
            //   const deltaX = previewData[transformIndex].translateX + 3 * transformRpx(750)
            //   previewData[transformIndex] = data[0]
            //   previewData[transformIndex].translateX = deltaX
            // }
          }

          this.setData({
            previewData,
            initScale: true,
            disabled: false
          })
        }, 200)

        curItem.scale = 0
        curItem.x = 0
        curItem.y = 0
      }

      moving = false
      return true
    },
    // 右滑-显示上一张
    rightScroll(curIndex) {
      const {previewData, data} = this.data
      const {itemIndex} = this.data
      if (curItem.scale > 1) {
        if (curItem.x < 0) {
          return false
        }
      }

      if (itemIndex > 1) {
        this.animation.translateX(-1 * itemIndex * transformRpx(750) + 2 * transformRpx(750)).step()

        this.setData({
          animationData: this.animation.export(),
          itemIndex: itemIndex - 1,
          animation: false,
          translateX: -1 * itemIndex * transformRpx(750) + 2 * transformRpx(750)
        })

        setTimeout(() => {
          if (itemIndex < data.length) {
            if (data[itemIndex - 3]) {
              const transformIndex = curIndex === 2 ? 0 : curIndex + 1
              const deltaX = previewData[transformIndex].translateX - 3 * transformRpx(750)
              previewData[transformIndex] = data[itemIndex - 3]
              previewData[transformIndex].translateX = deltaX
            } else {
              const transformIndex = curIndex === 2 ? 0 : curIndex + 1

              const deltaX = previewData[transformIndex].translateX - 3 * transformRpx(750)
              previewData[transformIndex] = data[0]
              previewData[transformIndex].translateX = deltaX
            }
          }
          this.setData({
            previewData,
            initScale: true,
            disabled: false
          })

          moving = false
        }, 200)
      } else {
        moving = false
      }

      return true
    },
    touchmove(e) {
      const {pageX, pageY} = e.changedTouches[0]

      if (scale) {
        return false
      }

      if (!moveStartX) {
        return false
      }

      if (!this.touchVerify(startX, startY, pageX, pageY)) {
        return false
      }

      if (e.touches.length > 1) {
        return false
      }

      const delta = transformRpx(750) - transformRpx(750) * curItem.scale
      if (curItem.x > delta + 15 && curItem.x < 0) {
        return false
      }

      if (moveStartX < pageX) {
        // 右滑
        this.moveRight(e)
      } else if (moveStartX > pageX) {
        // 左滑
        this.moveLeft(e)
      }

      moveStartX = pageX
      return true
    },
    moveLeft(e) {
      const {pageX} = e.touches[0]
      const {translateX} = this.data
      const {itemIndex, data} = this.data

      const delta = transformRpx(750) - transformRpx(750) * curItem.scale
      if (curItem.x > delta + 15) {
        return false
      }

      if (itemIndex < data.length) {
        this.moveAnimation.translateX(translateX - (moveStartX - pageX)).step()
        this.setData({
          animationData: this.moveAnimation.export(),
          translateX: translateX - (moveStartX - pageX),
          disabled: true
        })
      }
      // }
      return true
    },
    moveRight(e) {
      const {pageX} = e.touches[0]
      const {translateX} = this.data
      const {itemIndex} = this.data

      if (curItem.scale > 1) {
        if (curItem.x < 0) {
          return false
        }
      }

      if (itemIndex > 1) {
        this.moveAnimation.translateX(translateX - (moveStartX - pageX)).step()
        this.setData({
          animationData: this.moveAnimation.export(),
          translateX: translateX - (moveStartX - pageX),
          disabled: true
        })
      }
      return true
    },
    // 记录移动位置
    onChange(e) {
      const {detail} = e
      curItem.x = detail.x
      curItem.y = detail.y
    },
    // 照片墙滚动
    scroll(e) {
      scrollTop = e.detail.scrollTop
      this.changeItem()
    },
    changeItem: debounce(function () {
      const {data} = this.data
      const minConlum = (Math.floor(scrollTop / imgHeight) - 2) * 3
      const maxConlum = minConlum + 8 * 3
      data.map((item, index) => {
        if (index >= minConlum && index < maxConlum) {
          item.show = true
        }
        return true
      })

      this.setData({
        data
      })
    }, 500),
    // 预览大图
    preview(e) {
      const {data} = this.data
      const {url} = e.currentTarget.dataset
      const index = data.findIndex((value) => value.src === url)
      const previewData = []


      let _interval = interval
      if (index === data.length - 1) {
        _interval = [-2, -1, 0]
      } else if (index === 0) {
        _interval = [0, 1, 2]
      }

      _interval.map(item => {
        data[index + item].translateX = index * transformRpx(750) + item * transformRpx(750)
        previewData.push(data[index + item])
        return true
      })

      this.animation.translateX(-1 * index * transformRpx(750)).step()

      this.setData({
        previewData,
        animationData: this.animation.export(),
        translateX: -1 * index * transformRpx(750),
        initScale: true,
        previewShow: true,
        itemIndex: index + 1,
      })

      setTimeout(() => {
        this.setData({
          animation: true
        })
      }, 200)
    },
    // 关闭大图预览
    close() {
      this.setData({
        previewShow: false,
        animation: false
      })
    }
  }
})
