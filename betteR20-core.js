// ==UserScript==
// @name         betteR20-core
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      1.2.1
// @updateURL    https://get.5etools.com/betteR20-core.js
// @downloadURL  https://get.5etools.com/betteR20-core.js
// @description  Enhance your Roll20 experience
// @author       5etools
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

/* eslint no-console: "off" */

OBJECT_DEFINE_PROPERTY = Object.defineProperty;
Object.defineProperty = function (obj, prop, vals) {
	try {
		if (prop === "largefeats" || prop === "xlfeats") {
			vals.value = true;
		}
		OBJECT_DEFINE_PROPERTY(obj, prop, vals);
	} catch (e) {
		console.log("failed to define property:");
		console.log(e);
		console.log(obj, prop, vals);
	}
};

d20plus = {
	log: function (arg) {
		console.log("%cD20Plus", "color: #3076b9; font-size: large", "> " + arg);
	},

	addCSS: (sheet, selector, rules) => {
		const index = sheet.cssRules.length;
		if ("insertRule" in sheet) {
			sheet.insertRule(selector + "{" + rules + "}", index);
		} else if ("addRule" in sheet) {
			sheet.addRule(selector, rules, index);
		}
	},

	addAllCss: () => {
		const targetSheet = window.document.styleSheets[window.document.styleSheets.length - 1];
		_.each(d20plus.baseCssRules, function (r) {
			d20plus.addCSS(targetSheet, r.s, r.r);
		});
		_.each(d20plus.cssRules, function (r) {
			d20plus.addCSS(targetSheet, r.s, r.r);
		});
	},

	addProFeatures: function () {
		function setMode(e) {
			console.log(e),
			"text" === e || "rect" === e || "polygon" === e || "path" === e || "pan" === e || "select" === e || "targeting" === e || "measure" === e || window.is_gm || (e = "select"),
				"text" == e ? $("#editor").addClass("texteditmode") : $("#editor").removeClass("texteditmode"),
				$("#floatingtoolbar li").removeClass("activebutton"),
				$("#" + e).addClass("activebutton"),
			"fog" == e.substring(0, 3) && $("#fogcontrols").addClass("activebutton"),
			"rect" == e && ($("#drawingtools").addClass("activebutton"),
				$("#drawingtools").removeClass("text path polygon").addClass("rect")),
			"text" == e && ($("#drawingtools").addClass("activebutton"),
				$("#drawingtools").removeClass("rect path polygon").addClass("text")),
			"path" == e && $("#drawingtools").addClass("activebutton").removeClass("text rect polygon").addClass("path"),
				"polygon" == e ? $("#drawingtools").addClass("activebutton").removeClass("text rect path").addClass("polygon") : d20.engine.finishCurrentPolygon(),
			"pan" !== e && "select" !== e && d20.engine.unselect(),
				"pan" == e ? ($("#select").addClass("pan").removeClass("select").addClass("activebutton"),
					d20.token_editor.removeRadialMenu(),
					$("#editor-wrapper").addClass("panning")) : $("#editor-wrapper").removeClass("panning"),
			"select" == e && $("#select").addClass("select").removeClass("pan").addClass("activebutton"),
				$("#floatingtoolbar .mode").hide(),
			("text" == e || "select" == e) && $("#floatingtoolbar ." + e).show(),
				"gridalign" == e ? $("#gridaligninstructions").show() : "gridalign" === d20.engine.mode && $("#gridaligninstructions").hide(),
				"targeting" === e ? ($("#targetinginstructions").show(),
					$("#upperCanvas").addClass("targeting"),
					d20.engine.canvas.hoverCursor = "crosshair") : "targeting" === d20.engine.mode && ($("#targetinginstructions").hide(),
					$("#upperCanvas").removeClass("targeting"),
				d20.engine.nextTargetCallback && _.defer(function () {
					d20.engine.nextTargetCallback && d20.engine.nextTargetCallback(!1)
				}),
					d20.engine.canvas.hoverCursor = "move"),
				console.log("Switch mode to " + e),
				d20.engine.mode = e,
				d20.engine.canvas.isDrawingMode = "path" == e ? !0 : !1,
				"text" == e || "path" == e || "rect" == e || "polygon" == e || "fxtools" == e ? ($("#secondary-toolbar").show(),
					$("#secondary-toolbar .mode").hide(),
					$("#secondary-toolbar ." + e).show(),
				("path" == e || "rect" == e || "polygon" == e) && ("objects" == window.currentEditingLayer ? ($("#path_strokecolor").val(window.currentPlayer.get("color")).trigger("change-silent"),
					$("#path_fillcolor").val("transparent").trigger("change-silent")) : "" === $("#path_strokecolor").val() && ($("#path_strokecolor").val("#000000").trigger("change-silent"),
					$("#path_fillcolor").val("transparent").trigger("change-silent")),
					d20.engine.canvas.freeDrawingBrush.color = $("#path_strokecolor").val(),
					d20.engine.canvas.freeDrawingBrush.fill = $("#path_fillcolor").val() || "transparent",
					$("#path_width").trigger("change")),
				"fxtools" == e && "" === $("#fxtools_color").val() && $("#fxtools_color").val("#a61c00").trigger("change-silent")) : $("#secondary-toolbar").hide(),
				$("#floatingtoolbar").trigger("blur")
		}

		d20plus.setMode = setMode;

		if (!$(`#fxtools`).length) {
			const $fxMode = $(`<li id="fxtools"/>`).append(`<span class="pictos">e</span>`);
			$fxMode.on("click", () => {
				d20plus.setMode("fxtools");
			});
			$(`#drawingtools`).after($fxMode);
		}

		// add lighting layer tool
		if (!$(`#editinglayer .choosewalls`).length) {
			$(`#editinglayer .choosegmlayer`).after(`<li class="choosewalls"><span class="pictostwo">r</span> Dynamic Lighting</li>`);
		}

		// ensure tokens have editable sight
		$("#tmpl_tokeneditor").replaceWith(d20plus.template_TokenEditor);
		// show dynamic lighting/etc page settings
		$("#tmpl_pagesettings").replaceWith(d20plus.template_pageSettings);
		$("#page-toolbar").on("mousedown", ".settings", function () {
			var e = d20.Campaign.pages.get($(this).parents(".availablepage").attr("data-pageid"));
			e.view._template = $.jqotec("#tmpl_pagesettings");
		});
	},

	enhanceMeasureTool: function () {
		// ROLL20 CODE
		var T = function(e, t, n, i, r, o) {
			var a = d20.engine.getDistanceInScale({
				x: t.x,
				y: t.y
			}, {
				x: t.to_x,
				y: t.to_y
			}, o)
				, s = a[0];
			void 0 !== r && (s = Math.round(10 * (s + r)) / 10);
			var l = s + "" + d20.Campaign.activePage().get("scale_units");
			if (e.strokeStyle = t.color,
					n) {
				// BEGIN MOD
				var fontSize = (1 / d20.engine.canvasZoom) * 12;
				e.font = fontSize + "pt Arial Black";
				// END MOD
				var c = e.measureText(l);
				e.fillStyle = "rgba(255,255,255,0.75)",
					e.beginPath(),
					e.rect(t.to_x - 35, t.to_y - 35, c.width + 10, 20),
					e.closePath(),
					e.fill()
			}
			e.beginPath();
			var u = 15
				, d = Math.atan2(t.to_y - t.y, t.to_x - t.x);
			return e.moveTo(t.x, t.y),
				e.lineTo(t.to_x, t.to_y),
			(i === !0 || "arrow" === i) && (e.lineTo(t.to_x - u * Math.cos(d - Math.PI / 6), t.to_y - u * Math.sin(d - Math.PI / 6)),
				e.moveTo(t.to_x, t.to_y),
				e.lineTo(t.to_x - u * Math.cos(d + Math.PI / 6), t.to_y - u * Math.sin(d + Math.PI / 6))),
				e.closePath(),
				e.stroke(),
			"nub" === i && (e.beginPath(),
				e.arc(t.to_x, t.to_y, 7, 0, 2 * Math.PI, !0),
				e.closePath(),
				e.fillStyle = e.strokeStyle,
				e.fill()),
			n && (e.fillStyle = "rgba(0,0,0,1)",
				e.fillText(l, t.to_x - 30, t.to_y - 20)),
				a
		};
		d20.engine.drawMeasurements = function(e) {
			e.globalCompositeOperation = "source-over",
				e.lineWidth = 3,
				e.globalAlpha = 1,
				_.each(d20.engine.measurements, function(t) {
					if (t.pageid === d20.Campaign.activePage().id) {
						var n = _.clone(t)
							, i = d20.Campaign.players.get(n.player);
						n.color = i.get("color"),
							n.to_x = n.to_x - d20.engine.currentCanvasOffset[0],
							n.to_y = n.to_y - d20.engine.currentCanvasOffset[1],
							n.x = n.x - d20.engine.currentCanvasOffset[0],
							n.y = n.y - d20.engine.currentCanvasOffset[1],
							T(e, n, !0, !0)
					}
				})
		}
		// END ROLL20 CODE
	},

	enhanceStatusEffects: function () {
		d20.token_editor.statussheet.src = "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet.png";
		d20.token_editor.statussheet_small.src = "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet_small.png";

		const xSize = 34;
		const iMin = 47;
		const iMax = 101;
		for (let i = iMin; i < iMax; ++i) {
			d20.token_editor.statusmarkers["5etools_" + (i - iMin)] = String(i * xSize);
		}

		// TODO give this a proper button
		$(`<button>BREAK STUFF</button>`).css({
			position: "fixed",
			top: "10px",
			left: "10px",
			"z-index": "10000"
		}).on("click", () => {
			d20.engine.canvas._objects.forEach(it => {
				it.model.view.updateBackdrops = function (e) {
					if (!this.nohud && ("objects" == this.model.get("layer") || "gmlayer" == this.model.get("layer")) && "image" == this.model.get("type") && this.model && this.model.collection && this.graphic) {
						// BEGIN MOD
						const scaleFact = d20.Campaign.activePage().get("snapping_increment");
						// END MOD
						var t = this.model.collection.page
							, n = e || d20.engine.canvas.getContext();
						n.save(),
						(this.graphic.get("flipX") || this.graphic.get("flipY")) && n.scale(this.graphic.get("flipX") ? -1 : 1, this.graphic.get("flipY") ? -1 : 1);
						var i = this
							, r = Math.floor(this.graphic.get("width") / 2)
							, o = Math.floor(this.graphic.get("height") / 2)
							, a = (parseFloat(t.get("scale_number")),
							this.model.get("statusmarkers").split(","));
						-1 !== a.indexOf("dead") && (n.strokeStyle = "rgba(189,13,13,0.60)",
							n.lineWidth = 10,
							n.beginPath(),
							n.moveTo(-r + 7, -o + 15),
							n.lineTo(r - 7, o - 5),
							n.moveTo(r - 7, -o + 15),
							n.lineTo(-r + 7, o - 5),
							n.closePath(),
							n.stroke()),
							n.rotate(-this.graphic.get("angle") * Math.PI / 180),
							n.strokeStyle = "rgba(0,0,0,0.65)",
							n.lineWidth = 1;
						var s = 0
							, l = i.model.get("bar1_value")
							, c = i.model.get("bar1_max");
						if ("" != c && (window.is_gm || this.model.get("showplayers_bar1") || this.model.currentPlayerControls() && this.model.get("playersedit_bar1"))) {
							var u = parseInt(l, 10) / parseInt(c, 10)
								, d = -o - 20 + 0;
							n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar1_rgb + ",0.75)",
								n.beginPath(),
								n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
								n.closePath(),
								n.fill(),
								n.beginPath(),
								n.rect(-r + 3, d, 2 * r - 6, 8),
								n.closePath(),
								n.stroke(),
								s++
						}
						var l = i.model.get("bar2_value")
							, c = i.model.get("bar2_max");
						if ("" != c && (window.is_gm || this.model.get("showplayers_bar2") || this.model.currentPlayerControls() && this.model.get("playersedit_bar2"))) {
							var u = parseInt(l, 10) / parseInt(c, 10)
								, d = -o - 20 + 12;
							n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar2_rgb + ",0.75)",
								n.beginPath(),
								n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
								n.closePath(),
								n.fill(),
								n.beginPath(),
								n.rect(-r + 3, d, 2 * r - 6, 8),
								n.closePath(),
								n.stroke(),
								s++
						}
						var l = i.model.get("bar3_value")
							, c = i.model.get("bar3_max");
						if ("" != c && (window.is_gm || this.model.get("showplayers_bar3") || this.model.currentPlayerControls() && this.model.get("playersedit_bar3"))) {
							var u = parseInt(l, 10) / parseInt(c, 10)
								, d = -o - 20 + 24;
							n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar3_rgb + ",0.75)",
								n.beginPath(),
								n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
								n.closePath(),
								n.fill(),
								n.beginPath(),
								n.rect(-r + 3, d, 2 * r - 6, 8),
								n.closePath(),
								n.stroke()
						}
						var h, p, g = 1, f = !1;
						switch (d20.Campaign.get("markers_position")) {
							case "bottom":
								h = o - 10,
									p = r;
								break;
							case "left":
								h = -o - 10,
									p = -r,
									f = !0;
								break;
							case "right":
								h = -o - 10,
									p = r - 18,
									f = !0;
								break;
							default:
								h = -o + 10,
									p = r
						}
						// BEGIN MOD
						n.strokeStyle = "white";
						n.lineWidth = 3 * scaleFact;
						const scaledFont = 14 * scaleFact;
						n.font = "bold " + scaledFont + "px Arial";
						// END MOD
						_.each(a, function(e) {
							var t = d20.token_editor.statusmarkers[e.split("@")[0]];
							if (!t)
								return !0;
							if ("dead" === e)
								return !0;
							var i = 0;
							if (g--,
								"#" === t.substring(0, 1))
								n.fillStyle = t,
									n.beginPath(),
									f ? h += 16 : p -= 16,
									n.arc(p + 8, f ? h + 4 : h, 6, 0, 2 * Math.PI, !0),
									n.closePath(),
									n.stroke(),
									n.fill(),
									i = f ? 10 : 4;
							else {
								// BEGIN MOD
								if (!d20.token_editor.statussheet_ready) return;
								const scaledWH = 21 * scaleFact;
								const scaledOffset = 22 * scaleFact;
								f ? h += scaledOffset : p -= scaledOffset;

								if (d20.engine.canvasZoom <= 1) {
									n.drawImage(d20.token_editor.statussheet_small, parseInt(t, 10), 0, 21, 21, p, h - 9, scaledWH, scaledWH);
								} else {
									n.drawImage(d20.token_editor.statussheet, parseInt(t, 10), 0, 24, 24, p, h - 9, scaledWH, scaledWH)
								}

								i = f ? 14 : 12;
								i *= scaleFact;
								// END MOD
							}
							if (-1 !== e.indexOf("@")) {
								var r = e.split("@")[1];
								// BEGIN MOD
								// TODO restore "0 to clear" functionality? or bind it to another key? backtick?
								n.fillStyle = "rgb(222,31,31)";
								var o = f ? 9 : 14;
								o *= scaleFact;
								o -= (14 - (scaleFact * 14));
								n.strokeText(r + "", p + i, h + o);
								n.fillText(r + "", p + i, h + o);
								// END MOD
							}
						});
						var m = i.model.get("name");
						if ("" != m && 1 == this.model.get("showname") && (window.is_gm || this.model.get("showplayers_name") || this.model.currentPlayerControls() && this.model.get("playersedit_name"))) {
							n.textAlign = "center";
							// BEGIN MOD
							var y = 14 * scaleFact;
							const scaledY = 22 * scaleFact;
							const scaled6 = 6 * scaleFact;
							const scaled8 = 8 * scaleFact;
							n.font = "bold " + y + "px Arial";
							var v = n.measureText(m).width;
							n.fillStyle = "rgba(255,255,255,0.50)";
							n.fillRect(-1 * Math.floor((v + scaled6) / 2), o + scaled8, v + scaled6, y + scaled6);
							n.fillStyle = "rgb(0,0,0)";
							n.fillText(m + "", 0, o + scaledY, v);
							// END MOD
						}
						n.restore()
					}
				}
			});
		 })//.appendTo(`body`);

		$(document).off("mouseenter", ".markermenu");
		$(document).on("mouseenter", ".markermenu", function() {
			var e = this;
			$(this).on("mouseover.statusiconhover", ".statusicon", function() {
				a = $(this).attr("data-action-type").replace("toggle_status_", "")
			}),
				$(document).on("keypress.statusnum", function(t) {
					// BEGIN MOD // TODO see if this clashes with keyboard shortcuts
					if ("dead" !== a && currentcontexttarget) {
						// END MOD
						var n = String.fromCharCode(t.which)
							, i = "" == currentcontexttarget.model.get("statusmarkers") ? [] : currentcontexttarget.model.get("statusmarkers").split(",")
							, r = (_.map(i, function(e) {
							return e.split("@")[0]
						}),
							!1);
						i = _.map(i, function(e) {
							return e.split("@")[0] == a ? (r = !0,
							a + "@" + n) : e
						}),
						r || ($(e).find(".statusicon[data-action-type=toggle_status_" + a + "]").addClass("active"),
							i.push(a + "@" + n)),
							currentcontexttarget.model.save({
								statusmarkers: i.join(",")
							})
					}
				})
		})
	},

	// CSS /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	baseCssRules: [
		// status icon enhancement
		{
			s: "#radial-menu .markermenu .markericon",
				r: "background-image: url(https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet.png);"
		}
	],

	cssRules: [], // other scripts should populate this

	// HTML AND TEMPLATES //////////////////////////////////////////////////////////////////////////////////////////////
	template_TokenEditor: `
	 <script id='tmpl_tokeneditor' type='text/html'>
      <div class='dialog largedialog tokeneditor' style='display: block;'>
        <ul class='nav nav-tabs'>
          <li class='active'>
            <a data-tab='basic' href='javascript:void(0);'>Basic</a>
          </li>
          <li>
            <a data-tab='advanced' href='javascript:void(0);'>Advanced</a>
          </li>
        </ul>
        <div class='tab-content'>
          <div class='basic tab-pane'>
            <div style='float: left; width: 300px;'>
              <div style='float: right; margin-right: 85px; font-size: 1.2em; position: relative; top: -4px; cursor: help;'>
                <a class='showtip pictos' title="You can choose to have the token represent a Character from the Journal. If you do, the token's name, controlling players, and bar values will be based on the Character. Most times you'll just leave this set to None/Generic.">?</a>
              </div>
              <label>Represents Character</label>
              <select class='represents'>
                <option value=''>None/Generic Token</option>
                <$ _.each(window.Campaign.activeCharacters(), function(char) { $>
                <option value="<$!char.id$>"><$!char.get("name")$></option>
                <$ }); $>
              </select>
              <div class='clear'></div>
              <div style='float: right; margin-right: 75px;'>
                <label>
                  <input class='showname' type='checkbox' value='1'>
                  Show nameplate?
                </label>
              </div>
              <label>Name</label>
              <input class='name' style='width: 210px;' type='text'>
              <div class='clear'></div>
              <label>Controlled By</label>
              <$ if(this.character) { $>
              <p>(Determined by Character settings)</p>
              <$ } else { $>
              <select class='controlledby chosen' multiple='true'>
                <option value='all'>All Players</option>
                <$ window.Campaign.players.each(function(player) { $>
                <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                <$ }); $>
              </select>
              <$ } $>
              <div class='clear' style='height: 10px;'></div>
              <label>
                Tint Color
              </label>
              <input class='tint_color colorpicker' type='text'>
              <div class='clear'></div>
            </div>
            <div style='float: left; width: 300px;'>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar1_color')$>'></span>
                Bar 1
              </label>
              <div class='clear' style='height: 1px;'></div>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar1_value' type='text'>
                /
                <input class='bar1_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right;'>
                  <select class='bar1_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                  <a class='pictos showtip' style='font-size: 1.2em; position: relative; top: -5px; margin-left: 10px; cursor: help;' title='You can choose an Attribute from the Character this token represents. The values for this bar will be synced to the values of that Attribute.'>?</a>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar2_color')$>'></span>
                Bar 2
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar2_value' type='text'>
                /
                <input class='bar2_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar2_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar3_color')$>'></span>
                Bar 3
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar3_value' type='text'>
                /
                <input class='bar3_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar3_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear' style='height: 10px;'></div>
              <div style='float: left; width: 130px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura1_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 1
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura1_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura1_color colorpicker' type='text'>
                </div>
              </div>
              <div style='float: left; width: 130px; margin-left: 20px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura2_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 2
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura2_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura2_color colorpicker' type='text'>
                </div>
              </div>
              <div class='clear'></div>
            </div>
            <div class='clear'></div>
            <hr>
            <h4>
              GM Notes
              <span style='font-weight: regular; font-size: 0.9em;'>(Only visible to GMs)</span>
            </h4>
            <textarea class='gmnotes'></textarea>
            <div class='clear'></div>
            <label>&nbsp;</label>
          </div>
          <div class='advanced tab-pane'>
            <div class='row-fluid'>
              <div class='span6'>
                <h4>Player Permissions</h4>
                <div style='margin-left: 5px;'>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Name</label>
                    <label>
                      <input class='showplayers_name' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_name' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 1</label>
                    <label>
                      <input class='showplayers_bar1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 2</label>
                    <label>
                      <input class='showplayers_bar2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 3</label>
                    <label>
                      <input class='showplayers_bar3' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar3' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 1</label>
                    <label>
                      <input class='showplayers_aura1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 2</label>
                    <label>
                      <input class='showplayers_aura2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 10px;'></div>
                  <small style='text-align: left; font-size: 0.9em;'>
                    See: All Players can view
                    <br>
                    Edit: Controlling players can view and change
                  </small>
                </div>
                <div class='clear'></div>
              </div>
              <div class='span6'>
                <h4>Emits Light</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='light_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_dimradius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_angle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <span style='color: #888; padding-left: 5px;'>Light Radius / (optional) Start of Dim / Angle</span>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_otherplayers' type='checkbox'>
                    All Players See Light
                  </label>
                </div>
                <div class='inlineinputs' style='margin-top: 2px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_hassight' type='checkbox'>
                    Has Sight
                  </label>
                  <span style="margin-left: 9px; margin-right: 28px;">/</span>
                  Angle:
                  <input class='light_losangle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <div class='inlineinputs' style='margin-left: 90px; margin-top: 5px;'>
                  <span style="margin-left: 8px; margin-right: 12px;">/</span>
                  Multiplyer:
                  <input class='light_multiplier' placeholder='1.0' style='margin-right: 10px;' type='text'>x</input>
                </div>
                <h4>Advanced Fog of War</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='advfow_viewdistance' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                </div>
                <span style='color: #888; padding-left: 5px;'>View Distance</span>
                <!-- %h4 -->
                <!-- Token Actions -->
                <!-- %a.pictos.showtip(style="margin-left: 15px; cursor: help; font-size: 1.1em; position: relative; top: -2px;" title="Choose from Macros and Abilities of linked Character to show when token is selected") ? -->
                <!-- %p -->
                <!-- %strong Add New Token Action: -->
                <!-- %br -->
                <!-- %select.chosen(placeholder="Choose from the list...") -->
                <!-- %option(value="") Choose from the list... -->
                <!-- <$ if(this.character) { $> -->
                <!-- <optgroup label="Abilities"> -->
                <!-- <$ this.character.abilities.each(function(abil) { $> -->
                <!-- <option value="ability|<$!abil.get('id')$>"><$!abil.get('name')$></option> -->
                <!-- <$ }); $> -->
                <!-- </optgroup> -->
                <!-- <$ } $> -->
              </div>
            </div>
          </div>
        </div>
      </div>
	</script>
`,

	template_pageSettings: `
<script id="tmpl_pagesettings" type="text/html">
      <label style='padding-top: 4px;'>
        <strong>Page Size</strong>
      </label>
      <input type="number" class="width" style="width: 50px;" value="<$!this.model.get("width")$>" />
      un. by
      <input type="number" class="height" style="width: 50px; margin-left: 5px;" value="<$!this.model.get("height")$>" />
      un.
      <small style='display: block; font-size: 0.9em; margin-left: 110px;'>width by height, 1 unit = 70 pixels</small>
      <div class='clear' style='height: 15px;'></div>
      <label style='margin-left: 55px; position: relative; top: 6px;'><strong>Scale:</strong> 1 unit =</label>
      <input type="number" class="scale_number" style="width: 35px;" value="<$!this.model.get("scale_number")$>" />
      <select class='scale_units' style='width: 50px; position: relative; top: 2px;'>
        <option value='ft'>ft.</option>
        <option value='m'>m.</option>
        <option value='km'>km.</option>
        <option value='mi'>mi.</option>
        <option value='in'>in.</option>
        <option value='cm'>cm.</option>
        <option value='un'>un.</option>
        <option value='hex'>hex</option>
        <option value='sq.'>sq.</option>
      </select>
      <div class='clear' style='height: 15px;'></div>
      <label>
        <strong>Background</strong>
      </label>
      <input class='pagebackground' type='text'>
      <hr>
      <label style='position: relative; top: 8px;'>
        <strong>Grid</strong>
      </label>
      <label class='checkbox'>
        <input class='gridenabled' type='checkbox' value='1'>
        Enabled, Size:
      </label>
      <input type="number" class="snappingincrement" style="width: 35px;" value="<$!this.model.get("snapping_increment")$>" /> units
      <div class='clear' style='height: 7px;'></div>
      <label style='margin-left: 55px; position: relative; top: 4px;'>
        <a class='showtip pictos' title='Type of formula to use for calculating distances when using the measurement tool. Note: does not apply to Hex grids.'>?</a>
        Diagonals
      </label>
      <select class='diagonaltype' style='width: 100px;'>
        <option value="foure" <$ if(this.model.get("diagonaltype") == "foure") { $>selected<$ } $> >D&D 4E Compatible (Default)</option>
        <option value="threefive" <$ if(this.model.get("diagonaltype") == "threefive") { $>selected<$ } $> >Pathfinder/3.5E Compatible</option>
        <option value="pythagorean" <$ if(this.model.get("diagonaltype") == "pythagorean") { $>selected<$ } $> >Euclidean</option>
        <option value="manhattan" <$ if(this.model.get("diagonaltype") == "manhattan") { $>selected<$ } $> >Manhattan</option>
      </select>
      <div class='clear' style='height: 7px;'></div>
      <label style='margin-left: 55px; position: relative; top: 4px;'>Type</label>
      <select class='gridtype' style='width: 100px;'>
        <option value="square" <$ if(this.model.get("grid_type") == "square") { $>selected<$ } $> >Square</option>
        <option value="hex" <$ if(this.model.get("grid_type") == "hex") { $>selected<$ } $> >Hex (V)</option>
        <option value="hexr" <$ if(this.model.get("grid_type") == "hexr") { $>selected<$ } $> >Hex (H)</option>
      </select>
      <div class='clear' style='height: 2px;'></div>
      <label class='checkbox' style='margin-left: 130px;'>
        <input class='gridlabels' type='checkbox' value='1'>&nbsp; Show Labels (Hex Only)</input>
      </label>
      <div class='clear' style='height: 10px;'></div>
      <label style='margin-left: 55px;'>Color</label>
      <input class='gridcolor' type='text'>
      <div class='clear' style='height: 7px;'></div>
      <label style='margin-left: 55px;'>Opacity</label>
      <div class='gridopacity'></div>
      <div class='clear' style='height: 10px'></div>
      <hr>
      <label style='position: relative; top: -2px;'>
        <strong>Fog of War</strong>
      </label>
      <label class='checkbox'>
        <input class='darknessenabled' type='checkbox' value='1'>&nbsp; Enabled</input>
      </label>
      <hr>
      <label style='position: relative; top: 3px; width: 85px; padding-left: 15px;'>
        <strong>Advanced Fog of War</strong>
      </label>
      <label class='checkbox'>
        <input class='advancedfowenabled showtip' style='margin-top: 8px; margin-bottom: 8px;' type='checkbox' value='1'>&nbsp; Enabled</input>
      </label>
      <span class='no_grid' style='display: none;'>
        , Size:
        <input type="number" class="advancedfowgridsize" style="width: 30px;" value="<$!this.model.get("adv_fow_grid_size")$>" /> units
      </span>
      <br>
      <label class='checkbox'>
        <input class='advancedfowshowgrid showtip' title='By default the Advanced Fog of War hides the map grid anywhere revealed but the player can no longer see because of Dynamic Lighting. This option makes the grid always visible.' type='checkbox' value='1'>&nbsp; Show Grid</input>
      </label>
      <br>
      <label class='checkbox' style='margin-left: 110px;'>
        <input class='dimlightreveals showtip' title='By default the Advanced Fog of War will not be permanently revealed by Dynamic Lighting that is not bright. This option allows dim lighting to also reveal the fog.' type='checkbox' value='1'>&nbsp; Dim Light Reveals</input>
      </label>
      <br>
      <br>
      <label style='position: relative; top: -2px;'>
        <strong>Dynamic Lighting</strong>
      </label>
      <label class='checkbox'>
        <input class='lightingenabled showtip' type='checkbox' value='1'>&nbsp; Enabled</input>
      </label>
      <br>
      <label class='checkbox'>
        <input class='lightenforcelos showtip' title="Player's line of sight set by what tokens they can control." type='checkbox' value='1'>&nbsp; Enforce Line of Sight</input>
      </label>
      <br>
      <br>
      <label class='checkbox' style='margin-left: 110px;'>
        <input class='lightingupdate' type='checkbox' value='1'>&nbsp; Only Update on Drop</input>
      </label>
      <br>
      <label class='checkbox' style='margin-left: 110px;'>
        <input class='lightrestrictmove' title="Don't allow player tokens to move through Dynamic Lighting walls. Can be enabled even if lighting is not used." type='checkbox' value='1'>&nbsp; Restrict Movement</input>
      </label>
      <br>
      <label class='checkbox' style='margin-left: 110px;'>
        <input class='lightglobalillum' title='Instead of darkness show light in all places players can see.' type='checkbox' value='1'>&nbsp; Global Illumination</input>
      </label>
      <hr>
      <label style='font-weight: bold;'>GM Opacity</label>
      <div class='fogopacity'></div>
      <div class='clear'></div>
      <hr>
      <label style='font-weight: bold;'>Play on Load</label>
      <select class='pagejukeboxtrigger' style='width: 180px;'></select>
      <div class='clear'></div>
      <hr>
      <button class='delete btn btn-danger' style='float: right;'>
        Delete Page
      </button>
      <button class='archive btn'>
        Archive Page
      </button>
      <div class='clear'></div>
</script>
`
};

