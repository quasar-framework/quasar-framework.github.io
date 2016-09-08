Quasar.function("FileManager", function (base) {
    return new Quasar.FileManager(this, base);
});

Quasar.define("FileManager", function (browser, base) {
    var manager = this;

    base = base ? base.replace(".", "") : "Public";

    this.browser = browser;
    this.base = base;

    Quasar(browser).addClass("quasar file-manager folder open").attr("data-path", base);

    this.generateToolbar();
    this.loadDir(browser);

    this.onFileSelected = function (file) {
    };
    this.onDirSelected = function (dir) {
    };
});

Quasar.FileManager.prototype = {
    loadDir: function (entity) {
        var manager = this;
        entity = Quasar(entity);

        if (entity.hasClass("file")) {
            entity = entity.parent().parent();
        }

        var loaded = entity.find("ul");

        if (loaded) {
            loaded.remove();
        }

        Quasar.xhr({
            url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/dir/" + entity.attr("data-path"),
            response: function (resp) {
                entity.append(Quasar.new("ul").html(resp));

                manager.processEntries();
                manager.toolbar.actualize();
            },
            error: Quasar.FileManager.onxhrerror
        });
    },
    generateToolbar: function () {
        var toolbar = new Quasar.FileManager.Toolbar();

        Quasar.foreach([
            'upload', 'createdir', 'unlink', 'rename'
        ], function () {
            toolbar.addButton(new Quasar.FileManager.Toolbar.Button[this]());
        });

        toolbar.file_manager = this;
        Quasar(this.browser).append(toolbar.node);

        this.toolbar = toolbar;
    },
    processEntries: function () {
        var manager = this;
        var entries = Quasar(this.browser).find(".unproc");

        if (entries.nodes.length) {
            entries.invoke(function () {
                this.file_manager = manager;
                this.onclick = Quasar.FileManager.entityClick;
            }).rmvClass("unproc");
        }
    },
    select: function (elem) {
        elem = Quasar(elem);

        this.deselect();
        elem.addClass("selected");

        this.toolbar.actualize();
    },
    deselect: function () {
        Quasar(this.browser).find(".selected").rmvClass("selected");
        this.toolbar.actualize();
    },
    openFile: function (elem) {
        this.select(elem);
        this.onFileSelected.call(this, elem);
    },
    openFolder: function (elem, event) {
        var evt = Quasar(event.target);

        if (!(evt.hasClass("file") || evt.parent().hasClass("file")) && (elem === event.target || elem === event.target.parentNode)) {

            var q = Quasar(elem);

            if (!q.hasClass("selected")) {
                this.select(elem);
                return;
            }

            this.onDirSelected.call(this, elem);

            var folder,
                manager = this;

            if (q.hasClass("folder")) {
                folder = elem;
            } else {
                folder = elem.parentNode;
            }

            if (!elem.getElementsByTagName("ul").length) {
                this.loadDir(folder);
            }

            var icon = q.firstChild();

            if (icon.hasClass("fa-folder")) {
                icon.rmvClass("fa-folder").addClass("fa-folder-open");
                icon.parent().addClass("open");
            } else {
                icon.rmvClass("fa-folder-open").addClass("fa-folder");
                icon.parent().rmvClass("open");
            }
        }
    },
    getSelectedEntry: function () {
        return Quasar(this.browser).find(".selected").node();
    },
    getPath: function (entry) {
        var path;
        if (Quasar(entry).hasClass("file")) {
            path = entry.parentNode.parentNode.getAttribute("data-path") + "/" + entry.firstElementChild.nextElementSibling.innerHTML;
        } else {
            path = entry.getAttribute("data-path");
        }

        return path;
    }
};

Quasar.FileManager.entityClick = function (event) {
    if (Quasar(this).hasClass("folder")) {
        this.file_manager.openFolder(this, event);
    } else {
        this.file_manager.openFile(this);
    }
};

Quasar.FileManager.onxhrerror = function (error) {
    Quasar.redirect(Quasar.depot.get("SITE_URL") + "/quasar?GUI_backto=" + encodeURIComponent(document.location.href));
};

Quasar.FileManager.Toolbar = function () {
    var element = document.createElement("div");
    element.className = "toolbar";

    this.node = element;
};

