(function () {
    if (!document.getElementById('Quasar-qlib-ui-styles')) {
        var style = document.createElement("link");
        style.id = "Quasar-qlib-ui-styles";
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = Quasar.depot.get("SITE_URL") + "/" + Quasar.depot.get("RESOURCE_URI") + "/css/qlib-ui.css";
        document.head.appendChild(style);
    }
}());

/**
 * AjaxifyForm
 */
Quasar.function('AjaxifyForm', function (options) {
    var q = Quasar(this).addClass('Quasar-AF').rmvClass("loading");
    Quasar.AjaxifyForm.functions.addLoadingIndicator(this);

    if (this.nodeName === 'FORM') {
        options = Quasar.extend({
            beforeSubmit: Quasar.AjaxifyForm.functions.emptyFunc,
            afterSubmit: Quasar.AjaxifyForm.functions.emptyFunc,
            afterResponse: Quasar.AjaxifyForm.functions.emptyFunc,
            success: Quasar.AjaxifyForm.functions.success,
            error: Quasar.AjaxifyForm.functions.error,
            progress: Quasar.AjaxifyForm.functions.emptyFunc,
            response: {
                method: "html", // append | prepend | html
                sort: false, // true | false | function
                element: Quasar(this).find('.AFResponse') // Quasar object with 1 DOM element
            },
            reset: true // true | false
        }, options || {});

        this.QAF = {
            handler: options,
            loading: false
        };
//
//        Quasar(this.elements).invoke(function () {
//            if ((this.nodeName === 'BUTTON' || this.nodeName === 'INPUT') && this.type === 'submit') {
//                Quasar(this).on('click', Quasar.AjaxifyForm.functions.submitButtonOnclick);
//            }
//        });

        this.onsubmit = Quasar.AjaxifyForm.functions.onsubmit;
    } else {
        throw 'Type mismatch, only forms should be passed to method [AjaxifyForm]';
    }
});

Quasar.AjaxifyForm = {
    functions: {
        success: function (resp) {
            var AFResp = this.node().QAF.handler.response;

            if (AFResp.element.hasClass("AFResponse")) {
                AFResp.element.html("");
            }
            this.find('.Quasar-Field-Error').html("");
            this.find('.quasar-error').rmvClass('quasar-error');

            if (resp.status === 'success') {
                AFResp.element[(AFResp.method || "html")](resp.data);

                if (AFResp.sort !== undefined) {
                    if (typeof AFResp.sort === "function") {
                        AFResp.element.sort(AFResp.sort);
                    } else if (AFResp.sort === true) {
                        AFResp.element.sort();
                    }
                }

                if (this.node().QAF.handler.reset) {
                    this.node().reset();
                }
                var captcha = this.find('.quasar-captcha-img').node();

                if (captcha) {
                    captcha.onclick();
                }

                return true;
            } else if (resp.status === 'failure') {
                Quasar.foreach(resp.data, function (k, v) {
                    var errorDiv = this.find('.' + k + '.Quasar-Field-Error');

                    errorDiv.html(v);
                    this.find('*[name="' + errorDiv.attr("data-input") + '"]').addClass('quasar-error');
                }, this);
            }

            return false;
        },
        error: function (data) {
            var form = this;
            if (data.error === true) {
                if (data.code === 1 && data.class === "Plugins\\Users\\Exceptions\\UserException") {
                    Quasar.xhr({
                        type: "GET",
                        url: Quasar.depot.get("SITE_URL") + "/users/login",
                        response: function (data) {
                            Quasar.requireUsersPluginAssets(data[0]);
                            var d = new Quasar.Dialog();
                            d.open(data[1], {}, 'xhr-login-dialog');
                            var loginForm = d.elements.body.find(".loginForm");
                            loginForm.node().Quasar_original_form = form.node();
                            loginForm.AjaxifyForm({
                                success: function (resp) {
                                    if (resp.status === 'success') {
                                        d.close();
                                        form.node().onsubmit();
                                    } else if (resp.status === 'failure') {
                                        Quasar.AjaxifyForm.functions.success.call(this, resp);
                                    }
                                }
                            });
                        }
                    });
                } else {
                    alert(data.message);
                }
            } else {
                alert(data);
            }
        },
        emptyFunc: function () {
        },
        submitForm: function () {
            var form = Quasar(this);
            var data = form.node().QAF.formData;

            if (form.attr('method').toLowerCase() === "get") {
                data = {};

                Quasar.foreach(this.elements, function () {
                    var name = this.getAttribute("name");
                    if (name) {
                        data[name] = this.value;
                    }
                });
            }

            Quasar.xhr({
                url: form.attr('action') || document.URL,
                type: form.attr('method') || 'POST',
                data: data,
                response: function (x, xhr, settings) {
                    switch (typeof form.node().QAF.handler.success) {
                        case 'function':
                            form.node().QAF.handler.success.call(form, x, xhr, settings);
                            break;
                    }

                    Quasar(form.node().elements).invoke(function () {
                        if (this.type.toLowerCase() === 'password') {
                            this.value = '';
                        }
                    });
                },
                error: function (x, xhr, settings) {
                    switch (typeof form.node().QAF.handler.error) {
                        case 'function':
                            form.node().QAF.handler.error.call(form, x, xhr, settings);
                            break;
                    }
                },
                readyState: {
                    4: function (x, xhr, settings) {
                        form.node().QAF.loading = false;
                        form.rmvClass('loading');

                        form.node().QAF.formData = [];
                        form.node().QAF.files = {};

                        form.node().QAF.handler.afterResponse.call(form);
                    }
                }
            });
        },
        onsubmit: function (e) {
            if (!Quasar.validateFormOnSubmit.call(this)) {
                return false;
            }

            var form = Quasar(this);
            form.find(".quasar-error").rmvClass("quasar-error");

            if (!this.QAF.loading) {
                this.QAF.loading = true;
                form.addClass('loading');

                this.QAF.handler.beforeSubmit.call(form);
                this.disabled = true;

                this.QAF.formData = new FormData(this);
                Quasar.AjaxifyForm.functions.submitForm.call(this);

                this.QAF.handler.afterSubmit.call(form);
            }

            return false;
        },
//        submitButtonOnclick: function () {
//            this.QAFClicked = true;
//        }
        addLoadingIndicator: function (form) {
            var q = Quasar(form);
            if (!q.find("loading-indicator").node()) {
                q.append(Quasar.new("div").class("loading-indicator"));
            }
        }
    }
};

