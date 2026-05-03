/** Extend Array Class **/

if (typeof (Array.prototype.sortByProp) === "undefined") {
    Array.prototype.sortByProp = function (p, reverse, aplhanum) {
        // sort by multiple props
        if (typeof p == "object" && p.length > 1) {
            if (aplhanum)
                var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

            return this.sort(function (a, b) {
                for (let i = 0; i < p.length; i++) {
                    if (reverse) {
                        if (aplhanum) {
                            return collator.compare(b[p[i]], a[p[i]]);
                        } else {
                            if (isNaN(a[p[i]]) && isNaN(b[p[i]])) {
                                if (a[p[i]] < b[p[i]])
                                    return - 1;
                                if (b[p[i]] < a[p[i]])
                                    return 1;
                            } else {
                                if (parseInt(a[p[i]]) < parseInt(b[p[i]]))
                                    return - 1;
                                if (parseInt(b[p[i]]) < parseInt(a[p[i]]))
                                    return 1;
                            }
                        }
                    } else {
                        if (aplhanum) {
                            return collator.compare(a[p[i]], b[p[i]]);
                        } else {
                            if (isNaN(a[p[i]]) && isNaN(b[p[i]])) {
                                if (a[p[i]] > b[p[i]])
                                    return - 1;
                                if (b[p[i]] > a[p[i]])
                                    return 1;
                            } else {
                                if (parseInt(a[p[i]]) > parseInt(b[p[i]]))
                                    return - 1;
                                if (parseInt(b[p[i]]) > parseInt(a[p[i]]))
                                    return 1;
                            }
                        }
                    }
                }
                return 0;
            })
        }

        // sort by single prop		
        if (reverse) {
            if (aplhanum) {
                var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

                return this.sort(function (a, b) {
                    return collator.compare(b[p], a[p]);
                });
            } else {
                return this.sort(function (a, b) {
                    if (isNaN(a[p]) && isNaN(b[p]))
                        return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
                    else
                        return (parseInt(a[p]) < parseInt(b[p])) ? 1 : (parseInt(a[p]) > parseInt(b[p])) ? -1 : 0;
                });
            }
        } else {
            if (aplhanum) {
                var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

                return this.sort(function (a, b) {
                    return collator.compare(a[p], b[p]);
                });
            } else {
                return this.sort(function (a, b) {
                    if (isNaN(a[p]) && isNaN(b[p]))
                        return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
                    else
                        return (parseInt(a[p]) > parseInt(b[p])) ? 1 : (parseInt(a[p]) < parseInt(b[p])) ? -1 : 0;
                });
            }
        };
    }
}

if (typeof (Array.prototype.contains) === "undefined") { // IE do not support the Array contains() method
    Array.prototype.contains = function (needle) {
        for (i in this) {
            if (needle.indexOf(this[i]) !== -1 || this[i] == needle) return true;
        }
        return false;
        return undefined;
    };
}

if (typeof (Array.prototype.find) === "undefined") { // IE do not support the Array find() method
    Array.prototype.find = function (testfunc) {
        for (var i = 0; i < this.length; i++) {
            if (testfunc(this[i]))
                return this[i];
        }
        return undefined;
    };
}

if (typeof (Array.prototype.findByProp) === "undefined") {
    Array.prototype.findByProp = function (prop, eq) {
        // Search array of objects, return FIRST object who's <prop> match <eq>
        // If no match <undefined> is returned
        for (var i = 0; i < this.length; i++) {
            if (this[i][prop] == eq)
                return this[i];
        }
        return undefined;
    };
}

if (typeof (Array.prototype.grep) === "undefined") {
    Array.prototype.grep = function (testfunc) {
        var ret = [];
        // Search array, return list of elements where <testfunc> returns true
        // If no match an empty array is returned
        for (var i = 0; i < this.length; i++) {
            if (testfunc(this[i]))
                ret.push(this[i]);
        }
        return ret;
    };
}