Quasar.FileManager.Toolbar.prototype = {
    addButton: function (button) {
        this.node.appendChild(button.node);

        button.toolbar = this;

        return button;
    },
    getButton: function (id) {
        Quasar(this.node).find(".button." + id);
    },
    actualize: function () {
        var selectedEnt = this.file_manager.getSelectedEntry();

        if (selectedEnt) {
            var selected = (Quasar(selectedEnt).hasClass("folder") ? 1 : 2);
        } else {
            var selected = false;
        }

        Quasar(this.node).find(".button").invoke(function () {
            if (selected === false) {
                if (this.activateOn === -1) {
                    this.toolbar_button.enable();
                } else {
                    this.toolbar_button.disable();
                }

            } else if (this.activateOn <= 0 || this.activateOn === selected) {
                this.toolbar_button.enable();
            } else {
                this.toolbar_button.disable();
            }

        });
    },
    createButton: function (v) {
        Quasar.FileManager.Toolbar.Button[v.id] = function () {
            Quasar.FileManager.Toolbar.Button.call(this, v);
        };

        var proto = Object.create(Quasar.FileManager.Toolbar.Button.prototype);
        proto.onclick = v.onclick;

        Quasar.FileManager.Toolbar.Button[v.id].prototype = proto;

        return new Quasar.FileManager.Toolbar.Button[v.id];
    }
};

Quasar.FileManager.Toolbar.Button = function (o) {
    var element = document.createElement("button"), button = this;

    element.className = "button icon fa fa-" + o.icon + " " + o.id;
    element.title = o.title;
    element.onclick = function () {
        var selected = this.toolbar_button.toolbar.file_manager.getSelectedEntry();
        var dir, entity;

        if (selected === undefined) {
            dir = this.toolbar_button.toolbar.file_manager.base;
            selected = this.toolbar_button.toolbar.file_manager.browser;
        } else if (Quasar(selected).hasClass("file")) {
            dir = selected.parentNode.parentNode.getAttribute("data-path");
            entity = dir + "/" + selected.firstElementChild.nextElementSibling.innerHTML;
        } else {
            dir = selected.getAttribute("data-path");
        }

        button.onclick(selected, dir, entity);
    };

    // Button active on
    // 0 - both
    // 1 - folders
    // 2 - files
    element.activateOn = o.active || 0;

    element.toolbar_button = this;

    this.node = element;
};

Quasar.FileManager.Toolbar.Button.prototype = {
    enable: function () {
        Quasar(this.node).rmvClass("disabled").rmvAttr("disabled");
    },
    disable: function () {
        Quasar(this.node).addClass("disabled").attr("disabled", "disabled");
    },
    remove: function () {
        Quasar(this.node).remove();
    }
};

