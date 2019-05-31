const data = require('./data.js')

const list = data.data

Page({
  data: {
    list,
    option: '',
    animationData: {},
    model: '',
    tab: 'comment'
  },
  ready() {
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
  },
  onLoad() {
    setTimeout(() => {
      list.splice(0, 1)
      this.setData({
        list
      })
    }, 2000)
  },
  changeTab(e) {
    if (e.currentTarget.dataset.tab) {
      this.setData({
        tab: e.currentTarget.dataset.tab
      })
    }
  },
  toggleComment() {
    const animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear'
    })
    this.animation = animation


    if (!this.commentShow) {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
      this.commentShow = true
    } else {
      animation.translateY('100%').step()
      this.setData({
        animationData: animation.export()
      })
      this.commentShow = false
    }
  },
  closeComment() {
    const animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear'
    })
    this.animation = animation
    animation.translateY('100%').step()
    this.setData({
      animationData: animation.export()
    })
    this.commentShow = false
  },
  select() {
    this.setData({
      option: 'download'
    })
  },
  finish() {
    this.toggleComment()

    this.setData({
      list,
      option: 'normal'
    })
  },
  like(e) {
    console.log(e.detail.img)
    console.log(e.detail.title)
  },
  updateItem(e) {
    console.log(e.detail.curItem)
  }
})
