/**
 * 日期选择类（依赖于lunar.js）
 * @param {Object} target 必选,需要绑定的元素对象,要求是jQuery对象
 * @param {Date} date 可选,初始化的时间
 * @param {String} dateFormat 可选,日期显示格式。如"yyyy-MM-dd"
 * @param {Function} callback 可选,选择日期后的回调
 * @param {String} direction 可选,日历选择器的展示位置。默认展示在元素target下方并左对齐
 * 
 * @examples
 * new CalendarSelector({container:$("#demo"),date:'2014-11-12',dateFormat:'yyyy-MM-dd'});
 * 
 */
;
(function($) {
    /**
     * 工具类
     * 提供一般的工具方法,抽离原因是希望日历选择器可以独立适用于各页面
     */
    var Tools = {
            Date: {
                /**
                 * 将日期字符串转换成标准日期对象
                 * @param {String} str 时间字符串,如 2014/01/01 或者2014-1-1
                 */
                parse: function(str) {
                    if (/^\d{10}$/.test(str)) {
                        return new Date(str * 1000);
                    } else if (/^\d{13}$/.test(str)) {
                        return new Date(str * 1);
                    }
                    str = Tools.Text.trim(str);
                    var reg = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;
                    var m = str.match(reg);
                    if (m) {
                        var year = m[1];
                        var month = parseInt(m[2] - 1, 10);
                        var day = parseInt(m[3], 10);
                        var hour = parseInt(m[4], 10);
                        return new Date(year, month, day);
                    } else {
                        return undefined;
                    }
                },
                /**
                 * 将时间对象格式化成指定格式的时间字符串
                 * @param {String} date 时间对象
                 * @param {Date} text 要格式化的文本格式
                 * @returns {String}
                 * @example
                 * Tools.Date.formatToString(new Date(), 'yyyy-MM-dd')
                 */
                formatToString: function(date, text) {
                    var reg = /yyyy|yy|M+|d+|S|w/g;
                    text = text.replace(reg, function(pattern) {
                        var result;
                        switch (pattern) {
                            case "yyyy":
                                result = date.getFullYear();
                                break;
                            case "yy":
                                result = date.getFullYear().toString().substring(2);
                                break;
                            case "M":
                            case "MM":
                                result = date.getMonth() + 1;
                                break;
                            case "dd":
                            case "d":
                                result = date.getDate();
                                break;
                            default:
                                result = "";
                                break;
                        }
                        if (pattern.length == 2 && result.toString().length == 1) {
                            result = "0" + result;
                        }
                        return result;
                    });
                    return text;
                },
            },
            Text: {
                /**
                 * 格式化字符串，提供数组和object两种方式
                 * @example
                 * Tools.Text.format("hello,{name}",{name:"kitty"})
                 * Tools.Text.format("hello,{0}",["kitty"])
                 * @returns {String}
                 */
                format: function(str, arr) {
                    var reg;
                    if ($.isArray(arr)) {
                        reg = /\{([\d]+)\}/g;
                    } else {
                        reg = /\{([\w]+)\}/g;
                    }
                    return str.replace(reg, function($0, $1) {
                        var value = arr[$1];
                        if (value !== undefined) {
                            return value;
                        } else {
                            return "";
                        }
                    });
                },
                
                trim: function(str) {
                    var str = str,
                    str = str.replace(/^\s\s*/, ''),
                    ws = /\s/,
                    i = str.length;
                    while (ws.test(str.charAt(--i)));
                        return str.slice(0, i + 1);
                }
            }
        }
    /**
     * 日历选择器
     */
    function CalendarSelector(options) {
        this.initialize(options);
    }

    CalendarSelector.prototype = {
        /**
         * 界面元素的模板
         */
        template: {
            main: ['<div class="calendarSelector">',
                        '<div class="tips calendarPlugin" id="datepickerDays" style="display: block;">',
                            '<div class="calendarPlugin_top">',
                                '<a href="javascript:void(0);" class="i-calendarLeft" id="prevMonth"></a>',
                                '<a href="javascript:void(0);" class="calendarPlugin_time" id="dateDisplay">',
                                '</a>',
                                '<a href="javascript:void(0);" class="i-calendarRight" id="nextMonth"></a>',
                                '<input type="hidden" id="currentDate" />',
                            '</div>',
                            '<table class="calendarPluginTable">',
                                '<thead>',
                                    '<tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>',
                                    '</thead>',
                                    '<tbody id="dateSelectorTBody"></tbody>',
                            '</table>',
                        '</div>',
                        '<div class="tips calendarPlugin" id="datepickerMonths" style="display: none;">',
                            '<div class="calendarPlugin_top">',
                                '<a href="javascript:void(0);" class="i-calendarLeft" id="prevYear"></a>',
                                '<span class="calendarPlugin_timeS" id="yearDisplay">','</span>',
                                '<a href="javascript:void(0);" class="i-calendarRight" id="nextYear"></a>',
                            '</div>',
                            '<table class="calendarPluginTable_other monthChoose">',
                                '<tbody id="monthSelectorTBody">',
                                '<tr>',
                                    '<td><div>1月</div></td>',
                                    '<td><div>2月</div></td>',
                                    '<td><div>3月</div></td>',
                                    '<td><div>4月</div></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><div>5月</div></td>',
                                    '<td><div>6月</div></td>',
                                    '<td><div>7月</div></td>',
                                    '<td><div>8月</div></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><div>9月</div></td>',
                                    '<td><div>10月</div></td>',
                                    '<td><div>11月</div></td>',
                                    '<td><div>12月</div></td>',
                                '</tr>',
                                '</tbody>',
                            '</table>',
                        '</div>',
                    '</div>'].join(''),

            date: ['<td class="{isSelectable}" title="农历{lunarDateStr}" date="{stringDate}">',
                        '<div class="{isToday}">',
                            '<span>{currentDay}</span>','<p>{lunarDate}</p>',
                        '</div>',
                    '</td>'
                    ].join('')

        },
        monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        monthNumber: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        minYear: 1900,
        maxYear: 2049,
        /**
         * 初始化
         * @param {Object} target 必选,需要绑定的元素对象,要求是jQuery对象
         * @param {Date} date 可选,初始化的时间
         * @param {String} dateFormat 可选,日期显示格式。如"yyyy-MM-dd"
         * @param {Function} callback 可选,选择日期后的回调
         * @param {String} direction 可选,日历选择器的展示位置。默认展示在元素target下方并左对齐
         */
        initialize: function(options) {
            var self = this;
            //参数初始化
            options || (options = {}); //容错

            this.target = $(options.container);
            
            if (!this.target) { //必须的参数检测
                throw new Error('[CalendarSelector] container is empty!');
            }

            //date参数转换和保存
            var date = options.date || new Date();

            if (typeof date !== 'object') {
                date = Tools.Date.parse(date);
            }

            this.date = date || new Date();
            
            this.dateFormat = options.dateFormat || "yyyy-MM-dd";

            this.direction = options.direction || "rightBottom";

            this.pickerArea = $(this.template.main);
            //this.pickerArea.insertAfter(this.target);  
            
            /*this.keepElements();
            this.hiddenInput.val(Tools.Date.formatToString(this.date,this.dateFormat));*/ //保存日期
            //this.renderAndAddStyle(this.date);

            //事件绑定
            //this.initEvents();
            this.target.on('click', function(event) {
                self.show();
            });
        },

        /**
         * 绑定事件
         */
        initEvents: function() {
            
            var self = this;
            
            this.prevMonthBtn.on('click', function(event) {
                self.addMonth(-1); 
            });

            this.nextMonthBtn.on('click', function(event) {
                self.addMonth(1); 
            });

            this.prevYearBtn.on('click', function(event) {
                self.addYear(-1); 
            });
            
            this.nextYearBtn.on('click',  function(event) {
                self.addYear(1); 
            });
            //选择某月
            this.monthTdBtn.on('click', function(event) {
                self.selectMonth(event);
            });
            // 选择某天
            this.dateSelectorTbodyEl.on('click', 'td.selectable',function(event) {
              self.changeDate($(event.currentTarget).attr("date"));
            });

            //注册mouseover与mouseout事件
            this.monthSelectorTbodyEl.on({
                mouseover: function() {
                var clsName = $(this).attr('class');
                if (!!!clsName) {
                  $(this).addClass("onHoverDay");  
                }  
              },
              mouseout: function() {
                if (!$(this).hasClass('onDay')){
                    $(this).removeClass("onHoverDay");
                }
              }
            },'td div');

            this.dateSelectorTbodyEl.on({
                mouseover: function() {
                if (!$(this).hasClass('onDay') ){
                    $(this).addClass("onHoverDay");
                } 
              },
              mouseout: function() {
                if (!$(this).hasClass('onDay')){
                    $(this).removeClass("onHoverDay");
                }
              }
            },'td.selectable div');
        },

        show: function(e) {
            var self = this;
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            var calendarAreaEL = this.target.next('.calendarSelector');
            if (calendarAreaEL.length == 0){ //还没渲染
                console.log('no render');
                this.pickerArea.insertAfter(this.target); 
                this.keepElements();
                this.hiddenInput.val(Tools.Date.formatToString(this.date,this.dateFormat));                    
                this.renderAndAddStyle(this.date);
                this.initEvents();
            }else{
                this.renderAndAddStyle(this.date); //获取到刚刚点击的日期
                this.target.next('.calendarSelector').css("display", "block");
            }

            this.height = this.target.outerHeight();
            this.place();
            $(window).on('resize',function(event) {
                self.place();
            });
            $(document).keydown($.proxy(this.keydownHandler,self));
            $(document).on('mousedown', function(ev){
                if ($(ev.target).closest('.calendarSelector').length == 0) {
                    self.hide();
                }
            });
        },
        hide: function(){
            $(window).off('resize', this.place);
            $(document).off('mousedown', this.hide);
            $(document).off("keydown", this.keydownHandler);
            this.pickerArea.css("display", "none");            
        },
        place: function(){
            var offset = this.target.offset();
            this.pickerArea.css({
                top: offset.top + this.height,
                left: offset.left
            });
        },
        /** 
         * 缓存相关DOM节点及DOM区域
         **/
        keepElements: function() {
            var self = this;
            
            self.prevMonthBtn = $('#prevMonth', this.pickerArea);
            self.nextMonthBtn = $('#nextMonth', this.pickerArea);
            self.prevYearBtn = $('#prevYear', this.pickerArea);
            self.nextYearBtn = $('#nextYear', this.pickerArea);
            
            self.dateDisplayEl = $('#dateDisplay', this.pickerArea);
            self.yearDisplayEl = $('#yearDisplay', this.pickerArea);

            self.dateSelectorEl = $('#datepickerDays', this.pickerArea);
            self.monthSelectorEl = $('#datepickerMonths', this.pickerArea);
            self.dateSelectorTbodyEl = $('#dateSelectorTBody', self.dateSelectorEl);
            self.hiddenInput = $('#currentDate',self.dateSelectorEl);
            self.monthSelectorTbodyEl = $('#monthSelectorTBody', self.monthSelectorEl);
            self.monthTdBtn = $("td", this.monthSelectorTbodyEl);
        },
        /**
         *  渲染日期选择区域 
         */
        renderDateSelectArea: function(date) {

            var self = this;

            if (typeof date !== 'object') {
                console.log('渲染日期必须为对象');
            }
            var newDate = new Date(date.getFullYear(), date.getMonth(), 1);

            if (this.isSameDate(newDate)) {

                this.currentDate = newDate;

                var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
                var numDays = this.daysBetween(rangeStart, rangeEnd);      
                var dayCells = "";
                var datesArr = [];
                var dateArr = [];

                //开始渲染
                for (var i = 0; i <= numDays; i++) {
                    
                    var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i, 12, 00);

                    var html = '',
                        className = '',
                        //isClickDay = '',
                        isToday = '';
                    //判断当前日期是否属于当前月份
                    if (currentDay.getMonth() == date.getMonth()) {
                        className = 'selectable';
                    } else {
                        className = 'noDay';
                    }

                    //判断当前日期是否是今日
                    if (this.isToday(currentDay)) {
                        isToday = 'onDay';
                    }
                    
                    //算出当前日期的农历信息
                    var lunarObj = new Lunar(currentDay.getFullYear(), currentDay.getMonth() + 1, currentDay.getDate());
                    var lunarDate = lunarObj.ldayStr;
                    var lunarMonth = lunarObj.lmonthStr;
                    var lunarStr = lunarMonth + lunarDate;

                    //将当前日期转换成字符串
                    var stringDate = Tools.Date.formatToString(currentDay, 'yyyy-MM-dd');

                    html = Tools.Text.format(this.template.date, {
                        isSelectable: className,
                        lunarDateStr: lunarStr,
                        stringDate: stringDate,
                        isToday: isToday,
                        currentDay: currentDay.getDate(),
                        lunarDate: lunarDate
                    });
                    
                    dateArr.push(html);

                    if ( (i+1) % 7 == 0){
                        var trElement = '<tr>' + dateArr.join('') + '<tr>';
                        datesArr.push(trElement);
                        dateArr = []; //清空
                    }
                  }

                this.dateSelectorTbodyEl.html(datesArr.join('')); //追加到日期选择的tbody中去
              
                this.dateDisplayEl.html(this.currentDate.getFullYear() + "年" + (this.getMonthName(date)));
                this.yearDisplayEl.html(this.currentDate.getFullYear() + "年");

                //渲染完后
                this.bindRenderEvents(date);              
            }
        },
        /**
         * 渲染日期选择试图后需要重新绑定的方法
         * @param  {Object} date 当前日期
         */
        bindRenderEvents: function(date) {
            var self = this;
            this.dateDisplayEl.on('click',function(e) {
                self.changeToMonthView();
                self.hightLightMonth(date);
                e.stopPropagation();
            });

            $("td.selectable div", this.dateSelectorTbodyEl).mouseout(function() { 
                if (!$(this).hasClass('onDay')){
                    $(this).removeClass("onHoverDay")
                }
            });
            
        },

        hightLightMonth: function(date) {
          
            var months = $("td div",this.monthSelectorTbodyEl).removeClass('onClick');

            if (date.getFullYear() == this.currentDate.getFullYear()){      
                months.eq(this.monthNumber[date.getMonth()]-1).addClass('onClick');    
            }

            months.eq(this.monthNumber[new Date().getMonth()]-1).removeClass('onDay');

            //给定时间的年份等于当前年份时才显示当月
            if (this.currentDate.getFullYear() === (new Date().getFullYear())) {
                months.eq(this.monthNumber[new Date().getMonth()]-1).addClass('onDay');
            }
        },
        isSameDate: function(newDate) {
          return !this.currentDate || !(this.currentDate.getFullYear() == newDate.getFullYear() && this.currentDate.getMonth() == newDate.getMonth())
        },
        /**
         * 判断给定的日期是否为今日
         * @param  {[Object]}  date [给定的标准日期对象]
         * @return {Boolean}      [是否今日]
         */
        isToday: function(date) {
            var currentDay = date;
            var now = new Date();
            return (currentDay.getMonth() == now.getMonth()) && (currentDay.getFullYear() == now.getFullYear()) && (currentDay.getDate() == now.getDate())
        },

        /*isClickDay: function(currentDay,date) {
            return (currentDay.getMonth() == date.getMonth()) && (currentDay.getFullYear() == date.getFullYear()) && (currentDay.getDate() == date.getDate())
        },*/
        changeToMonthView: function() {
            this.dateSelectorEl.hide();
            this.monthSelectorEl.show();
        },
        changeToDateView: function() {
            this.dateSelectorEl.show();
            this.monthSelectorEl.hide();  
        },

        /**
         * 月切换
         * @param {Int} month 上一月下一月,month可为负数,负数表示上一个月
         */
        addMonth: function(amount) {

            var newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + amount, this.currentDate.getDate());

            //默认最小值1900年2月
            if (this.currentDate.getFullYear() <= this.minYear && this.currentDate.getMonth() + amount <= 1){
              alert('翻不了啦！');
              return;
            }
            //默认最大值2049年12月
            if (this.currentDate.getFullYear() >= this.maxYear && this.currentDate.getMonth() + amount >= 12){
              alert('翻不了啦！');
              return;
            }

            this.renderAndAddStyle(this.getSelectedDateObj(),this.fromMonthClick);
            this.renderDateSelectArea(newDate);
        },
        /**
         * 统一在该方法内重新渲染月视图及添加onClick样式
         * @param  {Object} date           选择的日期
         * @param  {Boolean} fromMonthClick 是否从月视图点过来的
         * @return 
         */
        renderAndAddStyle: function(date,fromMonthClick) {
            var stringDate = Tools.Date.formatToString(date,'yyyy-MM-dd');
            this.hiddenInput.val(Tools.Date.formatToString(date,this.dateFormat));
            this.renderDateSelectArea(date);

            $("td.selectable div", this.dateSelectorTbodyEl).removeClass("onClick").removeClass('onHoverDay');
            if (!fromMonthClick) {
                $("td[date=" + stringDate + "] div", this.dateSelectorTbodyEl).addClass("onClick");    
            }
            
        },
        /**
         * 年切换
         * @param {Int} year 上一年下一年,year可以为负数,负数表示上一年
         */
        addYear: function(amount) {

            if (this.currentDate.getFullYear() + amount > this.maxYear || this.currentDate.getFullYear() + amount <= this.minYear){
              alert('翻不了啦');
              return;
            }
            var newDate = new Date(this.currentDate.getFullYear()+amount,this.currentDate.getMonth(), this.currentDate.getDate());
            
            this.renderDateSelectArea(newDate);
            this.hightLightMonth(this.getSelectedDateObj());
        },
        /**
         * 选择月份
         * @param  {Object} event 事件对象
         */
        selectMonth: function (event) {
            event.stopPropagation(); //防止冒泡
            var target = $(event.target).closest('div');
            var s = target[0].innerHTML;
            var clickedMonth = s.substring(0,s.length-1);
            
            var newDate = new Date(this.currentDate.getFullYear(), clickedMonth - 1, this.getSelectedDateObj().getDate());
            
            this.hiddenInput.val(Tools.Date.formatToString(newDate, this.dateFormat));
            this.fromMonthClick = true;
            this.renderAndAddStyle(this.getSelectedDateObj(),this.fromMonthClick);

            this.changeToDateView();
        },
        /**
         * 选择一个日期
         * @param  {Object} dateString 日期字符串
         */
        changeDate: function(dateString) {

            var dateObj = Tools.Date.parse(dateString);
            this.date = dateObj;
            var formatedDate = Tools.Date.formatToString(dateObj,this.dateFormat);
            var selectedYear = dateObj.getFullYear();
            var selectedMonth = dateObj.getMonth() + 1;
            var selectedDate = dateObj.getDate();
            this.hiddenInput.val(formatedDate);

            var lunarObj = new Lunar(selectedYear, selectedMonth, selectedDate);
            var lunarDate = lunarObj.ldayStr;
            var lunarMonth = lunarObj.lmonthStr;
            var lunarStr = lunarMonth + lunarDate;
            //返回给调用者的数据
            var callbackData = {
                dateObj:dateObj,
                dateString:formatedDate,
                year:selectedYear,
                month:selectedMonth,
                date:selectedDate,
                lunarDate:lunarDate,
                lunarMonth: lunarMonth,
                lunarMonthDate: lunarStr
            };
            this.callback(callbackData);

            this.fromMonthClick = false;
            this.hide();
            
        },
        // 翻天处理
        switchTo: function(amount) {
            
            var selectedDate = this.getSelectedDateObj();
            var pickerDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + amount);
            this.renderAndAddStyle(pickerDate);
        },
        getSelectedDateObj: function() {
            return Tools.Date.parse(this.hiddenInput.val());
        },
        // 翻月处理（针对 pageup与pagedown）
        moveDateMonthBy: function(amount) {
            var selectedDate = this.getSelectedDateObj();
            var pickerDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, selectedDate.getDate());
            if (pickerDate.getMonth() == selectedDate.getMonth() + amount + 1) {
                pickerDate.setDate(0);
            };
            this.renderAndAddStyle(pickerDate);
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
            return this.changeDayTo(0, new Date(date.getFullYear(), date.getMonth()), -1);
        },  
      
        // 找到当前日期视图的最后一天
        rangeEnd: function(date) {
            return this.changeDayTo(-1 % 7, new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
        },
        //返回date的月份
        getMonthName: function(date) {
            return this.monthNames[date.getMonth()];

        },
        // 键盘事件
        keydownHandler: function(event) {

            switch (event.keyCode) {
                case 9: // tab
                case 27: // esc
                    this.hide();
                    return;
                break;
                case 13: // 回车
                    this.changeDate(this.hiddenInput.val());
                    break;
                case 33: // 上一页
                    this.moveDateMonthBy(event.ctrlKey ? -12 : -1);
                    break;
                case 34: // 下一页
                    this.moveDateMonthBy(event.ctrlKey ? 12 : 1);
                    break;
                case 38: // 上
                    this.switchTo(-7);
                    break;
                case 40: // 下
                    this.switchTo(7);
                break;
                case 37: // 左
                    this.switchTo(-1);
                    break;
                case 39: // 右
                    this.switchTo(1);
                    break;
                default:
                return;
            }
            event.preventDefault();
        },
        /**
         * 回调方法
         * @example
           var calendar = new CalendarSelector({container:$("#divId")});
           calendar.onchange(function(data){
               console.log(data);
           });
         */
        onchange: function(callback) {
            this.callback = callback;
        }
    };
    //构造器
    CalendarSelector.prototype.constructor = CalendarSelector;
    //exports
    window.CalendarSelector = CalendarSelector;
})(jQuery);