/**
 * AjaxifyPagination
 * 
 * url - http://example.com/posts/{page}
 * page - numeric replacement for "{page}" in url
 * button - Object {
 *	text: button text,
 *	class: button class
 *	endText: button text on results end
 *	endClass: button class on results end
 *	noResults: button text on 0 results found
 * }
 * response - Object {
 *  type: 'application/json',
 *  handler: function(){}
 * }
 * onload - function(),
 * autoload - boolean: load first page automatically
 */

Quasar.function('AjaxifyPagination', function (data) {
    var self = Quasar(this),
            btn = document.createElement('button'),
            loading = false;

    data = Quasar.extend({
        url: 0,
        page: 0,
        button: {},
        response: {},
        onload: null,
        autoload: false
    }, data || {});

    self.node().AP_URL = function (newURL) {
        if (newURL) {
            data.url = newURL;
        } else {
            return data.url;
        }
    };

    self.node().AP_page = function (newPage) {
        if (newPage !== undefined) {
            data.page = newPage;
        } else {
            return data.page;
        }
    };

    if (data.button === undefined) {
        data.button = {};
    }

    if (data.response === undefined) {
        data.response = {};
    }

    btn.innerHTML = data.button.text || 'Load more';
    btn.className = data.button.class || '';
    data.button.parent = data.button.parent !== undefined ? Quasar(data.button.parent) : self;

    data.response.type = data.response.type || "text/html";

    function loading_start() {
        loading = true;
        btn.innerHTML = 'Loading...';
        btn.disabled = true;
    }

    function loading_finish() {
        loading = false;
        btn.innerHTML = data.button.text || 'Load more';
        btn.disabled = false;
    }

    btn.onclick = function () {
        if (!loading) {
            loading_start();

            Quasar.xhr({
                url: data.url.replace('{page}', data.page),
                type: "GET",
                headers: {
                    accept: data.response.type
                },
                response: function (responseText, xhr) {

                    if (responseText.length === 0) {
                        loading_start();

                        if (data.page === 0) {
                            btn.innerHTML = data.button.noResults || "No results found";
                        } else {
                            btn.innerHTML = data.button.endText || 'End of results';
                        }

                        btn.className = data.button.endClass || 'results-end';
                    } else {
                        data.page++;

                        if (typeof data.response.handler === 'function') {
                            data.response.handler.call(self, responseText);
                        } else {
                            self.append(responseText);

                            if (data.button.parent.node() === self.node()) {
                                self.append(btn);
                            }
                        }

                        if (xhr.getResponseHeader('Quasar-LDS')) {
                            loading_start();

                            btn.innerHTML = data.button.endText || 'End of results';
                            btn.className = data.button.endClass || 'results-end';
                        }
                    }

                    if (typeof data.onload === 'function') {
                        data.onload.call(self);
                    }
                },
                readyState: {
                    4: loading_finish
                }
            });
        }
    };

    data.button.parent.append(btn);

    if (data.autoload) {
        btn.onclick.call(this);
    }
});

