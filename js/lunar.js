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
