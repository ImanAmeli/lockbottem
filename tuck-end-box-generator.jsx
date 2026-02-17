#target illustrator

(function () {
    if (app.documents.length === 0) {
        app.documents.add(DocumentColorSpace.CMYK);
    }

    var doc = app.activeDocument;

    function mmToPt(mm) {
        return mm * 2.834645669;
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

    function cmyk(c, m, y, k) {
        var col = new CMYKColor();
        col.cyan = c;
        col.magenta = m;
        col.yellow = y;
        col.black = k;
        return col;
    }

    function findOrCreateLayer(name) {
        var i;
        for (i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) {
                return doc.layers[i];
            }
        }
        var l = doc.layers.add();
        l.name = name;
        return l;
    }

    function clearLayer(layer) {
        while (layer.pageItems.length > 0) {
            layer.pageItems[0].remove();
        }
    }

    function addPath(layer, points, closed, strokeColor, strokeWidth, dashed) {
        var p = layer.pathItems.add();
        p.setEntirePath(points);
        p.closed = !!closed;
        p.stroked = true;
        p.strokeColor = strokeColor;
        p.strokeWidth = strokeWidth;
        p.filled = false;
        if (dashed) {
            p.strokeDashes = [6, 6];
        }
        return p;
    }

    function addCrease(layer, x0, y0, x1, y1, creaseColor) {
        return addPath(layer, [[x0, y0], [x1, y1]], false, creaseColor, 0.8, true);
    }

    function flapRectContour(x0, x1, yFold, depth, dir) {
        var y = yFold + (depth * dir);
        return [[x0, yFold], [x0, y], [x1, y], [x1, yFold]];
    }

    function tuckTabContour(x0, x1, yFold, depth, dir, shoulderRatio, tongueRatio) {
        var w = x1 - x0;
        var shoulder = w * shoulderRatio;
        var tongue = w * tongueRatio;
        var mid = (x0 + x1) / 2;
        var tipY = yFold + (depth * dir);
        return [
            [x0, yFold],
            [x0 + shoulder, yFold + (depth * dir * 0.55)],
            [mid - (tongue / 2), yFold + (depth * dir * 0.84)],
            [mid, tipY],
            [mid + (tongue / 2), yFold + (depth * dir * 0.84)],
            [x1 - shoulder, yFold + (depth * dir * 0.55)],
            [x1, yFold]
        ];
    }

    function lockMainContour(x0, x1, yFold, depth, isLeft, notchRatio) {
        var w = x1 - x0;
        var notch = w * notchRatio;
        var mid = (x0 + x1) / 2;
        var yTip = yFold - depth;
        var yShoulder = yFold - (depth * 0.35);
        var yLock = yFold - (depth * 0.8);

        if (isLeft) {
            return [
                [x0, yFold],
                [x0, yShoulder],
                [x0 + notch * 0.7, yLock],
                [mid - notch * 0.9, yTip],
                [mid + notch * 0.25, yLock],
                [x1 - notch, yShoulder],
                [x1, yFold]
            ];
        }

        return [
            [x0, yFold],
            [x0 + notch, yShoulder],
            [mid - notch * 0.25, yLock],
            [mid + notch * 0.9, yTip],
            [x1 - notch * 0.7, yLock],
            [x1, yShoulder],
            [x1, yFold]
        ];
    }

    function lockDustContour(x0, x1, yFold, depth, towardLeft) {
        var w = x1 - x0;
        var cut = w * 0.3;
        var yTip = yFold - depth;
        if (towardLeft) {
            return [[x0, yFold], [x0, yTip], [x1 - cut, yTip], [x1, yFold]];
        }
        return [[x0, yFold], [x0 + cut, yTip], [x1, yTip], [x1, yFold]];
    }

    function dialog() {
        var w = new Window('dialog', 'Carton Dieline Generator (mm)');
        w.alignChildren = 'fill';

        function field(label, def) {
            var g = w.add('group');
            g.add('statictext', undefined, label);
            var e = g.add('edittext', undefined, def);
            e.characters = 10;
            return e;
        }

        var typeG = w.add('group');
        typeG.add('statictext', undefined, 'Style:');
        var style = typeG.add('dropdownlist', undefined, [
            'Straight Tuck End (STE)',
            'Reverse Tuck End (RTE)',
            'Tuck Top + Lock Bottom (TTLB)'
        ]);
        style.selection = 0;

        var fw = field('Front Panel Width', '60');
        var fd = field('Side Panel Depth', '35');
        var fh = field('Body Height', '120');
        var fGlue = field('Glue Flap Width', '14');
        var fTop = field('Top Flap Depth', '32');
        var fBottom = field('Bottom Flap/Lock Depth', '32');
        var fDust = field('Dust Ratio (0.30-0.90)', '0.55');
        var fShoulder = field('Tuck Shoulder (0.10-0.35)', '0.18');
        var fTongue = field('Tuck Tongue (0.15-0.60)', '0.35');
        var fNotch = field('Lock Notch (0.08-0.28)', '0.16');

        var optP = w.add('panel', undefined, 'Options');
        optP.alignChildren = 'left';
        var clearBefore = optP.add('checkbox', undefined, 'Clear Cut/Crease layers before drawing');
        clearBefore.value = true;

        var btn = w.add('group');
        btn.alignment = 'right';
        btn.add('button', undefined, 'Cancel', {name: 'cancel'});
        btn.add('button', undefined, 'Draw', {name: 'ok'});

        if (w.show() !== 1) {
            return null;
        }

        function toNum(e) { return parseFloat(e.text); }

        return {
            style: style.selection.index,
            panelW: toNum(fw),
            panelD: toNum(fd),
            bodyH: toNum(fh),
            glueW: toNum(fGlue),
            topD: toNum(fTop),
            bottomD: toNum(fBottom),
            dustRatio: clamp(toNum(fDust), 0.30, 0.90),
            shoulderRatio: clamp(toNum(fShoulder), 0.10, 0.35),
            tongueRatio: clamp(toNum(fTongue), 0.15, 0.60),
            lockNotchRatio: clamp(toNum(fNotch), 0.08, 0.28),
            clearBeforeDraw: clearBefore.value
        };
    }

    function validate(v) {
        if (!v) { return 'cancel'; }
        var keys = ['panelW', 'panelD', 'bodyH', 'glueW', 'topD', 'bottomD'];
        var i;
        for (i = 0; i < keys.length; i++) {
            if (isNaN(v[keys[i]]) || v[keys[i]] <= 0) {
                return 'All dimensions must be positive numbers.';
            }
        }
        return null;
    }

    function drawDieline(v) {
        var cutLayer = findOrCreateLayer('Dieline - Cut');
        var creaseLayer = findOrCreateLayer('Dieline - Crease');

        if (v.clearBeforeDraw) {
            clearLayer(cutLayer);
            clearLayer(creaseLayer);
        }

        var cutColor = cmyk(0, 100, 100, 0);
        var creaseColor = cmyk(100, 0, 0, 0);

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

        var yTop = 0;
        var yBottom = -bodyH;

        var panel = [x1, x2, x3, x4, x5];

        addPath(cutLayer, [[x0, yTop], [x0, yBottom]], false, cutColor, 1.2, false);
        addPath(cutLayer, [[x5, yTop], [x5, yBottom]], false, cutColor, 1.2, false);
        addPath(cutLayer, [[x0, yTop], [x1, yTop]], false, cutColor, 1.2, false);
        addPath(cutLayer, [[x0, yBottom], [x1, yBottom]], false, cutColor, 1.2, false);

        var topTuckPanel = (v.style === 1) ? 3 : 1;
        var i;
        for (i = 1; i <= 4; i++) {
            var px0 = panel[i - 1];
            var px1 = panel[i];
            var pw = px1 - px0;
            var topIsTuck = (i === topTuckPanel);
            var topDepth = topIsTuck ? topD : topD * v.dustRatio;

            if (topIsTuck) {
                addPath(cutLayer, tuckTabContour(px0, px1, yTop, topDepth, 1, v.shoulderRatio, v.tongueRatio), false, cutColor, 1.2, false);
            } else {
                addPath(cutLayer, flapRectContour(px0, px1, yTop, topDepth, 1), false, cutColor, 1.2, false);
            }
            addCrease(creaseLayer, px0, yTop, px1, yTop, creaseColor);
        }

        if (v.style === 0 || v.style === 1) {
            var bottomTuckPanel = (v.style === 0) ? 3 : 1;
            for (i = 1; i <= 4; i++) {
                var bx0 = panel[i - 1];
                var bx1 = panel[i];
                var bw = bx1 - bx0;
                var bottomIsTuck = (i === bottomTuckPanel);
                var bDepth = bottomIsTuck ? bottomD : bottomD * v.dustRatio;

                if (bottomIsTuck) {
                    addPath(cutLayer, tuckTabContour(bx0, bx1, yBottom, bDepth, -1, v.shoulderRatio, v.tongueRatio), false, cutColor, 1.2, false);
                } else {
                    addPath(cutLayer, flapRectContour(bx0, bx1, yBottom, bDepth, -1), false, cutColor, 1.2, false);
                }
                addCrease(creaseLayer, bx0, yBottom, bx1, yBottom, creaseColor);
            }
        } else {
            addPath(cutLayer, lockMainContour(panel[0], panel[1], yBottom, bottomD, true, v.lockNotchRatio), false, cutColor, 1.2, false);
            addPath(cutLayer, lockDustContour(panel[1], panel[2], yBottom, bottomD * 0.7, false), false, cutColor, 1.2, false);
            addPath(cutLayer, lockMainContour(panel[2], panel[3], yBottom, bottomD, false, v.lockNotchRatio), false, cutColor, 1.2, false);
            addPath(cutLayer, lockDustContour(panel[3], panel[4], yBottom, bottomD * 0.7, true), false, cutColor, 1.2, false);

            addCrease(creaseLayer, panel[0], yBottom, panel[1], yBottom, creaseColor);
            addCrease(creaseLayer, panel[1], yBottom, panel[2], yBottom, creaseColor);
            addCrease(creaseLayer, panel[2], yBottom, panel[3], yBottom, creaseColor);
            addCrease(creaseLayer, panel[3], yBottom, panel[4], yBottom, creaseColor);
        }

        addCrease(creaseLayer, x1, yTop, x1, yBottom, creaseColor);
        addCrease(creaseLayer, x2, yTop, x2, yBottom, creaseColor);
        addCrease(creaseLayer, x3, yTop, x3, yBottom, creaseColor);
        addCrease(creaseLayer, x4, yTop, x4, yBottom, creaseColor);

        var label = doc.textFrames.add();
        var s = (v.style === 0) ? 'STE' : ((v.style === 1) ? 'RTE' : 'TTLB');
        label.contents = 'Style: ' + s + ' | W ' + v.panelW + ' | D ' + v.panelD + ' | H ' + v.bodyH + ' mm';
        label.position = [x0, yTop + mmToPt(20)];
        label.textRange.characterAttributes.size = 9;

        app.redraw();
    }

    var input = dialog();
    var err = validate(input);
    if (err) {
        if (err !== 'cancel') {
            alert(err);
        }
        return;
    }

    drawDieline(input);
    alert('Done. Dieline generated on Cut/Crease layers.');
})();
