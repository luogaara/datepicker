(function($) { // Localise the $ function

function DateInput(el, opts) {

  if (typeof(opts) != "object") opts = {};
  
  this.input = $(el);
  this.format = this.parseFormat(opts.format||this.input.data('date-format')||'mm/dd/yyyy');

  this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "keydownHandler", "selectDate");
  
  this.build(); //拼接模板
  console.log('build ok');
  return;
  this.selectDate(); //默认选中
  this.hide(); //默认隐藏
};

DateInput.prototype = {
  month_names: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  short_month_names: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
  short_day_names: ["日", "一", "二", "三", "四", "五", "六"],
  start_of_week: 0,
  build: function() {

    var monthHeader = $('<div class="calendarPlugin_top"><div>'+
      '<a href="javascript:void(0);" class="i-calendarLeft prev_month"></a>' +
      '<a href="javascript:void(0);" class="calendarPlugin_time" id="calendar_date"></a>'+
      '<a href="javascript:void(0);" class="i-calendarRight next_month"></a>'+
      '</div></div>'
      );

    var yearHeader = $('<div class="calendarPlugin_top"><div>'+
      '<a href="javascript:void(0);" class="i-calendarLeft prev_year"></a>' +
      '<span href="javascript:void(0);" class="calendarPlugin_timeS" id="calendar_year"></span>'+
      '<a href="javascript:void(0);" class="i-calendarRight next_year"></a>'+
      '</div></div>'
      );
    
    //拼接月视图字符串
    var oneMonthStr = '';
    var monthStr = '';
    var i = 0;
    while (i < 12) {
      oneMonthStr += '<td><div>'+this.month_names[i++]+'</div></td>';  
      if ( i%4 === 0 ){
        monthStr += '<tr>' + oneMonthStr + '</tr>';
        oneMonthStr = '';
      }
    }

    var monthStr = '<table class="calendarPluginTable_other monthChoose">'+ monthStr +'</table>';

    this.calendarDateEl = $("#calendar_date",monthHeader);
    this.calendarYearEl = $("#calendar_year",yearHeader);

    $(".prev_month", monthHeader).click(
        this.bindToObj(function() { 
            this.moveMonthBy(-1); 
        })
    );

    $(".next_month", monthHeader).click(
        this.bindToObj(function() { 
            this.moveMonthBy(1); 
        })
    );
    
    //前一年
    $(".prev_year", yearHeader).click(
        this.bindToObj(function() { 
            this.moveYearBy(-1); 
        })
    );
    //后一年
    $(".next_year", yearHeader).click(
        this.bindToObj(function() { 
            this.moveYearBy(1); 
        })
    );

    var tableShell = '<table class="calendarPluginTable"><thead><tr>';
    $(this.adjustDays(this.short_day_names)).each(function() {
      tableShell += "<th>" + this + "</th>";
    });
    tableShell += "</tr></thead><tbody></tbody></table>";
    
    var monthNav = $('<div class="tips calendarPlugin datepicker-days"></div>').append(monthHeader).append(tableShell);

    var yearNav = $('<div class="tips calendarPlugin datepicker-months" style="display:none"></div>').append(yearHeader).append(monthStr);
    

    this.rootLayers = $('<div class="date_selector"></div>').append(monthNav).append(yearNav).appendTo('body');
    
    this.dateSelector = $(".datepicker-days",this.rootLayers);
    this.monthSelector = $(".datepicker-months",this.rootLayers);

    this.tbody = $("tbody", this.dateSelector);
    this.yearTbody = $("tbody", this.monthSelector);

    //月视图选择某月
    $("td", this.yearTbody).click(this.bindToObj(function(event){
      this.chooseMonth(event);
    }));

    this.input.change(this.bindToObj(function() {
      this.selectDate(); 
    }));

    this.selectDate();
  },

  selectMonth: function(date) {
    var newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    if (!this.currentMonth || !(this.currentMonth.getFullYear() == newMonth.getFullYear() &&
                                this.currentMonth.getMonth() == newMonth.getMonth())) {
      this.currentMonth = newMonth;
      
      var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
      var numDays = this.daysBetween(rangeStart, rangeEnd);
      var dayCells = "";
      
      
      for (var i = 0; i <= numDays; i++) {
        var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i, 12, 00);
        
        //算出当前日期的农历信息
        var lunarObj = new Lunar(currentDay.getFullYear(), currentDay.getMonth()+1, currentDay.getDate());
        var lunarDate = lunarObj.ldayStr;
        var lunarMonth = lunarObj.lmonthStr;

        if (this.isFirstDayOfWeek(currentDay)) dayCells += "<tr>";
        
        if (currentDay.getMonth() == date.getMonth()) {
            dayCells += '<td class="selectable" title="农历'+lunarMonth+lunarDate+'" date="' + this.dateToString(currentDay) + '"><div><span>' + currentDay.getDate() + '</span><p>'+lunarDate+'</p></div></td>';
        } else {
          dayCells += '<td class="noDay" title="农历'+lunarMonth+lunarDate+'" date="' + this.dateToString(currentDay) + '"><div><span>' + currentDay.getDate() + '</span><p>'+lunarDate+'</p></div></td>';
        };
        
        if (this.isLastDayOfWeek(currentDay)) dayCells += "</tr>";
      };
      this.tbody.empty().append(dayCells);
      
      this.calendarDateEl.empty().append(this.currentMonth.getFullYear()+"年"+this.monthName(date));
      this.calendarYearEl.empty().append(this.currentMonth.getFullYear()+"年");

      this.calendarDateEl.unbind().click(this.bindToObj(function(e) {
        this.changeToMonthView(date);
        if(!this.input.val()){
          this.input.prop('value', this.formatDate(new Date(), this.format));  
        }
        this.hightLightMonth(new Date(this.input.val())); 
      }));
      
      //月份hover效果
      $("td div", this.yearTbody).mouseover(function() {
        var clsName = $(this).attr('class');
        if (!!!clsName) {
          $(this).addClass("onHoverDay");  
      }       
        
      });

      $("td div", this.yearTbody).mouseout(function() { 
        if (!$(this).hasClass('onDay')){
          $(this).removeClass("onHoverDay")
        }
      });

      //点击某天
      $(".selectable", this.tbody).click(this.bindToObj(function(event) {
        this.changeInput($(event.currentTarget).attr("date"));
      }));
            
      //高亮今日
      $("td[date=" + this.dateToString(new Date()) + "] div", this.tbody).addClass("onDay");
      
      $("td.selectable div", this.tbody).mouseover(function() { 
        if (!$(this).hasClass('onDay') ){
          $(this).addClass("onHoverDay")   
        }

      });

      $("td.selectable div", this.tbody).mouseout(function() { 
        if (!$(this).hasClass('onDay')){
          $(this).removeClass("onHoverDay")
        }
      });
      
      
    };
    
  },

  selectDate: function(date) {
    if (typeof(date) == "undefined") {    
      date = this.parseDate(this.input.val(),this.format);
    };
    if (!date) date = new Date();
    this.selectedDate = date;

    this.selectedDateString = this.dateToString(this.selectedDate);  
    this.selectMonth(this.selectedDate);
  },
  
  chooseMonth: function (event) {
    event.stopPropagation();
    var target = $(event.target).closest('div');    
    var s = target[0].innerText;
    var clickedMonth = s.substring(0,s.length-1);
    
    var newMonth = new Date(this.currentMonth.getFullYear(), clickedMonth - 1, this.parseDate(this.input.val(),this.format).getDate());
    
    this.input.prop('value', this.formatDate(newMonth, this.format));
    this.addClickStyle(false, newMonth);
    this.selectMonth(newMonth);
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
    this.dateSelector.hide();
    this.monthSelector.show();
  },

  changeToDateView: function() {
    this.dateSelector.show();
    this.monthSelector.hide();  
  },

  hightLightMonth: function(date) {
      var months = $("td div",this.yearTbody).removeClass('onClick');
      
      if (date.getFullYear() == this.currentMonth.getFullYear()){
        months.eq(this.short_month_names[date.getMonth()]-1).addClass('onClick');    
      }

      months.eq(this.short_month_names[new Date().getMonth()]-1).removeClass('onDay');
      
      //给定时间的年份等于当前年份时才显示当月
      if (this.currentMonth.getFullYear() === (new Date().getFullYear())) {
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
        this.addClickStyle(true, inputVal);
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
    if (event.target != this.input[0] && (!this.insideDateSelector(event) || !this.insideMonthSelector(event))) {
      this.hide();
      this.dateSelector.show();
      this.monthSelector.hide();
    };
  },
  
  // 当前鼠标点击在日期选择区域内返回true
  insideDateSelector: function(event) {
    var offset = this.dateSelector.position();
    offset.right = offset.left + this.dateSelector.outerWidth();
    offset.bottom = offset.top + this.dateSelector.outerHeight();
    
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  },
  // 当前鼠标点击在月份选择区域内返回true
  insideMonthSelector: function(event) {
    var offset = this.monthSelector.position();
    offset.right = offset.left + this.monthSelector.outerWidth();
    offset.bottom = offset.top + this.monthSelector.outerHeight();
    
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  },
  
  // 键盘事件处理
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
  
  //todo 不完善
  setPosition: function() {
    var offset = this.input.offset();
    this.rootLayers.css({
      top: offset.top + this.input.outerHeight(),
      left: offset.left
    });
  },
  
  // 翻天
  moveDateBy: function(amount) {
    var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + amount);
    this.addClickStyle(false, newDate);
    
  },
  
  // pagedown pageup 翻月
  moveDateMonthBy: function(amount) {
    var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + amount, this.selectedDate.getDate());
    if (newDate.getMonth() == this.selectedDate.getMonth() + amount + 1) {
      newDate.setDate(0);
    };
    this.addClickStyle(false,newDate);
    
  },
  
  //翻月
  moveMonthBy: function(amount) {
    var newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + amount, this.currentMonth.getDate());
    if(!this.input.val()){
      this.input.prop('value', this.formatDate(new Date(), this.format));  
    }
    //向左翻最小值1900年2月
    if (this.currentMonth.getFullYear() <= 1900 && this.currentMonth.getMonth() + amount <= 1){
      alert('翻不了啦！');
      return;
    }
    //向右翻最大值2049年12月
    if (this.currentMonth.getFullYear() >= 2049 && this.currentMonth.getMonth() + amount >= 12){
      alert('翻不了啦！');
      return;
    }
    this.addClickStyle(true, this.input.val());
    this.selectMonth(newMonth);
  },
  

  addClickStyle: function(isStringDate, date) {
    if (isStringDate){
      var stringDateVal = date;
      this.selectDate(this.parseDate(stringDateVal,this.format));
    } else {
      var stringDateVal = this.dateToString(date);
      this.selectDate(date);
    }
    
    $("td.selectable div", this.tbody).removeClass("onClick").removeClass('onHoverDay');
    $("td[date=" + stringDateVal + "] div", this.tbody).addClass("onClick");
  },
  //翻年
  moveYearBy: function(amount) {
    if(!this.input.val()){
      this.input.prop('value', this.formatDate(new Date(), this.format));  
    }   

    if (this.currentMonth.getFullYear()+amount >= 2050 || this.currentMonth.getFullYear()+amount <= 1900){
      alert('翻不了啦');
      return;
    }

    var newMonth = new Date(this.currentMonth.getFullYear()+amount,this.currentMonth.getMonth(), this.currentMonth.getDate());

    this.selectMonth(newMonth); 
    this.hightLightMonth(new Date(this.input.val()));
    
    
  },
  
  monthName: function(date) {
    return this.month_names[date.getMonth()];
  },

  // 在方法内部将this指针指向全局的this对象
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
   
  // 返回指定两个日期之间的天数
  daysBetween: function(start, end) {
    start = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    end = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return (end - start) / 86400000;
  },

  changeDayTo: function(dayOfWeek, date, direction) {
    var difference = direction * (Math.abs(date.getDay() - dayOfWeek - (direction * 7)) % 7);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference);
  },
  
  rangeStart: function(date) {
    return this.changeDayTo(this.start_of_week, new Date(date.getFullYear(), date.getMonth()), -1);
  },  
  
  rangeEnd: function(date) {
    return this.changeDayTo((this.start_of_week - 1) % 7, new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
  },
  
  isFirstDayOfWeek: function(date) {
    return date.getDay() == this.start_of_week;
  },
  
  isLastDayOfWeek: function(date) {
    return date.getDay() == (this.start_of_week - 1) % 7;
  },
  
  adjustDays: function(days) {
    var newDays = [];
    for (var i = 0; i < days.length; i++) {
      newDays[i] = days[(i + this.start_of_week) % 7];
    };
    return newDays;
  },

  parseFormat: function(format){
      var separator = format.match(/[.\/\-\s].*?/),
        parts = format.split(/\W+/);
      if (!separator || !parts || parts.length === 0){
        throw new Error("不正确的日期格式！");
      }
      return {separator: separator, parts: parts};
  },

  parseDate: function(date, format) {
      if (!date) return;
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

var tt = new DateInput('.demo',{format:'yyyy-mm-dd'});

})(jQuery);