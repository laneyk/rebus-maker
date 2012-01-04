<html>
<head>
<link rel=stylesheet type="text/css" href="rebus_style.css">
<script type = "text/javascript" src="jquery.js"></script>
<script type = "text/javascript" src="rebus.js"></script>
</head>
<body onload = "load();">
<div>
<canvas id="canvas" width'100' height='100' style="z-index:1">
</canvas>
</div>
<div id = "button_div">
<div><button id="add_button" onClick="addWord();" type="button">Add Word</button>
<button id="draw_line_button" onClick="startLine();" type="button">Add Line</button>
<button id="draw_circle_button" onClick="startCircle();" type="button">Add Circle</button>
<button id="edit_button" onClick="editWord();" type="button" style="visibility:hidden">Convert Word to Image</button>
<button id="incr_button" onClick="increaseSize();" type="button" style="visibility:hidden">Thicker</button>
<button id="decr_button" onClick="decreaseSize();" type="button" style="visibility:hidden">Thinner</button>
</div>
<div>
<button id="copy_button" onClick="copyWord();" type="button" style="visibility:hidden">Copy Selected Object</button>
<button id="del_button" onClick="deleteWord();" type="button" style="visibility:hidden">Delete Selected Object</button>
<button id="top_button" onClick="topWord();" type="button" style="visibility:hidden">Move Selected Object To Top</button>
</div>
<div>
<button id="png_button" onClick="pngImage();" type="button">Make Grayscale PNG</button>
<button id="clear_button" onClick="clearImage();" type="button">Clear All</button>
</div>
<div id="imgDiv"> </div>
</div>
<canvas id="dummy_canvas" style="display:none"></canvas>
</body>
</html>

