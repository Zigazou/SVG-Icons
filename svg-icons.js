(function () {
    "use strict";

    // SVG XML NameSpace
    var SVGXMLNS = "http://www.w3.org/2000/svg";

    // Regexp for slicing class list
    var SEPWORDS = /[\n\r\t\ ]+/g;

    // Synchronizing flag to allow independent loading of more than one resource
    var synchronize = 0;

    // Object holding icons definitions
    var allIcons = null;

    // Array holding SVG-style definitions
    var allStyles = null;

    // Counter to generate auto ID
    var autoID = 0;

    // Custom stylesheet
    var customStylesheet = document.createElement("style");
    document.head.appendChild(customStylesheet);
    var customStyles = customStylesheet.sheet;

    /* Clone and convert a DOM element into an SVG DOM
     *
     * Because XMLHttpRequest will return the SVG as a simple XML DOM, we need
     * to duplicate and convert this DOM to the SVG namespace.
     *
     * This function works recursively, therefore all the elements that the SVG
     * is made of are also converted.
     */
    function cloneSVG(element, rename) {
        var svgElement;

        // We copy only Node and Text elements, comments and other element are
        // ignored.
        if(element.nodeType == 1) { // Node element
            // Creates the tag
            if(rename) {
                name = rename;
            } else {
                name = element.tagName;
            }

            svgElement = document.createElementNS(SVGXMLNS, name);

            // Copy the attributes
            var attributes = element.attributes;
            for(var i = 0; i < attributes.length; i++) {
                svgElement.setAttribute(
                    attributes[i].name,
                    attributes[i].value
                );
            }

            // Copy the children
            var children = element.childNodes;
            for(var i = 0; i < children.length; i++) {
                svgElement.appendChild(cloneSVG(children[i], null));
            }
        } else if(element.nodeType == 2) { // Text element
            svgElement = element.cloneNode(false);
        }

        return svgElement;
    }

    /* Converts an SVG DOM into a string ready to be encoded in Base64.
     */
    function svgToString(svg) {
        var strOut = "";

        if(svg.nodeType == 1) { // Node element
            // Creates the tag
            strOut = "<" + svg.tagName;

            // Copy the attributes
            var attributes = svg.attributes;
            for(var i = 0; i < attributes.length; i++) {
                strOut += " "
                        + attributes[i].name
                        + '="'
                        + attributes[i].value
                        + '"';
            }

            if(svg.children.length > 0) {
                strOut += ">";

                // Copy the children
                var children = svg.children;
                for(var i = 0; i < children.length; i++) {
                    strOut += svgToString(children[i]);
                }

                strOut += "</" + svg.tagName + ">";
            } else {
                // No child = no need to add an ending tag
                strOut += "/>";
            }
        } else if(svg.nodeType == 2) { // Text element
            strOut += svg.nodeValue;
        }

        return strOut;
    }

    /* Retrieve an SVG file and call a user function on it.
     *
     * This function uses the fact that XMLHttpRequest will automatically parse
     * the SVG file as an XML file. The callback function will directly get
     * a DOM.
     */
    function asynchronousLoad(url, callback) {
        synchronize++;

        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onload = function () {
            if(xmlhttp.status == 200) {
                whenDOMContentLoaded(function() {
                    callback(xmlhttp.responseXML);
                });
            }
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    /* Given an element, returns all the actions the SVG-Icons library has to do
     *
     * The function searches for svg-prepend, svg-append and svg-background
     * classes.
     *
     * It returns an array containing actions (type, on, value).
     */
    function getActions(element) {
        var classes = element.className.replace(SEPWORDS, " ").split(" ");
        var actions = [];
        for(var i = 0; i < classes.length - 1; i++) {
            switch(classes[i]) {
                case "svg-prepend":
                case "svg-append":
                case "svg-background":
                case "svg-backafter":
                case "svg-backbefore":
                    actions.push({
                        sel: null,
                        type: classes[i],
                        on: element,
                        value: classes[i + 1]
                    });
                    i++;
                    break;
                default:
            }
        }

        return actions;
    }

    /* Create a CSS rule
     */
    function createCSSRule(selector, property, value) {
        var rule = selector + "{" + property + ":" + value + ";}";
        customStyles.insertRule(rule, 0);
    }

    /* Create SVG icons for one DOM element
     */
    function doAction(action) {
        if(!allIcons.hasOwnProperty(action.value)) return;
        var icon = allIcons[action.value];
        if(!icon) return;

        var viewBox = icon.getAttribute("viewBox");
        var svg = cloneSVG(icon, "svg");

        svg.removeAttribute("id");
        svg.setAttribute("xmlns", SVGXMLNS);
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute(
            "class",
            "svg-icon " + action.type + " " + action.value
        );

        switch(action.type) {
            case "svg-prepend":
                action.on.insertBefore(svg, action.on.firstChild);
                break;

            case "svg-append":
                action.on.appendChild(svg);
                break;

            case "svg-background":
                var str = svgToString(svg);
                var uri = "url(data:image/svg+xml," + encodeURI(str) + ")";
                action.on.style.backgroundImage = uri;
                break;

            case "svg-backafter":
                var str = svgToString(svg);
                var uri = "url(data:image/svg+xml," + encodeURI(str) + ")";
                createCSSRule(
                        action.sel + '::after',
                        "background-image",
                        uri
                );
                break;

            case "svg-backbefore":
                var str = svgToString(svg);
                var uri = "url(data:image/svg+xml," + encodeURI(str) + ")";
                createCSSRule(
                        action.sel + '::before',
                        "background-image",
                        uri
                );
                break;

            default:
        }
    }

    /* Create SVG icons for each element having a class among svg-prepend,
     * svg-append and svg-background.
     */
    function createSVGIcons() {
        var actions = [];

        // Search for actions according to classes on DOM elements
        var elements = document.querySelectorAll(
            ".svg-prepend, .svg-append, .svg-background"
        );

        for(var i = 0; i < elements.length; i++) {
            actions = actions.concat(getActions(elements[i]));
        }

        // Search for actions according to custom stylesheet
        var styles = allStyles.getElementsByTagName("action");
        for(var i = 0; i < styles.length; i++) {
            var selector = styles[i].getAttribute("selector");
            var type = styles[i].getAttribute("type");
            var value = styles[i].getAttribute("value");

            switch(type) {
                case "svg-backafter":
                case "svg-backbefore":
                    // These will generate CSS rules, no need to create a
                    // rule for each elements, the browser will handle it
                    actions.push({
                        sel: selector,
                        type: type,
                        on: null,
                        value: value
                    });
                    break;
                default:
                    // Generate an SVG for each element pointed to by the rule
                    elements = document.querySelectorAll(selector);

                    for(var j = 0; j < elements.length; j++) {
                        actions.push({
                            sel: selector,
                            type: type,
                            on: elements[j],
                            value: value
                        });
                    }
            }
        }

        // Apply each action found precedently
        for(var i = 0; i < actions.length; i++) doAction(actions[i]);
    }

    /* Look for a meta by its name
     *
     * This function looks for a meta tag by its name and returns its
     * content. It returns null if there is none.
     */
    function findMeta(name) {
        var meta = document.querySelector("meta[name=" + name + "]");
        if(meta) return meta.getAttribute("content");
        return null;
    }

    /* Run a callback when the DOMContentLoaded event is fired.
     *
     * If this event has already been fired, the callback is immediately called.
     */
    function whenDOMContentLoaded(callback) {
        if (/comp|inter|loaded/.test(document.readyState)) {
            // The document is ready to be modified
            callback();
        } else {
            // The document is not ready to be modified, delay
            // its update
            document.addEventListener('DOMContentLoaded', function() {
                callback();
            }, false);
        }
    }

    /* Run a callback only if all asynchronous loads have completed
     */
    function whenAsynchronousLoadsCompleted(callback) {
        synchronize--;
        if(synchronize <= 0) callback();
    }

    var svgURL = findMeta("svg-icons");
    var styleURL = findMeta("svg-stylesheet");
    if(svgURL && styleURL) {
        asynchronousLoad(svgURL, function(icons) {
            // Indexing all icons by their ID because IE9 doesn’t support
            // getElementById on XML hierarchy
            var symbols = icons.getElementsByTagName("symbol");
            allIcons = [];
            for(var i = 0; i < symbols.length; i++) {
                allIcons[symbols[i].getAttribute("id")] = symbols[i];
            }
            whenAsynchronousLoadsCompleted(createSVGIcons);
        });
        asynchronousLoad(styleURL, function(styles) {
            allStyles = styles;
            whenAsynchronousLoadsCompleted(createSVGIcons);
        });
    }
}) ();
