#!/bin/bash
function compileIcons() {
    printf "<svg>"

    for fic in icon-*.svg
    do
        id=$(basename "$fic" ".svg")
        cat "$fic" | sed "s/<svg/<symbol id=\"$id\"/g" \
                   | sed "s|</svg>|</symbol>|g"
    done

    printf "</svg>"
}

compileIcons > svg-icons.svg
