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
            listEditorGap: 20,
            pixelFilledColor: '#000',
            pixelEmptyColor: '#fff',
            charEditorOutOfBoundsColor: '#ccc',
            charEditorInBoundsColor: '#fff'
        };
        var $element = $(element);
        var plugin = this;
        plugin.settings = {};

        plugin.charArray = [];

        plugin.init = function()
        {
            plugin.settings = $.extend({}, defaults, options);

            for (var row = 0; row < plugin.settings.hexFontCharHeight; row++)
            {
                plugin.charArray[row] = [];
                for (var col = 0; col < plugin.settings.hexFontCharWidth; col++)
                {
                    plugin.charArray[row].push(0);
                }
            }

            plugin.fixedColor = null;
            plugin.lastColor = null;

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

                console.log('hfe: pixelSize = ' + pixelSize);
            }

            /*$.jCanvas.extend({
                name: 'getPixel',
                fn: function(ctx, params)
                {
                    var p = params;
                    alert('works');
                    var pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
                    $(this).data('pixelReturnValue', '#' + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16));
                }
            });*/

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

            plugin.drawBackground();
            plugin.updateHex();
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
                                    .append($('<li/>').append('<a id="hfe-font-new-item" href="#">New</a>'))
                                    .append($('<li/>').append('<a id="hfe-font-open-item" href="#">Open...</a>'))
                                    .append($('<li/>').append('<a id="hfe-font-save-item" href="#">Save...</a>'))
                                )
                            )
                            .append($('<li class="dropdown"/>')
                                .append('<a data-toggle="dropdown" class="dropdown-toggle" href="#" id="hfe-edit-menu">Edit</a>')
                                .append($('<ul class="dropdown-menu" role="menu" aria-labelledby="hfe-edit-menu"/>')
                                    .append($('<li/>').append('<a id="hfe-edit-copy-item" href="#">Copy</a>'))
                                    .append($('<li/>').append('<a id="hfe-edit-cut-item" href="#">Cut</a>'))
                                    .append($('<li/>').append('<a id="hfe-edit-paste-item" href="#">Paste</a>'))
                                )
                            )
                        )
                    )
                )
                .appendTo($element);

            var $tempCanvas = $('<div class="hfe-list-wrapper"/>').appendTo($element);
            var fontListHorizPadding = parseInt($tempCanvas.css('padding-left'))
                + parseInt($tempCanvas.css('padding-right'));
            $tempCanvas.remove();
            $tempCanvas = $('<div class="hfe-editor-wrapper"/>').appendTo($element);
            var charEditorHorizPadding = parseInt($tempCanvas.css('padding-left'))
                + parseInt($tempCanvas.css('padding-right'));
            $tempCanvas.remove();
            $tempCanvas = null;

            $('<div class="container"/>')
                .append($('<div class="col-sm-12 col-lg-12"/>')
                    .append($('<div class="hfe-list-container" style="width:'
                        + (plugin.settings.fontListWidth + fontListHorizPadding + 2) + 'px"/>')
                        .append($('<div class="hfe-list-wrapper"/>')
                            .append('<canvas width="' + plugin.settings.fontListWidth
                                + '" height="' + plugin.settings.fontListHeight + '"/>')
                        )
                    )
                    .append($('<div class="hfe-editor-container" style="width: '
                        + (plugin.settings.charEditorWidth + charEditorHorizPadding + 2) + 'px; margin-left: '
                        + (plugin.settings.fontListWidth + fontListHorizPadding + 2
                            + plugin.settings.listEditorGap) + 'px"/>')
                        .append($('<div class="hfe-editor-wrapper"/>')
                            .append('<canvas width="' + plugin.settings.charEditorWidth
                                + '" height="' + plugin.settings.charEditorHeight + '"/>')
                        )
                        .append($('<div class="container-fluid"/>')/* style="margin-left: '
                            + (plugin.settings.fontListWidth + fontListHorizPadding + 2
                            + plugin.settings.listEditorGap) + 'px"/>')*/
                            .append('<button type="button" style="margin-top: 15px" '
                                + 'class="btn btn-default btn-sm hfe-clear-button">Clear</button>')
                            .append($('<dl class="hfe-properties"/>')
                                .append('<dt>Code</dt>')
                                .append('<dd class="hfe-properties-code">00</dd>')
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

            plugin.updateHex();
        };

        plugin.drawBackground = function()
        {


// plugin.settings.charEditorOutOfBoundsColor

            $element.find('.hfe-editor-wrapper canvas').drawRect({
                fillStyle: plugin.hatchPattern,
                x: 0,
                y: 0,
                fromCenter: false,
                width: plugin.settings.charEditorWidth,
                height: plugin.settings.charEditorHeight
            });

            $element.find('.hfe-editor-wrapper canvas').drawRect({
                fillStyle: plugin.settings.charEditorInBoundsColor,
                x: plugin.pixelStartX,
                y: plugin.pixelStartY,
                fromCenter: false,
                width: plugin.canvasEffectiveWidth,
                height: plugin.canvasEffectiveHeight
            });
        };

        plugin.updateHex = function()
        {
            var result = '';
            for (var row = 0; row < plugin.charArray.length; row++)
            {
                var bByte = 0;
                for (var col = 0; col < plugin.charArray[row].length; col++)
                {
                    bByte |= (plugin.charArray[row][col] << (plugin.settings.hexFontCharWidth-1 - col));
                }
                result += ('00' + (bByte).toString(16).toUpperCase()).slice(-2);
            }
            $element.find('.hfe-properties-hex').text(result);
        };

        plugin.clearChar = function()
        {
            $('#hfe-confirm-clear-dialog').modal();
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
            plugin.updateHex();
        };

        plugin.init();
    };

    $.hexfonted.prototype.msg = {
        en: {

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
