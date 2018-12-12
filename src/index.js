

const {transformRpx, debounce} = require('./utils.js')

const imgHeight = transformRpx(248)

let scrollTop = 0 // 照片墙滚动高度
let startX = 0 // touch 事件起始 x 坐标
let startY = 0 // touch 事件起始 x 坐标
let moveStartX = 0 // move 事件起始 x 坐标
let scale = false // 是否缩放中
const interval = [-2, -1, 0, 1, 2]
let curScale = 1
const move = {
  x: 0,
  y: 0
}
let moving = false


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
    x: 0,
    y: 0,
    previewData: [],
    animation: true, // 滚动动画
    translateX: 0,
    curSrc: ''
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
    // 标记缩放
    onScale(e) {
      const {detail} = e
      curScale = detail.scale
      move.x = detail.x
      move.y = detail.y
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
      const {previewData} = this.data
      const {dataset} = e.currentTarget
      const curIndex = dataset.index

      if (scale) {
        setTimeout(() => {
          scale = false
        }, 1000)
        previewData[curIndex].disabled = false
        previewData[curIndex].scale = curScale
        previewData[curIndex].x = move.x
        previewData[curIndex].y = move.y
        this.setData({
          previewData
        })
        moving = false
        return false
      }

      previewData[curIndex].x = move.x
      previewData[curIndex].y = move.y

      this.setData({
        previewData
      })

      if (!this.touchVerify(startX, startY, pageX, pageY)) {
        moving = false
        return false
      }

      if (previewData[curIndex].scale > 1) {
        const delta = transformRpx(750) + previewData[curIndex].x
        if (delta > 20 && delta < transformRpx(750) - 20) {
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
    leftScroll(curIndex) {
      const {scrollLeft, data, previewData} = this.data
      const {itemIndex} = this.data
      if (previewData[curIndex].scale > 1) {
        const delta = transformRpx(750) + previewData[curIndex].x
        if (delta > 0) {
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
        previewData[curIndex].disabled = false
        previewData[curIndex].scale = 1
        previewData[curIndex].x = 0
        previewData[curIndex].y = 0
        this.setData({
          previewData,
          scrollLeft: curIndex * transformRpx(750) + transformRpx(750),
          // data,
          itemIndex: itemIndex + 1,
          curIndex
        })
      } else {
        this.setData({
          scrollLeft: curIndex * transformRpx(750),
        })
      }

      moving = false
      return true
    },
    rightScroll(curIndex) {
      const {scrollLeft, data, previewData} = this.data
      const {itemIndex} = this.data
      if (previewData[curIndex].scale > 1) {
        const delta = transformRpx(750) + previewData[curIndex].x
        if (delta < transformRpx(750)) {
          moving = false
          return false
        }
      }

      if (scrollLeft > 0) {
        previewData[curIndex].disabled = false
        previewData[curIndex].scale = 1
        previewData[curIndex].x = 0
        previewData[curIndex].y = 0
        this.setData({
          scrollLeft: curIndex * transformRpx(750) - transformRpx(750),
          // data,
          previewData,
          itemIndex: itemIndex - 1,
          animation: false,
        })

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
      const {previewData} = this.data
      const {dataset} = e.currentTarget

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

      const curIndex = dataset.index

      if (previewData[curIndex].scale > 1) {
        const delta = transformRpx(750) + previewData[curIndex].x
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
      const {dataset} = e.currentTarget
      const {scrollLeft, previewData} = this.data

      if (previewData[dataset.index].scale > 1) {
        const delta = transformRpx(750) + previewData[dataset.index].x
        if (delta > 0) {
          return false
        }
      }

      if (scrollLeft < (previewData.length - 1) * transformRpx(750)) {
        previewData[dataset.index].disabled = true
        this.setData({
          scrollLeft: scrollLeft + (moveStartX - pageX),
          previewData,
        })
      }
      return true
    },
    moveRight(e) {
      const {pageX} = e.touches[0]
      const {dataset} = e.currentTarget
      const {scrollLeft, previewData} = this.data

      if (previewData[dataset.index].scale > 1) {
        const delta = transformRpx(750) + previewData[dataset.index].x
        if (delta < transformRpx(750)) {
          return false
        }
      }

      if (scrollLeft > 0) {
        previewData[dataset.index].disabled = true
        this.setData({
          scrollLeft: scrollLeft - (pageX - moveStartX),
          previewData
        })
      }
      return true
    },
    onChange(e) {
      const {detail} = e
      move.x = detail.x
      move.y = detail.y
    },
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
        data,
        previewData,
        scrollLeft: scrollIndex * transformRpx(750),
        previewShow: true,
        itemIndex: index + 1
      })
    },
    close() {
      this.setData({
        previewShow: false
      })
    }
  }
})