/**
 * Checkbox
 */

Quasar.function('FancyCheckbox', function (options) {
    if (Quasar(this).hasClass('fancychecbox')) {
        return;
    }

    options = Quasar.extend(options, {});

    Quasar(this).addClass("fancycheckbox");

    var checkbox = Quasar.new("div").addClass("box"),
            tick = Quasar.new("div").class("tick" + (" " + (options.tick || "fa fa-check fa-lg")) + (options.animate ? " animated" : "")),
            text = Quasar.new("div").class("text").html(this.title || ""),
            label = Quasar.new('label').class("quasar fancycheckbox");

    checkbox.append(tick);

    label.insertBefore(this);
    label.append(checkbox).append(text).append(this);

    this.onchange = Quasar.FancyCheckbox.onchange;
    this.onfocus = Quasar.FancyCheckbox.onfocus;
    this.onblur = Quasar.FancyCheckbox.onblur;
    this.check = Quasar.FancyCheckbox.check;
    this.uncheck = Quasar.FancyCheckbox.uncheck;

    this.onchange();
});

Quasar.FancyCheckbox = {
    onchange: function () {
        var $label = Quasar(this.parentNode);
        this.checked ? $label.addClass('checked') : $label.rmvClass('checked');
        this.onblur();
    },
    onfocus: function () {
        Quasar(this.parentNode).addClass('focused');
    },
    onblur: function () {
        Quasar(this.parentNode).rmvClass('focused');
    },
    check: function () {
        this.checked = true;
        this.onchange();
    },
    uncheck: function () {
        this.checked = false;
        this.onchange();
    }
};

/**
 * Dialog
 */
Quasar.Dialog = function () {
    if (!(this instanceof Quasar.Dialog))
        return;

    this.settings = {
        loading: {
            img: {
                src: Quasar.depot.get('SITE_URL') + '/images/loading.gif',
                alt: 'Specify loading image path in popup.js',
                width: '20%',
                height: 'auto'
            },
            text: 'Loading, please wait..'
        },
        closeable: true
    },
    this.elements = {
        curtain: Quasar.new('div').addClass('Quasar-Dialog'),
        holder: Quasar.new('div').addClass('Quasar-Dialog-holder'),
        close: Quasar.new('div').addClass('Quasar-Dialog-close fa fa-lg fa-remove'),
        body: Quasar.new('div').addClass('Quasar-Dialog-body'),
        buttons: Quasar.new('div').addClass('Quasar-Dialog-buttons')
    };
    this.elements.close.nodes[0].onclick = (function (x) {
        return function () {
            switch (x.settings.closeable) {
                case 1:
                case true:
                    x.close();
                    break;
                case 2:
                    x.hide();
                    break;
            }
        };
    }(this));
    this.elements.holder.append(this.elements.close).append(this.elements.body).append(this.elements.buttons);
    this.elements.curtain.append(this.elements.holder).on('click', Quasar.Dialog.functions.curtainClick);
};

Quasar.Dialog.functions = {
    curtainClick: function (event) {
        if (this === event.target) {
            this.getElementsByClassName('Quasar-Dialog-close')[0].onclick();
        }
    }
};

