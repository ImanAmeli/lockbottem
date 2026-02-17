#target illustrator

(function () {
    if (app.documents.length === 0) {
        app.documents.add(DocumentColorSpace.CMYK);
    }

    var doc = app.activeDocument;

    function mmToPt(mm) {
        return mm * 2.834645669;
    }

    function makeColor(c, m, y, k) {
        var col = new CMYKColor();
        col.cyan = c;
        col.magenta = m;
        col.yellow = y;
        col.black = k;
        return col;
    }

    function addLayerByName(name) {
        var i;
        for (i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) {
                return doc.layers[i];
            }
        }
        var layer = doc.layers.add();
        layer.name = name;
        return layer;
    }

    function drawPath(layer, points, closed, strokeColor, strokeWidth, dashed) {
        var p = layer.pathItems.add();
        p.setEntirePath(points);
        p.closed = !!closed;
        p.stroked = true;
        p.strokeWidth = strokeWidth;
        p.strokeColor = strokeColor;
        p.filled = false;
        if (dashed) {
            p.strokeDashes = [6, 6];
        }
        return p;
    }

    function rectPoints(x, y, w, h) {
        return [
            [x, y],
            [x + w, y],
            [x + w, y - h],
            [x, y - h]
        ];
    }

    function tabPolygon(xStart, xEnd, yFold, depth, direction, shoulderRatio, tongueRatio) {
        var panelW = xEnd - xStart;
        var shoulder = panelW * shoulderRatio;
        var tongueW = panelW * tongueRatio;
        var mid = (xStart + xEnd) / 2;
        var tongueHalf = tongueW / 2;
        var tipY = yFold + (depth * direction);

        return [
            [xStart, yFold],
            [xStart + shoulder, yFold + (depth * direction * 0.55)],
            [mid - tongueHalf, yFold + (depth * direction * 0.85)],
            [mid, tipY],
            [mid + tongueHalf, yFold + (depth * direction * 0.85)],
            [xEnd - shoulder, yFold + (depth * direction * 0.55)],
            [xEnd, yFold]
        ];
    }

    function clamp(v, min, max) {
        if (v < min) {
            return min;
        }
        if (v > max) {
            return max;
        }
        return v;
    }

    function buildDialog() {
        var w = new Window('dialog', 'Tuck-End Box Generator (mm)');
        w.alignChildren = 'fill';

        function addField(label, value) {
            var g = w.add('group');
            g.add('statictext', undefined, label);
            var t = g.add('edittext', undefined, value);
            t.characters = 10;
            return t;
        }

        var typeGroup = w.add('group');
        typeGroup.add('statictext', undefined, 'Box Type:');
        var typeList = typeGroup.add('dropdownlist', undefined, ['Straight Tuck End (STE)', 'Reverse Tuck End (RTE)']);
        typeList.selection = 0;

        var widthField = addField('Panel Width', '60');
        var depthField = addField('Panel Depth', '35');
        var heightField = addField('Box Height', '120');
        var glueField = addField('Glue Flap Width', '14');
        var topField = addField('Top Flap Depth', '32');
        var bottomField = addField('Bottom Flap Depth', '32');
        var dustField = addField('Dust Flap Ratio (0.3-0.9)', '0.55');
        var shoulderField = addField('Tuck Shoulder Ratio (0.1-0.35)', '0.18');
        var tongueField = addField('Tuck Tongue Ratio (0.15-0.6)', '0.35');

        var buttons = w.add('group');
        buttons.alignment = 'right';
        buttons.add('button', undefined, 'Cancel', {name: 'cancel'});
        buttons.add('button', undefined, 'Draw', {name: 'ok'});

        if (w.show() !== 1) {
            return null;
        }

        function num(f) {
            return parseFloat(f.text);
        }

        return {
            type: typeList.selection.index,
            panelW: num(widthField),
            panelD: num(depthField),
            bodyH: num(heightField),
            glueW: num(glueField),
            topD: num(topField),
            bottomD: num(bottomField),
            dustRatio: clamp(num(dustField), 0.3, 0.9),
            shoulderRatio: clamp(num(shoulderField), 0.1, 0.35),
            tongueRatio: clamp(num(tongueField), 0.15, 0.6)
        };
    }

    function validate(v) {
        if (!v) {
            return 'Cancelled';
        }

        var keys = ['panelW', 'panelD', 'bodyH', 'glueW', 'topD', 'bottomD'];
        var i;
        for (i = 0; i < keys.length; i++) {
            if (isNaN(v[keys[i]]) || v[keys[i]] <= 0) {
                return 'All size fields must be valid positive numbers.';
            }
        }

        return null;
    }

    function createDieline(v) {
        var cutLayer = addLayerByName('Dieline - Cut');
        var creaseLayer = addLayerByName('Dieline - Crease');

        var cutCol = makeColor(0, 100, 100, 0);
        var creaseCol = makeColor(100, 0, 0, 0);

        var panelW = mmToPt(v.panelW);
        var panelD = mmToPt(v.panelD);
        var bodyH = mmToPt(v.bodyH);
        var glueW = mmToPt(v.glueW);
        var topD = mmToPt(v.topD);
        var bottomD = mmToPt(v.bottomD);

        var x0 = 0;
        var x1 = x0 + glueW;
        var x2 = x1 + panelW;
        var x3 = x2 + panelD;
        var x4 = x3 + panelW;
        var x5 = x4 + panelD;

        var yTopFold = 0;
        var yBodyBottom = -bodyH;

        var topTuckPanel = (v.type === 0) ? 1 : 3;    // STE: first panel, RTE: third panel
        var bottomTuckPanel = (v.type === 0) ? 3 : 1; // opposite panel

        var panelXs = [x1, x2, x3, x4, x5];

        drawPath(cutLayer, rectPoints(x0, yTopFold, glueW, bodyH), true, cutCol, 1.2, false);
        drawPath(cutLayer, rectPoints(x1, yTopFold, panelW, bodyH), true, cutCol, 1.2, false);
        drawPath(cutLayer, rectPoints(x2, yTopFold, panelD, bodyH), true, cutCol, 1.2, false);
        drawPath(cutLayer, rectPoints(x3, yTopFold, panelW, bodyH), true, cutCol, 1.2, false);
        drawPath(cutLayer, rectPoints(x4, yTopFold, panelD, bodyH), true, cutCol, 1.2, false);

        var i;
        for (i = 1; i <= 4; i++) {
            var px0 = panelXs[i - 1];
            var px1 = panelXs[i];
            var pw = px1 - px0;

            var topIsTuck = (i === topTuckPanel);
            var bottomIsTuck = (i === bottomTuckPanel);

            var topDepth = topIsTuck ? topD : topD * v.dustRatio;
            var bottomDepth = bottomIsTuck ? bottomD : bottomD * v.dustRatio;

            if (topIsTuck) {
                drawPath(cutLayer, tabPolygon(px0, px1, yTopFold, topDepth, 1, v.shoulderRatio, v.tongueRatio), false, cutCol, 1.2, false);
            } else {
                drawPath(cutLayer, rectPoints(px0, yTopFold, pw, topDepth), true, cutCol, 1.2, false);
            }

            if (bottomIsTuck) {
                drawPath(cutLayer, tabPolygon(px0, px1, yBodyBottom, bottomDepth, -1, v.shoulderRatio, v.tongueRatio), false, cutCol, 1.2, false);
            } else {
                drawPath(cutLayer, rectPoints(px0, yBodyBottom, pw, -bottomDepth), true, cutCol, 1.2, false);
            }

            drawPath(creaseLayer, [[px0, yTopFold], [px1, yTopFold]], false, creaseCol, 0.8, true);
            drawPath(creaseLayer, [[px0, yBodyBottom], [px1, yBodyBottom]], false, creaseCol, 0.8, true);
        }

        drawPath(creaseLayer, [[x1, yTopFold], [x1, yBodyBottom]], false, creaseCol, 0.8, true);
        drawPath(creaseLayer, [[x2, yTopFold], [x2, yBodyBottom]], false, creaseCol, 0.8, true);
        drawPath(creaseLayer, [[x3, yTopFold], [x3, yBodyBottom]], false, creaseCol, 0.8, true);
        drawPath(creaseLayer, [[x4, yTopFold], [x4, yBodyBottom]], false, creaseCol, 0.8, true);

        var gText = doc.textFrames.add();
        gText.contents = 'Tuck End | W:' + v.panelW + ' D:' + v.panelD + ' H:' + v.bodyH + ' mm';
        gText.position = [x0, yTopFold + mmToPt(20)];
        gText.textRange.characterAttributes.size = 9;

        app.redraw();
    }

    var values = buildDialog();
    var err = validate(values);
    if (err) {
        if (err !== 'Cancelled') {
            alert(err);
        }
        return;
    }

    createDieline(values);
    alert('Done! Dieline created on Cut/Crease layers.');
})();
