// langPref.js - remembers the language the visitor picked with the switcher.
//
// The switcher is a plain link to the other language's page, so choosing a
// language is an ordinary navigation with no JavaScript involved. All this does
// is record the choice, which the language hand-off in <head> reads on later
// visits to the language root to stop redirecting a visitor who has already
// said which language they want.
document.addEventListener('DOMContentLoaded', function () {
    var switches = document.querySelectorAll('.lang-switch');

    for (var i = 0; i < switches.length; i++) {
        switches[i].addEventListener('click', function () {
            var lang = this.getAttribute('hreflang');
            if (lang !== 'it' && lang !== 'en') return;
            try {
                localStorage.setItem('preferredLanguage', lang);
            } catch (e) {
                // localStorage can throw in privacy modes; the preference is a
                // convenience, so losing it is acceptable.
            }
        });
    }
});