var D20plus = function (version) {
	d20plus.version = version;

	// Window loaded
	window.onload = function () {
		window.unwatch("d20");
		const checkLoaded = setInterval(function () {
			if (!$("#loading-overlay").is(":visible")) {
				clearInterval(checkLoaded);
				d20plus.Init();
			}
		}, 1000);
	};

	/* object.watch polyfill by Eli Grey, http://eligrey.com */
	if (!Object.prototype.watch) {
		Object.defineProperty(Object.prototype, "watch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop, handler) {
				var
					oldval = this[prop],
					newval = oldval,
					getter = function () {
						return newval;
					},
					setter = function (val) {
						oldval = newval;
						return (newval = handler.call(this, prop, oldval, val));
					};
				if (delete this[prop]) {
					Object.defineProperty(this, prop, {
						get: getter,
						set: setter,
						enumerable: true,
						configurable: true
					});
				}
			}
		});
	}
	if (!Object.prototype.unwatch) {
		Object.defineProperty(Object.prototype, "unwatch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop) {
				var val = this[prop];
				delete this[prop];
				this[prop] = val;
			}
		});
	}
	/* end object.watch polyfill */

	window.d20ext = {};
	window.watch("d20ext", function (id, oldValue, newValue) {
		d20plus.log("Set Development");
		newValue.environment = "development";
		Object.defineProperty(newValue, 'seenad', {
			value: true
		});
		return newValue;
	});
	window.d20 = {};
	window.watch("d20", function (id, oldValue, newValue) {
		d20plus.log("Obtained d20 variable");
		window.unwatch("d20ext");
		window.d20ext.environment = "production";
		newValue.environment = "production";
		return newValue;
	});
	window.d20plus = d20plus;
	d20plus.log("Injected");
};

// Inject
if (window.top === window.self) unsafeWindow.eval("(" + D20plus.toString() + ")('" + GM_info.script.version + "')");

// CUSTOM CODE =========================================================================================================
d20plus.Init = () => {
	d20plus.log("Init (v" + d20plus.version + ")");
	d20plus.log("Add CSS");
	d20plus.addAllCss();
	if (window.is_gm) {
		d20plus.log("Add Pro features");
		d20plus.addProFeatures();
	}
	d20plus.log("Enhance Measure tool");
	d20plus.enhanceMeasureTool();
	d20plus.log("Enhance status effects");
	d20plus.enhanceStatusEffects();
	d20plus.log("All systems operational");

	d20.textchat.incoming(false, ({
		who: "system",
		type: "system",
		content: `<span style="font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;">betteR20-core v${d20plus.version} ready</span>`
	}))
};