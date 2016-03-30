(function () {
    "use strict";
    var SVGXMLNS = "http://www.w3.org/2000/svg";
    var SEPWORDS = /[\n\r\t\ ]+/g;

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
            var children = element.children;
            for(var i = 0; i < children.length; i++) {
                svgElement.appendChild(cloneSVG(children[i], null));
            }
        } else if(element.nodeType == 2) { // Text element
            svgElement = document.createTextElement(element.nodeValue);
        }

        return svgElement;
    }

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
            strOut += ">";

            // Copy the children
            var children = svg.children;
            for(var i = 0; i < children.length; i++) {
                strOut += svgToString(children[i]);
            }

            strOut += "</" + svg.tagName + ">";
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
    function doWithSVG(svgURL, callback) {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onload = function () {
            if(xmlhttp.status == 200) {
                if (/comp|inter|loaded/.test(document.readyState)) {
                    // The document is ready to be modified
                    callback(xmlhttp.responseXML);
                } else {
                    // The document is not ready to be modified, delay
                    // its update
                    document.addEventListener('DOMContentLoaded', function() {
                        callback(xmlhttp.responseXML);
                    }, false);
                }
            }
        }

        xmlhttp.open("GET", svgURL, true);
        xmlhttp.send();
    }

    /* Given an element, returns all the actions the SVG-Icons library has to do
     *
     * The function searches for svg-prepend, svg-append and svg-background
     * classes.
     * When it found one of them, it adds the following class to its
     * corresponding array.
     *
     * It returns an object with 3 entries : prepend, append and background,
     * each containing an array of icon ids.
     */
    function getActions(element) {
        var classes = element.className.replace(SEPWORDS, " ").split(" ");
        var prepends = [];
        var appends = [];
        var backgrounds = [];
        for(var i = 0; i < classes.length - 1; i++) {
            switch(classes[i]) {
                case "svg-prepend":
                    prepends.push(classes[i + 1]);
                    i++;
                    break;
                case "svg-append":
                    appends.push(classes[i + 1]);
                    i++;
                    break;
                case "svg-background":
                    backgrounds.push(classes[i + 1]);
                    i++;
                    break;
                default:
            }
        }

        return {
            prepend: prepends,
            append: appends,
            background: backgrounds
        }
    }

    /* Create SVG icons for one DOM element
     */
    function createSVGIconsFor(icons, element) {
        function doAction(specificActions, actionType, action) {
            for(var i = 0; i < specificActions.length; i++) {
                var id = specificActions[i];
                var icon = icons.getElementById(id);

                if(!icon) continue;

                var viewBox = icon.getAttribute("viewBox");
                var svg = cloneSVG(icon, "svg");

                svg.removeAttribute("id");
                svg.setAttribute("xmlns", SVGXMLNS);
                svg.setAttribute("aria-hidden", "true");
                svg.setAttribute("class", "svg-icon " + actionType + " " + id);

                action(element, svg);
            }
        }

        function actionPrepend(element, svg) {
            element.insertBefore(svg, element.firstChild);
        }

        function actionAppend(element, svg) {
            element.appendChild(svg);
        }

        function actionBackground(element, svg) {
            var str = svgToString(svg);
            element.style.backgroundImage =
                "url(data:image/svg+xml;base64," + btoa(str) + ")";
        }

        var actions = getActions(element);
        doAction(actions.prepend, "prepend", actionPrepend);
        doAction(actions.append, "append", actionAppend);
        doAction(actions.background, "background", actionBackground);
    }

    /* Create SVG icons for each element having a class among svg-prepend,
     * svg-append and svg-background.
     */
    function createSVGIcons(icons) {
        var elements = document.querySelectorAll(
            ".svg-prepend, .svg-append, .svg-background"
        );

        for(var i = 0; i < elements.length; i++) {
            createSVGIconsFor(icons, elements[i]);
        }
    }

    /* Look for the SVG URL in the meta tags
     *
     * This function looks for a meta tag named "svg-icons" and returns its
     * content. It returns null if there is none.
     */
    function findSVGURL() {
        var meta = document.querySelector("meta[name=svg-icons]");
        if(meta) return meta.getAttribute("content");
        return null;
    }

    var svgURL = findSVGURL();
    if(svgURL) {
        doWithSVG(svgURL, function(icons) { createSVGIcons(icons); });
    }
}) ();
