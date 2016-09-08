(function () {
    var editor;

    Quasar.onload(function () {
        editor = ace.edit("file_contents");
        editor.setTheme("ace/theme/tomorrow");

        addNavbarButton(Quasar.new("button").on("click", function () {
            Quasar(this).toggleClass("fa-folder").toggleClass("fa-folder-open");
            Quasar(".map").toggleClass("hidden");
        }).class("navbar-button fa fa-folder-open"));

        addNavbarButton(Quasar.new("button").on("click", function () {
            var file = Quasar(".file.selected"),
                button = this,
                thisfunc = arguments.callee;

            if (!file.node()) {
                return;
            }

            Quasar.xhr({
                url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/save",
                type: "PUT",
                data: {
                    path: file.parent().parent().attr("data-path") + "/" + file.lastChild().html(),
                    file_data: editor.getValue()
                },
                response: function (resp) {
                    if (resp === true) {
                        var newone = button.cloneNode(true);
                        newone.onclick = thisfunc;
                        Quasar(newone).rmvClass("saveFail").addClass("saveSuccess");
                        button.parentNode.replaceChild(newone, button);
                    }
                },
                error: function (resp) {
                    var newone = button.cloneNode(true);
                    newone.onclick = thisfunc;
                    Quasar(newone).rmvClass("saveSuccess").addClass("saveFail");
                    button.parentNode.replaceChild(newone, button);
                }
            });
        }).class("navbar-button fa fa-save"));

        processEntries();
    });

    function openFile() {
        var path = Quasar.depot.get("SITE_URL") + '/quasar/FileBrowser/file/' + this.parentNode.parentNode.getAttribute('data-path'),
            elem = this;

        Quasar(".selected").rmvClass("selected");
        Quasar(this).addClass("selected");

        Quasar("#file_contents").addClass("loading");

        editor.setReadOnly(true);

        Quasar.xhr({
            url: path + "/" + this.lastElementChild.innerHTML,
            response: function (resp) {
                var mode = ace.require("ace/ext/modelist").getModeForPath(elem.lastElementChild.innerHTML).mode;

                editor.session.setMode(mode);
                editor.session.setValue(resp, -1);
                editor.setReadOnly(false);

                Quasar("#file_contents").rmvClass("loading");
            }
        });
    }

    function folderClick(event) {
        var evt = Quasar(event.target);

        if (!(evt.hasClass("file") || evt.parent().hasClass("file")) && (this === event.target || this === event.target.parentNode)) {

            var elem;

            if (Quasar(this).hasClass("folder")) {
                elem = this;
            } else {
                elem = this.parentNode;
            }

            if (!this.getElementsByTagName("ul").length) {
                Quasar.xhr({
                    url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/dir/" + this.getAttribute("data-path"),
                    response: function (resp) {
                        Quasar(elem).append(Quasar.new("ul").html(resp));

                        processEntries();
                    }
                });
            }

            var icon = Quasar(this).firstChild();

            if (icon.hasClass("fa-folder")) {
                icon.rmvClass("fa-folder").addClass("fa-folder-open");
            } else {
                icon.rmvClass("fa-folder-open").addClass("fa-folder");
            }
        }
    }

    function processEntries() {
        Quasar(".unproc").invoke(function () {
            if (Quasar(this).hasClass("folder")) {
                this.onclick = folderClick;
            } else {
                this.onclick = openFile;
            }
        }).rmvClass("unproc");
    }
}
());