if (typeof (Array.prototype.grepByProp) === "undefined") {
    Array.prototype.grepByProp = function (prop, eq, regex) {
        var ret = [];
        // Search array of objects, return list of object who's <prop> match <eq>
        // If no match an empty array is returned
        for (var i = 0; i < this.length; i++) {
            if (regex === true) {
                var rgx = RegExp(eq, 'gi');

                if (rgx.test(this[i][prop]))
                    ret.push(this[i]);
            } else {
                if (this[i][prop] == eq)
                    ret.push(this[i]);
            }
        }
        return ret;
    };
}

if (typeof (Array.prototype.groupByProp) === "undefined") {
    Array.prototype.groupByProp = function (prop) {
        // Group By Array Of Objects
        return this.reduce(function (rv, x) {
            (rv[x[prop]] = rv[x[prop]] || []).push(x);
            return rv;
        }, {});
    }
}

if (typeof (Array.prototype.removeByProp) === "undefined") {
    Array.prototype.removeByProp = function (prop, eq, test_f) {
        // Search array of objects, remove ALL objects who's <prop> match <eq> and optional text_f returns true
        // <eq> can be a regexp
        // Return the number of removed objects
        var idx = [];
        for (var i = 0; i < this.length; i++) {
            if (typeof eq == "object") {
                try {
                    if (eq.test(this[i][prop]) && (test_f ? test_f(this[i], prop, eq) : true))
                        idx.unshift(i);
                } catch (err) {
                    error("removeByProp(): 'eq' is not a regexp")
                }
            } else {
                if (this[i][prop] == eq && (test_f ? test_f(this[i], prop, eq) : true))
                    idx.unshift(i);
            }
        }

        for (var i = 0; i < idx.length; i++) {
            this.splice(idx[i], 1);
        }

        return idx.length;
    };
}

if (typeof (Array.prototype.sumByProp) === "undefined") {
    Array.prototype.sumByProp = function (prop, eq, sumvar) {
        var ret = 0;
        // Search array of objects, return the sum of object who's <prop> match <eq>
        // If no match 0 is returned
        for (var i = 0; i < this.length; i++) {
            if ((eq || eq == "") && prop) {
                if (this[i][prop] == eq)
                    ret += (typeof this[i][sumvar] == "string" ? parseFloat(this[i][sumvar]) || 0 : this[i][sumvar]);
            } else //  if no 'prop' and 'eq' - just sum
                ret += (typeof this[i][sumvar] == "string" ? parseFloat(this[i][sumvar]) || 0 : this[i][sumvar]);
        }

        return ret;
    };
}

if (typeof (Array.prototype.arrayOfProp) === "undefined") {
    Array.prototype.arrayOfProp = function (prop, prefix = "", suffix = "") {
        var ret = [];
        // Make array of prop and return it
        if (prefix || suffix)
            for (var i = 0; i < this.length; i++) {
                ret.push((prefix ? prefix : "") + (prop ? this[i][prop] : "") + (suffix ? suffix : ""));
            }
        else
            for (var i = 0; i < this.length; i++) {
                ret.push(this[i][prop]);
            }

        return ret;
    };
}

if (typeof (Array.prototype.flatOfProp) === "undefined") {
    Array.prototype.flatOfProp = function (prop) {
        return this.flatMap(function (a) { return a[prop] })
    };
}

if (typeof (Array.prototype.convToFloat) === "undefined") {
    Array.prototype.convToFloat = function (props) {
        // Search array of objects, convert the list of props from db float to euro float
        if (!Array.isArray(props))
            props = [props];

        for (var i = 0; i < this.length; i++) {
            for (var j = 0; j < props.length; j++) {
                this[i][props[j]] = convToFloat(this[i][props[j]]);
            }
        }

        return this;
    };
}

if (typeof (Array.prototype.removeProp) === "undefined") {
    Array.prototype.removeProp = function (props, mkcopy) {
        // Search array of objects, remove properties in each object which match 
        // list of prop names or regexp
        // If <mkcopy> is true, a copy of the array is made before processig.
        // The (new) array is returned.

        var that = this;

        if (mkcopy)
            that = JSON.parse(JSON.stringify(this));

        if (props instanceof RegExp) {
            for (var i = 0; i < that.length; i++) {
                for (p in that[i]) {
                    if (p.match(props) != null)
                        delete that[i][p];
                }
            }
        } else {
            if (!Array.isArray(props))
                props = [props];

            for (var i = 0; i < that.length; i++) {
                for (var j = 0; j < props.length; j++) {
                    delete that[i][props[j]];
                }
            }
        }

        return that;
    };
}