Quasar.Dialog.prototype = {
    open: function (msg, buttons, _class, close) {
        var pop = this;
        document.body.style.overflow = 'hidden';
        this.elements.curtain.class('Quasar-Dialog visible ' + (_class || ''));
        this.elements.body.html(msg);
        this.elements.buttons.html('');
        if (typeof buttons === 'object') {
            Quasar.foreach(buttons, function (k, v) {
                var button;
                if (v instanceof HTMLElement) {
                    button = v;
                } else {
                    button = document.createElement('button');
                    button.onclick = function () {
                        if (typeof v === 'function') {
                            if (v.call(button) !== false) {
                                pop.close();
                            }
                        }
                    };
                    button.className = "qbutton";
                    button.innerHTML = k;
                }

                //button.style.width = (100 / Object.keys(buttons).length) + '%';
                pop.elements.buttons.append(button);
            });
        }
        document.body.appendChild(this.elements.curtain.nodes[0]);
        if (close !== undefined) {
            this.closeable(close);
        }
    },
    loading: function (msg, uncloseable) {
        if (uncloseable) {
            this.closeable(false);
        }
        this.open(
                Quasar.new('div').append(
                Quasar.new('img')
                .attr('src', this.settings.loading.img.src)
                .attr('alt', this.settings.loading.img.alt)
                .style({
                    width: this.settings.loading.img.width,
                    height: this.settings.loading.img.height
                })
                ).append(
                Quasar.new('div').style({marginTop: '2%'}).html(msg || this.settings.loading.text)
                )
                );
    },
    close: function () {
        if (this.settings.closeable) {
            this.elements.curtain.remove();
            if (Quasar('.Quasar-Dialog.visible').nodes.length === 0)
                document.body.style.overflow = 'auto';
        }
    },
    closeable: function (int) {
        this.settings.closeable = int;
        int ? this.elements.close.show() : this.elements.close.hide();
    },
    show: function () {
        this.elements.curtain.addClass('visible');
        document.body.style.overflow = 'hidden';
    },
    hide: function () {
        this.elements.curtain.rmvClass('visible');
        if (Quasar('.Quasar-Dialog.visible').nodes.length === 0)
            document.body.style.overflow = 'auto';
    }
};

Quasar.Dialog.Prompt = function (text, func) {
    var d = new Quasar.Dialog();

    var buttons = {};
    buttons[Quasar.Dialog.Prompt.button.Ok] = function () {
        if (typeof func === "function") {
            func(input.value);
        }
    };
    buttons[Quasar.Dialog.Prompt.button.Cancel] = null;

    d.open("", buttons);
    var input = document.createElement("input");
    input.type = "text";
    input.style.marginTop = "2rem";

    d.elements.body.append(text);
    d.elements.body.append(input);

    return d;
};

Quasar.Dialog.Prompt.button = {
    Ok: "Ok",
    Cancel: "Cancel"
};

/**
 * datepicker
 */