/**
 * 农历类
 * @param year {Int} 年
 * @param month {Int} 月，其中由1-12分别表示1-12月
 * @param day {Int} 日
 * 
 * @examples
 * new Lunar(); 
 * new Lunar(2014,12,30);
 * 
 */
; (function () {

    function Lunar() {
        this.date = (arguments.length != 3) ? new Date() : new Date(arguments[0], arguments[1] - 1, arguments[2]);

        //设置公农历信息
        this.setLunar();
    }

    //农历相关的中文字符串
    Lunar.prototype.HsString = '甲乙丙丁戊己庚辛壬癸'.split(''); //prototype中,只计算一次,split性能损失小
    Lunar.prototype.EbString = '子丑寅卯辰巳午未申酉戌亥'.split('');
    Lunar.prototype.NumString = "一二三四五六七八九十".split('');
    Lunar.prototype.MonString = "正二三四五六七八九十冬腊".split('');
    Lunar.prototype.YearString = "零一二三四五六七八九".split('');
    Lunar.prototype.Animals = "鼠牛虎兔龙蛇马羊猴鸡狗猪".split('');
    Lunar.prototype.Weeks = "日一二三四五六".split('');
    Lunar.prototype.WeekStart = "星期";
    Lunar.prototype.CalendarData = [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,//1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,//1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,//2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
        0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,//2050-2059
        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
        0x052d0, 0x0a9b8, 0x0a950, 0x0a4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba0, 0x0a5b0, 0x052b0,
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d260,
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
        0x0d520 //2100
    ];

    Lunar.prototype.setLunar = function (date) {
        date || this.date || (date = new Date());

        /** 设置到对象 **/
        var lunar = this.getLunar(date);

        //公历的时间
        this.year = this.date.getFullYear();
        this.month = this.date.getMonth() + 1; //js中用0-11表示1-12月
        this.day = this.date.getDate();
        //星期
        this.week = this.date.getDay();
        //公历闰年(在我有限的生命里,这样算是对的)
        this.isLeap = this.year % 4 === 0; //简化计算闰年, 1900-2049这样算是没问题的

        //闰月标记
        this.isLeapMonth = lunar.isLeap; //表示当月是否是农历的闰月
        //生肖
        this.animal = lunar.animal;
        //农历年月日
        this.lyear = lunar.lyear;
        this.lmonth = lunar.lmonth;
        this.lday = lunar.lday;
        //农历描述
        this.lyearStr = this.toLunarYear(this.lyear);
        this.lmonthStr = this.toLunarMonth(this.lmonth);
        this.ldayStr = this.toLunarDay(this.lday);
        //星期
        this.weekStr = this.toWeekDay(this.week);
        //干支纪年
        this.hsebYear = lunar.yHSEB;
    };

    //获取农历的闰月月份，无则返回0
    Lunar.prototype.leapMonth = function (year) {
        return (this.CalendarData[year - 1900] & 0xf);
    };
    //返回农历年 闰月的天数
    Lunar.prototype.leapDays = function (year) {
        if (this.leapMonth(year))
            return (this.CalendarData[year - 1900] & 0x10000) ? 30 : 29;
        else
            return 0;
    };
    //传回农历年的总天数
    Lunar.prototype.leapYearTotalDays = function (year) {
        var i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            sum += (this.CalendarData[year - 1900] & i) ? 1 : 0;
        }
        return (sum + this.leapDays(year));
    };
    //返回农历月的总天数
    Lunar.prototype.leapMonthTotalDays = function (year, month) {
        return (this.CalendarData[year - 1900] & (0x10000 >> month)) ? 30 : 29;
    };

    //获取农历信息
    Lunar.prototype.getLunar = function (date) {
        date = date || this.date;
        var i, leap = 0, temp = 0;
        var baseDate = new Date(1900, 0, 31);
        var offset = (date - baseDate) / 86400000;
        var lyear, lmonth, lday, yearCyl, monthCyl, dayCyl, isLeap;

        dayCyl = offset + 40;
        monCyl = 14;

        for (i = 1900; i < 2050 && offset > 0; i++) {
            temp = this.leapYearTotalDays(i);
            offset -= temp;
            monCyl += 12;
        }
        if (offset < 0) {
            offset += temp;
            i--;
            monCyl -= 12;
        }

        lyear = i;
        yearCyl = i - 1864;

        leap = this.leapMonth(i); //闰哪个月
        isLeap = false;

        for (i = 1; i < 13 && offset > 0; i++) {
            //闰月
            if (leap > 0 && i == (leap + 1) && isLeap == false) {
                --i;
                isLeap = true;
                temp = this.leapDays(lyear);
            }
            else {
                temp = this.leapMonthTotalDays(lyear, i);
            }

            //解除闰月
            if (isLeap == true && i == (leap + 1)) {
                isLeap = false;
            }

            offset -= temp;
            if (isLeap == false) {
                monCyl++;
            }
        }

        if (offset == 0 && leap > 0 && i == leap + 1) {
            if (isLeap) {
                isLeap = false;
            }
            else {
                isLeap = true;
                --i;
                --monCyl;
            }
        }

        if (offset < 0) {
            offset += temp;
            --i;
            --monCyl;
        }

        lmonth = i;
        lday = offset + 1;

        lday = Math.floor(lday);
        yearCyl = Math.floor(yearCyl);
        monCyl = Math.floor(monCyl);
        dayCyl = Math.floor(dayCyl);

        return {
            lyear: lyear,
            lmonth: lmonth,
            lday: lday,
            yHSEB: this.toHseb(lyear), //立春为界，传农历年
            isLeap: isLeap,
            animal: this.Animals[yearCyl % 12] //生肖
        };
    };

    //获取干支内容
    //月历干支好像计算有bug，暂时废弃
    Lunar.prototype.hseb = function (number) {
        return (this.HsString[number % 10] + this.EbString[number % 12]);
    };
    //干支纪年
    Lunar.prototype.toHseb = function (year) {
        //计算方法详见
        //http://baike.baidu.com/link?url=KjaS8Kfn-XjiT8-rjCVILVxcNATfE6sEpTZK42afCsDlKWBqn62UZ9KV1MeowLzo#2_1
        var g = (year % 10) - 3;
        var z = (year % 12) - 3;
        if (g < 1) g += 10;
        if (z < 1) g += 12;
        return this.HsString[g - 1] + this.EbString[z - 1] + '年';
    }

    //农历年份转中文
    Lunar.prototype.toLunarYear = function (year) {
        if (!year) return;

        var years = this.YearString;
        return year.toString().replace(/\d{1}/gi, function (i) {
            return years[i];
        });
    };

    //农历月份转中文
    Lunar.prototype.toLunarMonth = function (month) {
        return this.MonString[month - 1] + '月';
    };

    //农历天数转中文
    Lunar.prototype.toLunarDay = function (day) {
        var lunarDay = '';
        if (day >= 30) {
            lunarDay = '三十';
        } else if (day > 20) {
            lunarDay = '廿';
        } else if (day == 20) {
            lunarDay = '二十';
        } else if (day > 10) {
            lunarDay = '十';
        } else if (day == 10) {
            lunarDay = '初十';
        } else {
            lunarDay = '初';
        }

        day = day % 10;
        if (day > 0) {
            lunarDay += this.NumString[day - 1];
        }
        return lunarDay;


        //var lunarDay = (day < 11) ? "初" : ((day < 20) ? "十" : ((day < 30) ? "廿" : "卅"));
        //if (day % 10 != 0 || day == 10) {
        //    lunarDay += this.NumString.charAt((day - 1) % 10);
        //}

        //return lunarDay;
    };

    Lunar.prototype.toWeekDay = function (week) {
        return this.WeekStart + this.Weeks[week];
    }

    window.Lunar = Lunar;
})();