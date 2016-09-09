(function () {
    function Quasar(selector) {
        if (!(this instanceof Quasar))
            return new Quasar(selector);

        this.nodes = new Array();

        if (!selector) {
            return;
        } else {
            if (selector instanceof Quasar) {
                return selector;
            }
        }

        if (typeof selector === 'string') {
            switch (selector.substring(0, 1)) {
                case '#':
                    selector = document.getElementById(selector.substring(1));
                    if (selector) {
                        this.nodes.push(selector);
                    }
                    break;
                case '.':
                    this.nodes = Quasar.toArray(document.getElementsByClassName(selector.substring(1).replace(/\./g, ' ')));
                    break;
                default :
                    this.nodes = Quasar.toArray(document.getElementsByTagName(selector));
                    break;
            }
        } else if (selector.nodeType === 1 || selector === document || selector === window) {
            this.nodes.push(selector);
        } else if (selector instanceof HTMLCollection || selector instanceof NodeList) {
            this.nodes = Quasar.toArray(selector);
        }
    }
    
    // Initialize registry for plugins
    Quasar.Plugins = {};

    Quasar.depot = new function Depot() {
        var data = {
            LIB_VERSION: '3',
            SITE_URL: document.URL.replace(/(https?:\/\/.+?)\/.*/, '$1'),
            xhrSettings: {
                type: 'GET',
                error: function (er, xhr) {
                    if (er.error === true) {
                        alert(er.message);
                    } else {
                        alert(er);
                    }
                },
                response: function () {
                },
                max_upload_file_size: 8388608
            },
            now: new Date()
        };
        this.get = function (key) {
            return (typeof data[key] === 'object') ? Quasar.clone(data[key]) : data[key];
        };
        this.set = {
            xhrSettings: {
                type: function (type) {
                    if (type in {POST: 0, GET: 0, PUT: 0, DELETE: 0, FILE: 0})
                        data.xhrSettings.type = type;
                },
                error: function (func) {
                    if (typeof func === 'function')
                        data.xhrSettings.error = func;
                },
                response: function (func) {
                    if (typeof func === 'function')
                        data.xhrSettings.response = func;
                }
            },
            now: function (iso8601) {
                data.now = new Date(iso8601).getTime();
            },
            SITE_URL: function (url) {
                data.SITE_URL = url;
            },
            RESOURCE_URI: function (uri) {
                data.RESOURCE_URI = uri;
            }
        };
    };
    Quasar.isArray = function (obj) {
        return obj && (obj.length === 0 || typeof obj.length === "number" && obj.length > 0 && (obj.length - 1) in obj);
    };
    Quasar.foreach = function (obj, callback, context) {
        var value, i = 0;
        if (Quasar.isArray(obj)) {
            var length = obj.length;
            for (; i < length; i++) {
                value = callback.call(context || obj[ i ], i, obj[ i ]);
                if (value === false) {
                    break;
                }
            }
        } else {
            for (i in obj) {
                value = callback.call(context || obj[ i ], i, obj[ i ]);
                if (value === false) {
                    break;
                }
            }
        }
        return obj;
    };
    Quasar.extend = function (obj, extension) {
        Quasar.foreach(extension, function (k, v) {
            if (extension.hasOwnProperty(k)) {
                obj[k] = v;
            }
        });
        return obj;
    };
    Quasar.clone = function (obj) {
        if (null == obj || "object" != typeof obj)
            return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr))
                copy[attr] = obj[attr];
        }
        return copy;
    }
    Quasar.xhr = function (input) {
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest(),
                data = Quasar.extend(Quasar.depot.get('xhrSettings'), input);

            if (typeof data.readyState === 'object') {
                xhr.onreadystatechange = function () {
                    if (typeof data.readyState[xhr.readyState] === 'function')
                        data.readyState[xhr.readyState](xhr.responseText, xhr, data);
                };
            }
            xhr.onload = function () {
                var x = xhr.responseText;
                if (xhr.getResponseHeader("Content-Type") === 'application/json') {
                    try {
                        x = JSON.parse(x);
                    } catch (e) {
                        data.error(x, xhr, data);
                        return;
                    }
                }

                xhr.status === 200 ? data.response(x, xhr, data) : data.error(x, xhr, data);
            };
            xhr.onerror = function () {
                data.error(xhr.responseText, xhr, data);
            };

            if (!(data.type in {POST: 0, GET: 0, PUT: 0, DELETE: 0, FILE: 0})) {
                data.type = 'GET';
            }
            
            if (!(data.data instanceof window.File)) {
                if (data.data instanceof window.FormData) {
                    // do nothing
                } else if (typeof data.data === 'object') {
                    var _dataArray = [];
                    Quasar.foreach(data.data, function (k, v) {
                        _dataArray[_dataArray.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
                    });
                    data.data = _dataArray.join('&');
                } else if (typeof data.data !== 'string') {
                    data.data = null;
                }
            }

            if (xhr.upload && typeof data.progress === 'function') {
                xhr.upload.addEventListener('progress', data.progress, false);
            }

            if (data.type === 'GET' && data.data !== null) {
                data.url += "?" + data.data;
                data.data = null;
            }

            xhr.open(data.type, data.url || Quasar.depot.get('SITE_URL'), true);

            xhr.setRequestHeader('X-MF-XHR', true);
            xhr.setRequestHeader('Accept', 'application/json');
            
            if (data.type !== "GET" && !(data.data instanceof window.FormData)) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }

            if (typeof data.headers === 'object') {
                Quasar.foreach(data.headers, xhr.setRequestHeader, xhr);
            }
            
            xhr.send(data.data);

            return xhr;
        } else {
            throw 'Browser does not support XHR';
        }
    };

    Quasar.toArray = function (obj, index) {
        if (index === undefined) {
            index = 0;
        }
        return Array.prototype.slice.call(obj, index);
    }

    Quasar.refresh = function (x) {
        window.top.document.location.reload(x);
    };

    Quasar.redirect = function (url) {
        window.top.location = Quasar.url(url);
    };

    Quasar.new = function (elem) {
        return Quasar(document.createElement(elem));
    };

    Quasar.url = function (url) {
        if (url.search("://") < 0) {
            url = Quasar.depot.get("SITE_URL") + url;
        }

        return url;
    };

    Quasar.select = function (elem) {
        if (elem instanceof Quasar) {
            elem = elem.node();
        }

        var doc = document, range, selection;
        if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(elem);
            range.select();
        } else if (window.getSelection) {
            selection = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(elem);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    Quasar.links2anchors = function (text) {
        return text.replace(
            /((http|ftp)s?:\/\/((?:\w|\.|\-)+)(\/[^\s\<\>\"]*)?)/gi,
            '<a href="$1" title="$1">$3</a>'
            );
    };

    Quasar.onload = function (func) {
        if (typeof func === 'function') {
            window.addEventListener('load', func, false);
        } else {
            throw 'Method [Quasar.onload] expects parameter 1 to be a function.';
        }
    };

    Quasar.htmlencode = function (html) {
        return document.createElement('a').appendChild(
            document.createTextNode(html)).parentNode.innerHTML;
    };

    Quasar.function = function (fname, fbody) {
        if (Quasar.prototype[fname] === undefined) {
            Object.defineProperty(Quasar.prototype, fname, {
                value: function () {
                    var args = Quasar.toArray(arguments), rv;
                    Quasar.foreach(this.nodes, function (k, v) {
                        rv = fbody.apply(v, args);
                        if (rv !== undefined)
                            return false;
                    });
                    return this.nodes.length ? rv === undefined ? this : rv : undefined;
                }
            });
        }
    };

    Quasar.define = function (fname, fbody) {
        if (Quasar[fname] === undefined) {
            Object.defineProperty(Quasar, fname, {
                value: fbody
//				value: function() {
//					fbody.apply(v, Quasar.toArray(arguments, 0));
//				}
            });
        }
    };

    Quasar.foreach({
        show: function (display) {
            this.style.display = display ? display : 'block';
        },
        hide: function () {
            this.style.display = 'none';
        },
        find: function (selector) {
            return new Quasar(this.querySelectorAll(selector));
        },
        class: function (_class) {
            if (_class === undefined) {
                return this.className;
            } else {
                this.className = _class;
            }
        },
        hasClass: function (_class) {
            return (' ' + this.className + ' ').indexOf(' ' + _class + ' ') > -1;
        },
        addClass: function (_class) {
            if (!Quasar(this).hasClass(_class)) {
                this.className = this.className + ' ' + _class;
            }
        },
        rmvClass: function (_class) {
            this.className = ((' ' + this.className + ' ').replace(' ' + _class + ' ', ' ')).trim();
        },
        toggleClass: function (_class) {
            var elem = Quasar(this);
            (elem.hasClass(_class)) ? elem.rmvClass(_class) : elem.addClass(_class);
        },
        on: function (event, func, propagate) {
            this.addEventListener(event, func, propagate || false);
        },
        value: function (val) {
            if (val === undefined) {
                return this.value;
            } else {
                this.value = val;
            }
        },
        checked: function (x) {
            if (x === undefined) {
                return this.checked;
            } else {
                this.checked = x;
            }
        },
        html: function (html) {
            if (html === undefined) {
                return this.innerHTML;
            } else {
                this.innerHTML = '';
                Quasar(this).append(html);
            }
        },
        prepend: function (item) {
            if (item instanceof Quasar) {
                item.invoke(function ($this) {
                    $this.insertBefore(this, $this.firstElementChild);
                }, this);
            } else {
                (item instanceof Node) ? this.insertBefore(item, this.firstElementChild) : this.insertAdjacentHTML('afterbegin', item.toString());
            }
            ;
        },
        append: function (item) {
            if (item instanceof Quasar) {
                item.invoke(function ($this) {
                    $this.appendChild(this);
                }, this);
            } else {
                (item instanceof Node) ? this.appendChild(item) : this.insertAdjacentHTML('beforeend', item.toString());
            }
            ;
        },
        insertBefore: function (item) {
            Quasar(item).parent(true).insertBefore(this, item);
        },
        insertAfter: function (item) {
            item = Quasar(item);
            item.parent(true).insertBefore(this, item.next(true));
        },
        remove: function () {
            this.parentNode.removeChild(this);
            return true;
        },
        replace: function (item) {
            if (item instanceof Quasar) {
                item = item.node();
            }
            this.parentNode.replaceChild(item, this);
        },
        style: function (input) {
            Quasar.foreach(input, function (k, v) {
                if (k in this.style)
                    this.style[k] = v;
            }, this);
        },
        styleGet: function (prop) {
            return this.style[prop];
        },
        attr: function (attr, val) {
            if (val === undefined) {
                return this.getAttribute(attr);
            } else {
                this.setAttribute(attr, val);
            }
        },
        hasAttr: function (attr) {
            return Boolean(this.getAttribute(attr));
        },
        rmvAttr: function (attr) {
            return this.removeAttribute(attr);
        },
        width: function () {
            return this.clientWidth || this.offsetWidth;
        },
        height: function () {
            return this.clientHeight || this.offsetHeight;
        },
        children: function (x) {
            return x ? this.children : Quasar(this.children);
        },
        firstChild: function (x) {
            return x ? this.firstElementChild : Quasar(this.firstElementChild);
        },
        lastChild: function (x) {
            return x ? this.lastElementChild : Quasar(this.lastElementChild);
        },
        parent: function (x) {
            return x ? this.parentNode : Quasar(this.parentNode);
        },
        parents: function (_class, x) {
            var tmp = Quasar(this);
            while (tmp.parent().hasClass(_class) === false)
                tmp = tmp.parent();
            return tmp.parent(x);
        },
        next: function (x) {
            return x ? this.nextElementSibling : Quasar(this.nextElementSibling);
        },
        prev: function (x) {
            return x ? this.previousElementSibling : Quasar(this.previousElementSibling);
        },
        node: function (x) {
            return this;
        },
        invoke: function (func) {
            if (typeof func === 'function')
                return func.apply(this, Quasar.toArray(arguments, 1));
        },
        links2anchors: function (text) {
            this.innerHTML = Quasar.links2anchors(this.innerHTML);
        },
        sort: function (func, reverse) {
            var childrenArr = Quasar.toArray(this.children);
            childrenArr.sort(func || function (a, b) {
                return (a.innerHTML > b.innerHTML ? 1 : (a.innerHTML < b.innerHTML ? -1 : 0));
            });

            if (reverse) {
                childrenArr.reverse();
            }

            for (var i = 0, l = childrenArr.length; i < l; i++) {
                this.appendChild(childrenArr[i]);
            }
        }
    }, Quasar.function);

    Object.defineProperty(window, 'Quasar', {value: Quasar});

    (function () {
        var scripts = Quasar.toArray(document.getElementsByTagName('script'));
        for (var i in scripts) {
            if (scripts[i].getAttribute('data-Qlib') === 'preset') {
                var data = scripts[i].attributes;
            }
        }

        if (data) {
            Quasar.foreach({
                variable: function (variable) {
                    window[variable] = Quasar;
                },
                now: function (now) {
                    Quasar.depot.set.now(now);
                },
                root: function (url) {
                    Quasar.depot.set.SITE_URL(url);
                },
                res: function (uri) {
                    Quasar.depot.set.RESOURCE_URI(uri);
                }
            }, function (setting, func) {
                if (data['data-qlib-' + setting] !== undefined) {
                    func(data['data-qlib-' + setting].value);
                }
            });
        }
    }());
}());