if (typeof (Array.prototype.sum) === "undefined") {
    Array.prototype.sum = function () {
        var sum = 0;

        for (var i = 0; i < this.length; i++) {
            if (typeof this[i] == "string")
                sum += parseFloat(this[i]);
            else if (typeof this[i] == "undefined")
                ;
            else
                sum += this[i];
        }

        return sum;
    };
}

if (typeof (Array.prototype.copy) === "undefined") {
    Array.prototype.copy = function () {
        return JSON.parse(JSON.stringify(this));
    };
}

if (typeof (Array.prototype.forEachAsync) === "undefined") {
    Array.prototype.forEachAsync = async function (call) {
        for (var i = 0; i < this.length; i++) {
            await call(this[i], i);
        }
    };
}

if (typeof (Array.prototype.rotate) === "undefined") {
    // put first element in the end - or if 'reverse' put the last element in the front
    Array.prototype.rotate = function (reverse) {
        if (reverse)
            this.unshift(this.pop());
        else
            this.push(this.shift());

        return this;
    };
}


/** Extend Number Class **/

if (typeof (Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function () {
        return this * Math.PI / 180;
    };
}

if (typeof (Number.prototype.toDeg) === "undefined") {
    Number.prototype.toDeg = function () {
        return this * 180 / Math.PI;
    };
}

if (typeof (Number.prototype.rmHTML) === "undefined") {
    Number.prototype.rmHTML = function () {
        return this | 0;
    };
}

if (typeof (Number.prototype.inRange) === "undefined") {
    Number.prototype.inRange = function (range) {
        var re = /(\d+)\s*[\-]\s*(\d*)|(\d+)/g;
        var m;
        var res = false;

        while ((m = re.exec(range)) !== null) {
            if (m.index === re.lastIndex)
                re.lastIndex++;

            let r = m[0].split("-") // is in a range

            if (r.length == 1)
                res = this == parseInt(r[0]);
            else
                res = this >= parseInt(r[0]) && this <= parseInt(r[1]);

            if (res)
                return true;
        }
        return false;
    };
}

/** Extend String Class **/

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
        return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };
}

if (typeof (String.prototype.metaConfigClear) === "undefined") {
    String.prototype.metaConfigClear = function () {
        var ret = { dsp: "" };
        if (hook.run("metaConfigClear", this, ret)) {
            if (ret.dsp.length)
                return ret.dsp;
        }

        if (this.match(":") != null) {
            if (this.split(":")[0].trim().match(/^table/i)) {
                let r = this.substring(this.split(":")[0].length + 1)

                return r.split(";").map(m => { return m.metaConfigClear() })
            } else
                return this.split(":")[1].trim();
        }

        return this;
    };
}

if (typeof (String.prototype.format) === "undefined") {
    String.prototype.format = function () {
        var args = arguments;

        return this.replace(/{([%.|\w]+)}/g, function (match, number) {
            if (isNaN(number)) {
                if (number.startsWith('%') && number.endsWith('%')) {
                    // Example:
                    // "Navn på {0} er '{%name%}' og nummer er {%number%}".format(getComanysetting("order.name"), collectDataOrder.order)
                    // 
                    for (var arg of args) {
                        if (typeof arg == "object") {
                            match = match.replace("{%", "").replace("%}", "").replace(",", ".");
                            if (consObjPath(arg, match))
                                return typeof consObjPath(arg, match) != 'undefined' ? typeConvToDsp(match, consObjPath(arg, match)) : "";
                        }
                    }
                    return "";
                } else
                    return "{" + number + "}";
            } else {
                if (match.match(/(\d).(\d)/)) {
                    // handle {2.0} for metadata_2 where metadata is a table ie. an array (or JSON string array)
                    match = match.match(/(\d).(\d)/)
                    if (Array.isArray(args[match[1]]))
                        return args[match[1]][match[2]]
                    else {
                        try {
                            return JSON.parse(args[match[1]])[match[2]]
                        } catch (err) {
                            return typeof args[match[1]] != 'undefined' ? args[match[1]] : "";
                        }
                    }
                } else
                    return typeof args[number] != 'undefined' ? args[number] : "";
            }
        });

        // Old
        // return this.replace(/{(\d+)}/g, function(match, number) {
        // 			return typeof args[number] != 'undefined'
        // 			    ? args[number]
        // 			    : ""
        // 			;
        // 		    });
    };
}

