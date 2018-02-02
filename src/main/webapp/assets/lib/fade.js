var Fade = (function() {

    var FADE_IN_CSS;
    var FADE_OUT_CSS;

    function config(fadeInCss, fadeOutCss) {
        FADE_IN_CSS = fadeInCss;
        FADE_OUT_CSS = fadeOutCss;
    }

    function fade(elem, fadeIn) {
        Dom.removeCssClass(elem, FADE_IN_CSS, FADE_OUT_CSS);
        Dom.addCssClass(elem, fadeIn ? FADE_IN_CSS : FADE_OUT_CSS);
    }

    return {
        config : config,
        fadeIn : function(elem) {
            fade(elem, true)
        },
        fadeOut : function(elem) {
            fade(elem, false)
        }
    };
})();