SVG-Icons
=========
Import SVG icons from one file into an HTML document using JavaScript

Introduction
------------

Through fragment identifiers, a navigator is able to retrieve any element from
an SVG file, thus making it a good candidate for SVG sprite library.

Nonetheless, fragment identifiers (`xlink:href`) are not well supported by
browsers today. If Internet Explorer and Firefox supports it since long, it
is not the case of Chrome, Safari, Opera or the Android browser, with either
partial support or no support at all.

Some implementation also requires the SVG to be directly embedded in.
See http://fvsch.com/code/svg-icons/how-to/ for more information.

Target
------

This library tries to:

- be compatible with browsers from IE9 and above,
- leverage browser caching (icon file is loaded only once),
- have no dependency at all (no jQuery or anything else),
- be as asynchronous as possible,
- be usable with background images,
- let the icons be styled via CSS,
- not require insertion of tags,
- be accessible.

Limitations
-----------

When icons are used as background images, they cannot be styled with CSS.

If JavaScript is disabled, icons simply do not appear. Therefore they must be
unneeded to understand your page.

In order to be styled with CSS, an icon should not use `fill` or `stroke` color
information. If set, CSS won’t be able to change them.

This library only works when served from a web server (you cannot see correctly
`svg-icons.html` if you launch it from your directory).

Contents added dynamically after `svg-icons` has run won’t see icons added.

Example
-------

Place the following file in a directory pointed to by a web server:

- svg-icons.html
- svg-icons.js
- icons.svg

and access `svg-icons.html`.

Or visit http://ouep.eu/test/svg-icons/svg-icons.html

Usage
-----

The `head` part of your html must contain these two lines:

    <meta name="svg-icons" content="icons.svg">
    <script src="svg-icons.js"></script>

The first line indicates where to load icons.
The second line loads and runs the `svg-icons` library.

To insert an icon:

    <p class="svg-prepend icon-star">Lorem ipsum dolor</p>

the first class is the type of insertion:

- svg-prepend: add the icon inside the tag at its beginning (like ::before)
- svg-append: add the icon inside the tag at its end (like ::after)
- svg-background: set the icon as the background-image using data URI.

the second class is the `id` of the icon in the SVG file. It must follow
immediately after the type of insertion.

You can accumulate several insertion on the same tag:

    <p class="svg-prepend icon-star svg-append icon-circle">Lorem ipsum dolor</p>

The SVG file containing the icons must look like this:

    <svg>
      <symbol id="icon-circle" viewBox="0 0 16 16">
        <path d="m15.4 8a7.37 7.37 0 0 1 -7.4 7.4 7.37 7.37 0 0 1 -7.37 -7.4
          7.37 7.37 0 0 1 7.37 -7.37 7.37 7.37 0 0 1 7.4 7.37z"/>
      </symbol>
      <symbol id="icon-square" viewBox="0 0 16 16">
        <path d="m0.582 0.582h14.8v14.8h-14.8z"/>
      </symbol>
      <symbol id="icon-star" viewBox="0 0 16 16">
        <path d="m8 0.654 1.48 6.09 6.22-0.47-5.3 3.28 2.4 5.75-4.8-4-4.77
          4 2.37-5.75-5.32-3.28 6.24 0.47z"/>
      </symbol>
    </svg>

Each icon is stored in a `symbol`. This allows to use a `viewBox` specific to
each icon. The `icons` directory give an example of Bash script to help you
create such a file from individual SVG files.
