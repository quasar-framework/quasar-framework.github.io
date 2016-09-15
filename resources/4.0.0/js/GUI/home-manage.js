var editMode = false;
Quasar.onload(function () {
    var unsorted = Quasar("#unsorted").find(".features-container");

    Quasar("#enable_editing").on("click", function () {
        Quasar(document.body).addClass("editting");
        editMode = true;

    });

    Quasar("#save_layout").on("click", function () {
        Quasar(document.body).rmvClass("editting");
        persistLayout();
        editMode = false;
    });

    Quasar("#cancel_edits").on("click", function () {
        Quasar(document.body).rmvClass("editting");
        editMode = false;

        Quasar(".widget").invoke(function () {
            unsorted.append(this);
        });

        Quasar(".feature-group").invoke(function () {
            Quasar(this).remove();
        });

        constructLayout();
    });

    dragula(Quasar(".panel-holder").nodes, {
        moves: function (el, container, handle) {
            return editMode && handle.className.indexOf("panel-header") > -1;
        },
        accepts: function (el, target, source, sibling) {
            return el.is_section;
        }
    });

    var drag = dragula([unsorted.node()], {
        moves: function () {
            return editMode;
        },
        accepts: function (el, target, source, sibling) {
            return el.className.indexOf("widget") === 0;
        }
    });

    document.getElementById("add_section").onclick = function () {
        Quasar.Dialog.Prompt("<h2>Section name</h2>", function (name) {
            addSection(name);
        });
    };

    function addSection(name, holder) {
        var section = document.createElement("section");
        section.is_section = true;

        section.className = "feature-group panel";
        section.innerHTML = "<div class='panel-header'><span class='name' onclick='rename(this)'>" + name + "</span><span class='u-pull-right rmvSec' onclick='removeSection(this.parentNode.parentNode)'><i class='fa fa-times'></i></span></div>";
        var container = document.createElement("div");
        container.className = "features-container panel-body";
        section.appendChild(container);

        drag.containers.push(container);

        Quasar(".panel-holder").nodes[holder || 0].appendChild(section);

        return container;
    }
    
    function constructLayout() {
        if (featuresLayout) {
            Quasar.foreach(featuresLayout, function (index) {
                Quasar.foreach(this, function () {
                    var s = addSection(this[0], index);

                    Quasar.foreach(this[1], function () {
                        var e = document.getElementById("widget-" + this);
                        if (e) {
                            s.appendChild(e);
                        }
                    });
                });

            });
        }
        
        
    }
    constructLayout();

    try {
        document.getElementById("revert_default").onclick = function () {
            Quasar("#layout_input").value("");
            Quasar("#layout_form").node().onsubmit();

            new Quasar.Dialog().loading("Loading default layout, please wait...", true);

            setTimeout(function () {
                Quasar.refresh(true);
            }, 3500);
        };
    } catch (e) {

    }
});

function persistLayout() {
    var layout = [];
    Quasar("#layout").children().invoke(function () {
        var sections = [];

        Quasar(this).find(".feature-group").invoke(function () {
            var widgets = [];

            Quasar(this).find(".widget").invoke(function () {
                widgets.push(this.id.replace("widget-", ""));
            });

            sections.push([Quasar(this).find(".name").html(), widgets]);
        });

        layout.push(sections);
    });

    Quasar("#layout_input").value(JSON.stringify(layout));
    Quasar("#layout_form").node().onsubmit();
}

function rename(element) {
    if (editMode) {
        Quasar.Dialog.Prompt("New name", function (name) {
            element.innerHTML = name;
        });
    }
}

function removeSection(element) {
    if (Quasar(element).find(".panel-body").children(true).length) {
        new Quasar.Dialog().open("In order to remove a section you must make sure it has no features inside first.");
    } else {
        new Quasar.Dialog().open("Are you sure you want to remove this section?", {
            Remove: function () {
                Quasar(element).remove();
            },
            Cancel: null
        });
    }
}