if (typeof (String.prototype.isHHMMformat) === "undefined") {
    String.prototype.isHHMMformat = function () {
        if (this.match(/^[0-9]*:[0-5][0-9]$/) == null) {

            if (error)
                error(langTrans("Forkert tidsformat - skal være <i>timer:minutter</i> - f.eks. <i>7:34</i> for 7 timer og 34 min.") + " (" + this + ")");
            return false;
        }
        return true;
    };
}

if (typeof (String.prototype.isTimeOfDayformat) === "undefined") {
    String.prototype.isTimeOfDayformat = function () {
        if (this.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/) == null) {
            error(langTrans("Forkert tidsformat - skal være <i>timer:minutter</i> - f.eks. <i>7:34</i> for 7 timer og 34 min.") + " (" + this + ")");
            return false;
        }
        return true;
    };
}

if (typeof (String.prototype.isDateFormat) === "undefined") {
    String.prototype.isDateFormat = function (doerror) {
        var s = this.split("-");
        if (s.length != 3 || isNaN(s[0]) || isNaN(s[1]) || isNaN(s[2]) ||
            s[0].length != 4 || s[1].length != 2 || s[0] < 2000 || s[0] > 2030 ||
            s[1] > 12 || s[1] < 1 || s[2] > 31 || s[2] < 1) {
            if (doerror !== false && error)
                error(langTrans("Forkert datoformat - skal være <i>år-måned-dag</i> - f.eks. <i>2014-09-14</i>"));
            return false;
        }
        return true;
    };
}