Quasar.foreach([
    {
        id: "move",
        icon: "scissors",
        title: "Move file",
        active: 2,
        onclick: function () {
            alert('mgd');
        }
    },
    {
        id: "rename",
        icon: "pencil",
        title: "Rename entry",
        active: 0,
        onclick: function (selected, dir, entity) {
            var toolbarButton = this;
            var d = new Quasar.Dialog();
            var entry = entity ? entity : dir;

            var randomID = "quasar_random_id_" + Math.floor((Math.random() * 1000000000) + 1);

            d.open("<label>New name</label><input id='" + randomID + "' type='text' value='" + entry.split("/").pop() + "'/>", {
                Rename: function () {
                    var newName = Quasar("#" + randomID).value();
                    var newPath = entry.split("/").slice(0, -1).join("/") + "/" + newName;

                    Quasar.xhr({
                        url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/rename",
                        type: "PUT",
                        data: {
                            QFM_old: entry,
                            QFM_new: newPath
                        },
                        response: function (resp) {
                            if (resp.data === true) {
                                if (Quasar(selected).hasClass("folder")) {
                                    Quasar(selected).attr("data-path", newPath);
                                }
                                selected.firstElementChild.nextElementSibling.innerHTML = newName;
                            }
                        },
                        error: Quasar.FileManager.onxhrerror
                    });
                },
                Cancel: null
            });

        }
    },
    {
        id: "upload",
        icon: "upload",
        title: "Upload file",
        active: -1,
        onclick: function (selected, dir) {
            var manager = this.toolbar.file_manager;
            var d = new Quasar.Dialog();

            d.open("<label>Upload from your device</label><input type='file'/>" +
                "<hr/>" +
                "<label>Upload from the web</label><input placeholder='URL' type='text'/>", {
                    Upload: function () {

                        Quasar(this).parents("Quasar-Dialog-holder").find("input").invoke(function () {
                            if (this.value) {

                                var url = Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/upload";
                                var method = "POST";

                                if (this.type == "file") {
                                    d.loading("Uploading file..", true);
                                    Quasar.xhr({
                                        url: url,
                                        type: method,
                                        headers: {
                                            "X-QFM-NAME": this.files[0].name,
                                            "X-QFM-DIR": dir
                                        },
                                        data: this.files[0],
                                        response: function (resp) {
                                            if (typeof resp === "string" && resp.search("allocate") > -1) {
                                                d.closeable(true);
                                                d.open("An error occurred - file not uploaded!<hr/>" +
                                                    "<strong>File too large.</strong>", {
                                                        Close: null
                                                    });
                                                return;
                                            }

                                            if (resp.data == true) {
                                                manager.loadDir(selected);
                                            }

                                            d.closeable(true);
                                            d.close();
                                        },
                                        error: function (error) {
                                            d.closeable(true);
                                            d.open("An error occurred - file not uploaded!<hr/>" +
                                                "<strong>" + error.message + "</strong>", {
                                                    Close: null
                                                });
                                        }
                                    });
                                } else {
                                    d.loading("Downloading file from remote server..", true);
                                    Quasar.xhr({
                                        type: method,
                                        url: url,
                                        data: {
                                            QFM_dir: dir,
                                            QFM_remote_url: this.value
                                        },
                                        response: function (resp) {
                                            if (typeof resp === "string" && resp.search("allocate") > -1) {
                                                d.closeable(true);
                                                d.open("An error occurred - file not uploaded!<hr/>" +
                                                    "<strong>File too large.</strong>", {
                                                        Close: null
                                                    });
                                                return;
                                            }

                                            if (resp.data == true) {
                                                manager.loadDir(selected);
                                            }

                                            d.closeable(true);
                                            d.close();
                                        },
                                        error: function (error) {
                                            d.closeable(true);
                                            d.open("An error occurred - file not uploaded!<hr/>" +
                                                "<strong>" + error.message + "</strong>", {
                                                    Close: null
                                                });
                                        }
                                    });
                                }


                                return false;
                            }
                        });
                    },
                    Cancel: null
                });
        }
    },
    {
        id: "createdir",
        icon: "folder",
        title: "Create a new folder",
        active: -1,
        onclick: function (selected, dir) {
            var toolbarButton = this;
            var d = new Quasar.Dialog();

            var randomID = "quasar_random_id_" + Math.floor((Math.random() * 1000000000) + 1);

            d.open("<label>Folder name</label><input id='" + randomID + "' type='text'/>", {
                Create: function () {
                    var dirName = Quasar("#" + randomID).value();

                    Quasar.xhr({
                        url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/createDir",
                        type: "POST",
                        data: {
                            QFM_dir: dir + "/" + dirName
                        },
                        response: function (resp) {
                            if (resp.data === true) {
                                toolbarButton.toolbar.file_manager.loadDir(selected);
                            }
                        },
                        error: Quasar.FileManager.onxhrerror
                    });
                },
                Cancel: null
            })

        }
    },
    {
        id: "unlink",
        icon: "trash",
        title: "Delete entry",
        active: 0,
        onclick: function (selected, dir, entity) {
            var toolbar = this.toolbar;
            var d = new Quasar.Dialog();

            if (selected) {
                d.open("Are you sure you want to delete this entry?", {
                    Yes: function () {
                        Quasar.xhr({
                            url: Quasar.depot.get("SITE_URL") + "/quasar/FileBrowser/deleteEntity",
                            type: "DELETE",
                            data: {QFM_dir: entity ? entity : dir},
                            response: function (resp) {
                                if (resp.data === true) {
                                    Quasar(selected).remove();
                                    toolbar.actualize();
                                }
                            },
                            error: Quasar.FileManager.onxhrerror
                        });
                    },
                    No: null
                });
            }
        }
    }
], function (k, v) {
    Quasar.FileManager.Toolbar.Button[v.id] = function () {
        Quasar.FileManager.Toolbar.Button.call(this, v);
    };

    var proto = Object.create(Quasar.FileManager.Toolbar.Button.prototype);
    proto.onclick = v.onclick;

    Quasar.FileManager.Toolbar.Button[v.id].prototype = proto;
});