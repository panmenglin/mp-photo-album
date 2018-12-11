const order = ['red', 'yellow', 'blue', 'green', 'red']
const data = require('./data.js')

function transformRpx(rpx) {
  const systemInfo = wx.getSystemInfoSync()
  const px = rpx / 750 * systemInfo.windowWidth
  return px
}

const imgHeight = transformRpx(248)

// 搜选框防抖
function debounce(method, time) {
  let timer = null
  return function () {
    const context = this
    // 在函数执行的时候先清除timer定时器;
    clearTimeout(timer)
    timer = setTimeout(function () {
      method.call(context)
    }, time)
  }
}

let scrollTop = 0

const imgArr = []
data.data.picDoList.map(item => {
  item.scale = 1
  item.x = 0
  item.y = 0
  imgArr.push({
    src: item.url + '_1280',
    scale: 1
  })
  return true
})

let startX = 0

let scale = false

Component({
  properties: {
  },
  data: {
    toView: 'red',
    scrollTop: 100,
    data: data.data.picDoList,
    current: 0,
    itemIndex: 1,
    translateX: 0,
    scrollLeft: 0,
    x: 0,
    y: 0
  },
  ready() {
    // this.preview()
    this.changeItem()
  },
  methods: {
    onScale(e) {
      const {dataset} = e.currentTarget
      const {detail} = e
      const {data} = this.data
      data[dataset.index].scale = detail.scales
      scale = true
    },
    touchstart(e) {
      if (e.touches.length === 1) {
        const {pageX} = e.touches[0]
        startX = pageX
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

      console.log(startX)

      if (!startX) {
        return false
      }

      const curIndex = dataset.index
      // moveStartX = 0

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
      return true
    },
    leftScroll(curIndex) {
      const {scrollLeft, data} = this.data

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

      // if (curIndex > 0) {
      //   data[curIndex].scale = 1
      // }

      // if (curIndex < data.length - 1) {
      //   data[curIndex + 1].scale = 1
      // }

      if (scrollLeft < data.length * transformRpx(750)) {
        this.setData({
          scrollLeft: curIndex * transformRpx(750) + transformRpx(750),
          data,
          itemIndex: curIndex + 2
        })
        // current = curIndex + 1
      }
    },
    rightScroll(curIndex) {
      const {scrollLeft, data} = this.data
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
        this.setData({
          scrollLeft: curIndex * transformRpx(750) - transformRpx(750),
          data,
          itemIndex: curIndex
        })
        // current = curIndex - 1
      }
    },
    onChange(e) {
      const {dataset} = e.currentTarget
      const {detail} = e
      const {data} = this.data
      data[dataset.index].x = detail.x
      data[dataset.index].y = detail.y
    },
    // htouchmove() {
    //   return false
    // },
    upper() {
      // console.log(e)
    },
    lower() {
      // console.log(e)
    },
    scroll(e) {
      // console.log(e.detail.scrollTop)
      // console.log(e.detail.scrollTop)

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
    tap() {
      for (let i = 0; i < order.length; ++i) {
        if (order[i] === this.data.toView) {
          this.setData({
            toView: order[i + 1]
          })
          break
        }
      }
    },
    tapMove() {
      this.setData({
        scrollTop: this.data.scrollTop + 10
      })
    },
    preview(e) {
      const {data} = this.data
      const {url} = e.currentTarget.dataset

      const index = data.findIndex((value) => value.url === url)


      data[index].preview = true
      data[index + 1].preview = true
      data[index + 2].preview = true


      this.setData({
        data,
        scrollLeft: index * transformRpx(750),
        previewShow: true,
        itemIndex: index + 1
      })
    },
    close() {
      this.setData({
        previewShow: false
      })
    },
    bindload(e) {
      console.log(e)

      // const {url, index} = e.currentTarget.dataset
      // const {urls} = this.data
      // console.log(urls[index])
      // console.log(url)

      // // urls[index].src = urls[index].src.replace('_200', '_1920')
      // // console.log(urls)
      // this.setData({
      //   urls
      //   // urls: [_imgArr[index - 1]].concat(urls),
      //   // current: 1
      // })
    },
  }
})
