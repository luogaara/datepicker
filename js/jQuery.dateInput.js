(function($) {

function DateInput(el, opts) {

  if (typeof(opts) != "object") opts = {};
  $.extend(this, DateInput.DEFAULT_OPTS, opts);
  
  this.input = $(el);
  this.format = this.parseFormat(opts.format||this.input.data('date-format')||'mm/dd/yyyy'); //TODO duoyu 

  this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "keydownHandler", "selectDate");
  
  this.build(); //构建基本的模板片段
  this.initEvents();
  this.selectDate(); //初始化绘图
  this.hide(); //默认隐藏弹框
};

DateInput.DEFAULT_OPTS = {
  month_names: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  short_month_names: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
  week_names: ["日", "一", "二", "三", "四", "五", "六"],
  start_of_week: 0 //周第一天显示 0/周日 1/周一 2/周二
};

DateInput.prototype = {

  build: function() {

    var monthHeader = $('<div class="calendarPlugin_top"><div>'+
      '<a href="javascript:void(0);" class="i-calendarLeft prev_month"></a>' +
      '<a href="javascript:void(0);" class="calendarPlugin_time" id="dateDisplay"></a>'+
      '<a href="javascript:void(0);" class="i-calendarRight next_month"></a>'+
      '</div></div>'
      );

    var yearHeader = $('<div class="calendarPlugin_top"><div>'+
      '<a href="javascript:void(0);" class="i-calendarLeft prev_year"></a>' +
      '<span href="javascript:void(0);" class="calendarPlugin_timeS" id="yearDisplay"></span>'+
      '<a href="javascript:void(0);" class="i-calendarRight next_year"></a>'+
      '</div></div>'
      );
    
    // 拼接月视图字符串 TODO tuofeng join()
    var oneMonthStr = '';
    var monthStr = '';
    var i = 0;
    while (i < 12) {
      oneMonthStr += '<td><div>' + this.month_names[i++] + '</div></td>';  
      if ( i%4 === 0 ){
        monthStr += '<tr>' + oneMonthStr + '</tr>';
        oneMonthStr = '';
      }
    }

    var monthStr = '<table class="calendarPluginTable_other monthChoose">'+monthStr+'</table>';

    // 拼接星期字符串 TODO this
    var weekStr = '<table class="calendarPluginTable"><thead><tr>';
    $(this.adjustWeeks(this.week_names)).each(function() {
      weekStr += "<th>" + this + "</th>";
    });
    weekStr += "</tr></thead><tbody></tbody></table>";

    // 拼接日期选择和月份选择视图
    var dateView = $('<div class="tips calendarPlugin datepicker-days"></div>').append(monthHeader).append(weekStr);
    var monthView = $('<div class="tips calendarPlugin datepicker-months" style="display:none"></div>').append(yearHeader).append(monthStr);
    
    //最后将其包在一个div中并追加至页面
    this.rootLayers = $('<div class="date_selector"></div>').append(dateView).append(monthView).insertAfter(this.input);

    //获取相关DOM操作节点
    console.log(monthHeader);
    this.dateDisplayEl = $("#dateDisplay",monthHeader);
    this.yearDisplayEl = $("#yearDisplay",yearHeader);
    this.dateSelectorEl = $(".datepicker-days",this.rootLayers);
    this.monthSelectorEl = $(".datepicker-months",this.rootLayers);
    this.dateSelectorTbodyEl = $("tbody", this.dateSelectorEl);
    this.monthSelectorTbodyEl = $("tbody", this.monthSelectorEl);

    // 获取事件处理节点
    this.prevMonthBtn = $(".prev_month", monthHeader);
    this.nextMonthBtn = $(".next_month", monthHeader);
    this.prevYearBtn = $(".prev_year", yearHeader);
    this.nextYearBtn = $(".next_year", yearHeader);
    this.monthTdBtn = $("td", this.monthSelectorTbodyEl);
  },

  // 初始化的事件
  initEvents: function() {

    var self = this;

    this.prevMonthBtn.click(
        function() { 
            self.moveMonthBy(-1); 
        }
    );

    this.nextMonthBtn.click(
        this.bindToObj(function() { 
            this.moveMonthBy(1); 
        })
    );
    
    this.prevYearBtn.click(
        this.bindToObj(function() {
            this.moveYearBy(-1); 
        })
    );
    
    this.nextYearBtn.click(
        this.bindToObj(function() { 
            this.moveYearBy(1); 
        })
    );
    //月视图选择某月
    this.monthTdBtn.click(this.bindToObj(function(event){
      this.selectMonth(event);
    }));

    this.input.change(this.bindToObj(function() {
      this.selectDate(); 
    }));

    this.dateSelectorTbodyEl.on('click', 'td.selectable',function(event) {
      console.log('点击某天');
      self.changeInput($(event.currentTarget).attr("date"));
    });

    this.monthSelectorTbodyEl.on({
      mouseover: function() {
        console.log('mose over');
        var clsName = $(this).attr('class');
        if (!!!clsName) {
          $(this).addClass("onHoverDay");  
        }  
      },
      mouseout: function() {
        if (!$(this).hasClass('onDay')){
        $(this).removeClass("onHoverDay")
      }
      }
    },'td div');
     
  },

  // 绘出日期选择视图 TODO 判断太长
  render: function(date) {
    //console.log('renderDate'+date);
    var now = new Date();
    var newDate = new Date(date.getFullYear(), date.getMonth(), 1);
    
    if (!this.currentDate || 
	!(this.currentDate.getFullYear() == newDate.getFullYear() && this.currentDate.getMonth() == newDate.getMonth())) {

      this.currentDate = newDate;
      
      var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
      var numDays = this.daysBetween(rangeStart, rangeEnd);      
      var dayCells = "";
      
      //开始绘图
      for (var i = 0; i <= numDays; i++) {

        var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i, 12, 00);

        //算出当前日期的农历信息
        var lunarObj = new Lunar(currentDay.getFullYear(), currentDay.getMonth() + 1, currentDay.getDate());
        var lunarDate = lunarObj.ldayStr;
        var lunarMonth = lunarObj.lmonthStr;

        if (this.isFirstDayOfWeek(currentDay)) dayCells += "<tr>";
        
        if ((currentDay.getMonth() == now.getMonth()) && (currentDay.getFullYear() == now.getFullYear()) && (currentDay.getDate() == now.getDate())) {
          console.log(currentDay.getDate());
          console.log('laila!');
        }
        // 判断当前日期是否为当月的日期，如不是，加灰
        if (currentDay.getMonth() == date.getMonth()) {
            dayCells += '<td class="selectable" title="农历'+lunarMonth+lunarDate+'" date="' + this.dateToString(currentDay) + '"><div><span>' + currentDay.getDate() + '</span><p>'+lunarDate+'</p></div></td>';
        } else {
          dayCells += '<td class="noDay" title="农历'+lunarMonth+lunarDate+'" date="' + this.dateToString(currentDay) + '"><div><span>' + currentDay.getDate() + '</span><p>'+lunarDate+'</p></div></td>';
        };
        
        if (this.isLastDayOfWeek(currentDay)) dayCells += "</tr>";
      };

      this.dateSelectorTbodyEl.html(dayCells);
      
      this.dateDisplayEl.empty().append(this.currentDate.getFullYear()+"年"+this.monthName(date));
      this.yearDisplayEl.empty().append(this.currentDate.getFullYear()+"年");
      // 绘完之后事件的重新绑定
      this.bindEvents(date);

    };
  },

  // 绘图后要绑定的事件
  bindEvents: function (date) {

    var self = this;

    this.dateDisplayEl.on('click',
        this.bindToObj(function(e) {
          this.changeToMonthView(date);
          if(!this.input.val()){
            this.input.val(this.formatDate(new Date(), this.format) );  
          }
          this.hightLightMonth(new Date(this.input.val())); 
    }));
   
            
      //高亮今日
    $("td[date=" + this.dateToString(new Date()) + "] div", this.dateSelectorTbodyEl).addClass("onDay");
      
    $("td.selectable div", this.dateSelectorTbodyEl).mouseover(function() { 
      if (!$(this).hasClass('onDay') ){
        $(this).addClass("onHoverDay")   
      }
    });

    $("td.selectable div", this.dateSelectorTbodyEl).mouseout(function() { 
      if (!$(this).hasClass('onDay')){
        $(this).removeClass("onHoverDay")
      }
    });
  },

  // 选择某天事件处理 TODO parseDate()
  selectDate: function(date) {
    if (typeof(date) == "undefined") {
      date = this.parseDate(this.input.val(),this.format);
    };
    if (!date) date = new Date();
    this.selectedDate = date;

    this.selectedDateString = this.dateToString(this.selectedDate);
    this.render(this.selectedDate); // 重绘
  },
  
  // 选择某月事件处理
  selectMonth: function (event) {
    event.stopPropagation(); //防止冒泡
    var target = $(event.target).closest('div');
    var s = target[0].innerHTML;
    var clickedMonth = s.substring(0,s.length-1);
    
    var newDate = new Date(this.currentDate.getFullYear(), clickedMonth - 1, this.parseDate(this.input.val(),this.format).getDate());
    
    this.input.prop('value', this.formatDate(newDate, this.format));

    this.selectOneDay(false, newDate);
    this.render(newDate);
    this.changeToDateView();
  },
  
  changeInput: function(dateString) {
    var dateObj = this.parseDate(dateString,this.format);    
    var formated = this.formatDate(dateObj, this.format);
    this.input.prop('value', formated).change();
    this.hide();
    this.input.blur();
  },

  changeToMonthView: function(date) {
    this.dateSelectorEl.hide();
    this.monthSelectorEl.show();
  },

  changeToDateView: function() {
    this.dateSelectorEl.show();
    this.monthSelectorEl.hide();  
  },

  hightLightMonth: function(date) {
      
      var months = $("td div",this.monthSelectorTbodyEl).removeClass('onClick');

      if (date.getFullYear() == this.currentDate.getFullYear()){      

        months.eq(this.short_month_names[date.getMonth()]-1).addClass('onClick');    
      }
      months.eq(this.short_month_names[new Date().getMonth()]-1).removeClass('onDay');

      //给定时间的年份等于当前年份时才显示当月
      if (this.currentDate.getFullYear() === (new Date().getFullYear())) {
        months.eq(this.short_month_names[new Date().getMonth()]-1).addClass('onDay');
      }
  },
  
  show: function() {
    this.rootLayers.css("display", "block");
    $([window, document.body]).click(this.hideIfClickOutside);
    this.input.unbind("focus", this.show);
    $(document.body).keydown(this.keydownHandler);
    
    if (this.input.val()){
        var inputVal = this.input.val();     
        this.selectOneDay(true, inputVal);
    }

    this.setPosition();
  },
  
  hide: function() {
    this.rootLayers.css("display", "none");
    $([window, document.body]).unbind("click", this.hideIfClickOutside);
    this.input.focus(this.show);
    $(document.body).unbind("keydown", this.keydownHandler);
  },
  
  // 当鼠标点击除当前input及日期和月份选择器之外的区域时隐藏
  hideIfClickOutside: function(event) {
    if (event.target != this.input[0] && (!this.isInsideDateSelector(event) || !this.isInsideMonthSelector(event))) {
      this.hide();
      this.dateSelectorEl.show(); 
      this.monthSelectorEl.hide();
    };
  },
  
  isInsideDateSelector: function(event) {
    var offset = this.dateSelectorEl.position();
    offset.right = offset.left + this.dateSelectorEl.outerWidth();
    offset.bottom = offset.top + this.dateSelectorEl.outerHeight();
    
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  },
  
  isInsideMonthSelector: function(event) {
    var offset = this.monthSelectorEl.position();
    offset.right = offset.left + this.monthSelectorEl.outerWidth();
    offset.bottom = offset.top + this.monthSelectorEl.outerHeight();
    
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  },

  // 键盘事件
  keydownHandler: function(event) {
    switch (event.keyCode)
    {
      case 9: // tab
      case 27: // esc
        this.hide();
        return;
      break;
      case 13: // 回车
        this.changeInput(this.selectedDateString);
      break;
      case 33: // 上一页
        this.moveDateMonthBy(event.ctrlKey ? -12 : -1);
      break;
      case 34: // 下一页
        this.moveDateMonthBy(event.ctrlKey ? 12 : 1);
      break;
      case 38: // 上
        this.moveDateBy(-7);
      break;
      case 40: // 下
        this.moveDateBy(7);
      break;
      case 37: // 左
        this.moveDateBy(-1);
      break;
      case 39: // 右
        this.moveDateBy(1);
      break;
      default:
        return;
    }
    event.preventDefault();
  },

  //转换为字符串的yyyy-mm-dd形式，方便取日期DOM
  dateToString: function(date) {
    var day = (date.getDate() < 10 ? '0' : '') + date.getDate();
    return date.getFullYear() + "-" + this.short_month_names[date.getMonth()] + "-" + day;
  },
  
  // TODO 没做自适应
  setPosition: function() {
    var offset = this.input.offset();
    this.rootLayers.css({
      top: offset.top + this.input.outerHeight(),
      left: offset.left
    });
  },
  
  // 翻天处理
  moveDateBy: function(amount) {
    var pickerDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + amount);
    this.selectOneDay(false, pickerDate);
  },
  
  // 翻月处理（针对 pageup与pagedown）
  moveDateMonthBy: function(amount) {
    var pickerDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + amount, this.selectedDate.getDate());
    if (pickerDate.getMonth() == this.selectedDate.getMonth() + amount + 1) {
      pickerDate.setDate(0);
    };
    this.selectOneDay(false,pickerDate);
  },
  
  //翻月处理  TODO 写成配置文件
  moveMonthBy: function(amount) {
    var newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + amount, this.currentDate.getDate());

    if(!this.input.val()){
      this.input.prop('value', this.formatDate(new Date(), this.format));  
    }
    //最小值1900年2月
    if (this.currentDate.getFullYear() <= 1900 && this.currentDate.getMonth() + amount <= 1){
      alert('翻不了啦！');
      return;
    }
    //最大值2049年12月
    if (this.currentDate.getFullYear() >= 2049 && this.currentDate.getMonth() + amount >= 12){
      alert('翻不了啦！');
      return;
    }
    console.log(this.input.val());
    this.selectOneDay(true, this.input.val());
    this.render(newDate);
  },
  
  // 选中某天后并加上样式
  selectOneDay: function(isStringDate, date) {
    if (isStringDate){
      var stringDateVal = date;
      var dateObj = this.parseDate(stringDateVal,this.format);
    } else {
      var stringDateVal = this.dateToString(date);
      var dateObj = date;
    }
    this.selectDate(dateObj);
    this.addSelectedStyle(stringDateVal);
  },

  addSelectedStyle: function(stringDate) {
    $("td.selectable div", this.dateSelectorTbodyEl).removeClass("onClick").removeClass('onHoverDay');
    $("td[date=" + stringDate + "] div", this.dateSelectorTbodyEl).addClass("onClick");
  },

  //翻年处理
  moveYearBy: function(amount) {
    if(!this.input.val()){
      this.input.prop('value', this.formatDate(new Date(), this.format));  
    }   
    if (this.currentDate.getFullYear()+amount >= 2050 || this.currentDate.getFullYear()+amount <= 1900){
      alert('翻不了啦');
      return;
    }

    var newDate = new Date(this.currentDate.getFullYear()+amount,this.currentDate.getMonth(), this.currentDate.getDate());

    this.render(newDate);
    this.hightLightMonth(new Date(this.input.val()));
  },
  
  monthName: function(date) {
    return this.month_names[date.getMonth()];
  },

  // 在方法内部将this指针指向全局this对象
  bindToObj: function(fn) {
    var self = this;
    return function() {
     return fn.apply(self, arguments) 
    };
  },
  
  bindMethodsToObj: function() {
    for (var i = 0; i < arguments.length; i++) {
      this[arguments[i]] = this.bindToObj(this[arguments[i]]);
    };
  },
   
  // 返回指定两个日期之间的天数 如果是42天，则返回41
  daysBetween: function(start, end) {
    var start = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    var end = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return (end - start) / 86400000;
  },

  //算出当前月份视图的第一天和最后一天
  changeDayTo: function(dayOfWeek, date, direction) {
    var difference = direction * (Math.abs(date.getDay() - dayOfWeek - (direction * 7)) % 7);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference);
  },

  // 找到当前日期视图的第一天，如：当前月为11月，则返回 Sun Oct 26 2014 00:00:00 GMT+0800 
  rangeStart: function(date) {
    return this.changeDayTo(this.start_of_week, new Date(date.getFullYear(), date.getMonth()), -1);
  },  
  
  // 找到当前日期视图的最后一天
  rangeEnd: function(date) {
    return this.changeDayTo((this.start_of_week - 1) % 7, new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
  },
  
  // 判断当前日期的星期值是否为指定的第一天显示的星期值。
  isFirstDayOfWeek: function(date) {
    return date.getDay() == this.start_of_week;
  },
  
  isLastDayOfWeek: function(date) {
    return date.getDay() == (this.start_of_week - 1) % 7;
  },
  
  // 调整周的显示
  adjustWeeks: function(weeks) {
    var newWeeks = [];
    for (var i = 0; i < weeks.length; i++) {
      newWeeks[i] = weeks[(i + this.start_of_week) % 7];
    };
    return newWeeks;
  },

  // 解析日期格式
  parseFormat: function(format){
      var separator = format.match(/[.\/\-\s].*?/),
        parts = format.split(/\W+/);
      if (!separator || !parts || parts.length === 0){
        throw new Error("不正确的日期格式！");
      }
      return {separator: separator, parts: parts};
  },

  // 将非标准的日期格式转换成标准日期对象
  parseDate: function(date, format) {
      var parts = date.split(format.separator),
        date = new Date(),
        val;
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
      if (parts.length === format.parts.length) {
        var year = date.getFullYear(), day = date.getDate(), month = date.getMonth();
        for (var i=0, cnt = format.parts.length; i < cnt; i++) {
          val = parseInt(parts[i], 10)||1;
          switch(format.parts[i]) {
            case 'dd':
            case 'd':
              day = val;
              date.setDate(val);
              break;
            case 'mm':
            case 'm':
              month = val - 1;
              date.setMonth(val - 1);
              break;
            case 'yy':
              year = 2000 + val;
              date.setFullYear(2000 + val);
              break;
            case 'yyyy':
              year = val;
              date.setFullYear(val);
              break;
          }
        }
        date = new Date(year, month, day, 0 ,0 ,0);
      }
      return date;
    },

  // 格式化自定义格式
  formatDate: function(date, format){
      var val = {
        d: date.getDate(),
        m: date.getMonth() + 1,
        yy: date.getFullYear().toString().substring(2),
        yyyy: date.getFullYear()
      };
      val.dd = (val.d < 10 ? '0' : '') + val.d;
      val.mm = (val.m < 10 ? '0' : '') + val.m;
      var date = [];
      for (var i=0, cnt = format.parts.length; i < cnt; i++) {
        date.push(val[format.parts[i]]);
      }
      return date.join(format.separator);
    }
};

$.fn.date_input = function(opts) {
  return this.each(function() {
    new DateInput(this, opts); 
  });
};

$.date_input = {
  initialize: function(opts) {
    $("input.date_input").date_input(opts);
  } 
};

return DateInput;

})(jQuery);