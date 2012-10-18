$(document).ready(function () {

	var surface = $("#surface");

	function mouseOver() {
		$(this).addClass("liHover");
	}

	function mouseOut() {
		$(this).removeClass("liHover");
	}

	$("li").hover(mouseOver, mouseOut);

	$("li").click(function () {
		select($(this));
	});

	function select(listItem) {
		var rows = $("li");
		for (var i = 0; i < rows.length; i++) {
			$(rows[i]).removeClass("liSelect");
		}

		listItem.addClass("liSelect");
		surface.kendoDiagram({ url: "/Samples/" + listItem.text() + ".xml" });
	}

	select($("li").first());
});