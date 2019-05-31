const {
  transformRpx, debounce, sum, watch
} = require('./utils.js')

const imgHeight = transformRpx(248)

let startX = 0 // touch 事件起始 x 坐标
let startY = 0 // touch 事件起始 x 坐标
let moveStartX = 0 // move 事件起始 x 坐标
const interval = [-1, 0, 1] // 冗余

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
    },
    option: {
      type: String,
      value: 'normal'
    },
    likeTitle: {
      type: String,
      value: ''
    }
  },
  data: {
    data: [],
    itemIndex: 1, // 大图预览计数
    translateX: 0,
    previewData: [], // 预览内容
    moveAnimation: null, // 滚动动画
    lastTapTime: 0, // 记录双击时间
    curIndex: 0, // 当前 index
    initScale: true, // 是否重置缩放
    animationData: {},
    disabled: false,
    model: ''
  },
  ready() {
    // 加载列表
    const {list, likeTitle} = this.properties
    this.setData({
      data: list,
      title: likeTitle
    })

    this.initAlbum()

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

    wx.getSystemInfo({
      success: (res) => {
        const model = res.model.substring(0, res.model.indexOf('X')) + 'X'
        if (model === 'iPhone X') {
          this.setData({
            model: 'iphoneX'
          })
        }
      }
    })

    watch(this, {
      // option 变化重置照片选中状态
      option: (newVal) => {
        if (newVal === 'normal') {
          const {data} = this.data
          data.map(item => {
            item.check = false
            return true
          })
          this.setData({
            data
          })
        }
      },
      list: (newVal) => {
        this.setData({
          data: newVal
        })
        this.initAlbum()
      },
      likeTitle: (newVal) => {
        this.setData({
          title: newVal
        })
      }
    })
  },
  methods: {
    initAlbum() {
      this.changeItem()
      this.scrollTop = 0 // 照片墙滚动高度
      this.setData({
        scrollTop: 0
      })
    },
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
    touchstart(e) {
      if (e.touches.length === 1 && !this.moving) {
        const {pageX, pageY} = e.touches[0]
        startX = pageX
        startY = pageY
        moveStartX = pageX
        this.moving = true
      }
    },
    /**
     * 校验 touch 类型
     * @param {*} startX 起始位置 x
     * @param {*} startY 起始位置 y
     * @param {*} pageX 结束位置 x
     * @param {*} pageY 结束位置 y
     * @returns
     */
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
      const {itemIndex, translateX} = this.data

      if (this.scale) {
        setTimeout(() => {
          this.scale = false
        }, 500)

        this.moving = false
        return false
      }

      if (!this.touchVerify(startX, startY, pageX, pageY)) {
        // 处理重复拖动
        if (translateX % transformRpx(750) !== 0) {
          this.animation.translateX(-1 * itemIndex * transformRpx(750) + transformRpx(750)).step()
          this.setData({
            animationData: this.animation.export(),
          })
        }

        this.moving = false
        return false
      }

      const delta = transformRpx(750) - transformRpx(750) * curItem.scale
      if (curItem.x > delta + 15 && curItem.x < 0) {
        this.moving = false
        return false
      }

      if (startX < pageX && pageX - startX > 50) {
        // 右滑-显示上一张
        this.rightScroll(curIndex)
      } else if (startX > pageX && startX - pageX > 50) {
        // 左滑-显示下一张
        this.leftScroll(curIndex)
      } else {
        this.animation.translateX(-1 * itemIndex * transformRpx(750) + transformRpx(750)).step()
        this.setData({
          animationData: this.animation.export(),
        })
        this.moving = false
      }

      startX = 0
      moveStartX = 0
      return true
    },
    /**
     * 左滑-显示下一张
     * @param {*} curIndex 当前 swiper-item 下标
     * @returns
     */
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
        this.moving = false
      } else {
        this.moving = false
      }

      return true
    },
    /**
     * 右滑-显示上一张
     * @param {*} curIndex 当前 swiper-item 下标
     * @returns
     */
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
            }
          }

          this.setData({
            previewData,
            initScale: true,
            disabled: false
          })

          this.moving = false
        }, 200)
      } else {
        this.moving = false
      }

      return true
    },
    touchmove(e) {
      const {pageX, pageY} = e.changedTouches[0]

      if (this.scale) {
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
    /**
     * 向左滑动
     * @param {*} e
     * @returns
     */
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

      this.triggerEvent('updateitem', {
        curItem: data[itemIndex]
      })

      return true
    },
    /**
     * 向右滑动
     * @param {*} e
     * @returns
     */
    moveRight(e) {
      const {pageX} = e.touches[0]
      const {translateX} = this.data
      const {itemIndex, data} = this.data

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

      this.triggerEvent('updateitem', {
        curItem: data[itemIndex]
      })

      return true
    },
    /**
     * 标记缩放
     * @param {*} e
     */
    onScale(e) {
      const {detail} = e
      curItem.scale = detail.scale
      curItem.x = detail.x
      curItem.y = detail.y
      this.scale = true
    },
    /**
     * 记录移动位置
     * @param {*} e
     */
    onChange(e) {
      const {detail} = e
      curItem.x = detail.x
      curItem.y = detail.y
    },
    /**
     * 照片墙滚动
     * @param {*} e
     */
    scroll(e) {
      this.scrollTop = e.detail.scrollTop
      this.changeItem()
    },
    changeItem: debounce(function () {
      const {data} = this.data
      const minConlum = (Math.floor(this.scrollTop / imgHeight) - 2) * 3
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
    /**
     * 预览大图
     * @param {*} e
     * @returns
     */
    preview(e) {
      const {data} = this.data
      const {url} = e.currentTarget.dataset
      const {type} = e.currentTarget.dataset
      const index = data.findIndex((value) => value.src === url)
      const previewData = []

      if (type === 'download') {
        const downloadList = []
        data.map(item => {
          if (item.check) {
            downloadList.push(item.src)
          }
          return true
        })

        if (downloadList.length >= 9 && !data[index].check) {
          wx.showToast({
            title: '最多只能同时选择 9 张照片~',
            icon: 'none'
          })
          return false
        }

        data[index].check = !data[index].check
        this.setData({
          data
        })
        return false
      }

      let _interval = interval
      if (index === data.length - 1) {
        _interval = [-2, -1, 0]
      } else if (index === 0) {
        _interval = [0, 1, 2]
      }

      _interval.map(item => {
        if (data[index + item]) {
          data[index + item].translateX = index * transformRpx(750) + item * transformRpx(750)
          previewData.push(data[index + item])
        }
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

      this.clickLike = false

      setTimeout(() => {
        this.setData({
          animation: true
        })
      }, 200)

      return true
    },
    /**
     * 关闭大图预览
     */
    close() {
      this.setData({
        previewShow: false,
        animation: false
      })

      this.triggerEvent('close', {
        click: this.clickLike,
      })
    },
    /**
     * 下载
     * @returns
     */
    download() {
      if (this.downloading) {
        return false
      }
      const {data} = this.data
      const downloadList = []
      const progress = []
      data.map(item => {
        if (item.check) {
          downloadList.push(item.src)
          progress.push(0)
        }
        return true
      })

      if (downloadList.length === 0) {
        wx.showToast({
          title: '请选择图片',
          icon: 'none'
        })
        return false
      }

      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success: () => {
          this.triggerEvent('finish')
          this.downloading = true
          downloadList.map((item, index) => {
            wx.downloadFile({
              url: item,
              success: (res) => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: () => {}
                })
              }
            }).onProgressUpdate((res) => {
              progress[index] = res.progress
            })
            return true
          })

          const progressTimer = setInterval(() => {
            const all = downloadList.length * 100
            const _progress = parseInt((sum(progress) / all) * 100, 10)
            const _progressContent = _progress > 0 ? `下载中 ${_progress}%` : '下载中...'
            wx.showToast({
              title: _progressContent,
              icon: 'none'
            })

            if (_progress >= 100) {
              clearInterval(progressTimer)
              this.downloading = false
              setTimeout(() => {
                wx.showToast({
                  title: '保存成功',
                  icon: 'success',
                  duration: 1500
                })

                this.triggerEvent('download', {
                  downloadList
                })
              }, 500)
            }
          }, 200)
        },
        fail: () => {
          this.downloading = false
          wx.showToast({
            title: '请授权后,重新保存！',
            icon: 'none',
            duration: 2000
          })
          wx.openSetting({})
        }
      })

      return true
    },
    /**
     * 单图下载
     */
    downloadCur() {
      if (this.downloading) {
        return false
      }

      const {itemIndex, data} = this.data
      let progress = 0
      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success: () => {
          this.downloading = true
          wx.downloadFile({
            url: data[itemIndex - 1].src,
            success: (res) => {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({
                    title: '下载成功',
                    duration: 1500
                  })

                  this.triggerEvent('download', {
                    downloadList: [data[itemIndex - 1].src]
                  })
                }
              })
            }
          }).onProgressUpdate((res) => {
            progress = res.progress
          })

          const progressTimer = setInterval(() => {
            const _progressContent = progress > 0 ? `下载中 ${progress}%` : '下载中...'
            wx.showToast({
              title: _progressContent,
              icon: 'none'
            })

            if (progress >= 100) {
              clearInterval(progressTimer)

              this.downloading = false
              // setTimeout(() => {
              //   wx.showToast({
              //     title: '保存成功',
              //     icon: 'success',
              //     duration: 1500
              //   })
              // }, 500)
            }
          }, 200)
        },
        fail() {
          this.downloading = false
          wx.showToast({
            title: '请授权后,重新保存！',
            icon: 'none',
            duration: 2000
          })
          wx.openSetting({})
        }
      })
      return true
    },
    /**
     * 收藏
     */
    like(e) {
      const {itemIndex, data} = this.data
      const {dataset} = e.currentTarget

      this.triggerEvent('like', {
        img: data[itemIndex - 1],
        title: dataset.title
      })

      this.clickLike = true
    },
    /**
     * 页面点击
     */
    clickSwiper() {
      this.triggerEvent('clickswiper')
    }
  }
})