Quasar.function('datepicker', function (initData, onchange) {
    var nowYear = new Date().getFullYear();

    var settings = {
        startDate: (nowYear - 50) + '-01-01',
        endDate: (nowYear + 50) + '-12-31',
        preset: null,
        time: false
    },
    i,
            input = this,
            date = {},
            startDate,
            endDate,
            DOM = {
                frame: Quasar.new('div').class('datepickerFrame'),
                holder: Quasar.new('div'),
                title: document.createElement('div'),
                year: Quasar.new('select').class('datepickerYear quasar last-vertical'),
                month: Quasar.new('select').class('datepickerMonth quasar last-vertical'),
                days: Quasar.new('div').class('datepickerDays'),
                daysOfWeek: Quasar.new('div').class('datepickerDaysOfWeek'),
                dialog: new Quasar.Dialog()
            },
    daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (typeof initData === 'object') {
        Quasar.extend(settings, initData);
    } else {
        initData = {};
    }

    Quasar(input).addClass("quasar").addClass("datepicker");
    if (settings.startDate === '0000-00-00' || settings.endDate === '0000-00-00') {
        Quasar(input).addClass("disabled").attr("disabled", "disabled");
        return;
    }

    startDate = settings.startDate.split('-');
    endDate = settings.endDate.split('-');
    if (startDate.length !== 3 || endDate.length !== 3) {
        throw 'Illegal startDate or endDate value. Input format: YYYY-MM-DD';
    }
    for (i = 0; i < 3; i++) {
        startDate[i] = parseInt(startDate[i]);
        endDate[i] = parseInt(endDate[i]);
    }
    if (startDate[0] * 365.25 + startDate[1] * 30.44 + startDate[2] > endDate[0] * 365.25 + endDate[1] * 30.44 + endDate[2]) {
        throw 'Illegal endDate value! endDate value has to be greater than startDate!';
    }

    DOM.title.className = 'datepickerWindowTitle';
    //DOM.title.innerHTML = "Chose a date";
    DOM.title.appendChild(DOM.month.node());
    DOM.title.appendChild(DOM.year.node());
    DOM.holder.append(DOM.daysOfWeek);
    DOM.holder.append(DOM.days);

    DOM.frame.append(DOM.title);
    DOM.frame.append(DOM.holder.class('datepickerHolder'));

    DOM.year.on('change', Quasar.datepicker.visualupdate);
    for (i = endDate[0]; i >= startDate[0]; i--) {
        var year = document.createElement('option');
        year.innerHTML = i;
        DOM.year.append(year);
    }

    DOM.month.on('change', Quasar.datepicker.visualupdate);
    for (i = 1; i <= 12; i++) {
        DOM.month.append(Quasar.new('option').html(monthNames[i - 1]).attr('value', ('0' + i).slice(-2)));
    }

    for (i = 0; i < 7; i++) {
        DOM.daysOfWeek.append(Quasar.new('div').html(daysOfWeek[i]));
    }

    for (i = 1; i <= 31; i++) {
        DOM.days.append(Quasar.new('button').html(i).class("day" + i).on('click', Quasar.datepicker.ondayclick));
    }

    this.dialog = DOM.dialog;
    DOM.frame.node().datepickerData = {
        input: this,
        startDate: startDate,
        endDate: endDate
    };
    this.dialog.open(DOM.frame, null, 'datepickerDialog', 2);
    this.dialog.hide();

    Quasar(this).on('click', Quasar.datepicker.onclick);
    this.onkeydown = Quasar.datepicker.onkeydown;

    if (settings.time === true) {
        var hourPicker = document.createElement("input");
        hourPicker.type = "range";
        hourPicker.className = "hour-slider";
        hourPicker.value = 0;
        hourPicker.min = 0;
        hourPicker.max = 23;
        hourPicker.oninput = Quasar.datepicker.ontimesliderchange;

        var minPicker = document.createElement("input");
        minPicker.type = "range";
        minPicker.className = "min-slider";
        minPicker.value = 0;
        minPicker.min = 0;
        minPicker.max = 59;
        minPicker.oninput = Quasar.datepicker.ontimesliderchange;

        var timeInput = document.createElement("input");
        timeInput.type = "text";
        timeInput.value = "00:00";
        timeInput.className = "time-input";

        DOM.holder.append("<hr/>");
        DOM.holder.append(timeInput).append(hourPicker).append(minPicker);
    }

    if (!initData.preset && input.value) {
        initData.preset = input.value;
    }

    if (initData.preset) {
        if (settings.time === true) {
            var preset = initData.preset.split(" ");

            var timepreset = (preset[1] ? preset[1] : "00:00").split(":");
            preset = preset[0];

            hourPicker.value = timepreset[0];
            minPicker.value = timepreset[1];

            Quasar.datepicker.ontimesliderchange.call(hourPicker);
        } else {
            var preset = initData.preset;
        }

        preset = preset.split("-");

        if (preset.length !== 3) {
            throw 'Illegal preset value. Input format: YYYY-MM-DD';
        } else {
            DOM.month.node().value = ("0" + preset[1]).slice(-2);
            DOM.year.node().value = preset[0];
            preset[2] = parseInt(preset[2]);

            DOM.days.children().invoke(function () {
                if (preset[2] === parseInt(this.innerHTML)) {
                    Quasar(this).addClass("selected");

                    return false;
                }
            });

            input.value = initData.preset;
            if (typeof onchange === "function") {
                this.onchange = onchange;
                this.onchange();
            }
        }
    } else {
        DOM.year.node().value = endDate[0] - ((endDate[0] - startDate[0]) / 2);
    }

    Quasar.datepicker.visualupdate.call(DOM.month.node());
});

