var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
var stockKey = "stockKey"
var coverageKey = "coverageKey"

Page({
  data: {
    tabs: ["涨/跌停", "盈亏/加仓"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    copyright: new Date().getFullYear(),
    stock: {
      preClosePrice: '',
      count: 1,
      isNew: false,
      isST: false,
      totalUpperPrice: '11.94',
      totalUpperPercent: '10.05',
      totalDownPrice: '9.77',
      totalDownPercent: '-9.95'
    },
    coverage: {
      holdPrice: '',
      newPrice: '',
      holdNum: 1000,
      lossPrice: '0.00',
      lossPercent: '0.00',
      addNum: 1000,
      addCostPrice: '0.00',
      addHoldPrice: '0.00',
      addLossPercent: '0.00'
    }
  },
  onLoad: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
  },
  onShow: function(){
    var stock = wx.getStorageSync(stockKey)
    if (stock) {
      if (stock.preClosePrice == 0) {
        stock.preClosePrice = ''
      }
      this.setData({
        stock: stock
      })
      this._calc()
    }

    var coverage = wx.getStorageSync(coverageKey)
    if(coverage) {
      this.setData({
        coverage: coverage
      })
      this._coverageCalc()
    }
  },
  //事件处理函数
  previewImage: function (e) {
    var current = e.target.dataset.src
    var urls = []
    urls.push(current)
    wx.previewImage({
      current: current,
      urls: urls
    })
  },
  inputChange: function(e) {
    var val = e.detail.value
    if (val == ''){
      this.setData({
        ["stock.totalUpperPrice"]: '0.00',
        ["stock.totalUpperPercent"]: '0.00',
        ["stock.totalDownPrice"]: '0.00',
        ["stock.totalDownPercent"]: '-0.00',
      })
      return
    }
    var re = /^[0-9]+([.]{1}[0-9]{1,2})?$/; //判断字符串是否为数字 //判断正整数 /^[1-9]+[0-9]*]*$/ 
    if (!re.test(val) || (val < 0 || val > 1000)) { 
      wx.showToast({
        title: '请输入0.1-999之间的收盘价',
        icon: 'none'
      })
      return
    }

    this.setData({
        ["stock.preClosePrice"]: val < 0 ? '' : val
    })
    
    this._calc()
  },
  sliderChanging: function(e){
    this.setData({
      ["stock.count"]: e.detail.value
    })
    this._calc()
  },
  _calc: function(){
    var stock = this.data.stock
    var price = stock.preClosePrice
    var isST = stock.isST
    var upperCoef = isST ? 1.05 : 1.1
    var downCoef = isST ? 0.95 : 0.9
    var count = stock.count

    var isNew = stock.isNew
    
    var _totalUpperPrice = this._calcPrice(price, isNew ? 1.44 : upperCoef)
    
    var _totalDownPrice = this._calcPrice(price, isNew ? 0.64 : downCoef)
    
    if(count > 1){
      for(var i = 1; i < count; i++){
        _totalUpperPrice = this._calcPrice(_totalUpperPrice, upperCoef)
        _totalDownPrice = this._calcPrice(_totalDownPrice, downCoef)
      }
    }
    this.setData({
      ["stock.totalUpperPrice"]: _totalUpperPrice,
      ["stock.totalDownPrice"]: _totalDownPrice
    })

    var _totalUpperPercent = this._calcPercent(price, _totalUpperPrice)
    var _totalDownPercent = this._calcPercent(price, _totalDownPrice)

    this.setData({
      ["stock.totalUpperPercent"]: _totalUpperPercent,
      ["stock.totalDownPercent"]: _totalDownPercent == 0 ? '-' + _totalDownPercent : _totalDownPercent
    })
    
    wx.setStorageSync(stockKey, this.data.stock)
  },
  _calcPrice: function(price, coef) {
    var _price = parseFloat(price * coef).toFixed(2)
    return _price
  },
  _calcPercent: function (prePrice, upperPrice) {
    if (prePrice == 0){
      return "0.00"
    }
    return (parseFloat(upperPrice / prePrice - 1) * 100).toFixed(2)
  },
  switchChange: function(e) {
    var sh = e.currentTarget.dataset.sh
    var checked = e.detail.value
    var stock = this.data.stock
    var isST = stock.isST
    var isNew = stock.isNew
    if(sh == 'isST') {
      if (checked == true){
        isNew = false
      }
      this.setData({
        ["stock.isST"]: checked,
        ["stock.isNew"]: isNew
      })
    }
    if (sh == 'isNew') {
      if (checked == true) {
        isST = false
      }
      this.setData({
        ["stock.isST"]: isST,
        ["stock.isNew"]: checked
      })
    }

    this._calc()
  },

  coverageInputChange: function(e){
    var val = e.detail.value
    var src = e.target.dataset.src
    
    var re = /^[0-9]+([.]{1}[0-9]{1,2})?$/; //判断字符串是否为数字 //判断正整数 /^[1-9]+[0-9]*]*$/ 
    if ((!re.test(val) || (val < 0 || val > 1000))) {
      wx.showToast({
        title: '请输入0.1-999之间的数字',
        icon: 'none'
      })
    }

    this.setData({
      [src]: val < 0 ? '' : val
    })

    this._coverageCalc()
  },

  valChange: function(e){
    var val = e.detail.value
    var src = e.target.dataset.src
    this.setData({
      [src]: e.detail.value
    })
    this._coverageCalc()
  },

  _coverageCalc: function(){
    var coverage = this.data.coverage

    var holdPrice = parseFloat(coverage.holdPrice) || 0
    var newPrice = parseFloat(coverage.newPrice) || 0
    var holdNum = parseFloat(coverage.holdNum) || 0
    var addNum = parseFloat(coverage.addNum) || 0
    
    var lossPrice = '0.00'
    var lossPercent = '0.00'

    var addHoldPrice = '0.00'
    var addLossPercent = '0.00'

    var addCostPrice = '0.00'

    if (holdPrice && newPrice && holdNum){
      lossPrice = newPrice - holdPrice
      lossPrice = lossPrice * holdNum
      lossPrice = lossPrice.toFixed(2)
      lossPercent = this._calcPercent(holdPrice, newPrice)

      if(addNum > 0){
        addCostPrice = newPrice * addNum
        
        addHoldPrice = ((holdPrice * holdNum) + (newPrice * addNum)) / (parseInt(holdNum) + parseInt(addNum))
        addHoldPrice = addHoldPrice.toFixed(2)

        addLossPercent = this._calcPercent(addHoldPrice, newPrice)  
      }

      wx.setStorageSync(coverageKey, this.data.coverage)
    }

    this.setData({
      ["coverage.lossPercent"]: lossPercent,
      ["coverage.lossPrice"]: lossPrice,
      ["coverage.addHoldPrice"]: addHoldPrice,
      ["coverage.addLossPercent"]: addLossPercent,
      ["coverage.addCostPrice"]: addCostPrice
    })

  },
  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '用了涨停计算器，再也不用关灯吃面，滴蜡复盘啦~',
      path: '/pages/index/index',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})