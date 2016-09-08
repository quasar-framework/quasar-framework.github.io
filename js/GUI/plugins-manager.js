function resizeIframe() {
    var iframe = document.getElementById("installed_plugins");

    iframe.style.height = (iframe.contentWindow.document.body.offsetHeight + 50) + 'px';
}

function confirmUninst() {
    if (confirm('Are you sure you want to remove the plugin?')) {
        return true;
    }
    return false;
}

function toggleComponents(td) {
    td.parentNode.nextElementSibling.classList.toggle('visible');
}

Quasar.onload(function () {

    function installRemotePluginPrompt() {
        var btn = this;

        var d = new Quasar.Dialog();
        d.loading("Fetching plugin details..");

        Quasar.xhr({
            url: this.pluginURL,
            response: function (x) {
                if (!x.versions) {
                    return;
                }

                var h3 = document.createElement("h3");
                h3.innerHTML = "Please select version";

                var p = document.createElement("p");
                p.innerHTML = "You are about to install plugin [" + btn.pluginDisplayName + "]";

                var select = document.createElement("select");

                Quasar.foreach(x.versions, function () {
                    var option = document.createElement("option");
                    option.value = this.version;
                    option.innerHTML = "v" + this.version + " @ " + this.date;
                    select.appendChild(option);
                });

                d.open(Quasar.new("div").append(h3).append(p).append(select), {
                    Install: function () {
                        if (!select.value) {
                            return;
                        }

                        installRemotePlugin(btn.pluginID, select.value);
                    },
                    Cancel: null
                });
            }
        });
    }

    function installRemotePlugin(id, version) {
        Quasar("#installRemoteId").value(id);
        Quasar("#installRemoteVer").value(version);
        Quasar("#installRemotePlugin").node().onsubmit();
    }

    function processPluginEntries() {
        var btn = document.createElement("button");
        btn.type = "button";

        if (document.getElementById("installed_plugins").contentDocument.getElementById("installed_plugin_" + this.getAttribute("data-name"))) {
            btn.className = "button u-pull-right";
            btn.innerHTML = "installed";
            btn.setAttribute("disabled", "disabled");
        } else {
            var a = Quasar(this).find(".location");

            btn.className = "button button-primary u-pull-right";
            btn.innerHTML = "install";
            btn.pluginURL = a.attr("href");
            btn.pluginDisplayName = a.html();
            btn.pluginID = this.getAttribute("data-id");
            btn.onclick = installRemotePluginPrompt;
        }

        Quasar(this).prepend(btn);
    }

    var statusDialog;

    Quasar("#installRemotePlugin").AjaxifyForm({
        beforeSubmit: function () {
            statusDialog = new Quasar.Dialog();
            statusDialog.loading("Downloading plugin..", true);
        },
        success: function () {
            Quasar.refresh();
        },
        error: function () {
            statusDialog.closeable(true);
            statusDialog.open("Plugin was not installed successfully.", {
                Ok: null
            });
        }
    });

    Quasar("#searchForm").AjaxifyForm({
        success: function (resp) {
            Quasar(this.node().QAF.handler.response.element).html(resp).children().invoke(processPluginEntries);
        },
        error: function (err) {
            if (!err) {
                alert("Could not connect to live server.");
            }
        }
    });

    var create = document.createElement("button");
    create.className = "navbar-button fa fa-plus";
    create.title = "Create your own plugin.";
    create.onclick = function () {
        var form = Quasar("#createPlugin").node().cloneNode(true);
        Quasar(form).style({
            display: "block"
        }).AjaxifyForm({
            success: function (resp) {
                if (resp.data && resp.data === true) {
                    d.closeable(true);
                    d.close();

                    var iframe = document.getElementById("installed_plugins");
                    iframe.src = iframe.src + "?breaker=" + Date.now();
                } else {
                    Quasar.AjaxifyForm.functions.success.call(this, resp);
                }

            }
        });

        var d = new Quasar.Dialog();
        d.open(form, {
            Create: function () {
                form.onsubmit();
            },
            Cancel: function () {
                d.closeable(true);
                d.close();
            }
        }, null, false);
    };

    addNavbarButton(create);
});