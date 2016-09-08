Quasar.onload(function () {


    Quasar("#addlocale").on("click", function () {

        Quasar.Dialog.Prompt("<h4>Language code</h4>", function (locale) {
            Quasar.xhr({
                url: Quasar.depot.get("SITE_URL") + "/quasar/Translations/addlocale",
                type: "POST",
                data: {
                    dgd_locale: locale
                },
                response: function (x) {
                    if (x === true) {
                        Quasar.refresh();
                    }
                }
            });
        });
    });

    var d;

    function flagClick() {
        window.FLAG_CLICKED.src = this.src;
        Quasar(window.FLAG_CLICKED).next().value(this.FLAG_NAME);
        d.hide();
    }

    Quasar(document.body).find(".language .flag").on("click", function () {
        window.FLAG_CLICKED = this;

        if (!d) {
            var path = Quasar.depot.get("SITE_URL") + window.RESURL + "/images/flags/med/";
            d = new Quasar.Dialog();
            d.open();
            d.closeable(2);

            Quasar.foreach([
                "Equatorial_Guinea", "Namibia", "Mozambique", "Eritrea", "Greece", "Dominican_Republic", "Thailand", "Turks_and_Caicos_Islands", "Mauritania", "Vietnam", "France", "Republic_of_the_Congo", "Kiribati", "Vanuatu", "Lesotho", "Belarus", "Bosnia", "China", "Saint_Vicent_and_the_Grenadines", "Spain", "Tibet", "Ukraine", "Falkland_Islands", "US_Virgin_Islands", "Serbia_and_Montenegro", "Netherlands", "Comoros", "Monaco", "Andorra", "Luxembourg", "American_Samoa", "Venezuela", "Tanzania", "United_Kingdom", "Denmark", "Malawi", "Niue", "Bahamas", "Tajikistan", "Armenia", "Algeria", "South_Korea", "Uganda", "Albania", "French_Polynesia", "Nepal", "Anguilla", "Estonia", "Singapore", "Rwanda", "Paraguay", "Egypt", "Lithuania", "Cameroon", "Vatican_City", "Bahrain", "Micronesia", "Macao", "Tunisia", "Austria", "Sweden", "Bolivia", "South_Africa", "Germany", "Palau", "Saint_Pierre", "Grenada", "Kyrgyzstan", "Cambodia", "Montserrat", "Morocco", "South_Georgia", "Hong_Kong", "Portugal", "Barbados", "Croatia", "Suriname", "Greenland", "Papua_New_Guinea", "Côte_d'Ivoire", "Faroe_Islands", "Israel", "Nauru", "Hungary", "Chile", "Soloman_Islands", "Finland", "Slovakia", "Kazakhstan", "Burundi", "Guyana", "Pakistan", "Philippines", "Sri_Lanka", "Liberia", "Colombia", "Japan", "Costa_Rica", "Taiwan", "Wallis_and_Futuna", "Cyprus", "Malta", "Pitcairn_Islands", "Gambia", "Russian_Federation", "Argentina", "San_Marino", "Christmas_Island", "Zimbabwe", "Mexico", "Mauritius", "Jordan", "Turkey", "Sao_Tomé_and_Príncipe", "Lebanon", "Somalia", "Turkmenistan", "Sudan", "Syria", "Azerbaijan", "UAE", "Iran", "Australia", "El_Salvador", "Sierra_Leone", "Angola", "Brunei", "Trinidad_and_Tobago", "Tuvalu", "Guatemala", "Chad", "Norway", "Nicaragua", "Bulgaria", "Uzbekistan", "Djibouti", "Botswana", "Myanmar", "Dominica", "Honduras", "Central_African_Republic", "Samoa", "Cape_Verde", "Zambia", "Belgium", "Burkina_Faso", "Madagascar", "Belize", "Togo", "Qatar", "Panama", "Guam", "Canada", "Poland", "Brazil", "Romania", "Timor-Leste", "Jamaica", "Oman", "Saint_Lucia", "Ecuador", "Swaziland", "Kuwait", "Malaysia", "United_States_of_America", "Liechtenstein", "Uruguay", "Saudi_Arabia", "Iraq", "Niger", "Slovenia", "Yemen", "Aruba", "Moldova", "Czech_Republic", "Norfolk_Island", "Tonga", "Ireland", "Indonesia", "Cuba", "Laos", "Maldives", "Benin", "Kenya", "Soviet_Union", "Gabon", "Afghanistan", "British_Virgin_Islands", "Peru", "Macedonia", "Iceland", "Bhutan", "Italy", "Ethiopia", "Netherlands_Antilles", "Georgia", "Seychelles", "Antigua_and_Barbuda", "Marshall_Islands", "Fiji", "Gibraltar", "India", "Cayman_Islands", "Democratic_Republic_of_the_Congo", "Puerto_Rico", "Bangladesh", "Mali", "Saint_Kitts_and_Nevis", "North_Korea", "New_Zealand", "Senegal", "Guinea_Bissau", "Switzerland", "Mongolia", "Haiti", "Martinique", "Nigeria", "Libya", "Ghana", "Bermuda", "Cook_Islands", "Guinea", "Latvia"
            ], function () {
                var img = Quasar.new("img").addClass("select-flag").attr("src", path + this + ".png").on("click", flagClick);
                img.node().FLAG_NAME = this;
                d.elements.body.append(img);
            });
        }

        d.show();
    });

});