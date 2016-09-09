(function () {
	"use strict";

	function Quasar(selector) {
		if (!selector) {
			return;
		}

		var list = null;

		if (typeof selector === 'string') {
			switch (selector.substring(0, 1)) {
				case '#':
					return document.getElementById(selector.substring(1));
				case '.':
					list = document.getElementsByClassName(selector.substring(1).replace(/\./g, ' '));
					break;
				default :
					list = document.getElementsByTagName(selector);
			}
		} else if (selector.nodeType === 1 || selector === document || selector === window) {
			return selector;
		}

		return list.length === 1 ? list[0] : list;
	}

	Quasar.depot = new function Depot() {
		var data = {
			LIB_VERSION: '4',
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
			}
		};
		this.get = function (key) {
			return (typeof data[key] === 'object') ? Object.create(data[key]) : data[key];
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
	Quasar.xhr = function (input) {
		if (window.XMLHttpRequest) {
			var xhr = new XMLHttpRequest(),
					data = Quasar.extend(Quasar.depot.get('xhrSettings'), input);

			if (typeof data.readyState === 'object') {
				xhr.onreadystatechange = function () {
					if (typeof data.readyState[xhr.readyState] === 'function')
						data.readyState[xhr.readyState](xhr.responseText);
				};
			}
			xhr.onload = function () {
				var x = xhr.responseText;
				if (xhr.getResponseHeader("Content-Type") === 'application/json') {
					try {
						x = JSON.parse(x);
					} catch (e) {
						data.error(x, xhr);
						return;
					}
				}
				xhr.status === 200 ? data.response(x) : data.error(x, xhr);
			};
			xhr.onerror = function () {
				data.error(xhr.responseText, xhr);
			};

			if (!(data.data instanceof window.File)) {
				if (typeof data.data === 'object') {
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

			if (!(data.type in {POST: 0, GET: 0, PUT: 0, DELETE: 0, FILE: 0})) {
				data.type = 'GET';
			}

			if (data.type === 'GET' && data.data !== null) {
				data.url += "?" + data.data;
				data.data = null;
			}

			xhr.open(data.type, data.url || Quasar.depot.get('SITE_URL'), true);

			xhr.setRequestHeader('X-MF-XHR', true);
			xhr.setRequestHeader('Accept', 'application/json');
			if (data.type !== 'GET') {
				xhr.setRequestHeader('Content-Type', 'application/quasar-input');
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

	Quasar.refresh = function (x) {
		window.top.document.location.reload(x);
	};

	Quasar.redirect = function (url) {
		window.top.location = url;
	};

	Quasar.new = function (elem) {
		return document.createElement(elem);
	};

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

	Quasar.function = function (fname, fbody) {
		Element.prototype[fname] = fbody;

		HTMLCollection.prototype[fname] = NodeList.prototype[fname] = function () {
			return this.invoke.call(this, fbody, arguments);
		};
	};

	Quasar.define = function (fname, fbody) {
		if (Quasar[fname] === undefined) {
			Object.defineProperty(Quasar, fname, {
				value: fbody
			});
		}
	};

	HTMLCollection.prototype.invoke = NodeList.prototype.invoke = function (func, args) {
		if (typeof func === 'function') {
			for (var i = 0, len = this.length; i < len; i++) {
				func.apply(this[i], args);
			}
		}

		return this;
	};

	Quasar.foreach({
		show: function (display) {
			this.style.display = display ? display : 'block';

			return this;
		},
		hide: function () {
			this.style.display = 'none';

			return this;
		},
		find: function (selector) {
			return this.querySelectorAll(selector);
		},
		class: function (_class) {
			if (_class === undefined) {
				return this.className;
			} else {
				this.className = _class;

				return this;
			}
		},
		hasClass: function (_class) {
			return (' ' + this.className + ' ').indexOf(' ' + _class + ' ') > -1;
		},
		addClass: function (_class) {
			this.className += ' ' + _class;

			return this;
		},
		rmvClass: function (_class) {
			this.className = ((' ' + this.className).split(' ' + _class)).join(' ').trim();

			return this;
		},
		toggleClass: function (_class) {
			(this.hasClass(_class)) ? this.rmvClass(_class) : this.addClass(_class);

			return this;
		},
		on: function (event, func, propagate) {
			this.addEventListener(event, func, propagate || false);

			return this;
		},
		value: function (val) {
			if (val === undefined) {
				return this.value;
			} else {
				this.value = val;

				return this;
			}
		},
		checked: function (x) {
			if (x === undefined) {
				return this.checked;
			} else {
				this.checked = x;

				return this;
			}
		},
		html: function (html) {
			if (html === undefined) {
				return this.innerHTML;
			} else {
				this.innerHTML = '';
				this.append(html);

				return this;
			}
		},
		prepend: function (item) {
			(item instanceof Element) ? this.insertBefore(item, this.firstElementChild) : this.insertAdjacentHTML('afterbegin', item.toString());

			return this;
		},
		append: function (item) {
			(item instanceof Element) ? this.appendChild(item) : this.insertAdjacentHTML('beforeend', item.toString());

			return this;
		},
		insert: function (position, item) {
			switch (position){
				case 'before': item.parentElement.insertBefore(this, item); break;
				case 'after': item.parentElement.insertBefore(this, item.nextElementSibling); break;
			}
			
			return this;
		},
		"delete": function () {
			this.parentElement.removeChild(this);

			return true;
		},
		replaceWith: function (item) {
			this.parentElement.replaceChild(item, this);

			return this;
		},
		css: function (input) {
			if (typeof input === 'object') {
				Quasar.foreach(input, function (k, v) {
					if (k in this.style) {
						this.style[k] = v;
					}
				}, this);

				return this;
			} else {
				return this.style[input];
			}
		},
		attr: function (attr, val) {
			if (val === undefined) {
				return this.getAttribute(attr);
			} else {
				this.setAttribute(attr, val);

				return this;
			}
		},
		hasAttr: function (attr) {
			return Boolean(this.getAttribute(attr));
		},
		width: function () {
			return this.clientWidth || this.offsetWidth;
		},
		height: function () {
			return this.clientHeight || this.offsetHeight;
		},
		first: function () {
			return this.firstElementChild;
		},
		last: function () {
			return this.lastElementChild;
		},
		parents: function (_class) {
			var tmp = this;
			while (tmp.parentElement.hasClass(_class) === false) {
				tmp = tmp.parentElement;
			}
			return tmp === this ? null : tmp.parentElement;
		},
		next: function () {
			return this.nextElementSibling;
		},
		prev: function () {
			return this.previousElementSibling;
		},
		links2anchors: function (text) {
			this.innerHTML = Quasar.links2anchors(this.innerHTML);

			return this;
		}
	}, Quasar.function);


	Object.defineProperty(window, 'Quasar', {value: Quasar});
}());