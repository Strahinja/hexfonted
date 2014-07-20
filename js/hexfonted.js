/*!
 * Copyright 2014 Strahinya Radich.
 *
 * This file is part of HexFontEd.
 *
 * HexFontEd is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * HexFontEd is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */
(function ($) {
    $.hexfonted = function(element, options) {
        var defaults = {
            fontListWidth: 400,
            fontListHeight: 400,
            charEditorWidth: 250,
            charEditorHeight: 250,
            hexFontCharWidth: 8,
            hexFontCharHeight: 16,
            pixelsProportional: true,
            fontListCharHorizontalPadding: 15,
            fontListCharVerticalPadding: 15,
            fontListRightScrollbarPadding: 20,
            listEditorGap: 20,
            pixelFilledColor: '#000',
            pixelEmptyColor: '#fff',
            charEditorOutOfBoundsColor: '#ccc',
            charEditorBackgroundColor: '#fff',
            charEditorInBoundsColor: '#fff',
            fontListBackgroundColor: '#fff',
            fontListSelectionBackgroundColor: '#eee',
            fontListGridColor: '#ccc',
            fontListCrossColor: '#ccc'
        };
        var $element = $(element);
        var plugin = this;
        plugin.settings = {};

        plugin.charArray = [];

        plugin.init = function()
        {
            plugin.settings = $.extend({}, defaults, options);

            plugin.fixedColor = null;
            plugin.lastColor = null;

            plugin.selectedCharX = null;
            plugin.selectedCharY = null;

            plugin.canvasEffectiveWidth = plugin.settings.charEditorWidth;
            plugin.canvasEffectiveHeight = plugin.settings.charEditorHeight;

            plugin.pixelWidth = Math.floor(plugin.settings.charEditorWidth / plugin.settings.hexFontCharWidth);
            plugin.pixelHeight = Math.floor(plugin.settings.charEditorHeight / plugin.settings.hexFontCharHeight);
            plugin.pixelStartX = 0;
            plugin.pixelStartY = 0;

            if (plugin.settings.pixelsProportional)
            {
                //plugin.pixelWidth = Math.floor(plugin.settings.charEditorWidth / plugin.settings.hexFontCharWidth);
                //plugin.pixelHeight = Math.floor(plugin.settings.charEditorHeight / plugin.settings.hexFontCharHeight);
                var pixelSize = Math.min(plugin.pixelWidth, plugin.pixelHeight);
                //if (plugin.pixelWidth * plugin.settings.hexFontCharWidth > , plugin.pixelHeight);
                plugin.canvasEffectiveWidth = plugin.settings.hexFontCharWidth * pixelSize;
                plugin.canvasEffectiveHeight = plugin.settings.hexFontCharHeight * pixelSize;
                plugin.pixelStartX = (plugin.settings.charEditorWidth - plugin.canvasEffectiveWidth) / 2;
                plugin.pixelStartY = (plugin.settings.charEditorHeight - plugin.canvasEffectiveHeight) / 2;
                plugin.pixelWidth = pixelSize;
                plugin.pixelHeight = pixelSize;

                //console.log('hfe: pixelSize = ' + pixelSize);
            }

            plugin.numberOfChars = 255;
            plugin.generateSampleChars();

            plugin.charsPerRow = Math.floor(
                (plugin.settings.fontListWidth - plugin.settings.fontListRightScrollbarPadding)
                / (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2));

            plugin.fontListCanvasWidth =
                (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2)
                * Math.floor(
                    (plugin.settings.fontListWidth - plugin.settings.fontListRightScrollbarPadding)
                    /  (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2));

            plugin.numberOfCharRows = Math.ceil(plugin.numberOfChars  / plugin.charsPerRow);

            plugin.fontListCanvasHeight =
                (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2)
                * plugin.numberOfCharRows;

            //console.log(plugin);

            $element.addClass('hexfonted');
            plugin.createUI();

            plugin.hatchPattern = $element.find('.hfe-editor-wrapper canvas').createPattern({
                width: 5, height: 5,
                source: function(context) {
                    $(this).drawLine({
                        strokeStyle: plugin.settings.charEditorOutOfBoundsColor,
                        strokeWidth: 1,
                        x1: 0, y1: 0,
                        x2: 5, y2: 5
                    });
                }
            });

            plugin.drawCharList();
            plugin.drawCharEditorBackground();
            plugin.updateCharFromList(0,0);
            plugin.initEvents();
        };

        plugin.createUI = function()
        {
            $('<nav class="navbar navbar-default navbar-static" role="navigation"/>')
                .append($('<div class="container-fluid"/>')
                    .append($('<div class="navbar-header"/>')
                        .append($('<button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".hfe-navbar-collapse"/>')
                            .append('<span class="sr-only">Toggle navigation</span>')
                            .append('<span class="icon-bar"/>')
                            .append('<span class="icon-bar"/>')
                            .append('<span class="icon-bar"/>')
                        )
                        .append('<a class="navbar-brand" href="#">HexFontEd</a>')
                    )
                    .append($('<div class="collapse navbar-collapse hfe-navbar-collapse"/>')
                        .append($('<ul class="hfe-menu nav navbar-nav"/>')
                            .append($('<li class="dropdown"/>')
                                .append('<a data-toggle="dropdown" class="dropdown-toggle" href="#" id="hfe-font-menu">Font</a>')
                                .append($('<ul class="dropdown-menu" role="menu" aria-labelledby="hfe-font-menu"/>')
                                    .append($('<li/>').append('<a class="hfe-font-new-item" href="#">New</a>'))
                                    .append($('<li/>').append('<a class="hfe-font-import-item" href="#">Import...</a>'))
                                    .append($('<li/>').append('<a class="hfe-font-export-item" href="#">Export...</a>'))
                                    //.append($('<li/>').append('<a id="hfe-font-open-item" href="#">Open...</a>'))
                                    //.append($('<li/>').append('<a id="hfe-font-save-item" href="#">Save...</a>'))
                                )
                            )
                            .append($('<li class="dropdown"/>')
                                .append('<a data-toggle="dropdown" class="dropdown-toggle" href="#" id="hfe-edit-menu">Edit</a>')
                                .append($('<ul class="dropdown-menu" role="menu" aria-labelledby="hfe-edit-menu"/>')
                                    .append($('<li/>').append('<a class="hfe-edit-copy-item" href="#">Copy</a>'))
                                    .append($('<li/>').append('<a class="hfe-edit-cut-item" href="#">Cut</a>'))
                                    .append($('<li/>').append('<a class="hfe-edit-paste-item" href="#">Paste</a>'))
                                )
                            )
                        )
                    )
                )
                .appendTo($element);

            var $tempCanvas = $('<div class="hfe-list-wrapper"/>').appendTo($element);
            plugin.fontListHorizPadding = parseInt($tempCanvas.css('padding-left'))
                + parseInt($tempCanvas.css('padding-right'));
            plugin.fontListVertPadding = parseInt($tempCanvas.css('padding-top'))
                + parseInt($tempCanvas.css('padding-bottom'));
            $tempCanvas.remove();
            $tempCanvas = $('<div class="hfe-editor-wrapper"/>').appendTo($element);
            plugin.charEditorHorizPadding = parseInt($tempCanvas.css('padding-left'))
                + parseInt($tempCanvas.css('padding-right'));
            plugin.charEditorVertPadding = parseInt($tempCanvas.css('padding-top'))
                + parseInt($tempCanvas.css('padding-bottom'));
            $tempCanvas.remove();
            $tempCanvas = null;

            $('<div class="container"/>')
                .append($('<div class="col-sm-12 col-lg-12"/>')
                    .append($('<div class="hfe-list-container" style="width:'
                        + (plugin.settings.fontListWidth + plugin.fontListHorizPadding + 2) + 'px"/>')
                        .append($('<div class="hfe-list-wrapper" style="width: '
                            + (plugin.settings.fontListWidth + plugin.fontListHorizPadding + 2) + 'px; height: '
                            + (plugin.settings.fontListHeight + plugin.fontListVertPadding + 2) + 'px"/>')
                            .append($('<div class="hfe-list-wrapper-inner" style="width: '
                                + plugin.fontListCanvasWidth + 'px; height: '
                                + plugin.fontListCanvasHeight + 'px"/>')
                                .append('<canvas width="' + plugin.fontListCanvasWidth
                                    + '" height="' + plugin.fontListCanvasHeight + '"/>')
                            )
                        )
                    )
                    .append($('<div class="hfe-editor-container" style="width: '
                        + (plugin.settings.charEditorWidth + plugin.charEditorHorizPadding + 2) + 'px; margin-left: '
                        + (plugin.settings.fontListWidth + plugin.fontListHorizPadding + 2
                            + plugin.settings.listEditorGap) + 'px"/>')
                        .append($('<div class="hfe-editor-wrapper" style="width: '
                            + (plugin.settings.charEditorWidth + plugin.charEditorHorizPadding + 2) + 'px; height: '
                            + (plugin.settings.charEditorHeight + plugin.charEditorVertPadding + 2) + 'px"/>')
                            .append('<canvas width="' + plugin.settings.charEditorWidth
                                + '" height="' + plugin.settings.charEditorHeight + '"/>')
                        )
                        .append($('<div class="container-fluid"/>')/* style="margin-left: '
                            + (plugin.settings.fontListWidth + fontListHorizPadding + 2
                            + plugin.settings.listEditorGap) + 'px"/>')*/
                            .append('<button type="button" style="margin-top: 15px" '
                                + 'class="btn btn-default btn-sm hfe-clear-button">Clear</button>')
                            .append('<button type="button" disabled="disabled" style="margin-top: 15px" '
                                + 'class="btn btn-default btn-sm hfe-delete-button">Delete</button>')
                            .append($('<dl class="hfe-properties"/>')
                                .append('<dt>Code</dt>')
                                .append($('<dd class="hfe-properties-code"/>')
                                    .append('<input type="text" class="form-control hfe-insert-box" '
                                        + 'style="max-width: 40%; display: inline-block; '
                                        + 'vertical-align: top"/>')
                                    .append('<button type="button" '
                                        + 'class="btn btn-default btn-sm hfe-insert-button">Insert</button>')
                                    .append('<button type="button" '
                                        + 'class="btn btn-default btn-sm hfe-update-button">Update</button>')
                                )
                                .append('<dt>Hex</dt>')
                                .append('<dd class="hfe-properties-hex">000000003E0808087F49494949494949</dd>')
                                .append('<dt>Position</dt>')
                                .append('<dd class="hfe-properties-position">(0, 0)</dd>')
                                .append('<dt>Click</dt>')
                                .append('<dd class="hfe-properties-click">(0, 0)</dd>')
                            )
                        )
                    )
                )
                .appendTo($element);

            $('<div class="modal fade" id="hfe-confirm-clear-dialog" tabindex="-1" role="dialog" '
                + 'aria-labelledby="hfe-confirm-clear-dialog-title" aria-hidden="true"/>')
                .append($('<div class="modal-dialog"/>')
                    .append($('<div class="modal-content"/>')
                        .append($('<div class="modal-header"/>')
                            .append('<button type="button" class="close" data-dismiss="modal"><span '
                                + 'aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>')
                            .append('<h4 class="modal-title" id="hfe-confirm-clear-dialog-title">Clear character</h4>')
                            .append($('<div class="modal-body"/>')
                                .append('<p>Are you sure you want to clear the current character?</p>')
                                .append($('<div class="modal-footer"/>')
                                    .append('<button type="button" class="btn btn-default '
                                        + 'hfe-confirm-clear-dialog-no-button" data-dismiss="modal">No, keep it</button>')
                                    .append('<button type="button" class="btn btn-danger '
                                        + 'hfe-confirm-clear-dialog-yes-button" data-dismiss="modal">Yes, clear the character</button>')
                                )
                            )
                        )
                    )
                )
                .appendTo($element);

            $('<div class="modal fade" id="hfe-importexport-dialog" tabindex="-1" role="dialog" '
                + 'aria-labelledby="hfe-importexport-dialog-title" aria-hidden="true"/>')
                .append($('<div class="modal-dialog"/>')
                    .append($('<div class="modal-content"/>')
                        .append($('<div class="modal-header"/>')
                            .append('<button type="button" class="close" data-dismiss="modal"><span '
                                + 'aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>')
                            .append('<h4 class="modal-title" id="hfe-importexport-dialog-title">Export</h4>')
                            .append($('<div class="modal-body"/>')
                                .append('<p><strong>Note:</strong> you are limited by the capacity of '
                                    + '<code>&lt;textarea&gt;</code> in your browser and OS.</p>')
                                .append('<textarea class="hfe-importexport-dialog-hex" '
                                    + 'style="width: 100%; height: 100%; min-height: 300px" />')
                                .append($('<div class="modal-footer"/>')
                                    .append('<button type="button" class="btn btn-default '
                                        + 'hfe-importexport-dialog-cancel-button" data-dismiss="modal">Cancel</button>')
                                    .append('<button type="button" class="btn btn-primary '
                                        + 'hfe-importexport-dialog-ok-button" data-dismiss="modal">Export</button>')
                                )
                            )
                        )
                    )
                )
                .appendTo($element);
        };

        plugin.initEvents = function()
        {
            $element.find('.hfe-editor-wrapper>canvas').on('mousemove', plugin.editorOnMouseMove);
            $element.find('.hfe-editor-wrapper>canvas').on('mousedown', plugin.editorOnMouseDown);
            $element.find('.hfe-clear-button').on('click', plugin.clearChar);
            //$element.find('.hfe-confirm-clear-dialog-no-button').on('click', function(e){
            $element.find('.hfe-confirm-clear-dialog-yes-button').on('click', plugin.doClearChar);
            $(document).on('mouseup', plugin.editorOnMouseUp);
            //$element.find('.hfe-editor-wrapper>canvas').on('click', plugin.editorOnMouseClick);
            $element.find('.hfe-list-wrapper canvas').on('click', plugin.listOnClick);

            $element.find('.hfe-importexport-dialog-ok-button').on('click', plugin.doImport);
            $element.find('.hfe-insert-button').on('click', plugin.doInsertChar);
            $element.find('.hfe-update-button').on('click', plugin.doUpdateChar);

            $element.find('.hfe-font-import-item').on('click', function(evt){
                evt.stopPropagation();
                plugin.importAction();
                return false;
            });
            $element.find('.hfe-font-export-item').on('click', function(evt){
                evt.stopPropagation();
                plugin.exportAction();
                return false;
            });
        };

        plugin.editorOnMouseMove = function(evt)
        {
            /*var x = Math.floor(evt.offsetX / plugin.settings.charEditorWidth * plugin.settings.hexFontCharWidth);
            var y = Math.floor(evt.offsetY / plugin.settings.charEditorHeight * plugin.settings.hexFontCharHeight);*/
            var x = Math.floor((evt.offsetX - plugin.pixelStartX) / plugin.pixelWidth);
            var y = Math.floor((evt.offsetY - plugin.pixelStartY) / plugin.pixelHeight);

            if (x >= 0 && x < plugin.settings.hexFontCharWidth
                && y >= 0 && y < plugin.settings.hexFontCharHeight)
            {
                $element.find('.hfe-properties-position').text('(' + x + ', ' + y + ')');
                $element.find('.hfe-editor-wrapper>canvas').css('cursor', 'crosshair');
            }
            else
            {
                $element.find('.hfe-editor-wrapper>canvas').css('cursor', 'not-allowed');
            }

            if (plugin.mouseDown)
            {
                if (x >= 0 && x < plugin.settings.hexFontCharWidth
                    && y >= 0 && y < plugin.settings.hexFontCharHeight)
                {
                    $element.find('.hfe-properties-click').text('(' + x + ', ' + y + ')');
                    plugin.togglePixel(x, y);
                }

                if (plugin.fixedColor == null)
                {
                    plugin.fixedColor = plugin.lastColor;
                    //console.log('190: plugin.fixedColor <- ' + plugin.fixedColor);
                }
            }
        };

        plugin.editorOnMouseDown = function(evt)
        {
            var x = Math.floor((evt.offsetX - plugin.pixelStartX) / plugin.pixelWidth);
            var y = Math.floor((evt.offsetY - plugin.pixelStartY) / plugin.pixelHeight);

            if (x >= 0 && x < plugin.settings.hexFontCharWidth
                && y >= 0 && y < plugin.settings.hexFontCharHeight)
            {
                plugin.mouseDown = true;
                plugin.fixedColor = null;
                plugin.lastColor = null;
                //console.log('200: plugin.mouseDown <- ' + plugin.mouseDown);
                $element.find('.hfe-properties-click').text('(' + x + ', ' + y + ')');
                plugin.togglePixel(x, y);

                if (plugin.fixedColor == null)
                {
                    plugin.fixedColor = plugin.lastColor;
                    //console.log('190: plugin.fixedColor <- ' + plugin.fixedColor);
                }
            }
        };

        plugin.editorOnMouseUp = function(evt)
        {
            plugin.mouseDown = false;
            plugin.fixedColor = null;
            plugin.lastColor = null;
            //console.log('208: plugin.mouseDown <- ' + plugin.mouseDown);
            //console.log('209: plugin.fixedColor <- ' + plugin.fixedColor);
            //console.log('210: plugin.lastColor <- ' + plugin.lastColor);
        };

        plugin.togglePixel = function(x, y)
        {
            //console.log('243: plugin.charArray[' + y + '][' + x + '] = ' + plugin.charArray[y][x]);
            var color;
            if (plugin.charArray[y][x] == 1)
            {
                color = plugin.settings.pixelEmptyColor;
            }
            else if (plugin.charArray[y][x] == 0)
            {
                color = plugin.settings.pixelFilledColor;
            }

            if (plugin.fixedColor != null)
            {
                color = plugin.fixedColor;
            }
            plugin.charArray[y][x] = (color == plugin.settings.pixelFilledColor ? 1 : 0);
            plugin.lastColor = color;
            //console.log('262: lastColor <- ' + plugin.lastColor);

            $element.find('.hfe-editor-wrapper canvas').drawRect({
                fillStyle: color,
                x: plugin.pixelStartX + x * plugin.pixelWidth,
                y: plugin.pixelStartY + y * plugin.pixelHeight,
                fromCenter: false,
                width: plugin.pixelWidth,
                height: plugin.pixelHeight
            });

            plugin.updateProps();
            plugin.updateListFromChar(plugin.selectedCharX, plugin.selectedCharY);
        };

        plugin.drawCharEditorBackground = function()
        {
            $element.find('.hfe-editor-wrapper canvas').drawRect({
                fillStyle: plugin.settings.charEditorBackgroundColor,
                x: 0,
                y: 0,
                fromCenter: false,
                width: plugin.settings.charEditorWidth,
                height: plugin.settings.charEditorHeight
            })
            .drawRect({
                fillStyle: plugin.hatchPattern,
                x: 0,
                y: 0,
                fromCenter: false,
                width: plugin.settings.charEditorWidth,
                height: plugin.settings.charEditorHeight
            })
            .drawRect({
                fillStyle: plugin.settings.charEditorInBoundsColor,
                x: plugin.pixelStartX,
                y: plugin.pixelStartY,
                fromCenter: false,
                width: plugin.canvasEffectiveWidth,
                height: plugin.canvasEffectiveHeight
            });
        };

        plugin.drawEditorSingleChar = function()
        {
            var color;
            for (var y = 0; y < plugin.charArray.length; y++)
            {
                for (var x = 0; x < plugin.charArray[y].length; x++)
                {
                    if (plugin.charArray[y][x] == 1)
                    {
                        color = plugin.settings.pixelFilledColor;
                    }
                    else if (plugin.charArray[y][x] == 0)
                    {
                        color = plugin.settings.pixelEmptyColor;
                    }
                    $element.find('.hfe-editor-wrapper canvas').drawRect({
                        fillStyle: color,
                        x: plugin.pixelStartX + x * plugin.pixelWidth,
                        y: plugin.pixelStartY + y * plugin.pixelHeight,
                        fromCenter: false,
                        width: plugin.pixelWidth,
                        height: plugin.pixelHeight
                    });
                }
            }
        };

        plugin.drawCharListSingleChar = function(x, y, selected)
        {
            var fillColor = plugin.settings.fontListBackgroundColor;

            if (selected)
            {
                fillColor = plugin.settings.fontListSelectionBackgroundColor;
            }

            $element.find('.hfe-list-wrapper canvas').drawRect({
                strokeStyle: plugin.settings.fontListGridColor,
                fillStyle: fillColor,
                x: x * (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2),
                y: y * (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2),
                fromCenter: false,
                width: (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2),
                height: (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2)
            });

            var color;
            var theChar = plugin.getCharAt(x, y);
            if (theChar != null)
            {
                var matrix = plugin.hexToArray(theChar.hex);
                for (var py = 0; py < matrix.length; py++)
                {
                    for (var px = 0; px < matrix[py].length; px++)
                    {
                        if (matrix[py][px] == 1)
                        {
                            color = plugin.settings.pixelFilledColor;
                        }
                        else if (matrix[py][px] == 0)
                        {
                            color = plugin.settings.pixelEmptyColor;
                        }
                        $element.find('.hfe-list-wrapper canvas').drawRect({
                            fillStyle: color,
                            x: px + plugin.settings.fontListCharHorizontalPadding
                                + x * (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2),
                                //plugin.pixelStartX + x * plugin.pixelWidth,
                            y:  py + plugin.settings.fontListCharVerticalPadding
                                + y * (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2),
                                //plugin.pixelStartY + y * plugin.pixelHeight,
                            fromCenter: false,
                            width: 1,
                            height: 1
                        });
                    }
                }
                matrix = null;
                theChar = null;
            }
            else
            {
                $element.find('.hfe-list-wrapper canvas').drawLine({
                    strokeStyle: plugin.settings.fontListCrossColor,
                    x1: x * (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2),
                    y1:  y * (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2),
                    x2: (x+1) * (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2),
                    y2:  (y+1) * (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2)
                });
            }
        };

        plugin.drawCharList = function()
        {
            $element.find('.hfe-list-wrapper canvas').drawRect({
                fillStyle: plugin.settings.fontListBackgroundColor,
                x: 0,
                y: 0,
                fromCenter: false,
                width: plugin.fontListCanvasWidth,
                height: plugin.fontListCanvasHeight
            });

            for (var row = 0; row < plugin.numberOfCharRows; row++)
            {
                for (var col = 0; col < plugin.charsPerRow; col++)
                {
                    plugin.drawCharListSingleChar(col, row,
                        plugin.selectedCharX != null && plugin.selectedCharY != null
                            && plugin.selectedCharX == col && plugin.selectedCharY == row);
                }
            }
        };

        String.prototype.splitToChunks = function(len)
        {
            var chunks = [];
            for (var index = 0; index < this.length; index += len)
            {
                chunks.push(this.substr(index, len));
            }
            return chunks;
        };

        plugin.hexToArray = function(hex)
        {
            var result = [];

            var lines = hex.splitToChunks(2);
            for (var currentLine = 0; currentLine < lines.length; currentLine++)
            {
                var lineVal = parseInt(lines[currentLine], 16);
                var charRow = [];
                for (var currentCol = 0; currentCol < plugin.settings.hexFontCharWidth; currentCol++)
                {
                    charRow.push(lineVal & 1);
                    lineVal >>= 1;
                }
                charRow.reverse();
                result.push(charRow);
            }

            return result;
        };

        plugin.arrayToHex = function(matrix)
        {
            var result = '';

            for (var row = 0; row < matrix.length; row++)
            {
                var bByte = 0;
                for (var col = 0; col < matrix[row].length; col++)
                {
                    bByte |= (matrix[row][col] << (plugin.settings.hexFontCharWidth-1 - col));
                }
                result += ('00' + (bByte).toString(16).toUpperCase()).slice(-2);
            }

            return result;
        };

        plugin.updateCharFromList = function(x, y)
        {
            var theChar = plugin.getCharAt(x, y);
            if (theChar != null)
            {
                plugin.charArray = plugin.hexToArray(theChar.hex);
                plugin.charCode = theChar.code;
            }
        };

        plugin.updateListFromChar = function(x, y)
        {
            var theChar = plugin.getCharAt(x, y);

            plugin.setCharAt(x, y, {
                code: plugin.charCode,
                hex: plugin.arrayToHex(plugin.charArray)
            });

            plugin.drawCharListSingleChar(x, y, true);
        };

        plugin.listOnClick = function(evt)
        {
            var x = Math.floor(evt.offsetX
                / (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2));
            var y = Math.floor(evt.offsetY
                / (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2));

            if (plugin.selectedCharX != null && plugin.selectedCharY != null)
            {
                plugin.drawCharListSingleChar(plugin.selectedCharX, plugin.selectedCharY, false);
            }

            plugin.drawCharListSingleChar(x, y, true);

            plugin.selectedCharX = x;
            plugin.selectedCharY = y;

            plugin.updateCharFromList(x, y);
            plugin.drawCharEditorBackground();
            plugin.drawEditorSingleChar();
            plugin.updateProps();
        };

        plugin.updateProps = function()
        {
            $element.find('.hfe-properties-hex').text(plugin.arrayToHex(plugin.charArray));
            $element.find('.hfe-properties-code input').val(plugin.charCode);
        };

        plugin.clearChar = function()
        {
            $('#hfe-confirm-clear-dialog').modal();
        };

        plugin.generateSampleChars = function()
        {
            plugin.chars = [];
            for (var currentChar = 0; currentChar < plugin.numberOfChars; currentChar++)
            {
                plugin.chars.push({
                    code: ('00' + currentChar.toString(16).toUpperCase()).slice(-2),
                    hex: '00000000000000000000000000000000'
                });
            }
        };

        plugin.getCharAt = function(x, y)
        {
            var index = y * plugin.charsPerRow + x;
            if (index < plugin.chars.length)
            {
                return plugin.chars[index];
            }
            else
            {
                return null;
            }
        };

        plugin.setCharAt = function(x, y, ch)
        {
            var index = y * plugin.charsPerRow + x;
            if (index < plugin.chars.length)
            {
                plugin.chars[index].code = ch.code;
                plugin.chars[index].hex = ch.hex;
            }
        };

        plugin.doClearChar = function()
        {
            for (var row = 0; row < plugin.settings.hexFontCharHeight; row++)
            {
                for (var col = 0; col < plugin.settings.hexFontCharWidth; col++)
                {
                    plugin.charArray[row][col] = 0;
                }
            }
            $element.find('.hfe-editor-wrapper canvas').drawRect({
                fillStyle: plugin.settings.pixelEmptyColor,
                x: plugin.pixelStartX,
                y: plugin.pixelStartY,
                fromCenter: false,
                width: plugin.canvasEffectiveWidth,
                height: plugin.canvasEffectiveHeight
            });
            plugin.updateProps();
            plugin.updateListFromChar(plugin.selectedCharX, plugin.selectedCharY);
            plugin.drawCharListSingleChar(plugin.selectedCharX, plugin.selectedCharY, true);
        };

        plugin.importAction = function()
        {
            var lang = 'en'; // TODO
            $element.find('.hfe-importexport-dialog-hex').val('');
            $element.find('.hfe-importexport-dialog-cancel-button')
                .css('display', '');
            $element.find('.hfe-importexport-dialog-ok-button')
                .text($.hexfonted.prototype.msg[lang]['IMPORT_OK_LABEL']);
            $element.find('#hfe-importexport-dialog-title')
                .text($.hexfonted.prototype.msg[lang]['IMPORT_TITLE']);
            $element.find('#hfe-importexport-dialog').modal();
        };

        plugin.doExport = function()
        {
            var result = '';
            for (var currentChar = 0; currentChar < plugin.chars.length; currentChar++)
            {
                result += plugin.chars[currentChar].code
                    + ':' + plugin.chars[currentChar].hex + '\n';
            }

            return result;
        };

        plugin.exportAction = function()
        {
            var lang = 'en'; // TODO

            $element.find('.hfe-importexport-dialog-hex').val(plugin.doExport());

            $element.find('.hfe-importexport-dialog-cancel-button')
                .css('display', 'none');
            $element.find('.hfe-importexport-dialog-ok-button')
                .text($.hexfonted.prototype.msg[lang]['EXPORT_OK_LABEL']);
            $element.find('#hfe-importexport-dialog-title')
                .text($.hexfonted.prototype.msg[lang]['EXPORT_TITLE']);
            $element.find('#hfe-importexport-dialog').modal();
        };

        plugin.doImport = function()
        {
            plugin.chars = [];

            var lines = $element.find('.hfe-importexport-dialog-hex').val().split('\n');

            plugin.doClearChar();

            for (var currentLine = 0; currentLine < lines.length; currentLine++)
            {
                var parts = lines[currentLine].split(':');
                if (parts.length == 2)
                {
                    plugin.chars.push({
                        code: parts[0],
                        hex: parts[1]
                    });
                }
            }

            if (plugin.chars.length == 0)
            {
                plugin.numberOfChars = 255;
                plugin.generateSampleChars();
            }

            plugin.numberOfChars = plugin.chars.length;

            plugin.charsPerRow = Math.floor(
                (plugin.settings.fontListWidth - plugin.settings.fontListRightScrollbarPadding)
                    / (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2));

            plugin.fontListCanvasWidth =
                (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2)
                    * Math.floor(
                    (plugin.settings.fontListWidth - plugin.settings.fontListRightScrollbarPadding)
                        /  (plugin.settings.hexFontCharWidth + 2 * plugin.settings.fontListCharHorizontalPadding + 2));

            plugin.numberOfCharRows = Math.ceil(plugin.numberOfChars  / plugin.charsPerRow);

            plugin.fontListCanvasHeight =
                (plugin.settings.hexFontCharHeight + 2 * plugin.settings.fontListCharVerticalPadding + 2)
                    * plugin.numberOfCharRows;

            $element.find('.hfe-list-wrapper-inner').css({
                width: '' + plugin.fontListCanvasWidth + 'px',
                height: '' + plugin.fontListCanvasHeight + 'px'
            });
            $element.find('.hfe-list-wrapper-inner canvas').prop('width', plugin.fontListCanvasWidth);
            $element.find('.hfe-list-wrapper-inner canvas').prop('height', plugin.fontListCanvasHeight);
            $element.find('.hfe-editor-container').css({
                width: '' + (plugin.settings.charEditorWidth + plugin.charEditorHorizPadding + 2) + 'px',
                'margin-left': '' + (plugin.settings.fontListWidth + plugin.fontListHorizPadding + 2
                    + plugin.settings.listEditorGap) + 'px'
            });
            $element.find('.hfe-editor-wrapper').css({
                width: '' + (plugin.settings.charEditorWidth + plugin.charEditorHorizPadding + 2) + 'px',
                height: '' + (plugin.settings.charEditorHeight + plugin.charEditorVertPadding + 2) + 'px'
            });
            $element.find('.hfe-editor-wrapper canvas').prop('width', plugin.settings.charEditorWidth);
            $element.find('.hfe-editor-wrapper canvas').prop('height', plugin.settings.charEditorHeight);

            console.log(plugin);

            plugin.drawCharList();
            plugin.drawCharEditorBackground();
            plugin.updateCharFromList(0,0);

            lines = null;
        };

        plugin.doInsertChar = function()
        {
            var charCode = $element.find('.hfe-insert-box').val();

            if (charCode != '')
            {
                plugin.chars.push({
                    code: charCode,
                    hex: '00000000000000000000000000000000'
                });

                plugin.drawCharList();
                plugin.drawCharEditorBackground();

                plugin.updateCharFromList(
                    plugin.chars.length % plugin.charsPerRow,
                    Math.floor(plugin.chars.length / plugin.charsPerRow)
                );

                plugin.updateProps();
            }
        };

        plugin.doUpdateChar = function()
        {
            var charCode = $element.find('.hfe-insert-box').val();

            if (charCode != '')
            {
                plugin.chars[plugin.selectedCharY * plugin.charsPerRow + plugin.selectedCharX].code = charCode;

                plugin.updateCharFromList(
                    plugin.selectedCharX,
                    plugin.selectedCharY
                );

                plugin.updateProps();
            }
        };

        plugin.init();
    };

    $.hexfonted.prototype.msg = {
        en: {
            IMPORT_OK_LABEL: 'Import',
            IMPORT_TITLE: 'Import hex font',
            EXPORT_OK_LABEL: 'Close',
            EXPORT_TITLE: 'Export hex font'
        }
    };

    $.fn.hexfonted = function(options)
    {
        return this.each(function() {
            if ($(this).data('hexfonted') == undefined)
            {
                var plugin = new $.hexfonted(this, options);
                $(this).data('hexfonted', plugin);
                plugin = null;
            }
        });
    }

}(jQuery));
