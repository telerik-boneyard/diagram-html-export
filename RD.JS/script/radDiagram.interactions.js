$(document).ready(function () {

    var surface = $("#surface");
    var tooltip = $("#tooltip");
    var isAnimating = false;
    var showTimeout = null;
    var closeTimeout = null;
    var hoverTimeout = null;

    function isNullOrUndefined(item) {
        return item == undefined || item == null
    }

    function tryToShowTooptip(group, path) {
        clearTimeout(closeTimeout);

        if (hoverTimeout === null) {
            hoverTimeout = setTimeout(function () {
                closeTooltip(300);
            }, 1000);
        }

        showTimeout = setTimeout(function () {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
            showTooptip(group, path);
        }, 300);
    }

    function showTooptip(group, path) {
        if (tooltip[0]) {
            if (!isNullOrUndefined(group.transform)) {
                var absoluteLeft = group.transform.baseVal.getItem(0).matrix.e + mainLayer[0].transform.baseVal.getItem(0).matrix.e;
                var absoluteTop = group.transform.baseVal.getItem(0).matrix.f + mainLayer[0].transform.baseVal.getItem(0).matrix.f;
                var left = absoluteLeft + 230;
                var top = absoluteTop + 70;

                var bBox = group.getBBox();
                if (path.transform.baseVal.getItem(0).matrix.a)
                    left += bBox.width * path.transform.baseVal.getItem(0).matrix.a;
                else
                    left += bBox.width;

                var text = $("#content-" + group.id.replace("g-", ""));
                if (text[0])
                    var content = text[0].textContent == "" ? "" : (text[0].textContent + "</br>");

                setTooltipContent(content, absoluteLeft, absoluteTop);

                isAnimating = true;
                if (tooltip.hasClass('collapsed')) {
                    tooltip.removeClass('collapsed');
                    tooltip.animate({ top: top, left: left, opacity: 1 }, 250, function () { isAnimating = false; });
                }
                else {
                    tooltip.animate({ top: top, left: left }, 250, function () { isAnimating = false; });
                }
            }
        }
    }

    function setTooltipContent(content, x, y) {
        $("#contentLabel").html(content);
        $("#posXLabel").html(Math.round(x));
        $("#posYLabel").html(Math.round(y));
    }

    function tryToCloseTooptip() {
        clearTimeout(showTimeout);

        closeTimeout = setTimeout(function () {
            closeTooltip(300);
        }, 300);
    }

    function closeTooltip(duration) {
        tooltip.animate({ opacity: 0 }, duration, function () { tooltip.addClass('collapsed'); });
    }

    function shapeMouseOver() {
        var path = $("#" + this.id);
        if (path[0]) {
            path[0].setAttribute("class", 'diagramShape fill');
            tryToShowTooptip(this, path[0]);
        }
    }

    function shapeMouseOut() {
        var path = $("#" + this.id);
        if (path[0])
            path[0].setAttribute("class", "diagramShape");
        tryToCloseTooptip();
    }

    function onTooltipMouseOver(e) {
        if (!isAnimating)
            closeTooltip(3);
    }

    //// Dragging.
    ////	var shapeStartX;
    ////	var shapeStartY;
    ////	var draggingGroup;

    ////	function draggableOnDragStart(e) {
    ////		draggingGroup = $(e.target).parent()[0];

    ////		if (!isNullOrUndefined(draggingGroup.transform)) {
    ////			shapeStartX = draggingGroup.transform.baseVal.getItem(0).matrix.e;
    ////			shapeStartY = draggingGroup.transform.baseVal.getItem(0).matrix.f;
    ////		}
    ////	}

    ////	function draggableOnDrag(e) {
    ////		if (!isNullOrUndefined(draggingGroup.transform))
    ////			draggingGroup.transform.baseVal.getItem(0).setTranslate(e.x.location - (e.x.startLocation - shapeStartX), e.y.location - (e.y.startLocation - shapeStartY));
    ////	}

    surface.bind('completed', function () {
        if (tooltip[0]) {
            tooltip[0].onmouseover = onTooltipMouseOver;
        }

        $(".diagramShapeGroup").each(function () {
            ////			$(this).kendoDraggable({ dragstart: draggableOnDragStart, drag: draggableOnDrag });
            this.onmouseover = shapeMouseOver;
            this.onmouseout = shapeMouseOut;
        });
        ////$(".diagramConnectionGroup").each(function () {
        ////			$(this).kendoDraggable({ dragstart: draggableOnDragStart, drag: draggableOnDrag });
        ////});

        mainLayer = $("#mainLayer");
    });
});