if (typeof (String.prototype.isURLformat) === "undefined") {
    String.prototype.isURLformat = function (e) {
        if (this.toLowerCase().match(/(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/))
            return true;

        if (e)
            error(langTrans("Forkert URL format - skal være <i>http://eksempel.dk/navn</i>"));
        return false;
    };
}

if (typeof (String.prototype.isBase64) === "undefined") {
    String.prototype.isBase64 = function () {
        if (this === '' || this.trim() === '')
            return false;

        try {
            return btoa(atob(this)) == this;
        } catch (e) {
            return false;
        }
    };
}


if (typeof (String.prototype.rmHTML) === "undefined") {
    String.prototype.rmHTML = function (e) {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = this;
        return (tmp.textContent || tmp.innerText || "").trim();
    };
}

if (typeof (String.prototype.escapeHTML) === "undefined") {
    String.prototype.escapeHTML = function (e) {
        // let tmp = document.createElement("DIV");
        // tmp.innerHTML = this;
        // return (tmp.textContent || tmp.innerText || "").trim();
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
}


if (typeof (String.prototype.escHtmlChrs) === "undefined") {
    String.prototype.escHtmlChrs = function (reverse) {
        if (reverse)
            return this.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        else
            return this.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    };
}


if (typeof (String.prototype.escHtml) === "undefined") {
    String.prototype.escHtml = function (reverse) {
        if (reverse) {
            var escapeEl = document.createElement('textarea');
            escapeEl.innerHTML = this;
            return escapeEl.textContent;
        } else {
            var escapeEl = document.createElement('textarea');
            escapeEl.textContent = this;
            return escapeEl.innerHTML;
        }
    };
}

if (typeof (String.prototype.rmTags) === "undefined") {
    String.prototype.rmTags = function (e) {
        return this.replace(/<(?:.|\n)*?>/gm, '');
    };
}


if (typeof (String.prototype.markdown) === "undefined") {
    String.prototype.markdown = function (realm) {
        var str = this;

        str = str.replace(/_([^\s_](?:[^_]|__)+?[^\s_])_/g, "<i>$1</i>"); // _abekat_ => <i>abekat</i>
        str = str.replace(/\*([^\s\*](?:[^\*]|\*\*)+?[^\s\*])\*/g, "<b>$1</b>"); // *abekat* => <b>abekat</b>
        str = str.replace(/\[([^\s\]](?:[^\]]|\]\])+?[^\s\]])\]/g, "<span class=md-yellow>$1</span>"); // [abekat] => <span class=md-highlight>abekat</span>
        str = str.replace(/\`([^\s\]`](?:[^\`]|\`\`)+?[^\s\`])\`/g, "<span class=md-code>$1</span>"); // `abekat` => <span class=md-code>abekat</span>
        str = str.replace(/(@\s*\w*)/g, "<span class=md-attention>$1</span>"); //  will match '@anders' '@ anders'
        str = str.replace(/---\r\n/g, "<hr>"); // ---  => a horizontal line

        str = str.replace(/\n/g, "<br>");
        str = str.replace(/\:\-\)/g, '😀');
        str = str.replace(/\:\-\(/g, '😞');
        str = str.replace(/\;\-\)/g, '😜');

        // web url
        str = str.replace(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g, "<a href='$1' target=_blank class=md-link>$1</a>");

        str = markdownLinkMatch.match(str, realm)

        return str;
    };
}

function capitaliseFirstLetter(string) {
    // deprecated - use <string>.cap() instead
    debug("Deprecated: capitaliseFirstLetter()");
    if (string)
        return string.charAt(0).toUpperCase() + string.slice(1);
    else
        return ("Tekstfejl");
}

String.prototype.cap = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.decap = function () {
    return this.charAt(0).toLowerCase() + this.slice(1);
};

String.prototype.max = function (num, dots) {
    if (!num)
        num = 25;
    if (typeof dots == "undefined")
        dots = 3;

    if (this && this.length > num)
        return this.substring(0, num - dots) + (dots == 0 ? "" : "..............".substring(0, (dots > num ? num : dots)));

    return this;
};

String.prototype.toFloat = function () {
    var s = this.replace(/\./g, "").replace(",", ".");

    if (s == "")
        return 0;

    return parseFloat(s);
};

if (typeof (String.prototype.csvToArray) === "undefined") {
    String.prototype.csvToArray = function (o) {
        var od = {
            'fSep': ';',
            'rSep': '\r\n',
            'quot': '"',
            'head': false,
            'trim': false
        };

        if (o) {
            for (var i in od) {
                if (!o[i]) o[i] = od[i];
            }
        } else {
            o = od;
        }
        var a = [
            ['']
        ];
        for (var r = f = p = q = 0; p < this.length; p++) {
            switch (c = this.charAt(p)) {
                case o.quot:
                    if (q && this.charAt(p + 1) == o.quot) {
                        a[r][f] += o.quot;
                        ++p;
                    } else {
                        q ^= 1;
                    }
                    break;
                case o.fSep:
                    if (!q) {
                        if (o.trim) {
                            a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        }
                        a[r][++f] = '';
                    } else {
                        a[r][f] += c;
                    }
                    break;
                case o.rSep.charAt(0):
                    if (!q && (!o.rSep.charAt(1) || (o.rSep.charAt(1) && o.rSep.charAt(1) == this.charAt(p + 1)))) {
                        if (o.trim) {
                            a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        }
                        a[++r] = [''];
                        a[r][f = 0] = '';
                        if (o.rSep.charAt(1)) {
                            ++p;
                        }
                    } else {
                        a[r][f] += c;
                    }
                    break;
                default:
                    a[r][f] += c;
            }
        }
        if (o.head) {
            a.shift();
        }
        if (a[a.length - 1].length < a[0].length) {
            a.pop();
        }
        return a;
    };
}

/** Extend Date Class **/

// Returns the ISO week of the date.
if (typeof (Date.prototype.getWeek) === "undefined") {
    Date.prototype.getWeek = function () {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        var week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks from date to week1.
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
            - 3 + (week1.getDay() + 6) % 7) / 7);
    };
}

// Returns the date in yyyy-mm-dd format
if (typeof (Date.prototype.getYearMonthDay) === "undefined") {
    Date.prototype.getYearMonthDay = function () {
        var today = new Date(this.getTime());
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();

        if (dd < 10)
            dd = '0' + dd;

        if (mm < 10)
            mm = '0' + mm;

        return yyyy + '-' + mm + '-' + dd;
    };
}

if (typeof (Date.prototype.getHourMinSec) === "undefined") {
    Date.prototype.getHourMinSec = function () {
        var today = new Date(this.getTime());
        var hh = today.getHours();
        var mm = today.getMinutes();
        var ss = today.getSeconds();

        if (hh < 10)
            hh = '0' + hh;

        if (mm < 10)
            mm = '0' + mm;

        if (ss < 10)
            ss = '0' + ss;

        return hh + ':' + mm + ':' + ss;
    };
}

if (typeof (Date.prototype.getSqlDate) === "undefined") {
    Date.prototype.getSqlDate = function () {
        return this.getYearMonthDay() + ' ' + this.getHourMinSec();
    };
}


/** EXTEND OBJECT **/

const isArray = (val) => {
    return Array.isArray(val);
};

const isObject = (val) => {
    return {}.toString.call(val) === '[object Object]' && !isArray(val);
};

const clone = (val, history = null) => {
    const stack = history || new Set();

    if (stack.has(val)) {
        return val;
    }

    stack.add(val);

    const copyObject = (o) => {
        const oo = Object.create({});
        for (const k in o) {
            oo[k] = clone(o[k], stack);
        }
        return oo;
    };

    const copyArray = (a) => {
        return [...a].map((e) => {
            if (isArray(e)) {
                return copyArray(e);
            } else if (isObject(e)) {
                return copyObject(e);
            }
            return clone(e, stack);
        });
    };

    if (isArray(val)) {
        return copyArray(val);
    }

    if (isObject(val)) {
        return copyObject(val);
    }

    return val;
};

function consObjPath(context, key, def /* return if not found */) {
    if (!context || !key)	// check if valid paramets
        return "";

    if (typeof key == "object")
        return (key);

    if (key.toString().indexOf(".") < 0) {
        if (context[key])	// if var do not exist - return empty string
            return (context[key]);
        else
            return def || "";
    }

    var namespaces = key.split(".");
    for (var i = 0; i < namespaces.length; i++) {
        var pos = namespaces[0].indexOf("[");
        if (pos >= 0) { 	// handle "variable[2][23]" cases
            var idx = namespaces[i].substring(pos).match(/\d+/g);
            namespaces[i] = namespaces[i].substring(0, pos);

            context = context[namespaces[i].substring(0, pos)];
            for (var j = 0; j < idx.length; j++) {
                context = context[parseInt(idx[j])];
            }

        } else
            context = context[namespaces[i]];
        if (!context)
            return def || "";
    }
    return context;
}

function getUnique(arr, comp) {
    // a = [{ test: "pop" }, { test: "pop" }, { test: "pip" }]
    // getUnique(a, "test") => [{ test: "pop" }, { test: "pip" }]

    if (!Array.isArray(arr))	// not an array - return the element
        return (arr);

    if (comp) {
        var unique = arr.map(function (e) {
            return e[comp];
        }) // store the keys of the unique objects
            .map(function (e, i, final) {
                return final.indexOf(e) === i && i;
            }) // eliminate the dead keys & store unique objects
            .filter(function (e) {
                return arr[e];
            }).map(function (e) {
                return arr[e];
            });
    } else {
        var unique = arr.map(function (e) {
            return e;
        }) // store the keys of the unique objects
            .map(function (e, i, final) {
                return final.indexOf(e) === i && i;
            }) // eliminate the dead keys & store unique objects
            .filter(function (e) {
                return arr[e];
            }).map(function (e) {
                return arr[e];
            });
    }
    return unique;
}

var c = {
    getUnique,
    consObjPath,
    isArray,
    isObject,
    clone,

}
export { c }