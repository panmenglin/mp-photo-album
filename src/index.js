const {transformRpx, debounce} = require('./utils.js')

const imgHeight = transformRpx(248)

let scrollTop = 0 // 照片墙滚动高度
let startX = 0 // touch 事件起始 x 坐标
let startY = 0 // touch 事件起始 x 坐标
let moveStartX = 0 // move 事件起始 x 坐标
let scale = false // 是否缩放中
const interval = [-2, -1, 0, 1, 2] // 冗余
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
    scrollLeft: 0, // 预览图滚动距离
    previewData: [], // 预览内容
    animation: false, // 滚动动画
    curSrc: '', // 当前src
    lastTapTime: 0, // 记录双击时间
    curIndex: 0, // 当前 index
    initScale: true // 是否重置缩放
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

      if (curItem.scale > 1) {
        const delta = transformRpx(750) - transformRpx(750) * curItem.scale
        if (curItem.x > delta && curItem.x > 0) {
          moving = false
          return false
        }
      }

      if (startX < pageX && pageX - startX > 50) {
      // 右滑
        this.rightScroll(curIndex)
      } else if (startX > pageX && startX - pageX > 50) {
      // 左滑
        this.leftScroll(curIndex)
      } else {
        setTimeout(() => {
          this.setData({
            scrollLeft: curIndex * transformRpx(750),
          })
          moving = false
        }, 500)
      }

      startX = 0
      moveStartX = 0
      return true
    },
    // 左滑-显示下一张
    leftScroll(curIndex) {
      const {scrollLeft, data, previewData} = this.data
      const {itemIndex} = this.data

      if (curItem.scale > 1) {
        const delta = transformRpx(750) - transformRpx(750) * curItem.scale
        if (curItem.x > delta + 20) {
          return false
        }
      }

      if (data[itemIndex + 2]) {
        let insert = false
        previewData.map(item => {
          if (item.src === data[itemIndex + 2].src) {
            insert = true
          }
          return true
        })

        if (!insert) {
          previewData.push(data[itemIndex + 2])
        }
      }

      if (scrollLeft < (previewData.length - 1) * transformRpx(750)) {
        this.setData({
          previewData,
          scrollLeft: curIndex * transformRpx(750) + transformRpx(750),
          itemIndex: itemIndex + 1,
        })

        setTimeout(() => {
          this.setData({
            initScale: true
          })
        }, 500)

        // 临时处理最后一张图位置问题
        if (itemIndex >= data.length - 1) {
          setTimeout(() => {
            this.setData({
              scrollLeft: curIndex * transformRpx(750) + transformRpx(750),
            })
          }, 500)
        }

        curItem.scale = 0
        curItem.x = 0
        curItem.y = 0
      } else {
        this.setData({
          scrollLeft: curIndex * transformRpx(750),
        })
      }

      moving = false
      return true
    },
    // 右滑-显示上一张
    rightScroll(curIndex) {
      const {scrollLeft, data, previewData} = this.data
      const {itemIndex} = this.data
      if (curItem.scale > 1) {
        if (curItem.x > 0) {
          return false
        }
      }

      if (scrollLeft > 0) {
        this.setData({
          scrollLeft: curIndex * transformRpx(750) - transformRpx(750),

          itemIndex: itemIndex - 1,
          animation: false,
        })

        setTimeout(() => {
          this.setData({
            initScale: true
          })
        }, 500)

        curItem.scale = 0
        curItem.x = 0
        curItem.y = 0

        setTimeout(() => {
          if (previewData[curIndex - 1]) {
            const curSrc = previewData[curIndex - 1].previewSrc
            this.setData({
              curSrc
            })
          }
        }, 500)

        setTimeout(() => {
          if (this.data.curSrc) {
            if (data[itemIndex - 4]) {
              let insert = false
              previewData.map(item => {
                if (item.src === data[itemIndex - 4].src) {
                  insert = true
                }
                return true
              })

              if (!insert) {
                previewData.splice(0, 0, data[itemIndex - 4])
                this.setData({
                  previewData,
                  scrollLeft: curIndex * transformRpx(750),
                })
              }
            }

            this.setData({
              curSrc: '',
              animation: true,
            })
          }
          moving = false
        }, 700)
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

      if (curItem.scale > 1) {
        const delta = transformRpx(750) + curItem.x
        if (delta > 20 && delta < transformRpx(750) - 20) {
          return false
        }
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
      const {scrollLeft, previewData} = this.data

      if (curItem.scale > 1) {
        const delta = transformRpx(750) + curItem.x
        if (delta > 0) {
          return false
        }
      }

      if (scrollLeft < (previewData.length - 1) * transformRpx(750)) {
        this.setData({
          scrollLeft: scrollLeft + (moveStartX - pageX)
        })
      }
      return true
    },
    moveRight(e) {
      const {pageX} = e.touches[0]
      const {scrollLeft} = this.data

      if (curItem.scale > 1) {
        const delta = transformRpx(750) + curItem.x
        if (delta < transformRpx(750)) {
          return false
        }
      }

      if (scrollLeft > 0) {
        this.setData({
          scrollLeft: scrollLeft - (pageX - moveStartX)
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

      interval.map(item => {
        if (data[index + item]) {
          previewData.push(data[index + item])
        }
        return true
      })

      const scrollIndex = previewData.findIndex((value) => value.src === url)

      this.setData({
        previewData,
        scrollLeft: scrollIndex * transformRpx(750),
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
