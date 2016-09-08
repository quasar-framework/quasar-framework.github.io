function addSetting(anchor) {
    var buttons = {};
    var types = ["Array", "Boolean", "String"];
    for (var i = 0, l = types.length; i < l; i++) {
        buttons[types[i]] = function () {
            addSettingHTML(this.innerHTML, anchor);
        };
    }

    new Quasar.Dialog().open("Choose setting type.", buttons);
}

function addSettingHTML(type, anchor) {
    var keys = anchor.getAttribute("data-keys");
    var index = parseInt(anchor.getAttribute("data-index"));

    if (!keys || (!index && index !== 0)) {
        alert("Error.");
        throw "Can not add setting.";
    }

    var html = document.getElementById("renderSetting" + type).innerHTML
        .replace(/{{keys}}/g, keys).replace(/{{index}}/g, index);

    var dummy = document.createElement("div");
    dummy.innerHTML = html;

    var parent = anchor.parentNode;
    parent.appendChild(dummy.children[0]);
    parent.appendChild(anchor);

    index = index + 1;
    anchor.setAttribute("data-index", index);
}