Quasar.datepicker = {
    visualupdate: function () {
        var frame = Quasar(this).parents('datepickerFrame'),
                data = frame.node().datepickerData,
                yearSelect = frame.find('.datepickerYear'),
                monthSelect = frame.find('.datepickerMonth');

        data.year = yearSelect.value();
        data.month = monthSelect.value();

        monthSelect.children().invoke(function () {
            if (
                    (data.startDate[0] == data.year && data.startDate[1] > this.value) ||
                    (data.endDate[0] == data.year && data.endDate[1] < this.value)
                    ) {
                this.setAttribute('disabled', 'disabled');
            } else {
                this.removeAttribute('disabled');
            }
        });

        if (monthSelect.node().options[monthSelect.node().selectedIndex].getAttribute('disabled')) {
            monthSelect.children().invoke(function () {
                if (!this.getAttribute('disabled')) {
                    monthSelect.node().value = this.value;
                    return false;
                }
            });
        }

        data.month = monthSelect.value();

        var firstDay = (new Date(data.year + '-' + data.month + '-01')).getDay();
        if (firstDay === 0) {
            firstDay = 7;
        }
        firstDay--;

        frame.find('.datepickerDays').firstChild().style({marginLeft: (firstDay * 14.28) + "%"}).parent().children().invoke(function (daysInMonth, today) {
            if (this.innerHTML > daysInMonth) {
                this.style.display = 'none';
            } else {
                this.style.display = 'initial';
                if (
                        (data.startDate[0] == data.year && data.startDate[1] == data.month && data.startDate[2] > this.innerHTML) ||
                        (data.endDate[0] == data.year && data.endDate[1] == data.month && data.endDate[2] < this.innerHTML)
                        ) {
                    this.className = 'datepickerDisabled';
                } else {
                    this.className = '';
                }
            }

            if (data.year + "-" + data.month + "-" + ("0" + this.innerHTML).slice(-2) == data.input.value) {
                this.className += " selected";
            }

            if (data.year == today.getFullYear() && data.month == (today.getMonth() + 1) && this.innerHTML == today.getDate()) {
                this.className += " today";
            }
        }, Quasar.datepicker.daysInMonth(data.month, data.year), new Date());

    },
    onclick: function () {
        this.blur();
        this.dialog.show();
    },
    onkeydown: function () {
        return false;
    },
    daysInMonth: function (month, year) {
        return new Date(year, month, 0).getDate();
    },
    ondayclick: function () {
        var qthis = Quasar(this);
        if (qthis.hasClass('datepickerDisabled')) {
            return;
        }

        qthis.parent().find('.selected').rmvClass('selected');
        qthis.addClass('selected');

        var data = qthis.parents('datepickerFrame').node().datepickerData;

        data.input.value = data.year + '-' + data.month + '-' + ('0' + this.innerHTML).slice(-2);

        var time = data.input.dialog.elements.body.find(".time-input");
        if (time.node()) {
            data.input.value += " " + time.value();
        }

        data.input.dialog.elements.close.node().onclick();
    },
    ontimesliderchange: function () {
        var p = Quasar(this).parent();
        var hours = p.find(".hour-slider").value();
        var minutes = p.find(".min-slider").value();

        p.find(".time-input").value(("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2));
    }
};

/**
 * timeago
 */
Quasar.timeago = {
    parse: function () {
        // Pick all elements with class .quasar.timeago
        Quasar(".quasar.timeago").invoke(Quasar.timeago.parseElement);
    },
    parseElement: function () {
        var datetime = this.getAttribute("datetime");

        if (!datetime) {
            datetime = this.getAttribute("data-dt");
        }

        if (!datetime) {
            return;
        }

        var timeDiff = (Date.now() + Quasar.timeago.nowDiff) - new Date(datetime).getTime();
        var $l = Quasar.timeago.strings;

        if (timeDiff < 0) {
            var prefix = $l.prefixFromNow;
            var suffix = $l.suffixFromNow;
        } else {
            var prefix = $l.prefixAgo;
            var suffix = $l.suffixAgo;
        }

        var seconds = Math.abs(timeDiff) / 1000;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var years = days / 365;

        function substitute(stringOrFunction, number) {
            var string = typeof stringOrFunction === "function" ? stringOrFunction(number, timeDiff) : stringOrFunction;
            var value = ($l.numbers && $l.numbers[number]) || number;
            return isNaN(number) ? null : string.replace(/%d/i, value);
        }

        if (days > 1) {
            Quasar(this).rmvClass("timeago");
        }

        var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
                seconds < 90 && substitute($l.minute, 1) ||
                minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
                minutes < 90 && substitute($l.hour, 1) ||
                hours < 24 && substitute($l.hours, Math.round(hours)) ||
                hours < 42 && substitute($l.day, 1) ||
                days < 30 && substitute($l.days, Math.round(days)) ||
                days < 45 && substitute($l.month, 1) ||
                days < 365 && substitute($l.months, Math.round(days / 30)) ||
                years < 1.5 && substitute($l.year, 1) ||
                substitute($l.years, Math.round(years));

        if (words === null) {
            return;
        }


        this.innerHTML = [prefix, words, suffix].join(" ");
    },
    strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        seconds: "less than a minute",
        minute: "about a minute",
        minutes: "%d minutes",
        hour: "about an hour",
        hours: "about %d hours",
        day: "a day",
        days: "%d days",
        month: "about a month",
        months: "%d months",
        year: "about a year",
        years: "%d years",
        numbers: []
    },
    interval: 60000,
    now: new Date(Quasar.depot.get("now")).getTime()
};

Quasar.timeago.nowDiff = Quasar.timeago.now - Date.now();
Quasar.timeago.parse();
Quasar.timeago.intervalRef = setInterval(function () {
    Quasar.timeago.now += Quasar.timeago.interval;
    Quasar.timeago.nowDiff = Quasar.timeago.now - Date.now();
    Quasar.timeago.parse();
}, Quasar.timeago.interval);

/**
 *  Toast
 */

Quasar.Toast = function (text, weight) {

    if (Quasar.Toast.toaster === null) {
        Quasar.Toast.toaster = Quasar.new("div").class("quasar toaster");
        Quasar(document.body).append(Quasar.Toast.toaster);
    }

    var timeout;
    Quasar.Toast.toaster.append(Quasar.new("div").class("quasar toast message " + (weight || "")).html(text).on("click", function () {
        var qthis = Quasar(this);

        qthis.addClass("disappearing");

        timeout = setTimeout(function () {
            qthis.remove();
        }, 2000);
    }).on("mouseenter", function () {
        clearTimeout(timeout);
        Quasar(this).rmvClass("disappearing");
    }));
};

Quasar.Toast.toaster = null;

/**
 * ToTop button
 */

Quasar.function("ToTop", function () {
    if (window.innerHeight < this.offsetHeight) {
        var totop = Quasar.new("button").class("button icon fa fa-chevron-up"),
                self = this;
        totop.attr("style", "position: fixed; bottom: 1%; right: 1%;");
        totop.on("click", function () {
            self.scrollIntoView();
        });
        this.appendChild(totop.node());
    }
});

Quasar.ToTop = {
    fn: function (element) {
        element.scrollIntoView();
    }
};

Quasar.validateFormOnSubmit = function () {

    var valid = true;

    Quasar.foreach(this.elements, function () {
        if (this.type === 'hidden') {
            return;
        }

        var rules = [];
        var mssgs = [];

        if (this.QUASAR_VALIDATION) {
            rules = this.QUASAR_VALIDATION[0];
            mssgs = this.QUASAR_VALIDATION[1];
        } else {
            var data = this.getAttribute("data-rules");
            if (data) {
                data = JSON.parse(data);
                this.QUASAR_VALIDATION = data;
                this.removeAttribute("data-rules");
                rules = data[0];
                mssgs = data[1];
            }
        }

        var div = Quasar(this.form).find(".Quasar-Field-Error[data-input='" + this.name + "']");
        div.html("");

        if (rules.required !== true && (!this.value || !this.value.trim())) {
            return;
        }

        Quasar.foreach(rules, function (key, value) {
            if (Quasar.Validation[key]) {
                var err = Quasar.Validation[key].call(this, this.value, value);

                if (err) {
                    valid = false;
                    if (mssgs[key]) {
                        err = mssgs[key];
                    }
                    div.html(err);
                    Quasar(this).addClass("quasar-error");
                    return false;
                }
            }
        }, this);
    });

    return valid;
};

Quasar.Validation = {
    required: function (v) {
        if (v.trim().length === 0) {
            return "This field is required";
        }
    },
    email: function (v) {
        if (!(/\S+@\S+\.\S+/.test(v))) {
            return "Please enter a valid email address";
        }
    },
    length: function (v, d) {
        var min = d[0] || 0;
        var max = d[1] || 0;
        var length = v.trim().length;

        if (min > 0 && length < min) {
            return ("Minimum length for that field is " + min + " characters");
        }
        if (max > 0 && length > max) {
            return ("Maximum length for that field is " + max + " characters");
        }
    },
    "in": function (v, d) {
        var length = d.length;
        for (var i = 0; i < length; i++) {
            if (d[i] == v) {
                return;
            }
        }
        return "Field's value not present in pre-defined list";
    },
    "inX": function (v, d) {
        var length = d.length;
        for (var i = 0; i < length; i++) {
            if (d[i] == v) {
                return "Field's value present in pre-defined list";
            }
        }
    },
    "date": function (v) {
        if (v.split("-").length !== 3 || isNaN(Date.parse(v))) {
            return "This is an invalid date";
        }
    },
    "datetime": function (v) {
        if (!(/^\d{4}\-\d{2}\-\d{2}\s\d{2}\:\d{2}(?:\:\d{2})?$/.test(v))) {
            return "This is an invalid datetime";
        }
    },
    /*
     * Alphabetic and alphanumeric checks missing because javascript 
     * does not support UTF and multi-lingual regex matching is not available.
     */
    numeric: function (v) {
        if (isNaN(parseFloat(v)) && !isFinite(v)) {
            return "Can only contain numeric values";
        }
    },
    regex: function (v, d) {
        if (!(new RegExp(d[0], d[1]).test(v))) {
            return "Regular expression did not match.";
        }
    },
    url: function (v) {
        if (!(/^(?:http|ftp)s?\:\/\//i.test(v))) {
            return "Invalid url";
        }
    },
    equals: function (v, d) {
        if (v != d) {
            return "Value does not match predefined value";
        }
    },
    differs: function (v, d) {
        if (v == d) {
            return "Value matches predefined value";
        }
    },
    between: function (v, d) {
        if (!isNaN(parseFloat(v)) && isFinite(v)) {
            if (v < d[0] || v > d[1]) {
                return ("Value must be between " + d[0] + " and " + d[1] + ".");
            }
        } else {
            // between dates not supported in javascript
        }
    },
    betweenX: function (v, d) {
        if (!isNaN(parseFloat(v)) && isFinite(v)) {
            if (v <= d[0] || v >= d[1]) {
                return ("Value must be between " + d[0] + " and " + d[1] + ", exclusive.");
            }
        } else {
            // between dates not supported in javascript
        }
    },
    file: function (v, d) {
        if (window.File && this.files[0] && d < this.files[0].size / 1048576) {
            return 'Maximum file size of ' + d + ' MB exceeded.';
        }
    }
};

Quasar.requireUsersPluginAssets = function (data) {
    if (!Quasar.Plugins.Users) {
        var js = document.createElement('script');
        js.src = data[0];
        document.head.appendChild(js);
        var js = document.createElement('link');
        js.rel = 'stylesheet';
        js.href = data[1];
        document.head.appendChild(js);
    }
}

/*
 * Onload
 */
Quasar.onload(function () {
    /*
     * Enable xhr login prompt for pure (form-less) xhr requests
     */
    Quasar.depot.set.xhrSettings.error(function (er, xhr, original_settings) {
        if (er.error === true) {
            if (er.code === 1 && er.class === "Plugins\\Users\\Exceptions\\UserException") {
                Quasar.xhr({
                    type: "GET",
                    url: Quasar.depot.get("SITE_URL") + "/users/login",
                    response: function (data) {
                        Quasar.requireUsersPluginAssets(data[0]);
                        var d = new Quasar.Dialog();
                        d.open(data[1], {}, 'xhr-login-dialog');
                        var form = d.elements.body.find(".loginForm");
                        form.node().Quasar_original_xhr_settings = original_settings;
                        form.AjaxifyForm({
                            success: function (resp, xhr, settings) {
                                if (resp.status === 'success') {
                                    d.close();
                                    Quasar.xhr(original_settings);
                                } else if (resp.status === 'failure') {
                                    Quasar.AjaxifyForm.functions.success.call(this, resp, xhr, settings);
                                }
                            }
                        });
                    }
                });
            } else {
                alert(er.message);
            }
        } else {
            alert(er);
        }
    });

    /**
     * Fancy Checkbox
     */
    Quasar(".quasar.fancycheckbox").invoke(function () {
        Quasar(this).rmvClass("fancycheckbox").FancyCheckbox({
            tick: this.getAttribute("data-tick"),
            animate: this.getAttribute("data-animate") === "false" ? false : true
        });
    });

    /**
     * Ajaxify Form
     * Timeout used to prevent ajaxifying before custom ajaxification takes place.
     * TODO come up with a better fix than timeout
     */
    (function () {
        Quasar(".Quasar-AF").invoke(function () {
            Quasar(this).addClass("loading");
            Quasar.AjaxifyForm.functions.addLoadingIndicator(this);
        });

        setTimeout(function () {
            Quasar("form").invoke(function () {
                if (!Quasar(this).hasClass("Quasar-AF")) {
                    this.onsubmit = Quasar.validateFormOnSubmit;
                } else {
                    Quasar(this).rmvClass("loading");
                    if (this.QAF !== undefined) {
                        return;
                    }
                    Quasar(this).AjaxifyForm();
                }
            });
        }, 1000);
    }());
});
