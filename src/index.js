

const {transformRpx, debounce} = require('./utils.js')

const imgHeight = transformRpx(248)

let scrollTop = 0 // 照片墙滚动高度
let startX = 0 // touch 事件起始 x 坐标
let moveStartX = 0 // move 事件起始 x 坐标
let scale = false // 是否缩放中
const interval = [-2, -1, 0, 1, 2]

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
    previewData: []
  },
  ready() {
    this.setData({
      data: this.properties.list
    })
    this.changeItem()
  },
  methods: {
    // 标记缩放
    onScale(e) {
      const {dataset} = e.currentTarget
      const {detail} = e
      const {data} = this.data
      data[dataset.index].scale = detail.scales
      scale = true
    },
    // scalee(e) {
    //   const {dataset} = e.currentTarget
    //   const {data} = this.data
    //   data[dataset.index].scale = 2
    //   this.setData({
    //     data
    //   })
    // },
    touchstart(e) {
      if (e.touches.length === 1) {
        const {pageX} = e.touches[0]
        startX = pageX
        moveStartX = pageX
      }
    },
    touchend(e) {
      if (scale) {
        setTimeout(() => {
          scale = false
        }, 1000)
        return false
      }

      const {pageX} = e.changedTouches[0]
      const {data} = this.data
      const {dataset} = e.currentTarget

      if (!startX) {
        return false
      }

      const curIndex = dataset.index

      if (data[curIndex].scale > 1) {
        const delta = transformRpx(750) + data[curIndex].x
        if (delta > 20 && delta < transformRpx(750) - 20) {
          return false
        }
      }

      if (startX < pageX && pageX - startX > 30) {
      // 右滑
        this.rightScroll(curIndex)
      } else if (startX > pageX && startX - pageX > 30) {
      // 左滑
        this.leftScroll(curIndex)
      }

      startX = 0
      moveStartX = 0
      return true
    },
    leftScroll(curIndex) {
      const {scrollLeft, data} = this.data
      if (data[curIndex].scale > 1) {
        const delta = transformRpx(750) + data[curIndex].x
        if (delta > 20) {
          return false
        }
      }


      if (data[curIndex]) {
        data[curIndex].preview = true
      }
      if (data[curIndex + 1]) {
        data[curIndex + 1].preview = true
      }
      if (data[curIndex + 2]) {
        data[curIndex + 2].preview = true
      }
      if (data[curIndex - 3]) {
        data[curIndex - 3].preview = false
      }

      if (scrollLeft < (data.length - 1) * transformRpx(750)) {
        data[curIndex].disabled = false

        this.setData({
          scrollLeft: curIndex * transformRpx(750) + transformRpx(750),
          data,
          itemIndex: curIndex + 2
        })
      } else {
        this.setData({
          scrollLeft: curIndex * transformRpx(750),
        })
      }

      return true
    },
    rightScroll(curIndex) {
      const {scrollLeft, data} = this.data
      if (data[curIndex].scale > 1) {
        const delta = transformRpx(750) + data[curIndex].x
        if (delta < transformRpx(750) - 20) {
          return false
        }
      }

      if (data[curIndex]) {
        data[curIndex].preview = true
      }

      if (data[curIndex - 1]) {
        data[curIndex - 1].preview = true
      }

      if (data[curIndex - 2]) {
        data[curIndex - 2].preview = true
      }

      if (data[curIndex + 3]) {
        data[curIndex + 3].preview = false
      }

      if (scrollLeft > 0) {
        data[curIndex].disabled = false
        this.setData({
          scrollLeft: curIndex * transformRpx(750) - transformRpx(750),
          data,
          itemIndex: curIndex
        })
      }

      return true
    },
    touchmove(e) {
      if (scale) {
        setTimeout(() => {
          scale = false
        }, 1000)
        return false
      }


      const {pageX} = e.changedTouches[0]
      const {data} = this.data
      const {dataset} = e.currentTarget

      if (!moveStartX) {
        return false
      }

      if (e.touches.length > 1) {
        return false
      }

      const curIndex = dataset.index

      if (data[curIndex].scale > 1) {
        const delta = transformRpx(750) + data[curIndex].x
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
      const {scrollLeft, data} = this.data

      if (data[dataset.index].scale > 1) {
        const delta = transformRpx(750) + data[dataset.index].x
        if (delta > 0) {
          return false
        }
      }

      if (scrollLeft < (data.length - 1) * transformRpx(750)) {
        data[dataset.index].disabled = true
        this.setData({
          scrollLeft: scrollLeft + (moveStartX - pageX),
          data,
        })
      }
      return true
    },
    moveRight(e) {
      const {pageX} = e.touches[0]
      const {dataset} = e.currentTarget
      const {scrollLeft, data} = this.data

      if (data[dataset.index].scale > 1) {
        const delta = transformRpx(750) + data[dataset.index].x
        if (delta < transformRpx(750)) {
          return false
        }
      }

      if (scrollLeft > 0) {
        data[dataset.index].disabled = true
        this.setData({
          scrollLeft: scrollLeft - (pageX - moveStartX),
          data
        })
      }
      return true
    },
    onChange(e) {
      const {dataset} = e.currentTarget
      const {detail} = e
      const {data} = this.data
      data[dataset.index].x = detail.x
      data[dataset.index].y = detail.y
    },
    upper() {
      // console.log(e)
    },
    lower() {
      // console.log(e)
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

      const previewData = interval.map(item => data[index + item])

      // data[index].preview = true
      // data[index + 1].preview = true
      // data[index + 2].preview = true

      // if (data[index - 1]) {
      //   data[index - 1].preview = true
      // }


      this.setData({
        data,
        previewData,
        // scrollLeft: index * transformRpx(750),
        scrollLeft: 2 * transformRpx(750),
        previewShow: true,
        itemIndex: index + 1
      })
    },
    close() {
      this.setData({
        previewShow: false
      })
    },
    // bindload(e) {
    // },
  }
})
