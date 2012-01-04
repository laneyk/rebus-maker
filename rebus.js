function load() {
  canvas = document.getElementById("canvas");
  imgDiv = document.getElementById("imgDiv"); 
  edit_button = document.getElementById("edit_button");
  incr_button = document.getElementById("incr_button");
  decr_button = document.getElementById("decr_button");
  copy_button = document.getElementById("copy_button");
  top_button = document.getElementById("top_button");
  del_button = document.getElementById("del_button");
  dummy_canvas = document.getElementById("dummy_canvas");
  button_div = document.getElementById("button_div");

  canvas.addEventListener("mousedown",handleMouseDown,false);
  document.addEventListener("keydown",handleKeyDown,false);

  resizer_size = 9;

  photoResults = new Array();
  imageRequests = new Array();
  objects = new Array();
  object_selected = false;
  object_dragged = false;
  resize_pic = false;
  moving_line_endpoint = false;
  line_started = false;
  circle_started = false;
  picking_photo = false;
  updateLabels();

  canvas.width = 480;
  canvas.height = 288;
  ctx = canvas.getContext("2d");
  drawCanvas();
}

function isInside(point, obj) {
  var point_x = (obj.width > 0) ? point.x : -point.x;
  var obj_x = (obj.width > 0) ? obj.x : -obj.x;
  var obj_width = (obj.width > 0) ? obj.width : -obj.width;
  var point_y = (obj.height > 0) ? point.y : -point.y;
  var obj_y = (obj.height > 0) ? obj.y : -obj.y;
  var obj_height = (obj.height > 0) ? obj.height : -obj.height;
  if (point_x >= obj_x && point_x <= obj_x + obj_width) {
    if (point_y >= obj_y && point_y <= obj_y + obj_height) {
      return true;
    }
  }
  return false;
}

function hitTest(point, obj) {
  if (obj.type == "word" || obj.type == "pic") {
    if (isInside(point, obj)) {
      return true;
    }
  } else if (obj.type == "circle") {
    if (isInCircle(point, obj)) {
      return true;
    }
  } else if (obj.type == "line") {
    var x0 = point.x;
    var y0 = point.y;
    var x1 = obj.x;
    var y1 = obj.y;
    var x2 = obj.x + obj.x_diff;
    var y2 = obj.y + obj.y_diff;
    var x = ((y1-y0)*(y2-y1) - x0*(x2-x1) - x1*(y2-y1)*(y2-y1)/(x2-x1)) / (-(x2-x1) - (y2-y1)*(y2-y1)/(x2-x1)); 
    var y = -(x2-x1) / (y2-y1) * (x-x0) + y0;
    var closestPoint = {x:x, y:y};
    var dist = pointDistance(closestPoint,point);
    if (dist < obj.width) {
      var both_endpts_dist = pointDistance(closestPoint, {x:x1, y:y1}) + pointDistance(closestPoint, {x:x2, y:y2});
      var seg_length = pointDistance({x:x1, y:y1}, {x:x2, y:y2});
      if (both_endpts_dist - seg_length < 1) {
        return true;
      }
    }
  }
  return false;
}

function pointDistance(point1, point2) {
  return Math.sqrt((point1.x-point2.x)*(point1.x-point2.x) + (point1.y-point2.y)*(point1.y-point2.y));
}

function handleMouseMove(e) {
  var whereClicked = getCursorPosition(e);
  if (line_started) {
    cur_line.x_diff = whereClicked.x - cur_line.x;
    cur_line.y_diff = whereClicked.y - cur_line.y;
    drawCanvas();
    drawLine(cur_line);
  } else if (circle_started) {
    cur_circle.width = whereClicked.x - cur_circle.x;
    cur_circle.height = whereClicked.y - cur_circle.y;
    drawCanvas();
    drawCircle(cur_circle);
  } else if (object_dragged) { 
    var drag_obj = objects[drag_object_index];
    if (resize_pic) {
      drag_obj.width = whereClicked.x - drag_obj.x - drag_x;
      drag_obj.height = whereClicked.y - drag_obj.y - drag_y;
    } else if (moving_line_endpoint) {
      if (endpoint_to_move == 0) {
        var end_x = drag_obj.x + drag_obj.x_diff;
        var end_y = drag_obj.y + drag_obj.y_diff;
        drag_obj.x = whereClicked.x - drag_x;
        drag_obj.y = whereClicked.y - drag_y;
        drag_obj.x_diff = end_x - drag_obj.x;
        drag_obj.y_diff = end_y - drag_obj.y;
      } else {
        drag_obj.x_diff = whereClicked.x - drag_x + drag_obj.orig_x_diff - drag_obj.x;
        drag_obj.y_diff = whereClicked.y - drag_y + drag_obj.orig_y_diff - drag_obj.y;
      }
    } else {
      drag_obj.x = whereClicked.x - drag_x;
      drag_obj.y = whereClicked.y - drag_y;
    }
    drawCanvas();
  } 
}

function isInCircle(point, circ) {
  var centerX = circ.x + circ.width / 2;
  var centerY = circ.y + circ.height / 2;
  var width = circ.width;
  var height = circ.height;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - height / 2);
  ctx.bezierCurveTo(
    centerX + width/2, centerY - height / 2,
    centerX + width/2, centerY + height / 2,
    centerX, centerY + height / 2
  );
  ctx.bezierCurveTo(
    centerX - width/2, centerY + height/2,
    centerX - width/2, centerY - height/2,
    centerX, centerY - height/2
  );

  ctx.strokeStyle = "#000";
  ctx.lineWidth = circ.lineWidth;

  return (ctx.isPointInPath(point.x, point.y) || isInside(point, getResizer(circ)));
}

function drawCircle(circ, selected) {
  var centerX = circ.x + circ.width / 2;
  var centerY = circ.y + circ.height / 2;
  var width = circ.width;
  var height = circ.height;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - height / 2);
  ctx.bezierCurveTo(
    centerX + width/2, centerY - height / 2,
    centerX + width/2, centerY + height / 2,
    centerX, centerY + height / 2
  );
  ctx.bezierCurveTo(
    centerX - width/2, centerY + height/2,
    centerX - width/2, centerY - height/2,
    centerX, centerY - height/2
  );

  ctx.strokeStyle = "#000";
  ctx.lineWidth = circ.lineWidth;
  ctx.stroke();

  if (selected) {
    drawResizer(circ);
  }
}

function drawLine(line, selected) {
  ctx.beginPath();
  ctx.moveTo(line.x, line.y);
  ctx.lineTo(line.x + line.x_diff, line.y + line.y_diff);
  ctx.strokeStyle = selected ? "#f00" : "#000";
  ctx.lineWidth = line.width;
  ctx.stroke();
  
  if (selected) {
    var length = Math.sqrt(line.x_diff*line.x_diff + line.y_diff*line.y_diff);
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x + line.x_diff / length * line.width, line.y + line.y_diff / length * line.width);
    ctx.moveTo(line.x + line.x_diff, line.y + line.y_diff);
    ctx.lineTo(line.x + line.x_diff - line.x_diff / length * line.width, line.y + line.y_diff - line.y_diff / length * line.width);
    ctx.strokeStyle = "#00f";
    ctx.stroke();
  }
}

function handleMouseUp(e) {
  if (line_started) {
    line_started = false;
    objects.push(cur_line);
    object_selected = true;
    selected_object_index = objects.length - 1;
  } else if (circle_started) {
    circle_started = false;
    objects.push(cur_circle);
    object_selected = true;
    selected_object_index = objects.length - 1;
  } else {
    moving_line_endpoint = false;
    resize_pic = false;
    object_dragged = false;
  }
  canvas.removeEventListener("mousemove", handleMouseMove, false);
  canvas.removeEventListener("mouseout", handleMouseOut, false);
  canvas.removeEventListener("mouseup", handleMouseUp, false);
  drawCanvas();
}

function handleMouseOut(e) {
  handleMouseUp(e);
}

function lineObj(x, y, x_diff, y_diff, width) {
  this.type = "line";
  this.x = x;
  this.y = y;
  this.x_diff = x_diff;
  this.y_diff = y_diff;
  this.width = width;
}

function circleObj(x, y, width, height, lineWidth) {
  this.type = "circle";
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.lineWidth = lineWidth;
}

function picObj(obj, x, y, width, height, origWidth, origHeight) {
  this.type = "pic";
  this.img = obj;
  this.x = x;
  this.y = y;
  this.origWidth = origWidth;
  this.origHeight = origHeight;
  this.width = width;
  this.height = height;
}

function hitsEndpoint(point, line) {
  var dist1 = pointDistance(point, {x:line.x, y:line.y});
  var dist2 = pointDistance(point, {x:line.x + line.x_diff, y:line.y + line.y_diff});
  if (dist1 < line.width) {
    return 0;
  } else if (dist2 < line.width) {
    return 1;
  }
  return -1;
}

function handleMouseDown(e) {
  var whereClicked = getCursorPosition(e);
  if (picking_photo) {
    for (var i = 0; i < image_objects.length; i++) {
      if (isInside(whereClicked, image_objects[i])) {
        var cur_obj = objects[selected_object_index];
        objects[selected_object_index] = new picObj(image_objects[i].obj, cur_obj.x, cur_obj.y, 100, 100, 100, 100); 
        picking_photo = false;
        updateLabels();
        drawCanvas();
      }
    }
    if (isInside(whereClicked, noneButton)) {
      picking_photo = false;
      updateLabels();
      drawCanvas();
    } 
    if (isInside(whereClicked, urlButton)) {
      var pic_url = prompt("Enter the URL of a picture file");
      img = new Image();
      img.src = pic_url;
      img.onload = function() {
        var cur_obj = objects[selected_object_index];
        objects[selected_object_index] = new picObj(img, cur_obj.x, cur_obj.y, 100, 100, 100, 100);
        picking_photo = false;
        updateLabels();
        drawCanvas();
      }
      img.onerror = function() {
        picking_photo = false;
        updateLabels();
        drawCanvas();
        ctx.font = "15 px sans-serif";
        ctx.fillStyle = "#000";
        ctx.fillText("Sorry, I couldn't grab a picture from that URL :(", 10, canvas.height - 23);
      }
    }
    return;
  }

  if (line_started) {
    cur_line = new lineObj(whereClicked.x, whereClicked.y, 0, 0, 5);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mouseout", handleMouseOut, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    return;
  }
 
  if (circle_started) {
    cur_circle = new circleObj(whereClicked.x, whereClicked.y, 0, 0, 3);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mouseout", handleMouseOut, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    return;
  }

  for (var i = objects.length-1; i >= 0; i--) {
    if (hitTest(whereClicked, objects[i])) {
      var obj = objects[i];
      object_dragged = true;
      object_selected = true;
      if ((obj.type == "pic" || obj.type == "word" || obj.type == "circle") && isInside(whereClicked, getResizer(obj))) {
        resize_pic = true; 
      }
      if (obj.type == "line") {
        var endpoint_hit = hitsEndpoint(whereClicked, obj);
        if (endpoint_hit != -1) {
          moving_line_endpoint = true;
          endpoint_to_move = endpoint_hit;
          obj.orig_x_diff = obj.x_diff;
          obj.orig_y_diff = obj.y_diff;
        }
      }
      drag_object_index = i;
      selected_object_index = i;
      if (resize_pic) {
        drag_x = whereClicked.x - (obj.x + obj.width);
        drag_y = whereClicked.y - (obj.y + obj.height);
      } else {
        drag_x = whereClicked.x - obj.x;
        drag_y = whereClicked.y - obj.y;
      }
      break;
    }
  }

  if (object_dragged) {
    canvas.addEventListener("mousemove",handleMouseMove,false);
    canvas.addEventListener("mouseup",handleMouseUp,false);
    canvas.addEventListener("mouseout",handleMouseOut,false);
  } 
}

function drawCanvas() {
  var oldStyle = ctx.fillStyle;
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 8;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = oldStyle;
  
  for (var i = 0; i < objects.length; i++) {
    var selected = (object_selected && i == selected_object_index);
    drawObject(objects[i], selected);
  }
  
  ctx.strokeStyle = "#000";
  ctx.strokeRect(0,0,canvas.width,canvas.height);
  updateLabels();
}

function updateLabels() {
  if (object_selected) {
    var obj = objects[selected_object_index];
    var desc = getDesc(obj);
  }

  if (object_selected && obj.type == "word") {
    edit_button.style.visibility = "visible";
    edit_button.innerHTML = "Convert " + desc + " to Image";
  } else {
    edit_button.style.visibility = "hidden";
  }
  
  if (object_selected && (obj.type == "line" || obj.type == "circle")) {
    incr_button.style.visibility = "visible";
    decr_button.style.visibility = "visible";
  } else {
    incr_button.style.visibility = "hidden";
    decr_button.style.visibility = "hidden";
  }

  if (object_selected) {
    copy_button.style.visibility = "visible";
    copy_button.innerHTML = "Copy " + desc;
    del_button.style.visibility = "visible";
    del_button.innerHTML = "Delete " + desc;
    top_button.style.visibility = "visible";
    top_button.innerHTML = "Move " + desc + " to Top";
  } else {
    copy_button.style.visibility = "hidden";
    del_button.style.visibility = "hidden";
    top_button.style.visibility = "hidden";
  }

  if (picking_photo) {
    button_div.style.display = "none";
  } else {
    button_div.style.display = "block";
  }
}

function drawResizer(obj) {
  var oldFillStyle = ctx.fillStyle;
  ctx.fillStyle = "#f00";
  var resizer = getResizer(obj);
  ctx.fillRect(resizer.x, resizer.y, resizer.width, resizer.height);
  ctx.fillStyle = oldFillStyle;
}

function getResizer(obj) {
  var width = obj.width;
  var height = obj.height;
  var corner_x = (width > 0) ? obj.x + width - resizer_size : obj.x + width;
  var corner_y = (height > 0) ? obj.y + height - resizer_size : obj.y + height;
  return {x:corner_x, y:corner_y, width:resizer_size, height:resizer_size};
}

function drawWord(word, selected) {
  ctx.textBaseline = "top";
  ctx.font = word.font;
  ctx.translate(word.x, word.y);
  ctx.scale(word.width / word.origWidth, word.height / word.origHeight);
  ctx.translate(-word.x, -word.y);
  ctx.fillStyle = "#000";
  ctx.fillText(word.text, word.x, word.y);
  ctx.setTransform(1,0,0,1,0,0);
  if (selected) {
    drawResizer(word);
  }
}

function drawPic(pic, selected) {
  ctx.translate(pic.x, pic.y);
  ctx.scale(pic.width / pic.origWidth, pic.height / pic.origHeight);
  ctx.translate(-pic.x, -pic.y);
  ctx.drawImage(pic.img, pic.x, pic.y, pic.origWidth, pic.origHeight);
  ctx.setTransform(1,0,0,1,0,0);
  if (selected) {
    drawResizer(pic);
  }
}

function drawObject(obj, selected) {
  if (obj.type == "word") {
    drawWord(obj, selected); 
  } else if (obj.type == "line") {
    drawLine(obj, selected);
  } else if (obj.type == "pic") {
    drawPic(obj, selected);
  } else if (obj.type == "circle") {
    drawCircle(obj, selected);
  }
}

function startLine() {
  picking_photo = false;
  line_started = true;
  updateLabels();
}

function startCircle() {
  picking_photo = false;
  circle_started = true;
  updateLabels();
}

function addWord() {
  picking_photo = false;
  line_started = false;
  circle_started = false;
  updateLabels();
  var word_text = promptForWord();
  if (word_text) {
    pushWord(word_text, 50, 50, -1, -1, 70);
  }
  preGetPhotoResults(word_text);
}

function pushWord(text, x, y, width, height, size) {
    var new_word = new word(text, x, y, width, height, size);
    objects.push(new_word);
    object_selected = true;
    selected_object_index = objects.length - 1;
    drawCanvas();
}

function promptForWord() {
  var prompt_text = "Enter word";
  return prompt(prompt_text);
}

function word(text, x, y, width, height, fontSize) {
  this.type = "word";
  this.text = text;
  this.x = x;
  this.y = y;
  this.fontSize = fontSize;
  updateWordInfo(this, width, height);
}

function updateWordInfo(word, width, height) {
  word.font = "bold " + word.fontSize + "px sans-serif";
  var measurements = getWidthAndHeight(word.text, word.font, word.fontSize);
  word.origWidth = measurements.width;
  word.origHeight = measurements.height;
  word.width = (width == -1) ? word.origWidth : width;
  word.height = (height == -1) ? word.origHeight : height;
}

function getWidthAndHeight(text, font, fontSize) {
  ctx.font = font;
  var width = ctx.measureText(text).width;
  var height = fontSize * 1.2; //hacky
  return {width:width, height:height};
}

function determineFontHeight(font) {
  var dummyText = document.createTextNode("M");
  dummy.appendChild(dummyText);
  dummy.setAttribute("style", font);
  body.appendChild(dummy);
  var result = dummy.offsetHeight;
  body.removeChild(dummy);
  return result;
}

function handleKeyDown(e) {
    e = e || window.event;
    switch (e.keyCode) {
        case 187:
          increaseSize();
          break;
        case 189:
          decreaseSize();
          break;
    }
}

function topWord() {
  picking_photo = false;
  updateLabels();
  if (object_selected) {
    var top_obj = objects[selected_object_index];
    objects.splice(selected_object_index, 1);
    objects.push(top_obj);
    selected_object_index = objects.length - 1;
    drawCanvas();
  }
}


function deleteWord() {
  picking_photo = false;
  circle_started = false;
  line_started = false;
  updateLabels();
  if(object_selected) {
    objects.splice(selected_object_index, 1);
    if (objects.length > 0) {
      selected_object_index = objects.length - 1; 
    } else {
      object_selected = false;
    }
    drawCanvas();
  }
}

function copyWord() {
 picking_photo = false;
  circle_started = false;
  line_started = false;
  updateLabels();
  if(object_selected) {
    obj = objects[selected_object_index];
    var offset = 5;
    if (obj.type == "word") {
      word_to_copy = objects[selected_object_index];
      pushWord(word_to_copy.text, word_to_copy.x + offset, word_to_copy.y + offset, word_to_copy.width, word_to_copy.height, word_to_copy.fontSize);
    } else if (obj.type == "line") {
      objects.push(new lineObj(obj.x + offset, obj.y + offset, obj.x_diff, obj.y_diff, obj.width));
    } else if (obj.type == "pic") {
      objects.push(new picObj(obj.img, obj.x + offset, obj.y + offset, obj.width, obj.height, obj.origWidth, obj.origHeight));
    } else if (obj.type == "circle") {
      objects.push(new circleObj(obj.x + offset, obj.y + offset, obj.width, obj.height, obj.lineWidth));
    }
    object_selected = true;
    selected_object_index = objects.length - 1;
    drawCanvas();
  }
}

function getSavedImageFilename(obj, num) {
  var xmlhttp = new XMLHttpRequest();
  var url = "imagesave.php?url=" + obj.img.src + "&filenum=" + num + "&unid=" + unique_id;
  xmlhttp.open("GET", url, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}

function editWord() {
  picking_photo = false;
  circle_started = false;
  line_started = false;
  if(object_selected && objects[selected_object_index].type == "word") {
    picking_photo = true; 
    updateLabels();
    prompted_for_image = false;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 8;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeRect(0,0,canvas.width,canvas.height);
    var word = objects[selected_object_index].text;
    word.replace(' ','%20');
    var idx = -1;
    for (var i = 0; i < photoResults.length; i++) {
      if (photoResults[i].word == word) {
        idx = i;
        break;
      }
    }

    if (idx != -1) {
      prompted_for_image = true;
      promptForImage(photoResults[idx].results, word); 
    } else {
      ctx.fillStyle = "#000";
      ctx.font = "20 px sans-serif";
      ctx.fillText("Hang tight for a sec (or two...)", 100, 100);
    }
  }
}

function gotImageResults() {
  if (object_selected) {
    var word = objects[selected_object_index].text;
    word.replace(' ','%20');
  }
  var readyToPrompt = false;
  var idx = -1;
  for (var i = 0; i < imageRequests.length; i++) {
    if (imageRequests[i].request.readyState == 4) {
      photoResults.push({word:imageRequests[i].word, results:imageRequests[i].request.responseText});
      if (object_selected && imageRequests[i].word == word) {
        idx = photoResults.length - 1;
        readyToPrompt = true;
      }
    }
  }    

  if(picking_photo && !prompted_for_image && readyToPrompt) {
    promptForImage(photoResults[idx].results, word);
  }
}

function preGetPhotoResults(word) {
  ready_counter = 0;
  xmlhttp = new XMLHttpRequest();
  word.replace(' ','%20');
  var url="imagesearch.php?word=" + word + "&numresults=8";
  imageRequests.push({word:word, request:xmlhttp});
  xmlhttp.onreadystatechange = gotImageResults;
  xmlhttp.open("GET",url,true);
  xmlhttp.send();
}

function promptForImage(json_data, word) {
  var results = eval("(" + json_data + ")");

  var oldFillStyle = ctx.fillStyle;
  var oldStrokeStyle = ctx.strokeStyle;
 
  var border_width = 5;
  ctx.lineWidth = border_width;
  ctx.strokeStyle = "#aaa";
  ctx.fillStyle = "#fff";
  var vert_margin = 20;
  var horiz_margin = 30;
  var rect_width = canvas.width - 2*horiz_margin;
  var rect_height = canvas.height - 2*vert_margin;
  ctx.fillRect(horiz_margin, vert_margin, rect_width, rect_height);
  ctx.strokeRect(horiz_margin, vert_margin, rect_width, rect_height);
 
  ctx.fillStyle = "#000";
  ctx.font = "20 px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Choose an image for " + word, horiz_margin + border_width, vert_margin + border_width);

  var num_rows = 2;
  var num_cols = 4;
  var img_border_width = 5;
  var cell_width = (rect_width - 2*border_width) / num_cols;
  var cell_height = (rect_height - 40 - 2*border_width) / num_rows;
  var img_width = cell_width - 2*img_border_width;
  var img_height = cell_height - 2*img_border_width;
  num_images_loaded = 0;
  image_objects = new Array();
  for (var i = 0; i < results.length; i++) {
    var row = Math.floor(i / num_cols);
    var col = Math.floor(i % num_cols);
    var x = col*cell_width + img_border_width + horiz_margin + border_width;
    var y = row*cell_height + img_border_width + vert_margin + 20 + border_width;
    var img = new Image();
    var url = results[i]['url'];
    img.src = url.replace('%25', '%');
    image_objects.push({obj:img, x:x, y:y, width:img_width, height:img_height});
    var idx = image_objects.length - 1;
    img.onload = function(e) {
      num_images_loaded++;
      this.success = true;
      if(num_images_loaded == results.length) {
        drawImages(image_objects);
      }
    }.bind(image_objects[idx]);
    img.onerror = function(e) {
      num_images_loaded++;
      this.success = false;
      if(num_images_loaded == results.length) {
        drawImages(image_objects);
      }
    }.bind(image_objects[idx]);
  }

  var bottomCornerX = canvas.width - horiz_margin - border_width;
  var bottomCornerY = canvas.height - vert_margin - border_width;
  var noneX = bottomCornerX - 45;
  var noneY = bottomCornerY - 18;
  noneButton = {x:noneX, y:noneY, width:40, height:16};

  var urlX = bottomCornerX - 130;
  var urlY = bottomCornerY - 18;
  urlButton = {x:urlX, y:urlY, width:80, height:16};

  ctx.strokeStyle = oldStrokeStyle;
  ctx.fillStyle = oldFillStyle;
}

function drawImages(image_objects) {
  for (var i = 0; i < image_objects.length; i++) {
    img = image_objects[i];
    if (img.success) {
      ctx.drawImage(img.obj, img.x, img.y, img.width, img.height);
    }
  }
  ctx.fillStyle = "#444";
  ctx.fillRect(noneButton.x, noneButton.y, noneButton.width, noneButton.height);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("None", noneButton.x + 1, noneButton.y);
  ctx.fillStyle = "#444";
  ctx.fillRect(urlButton.x, urlButton.y, urlButton.width, urlButton.height);
  ctx.fillStyle = "#fff";
  ctx.fillText("Other URL", urlButton.x + 2, urlButton.y);
}

function adjustWordSize(amnt) {
  if(object_selected) {
    objects[selected_object_index].fontSize = objects[selected_object_index].fontSize + amnt;
    updateWordInfo(objects[selected_object_index]);
  }
  drawCanvas();
}

function adjustPicSize(amnt) {
  if(object_selected) {
    objects[selected_object_index].width *= amnt;
    objects[selected_object_index].height *= amnt;
  }
  drawCanvas();
}

function adjustLineWidth(amnt) {
  if(object_selected) {
    if (objects[selected_object_index].width == 1 && amnt < 0) {
      return;
    }
    objects[selected_object_index].width = objects[selected_object_index].width + amnt;
  }
}

function adjustCircleWidth(amnt) {
  if(object_selected) {
    if (objects[selected_object_index].lineWidth == 1 && amnt < 0) {
      return;
    }
    objects[selected_object_index].lineWidth = objects[selected_object_index].lineWidth + amnt;
  }
}

function increaseSize() {
  circle_started = false;
  line_started = false;
  adjustSize(1);
}

function decreaseSize() {
  circle_started = false;
  line_started = false;
  adjustSize(-1);
}

function adjustSize(sign) {
  if(object_selected) {
    sel = objects[selected_object_index];
    if (sel.type == "word") {
      adjustWordSize(4 * sign);
    } else if (sel.type == "line") {
      adjustLineWidth(1 * sign);
    } else if (sel.type == "circle") {
      adjustCircleWidth(1 * sign);
    } else if (sel.type == "pic") {
      var amnt = (sign < 0) ? 0.9 : 1.1;
      adjustPicSize(amnt);
    }
  }
  drawCanvas();
}

function clearImage() {
  object_selected = false;
  object_dragged = false;
  resize_pic = false;
  moving_line_endpoint = false;
  circle_started = false;
  line_started = false;
  picking_photo = false;
  updateLabels();
  objects = new Array();
  drawCanvas();
}

function getDesc(obj) {
  if (obj.type == "line") {
    return "Selected Line";
  } else if (obj.type == "word") {
    return "Word '" + obj.text + "'";
  } else if (obj.type == "pic") {
    return "Selected Picture";
  } else if (obj.type == "circle") {
    return "Selected Oval";
  }
}

function pngImage() {
  picking_photo = false;
  updateLabels();
  imgDiv.innerHTML = "<p>Be patient! :)</p>"; 
  object_selected = false;
  num_images_to_load = 0;
  for (var i = 0; i < objects.length; i++) {
    var obj = objects[i];
    if (obj.type == "pic") {
      num_images_to_load++;
    }
  }
  if (num_images_to_load == 0) {
    completePngImage();
  } else {
    num_images_loaded = 0;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.type == "pic") {
        obj.img.src = getSavedImageFilename(obj, i);
        obj.img.onload = function() {
          num_images_loaded++;
          if (num_images_loaded == num_images_to_load) {
            completePngImage();
          }
        };
      }
    }
  }
}

function completePngImage() {
  dummy_canvas.width = canvas.width;
  dummy_canvas.height = canvas.height;
  ctx = dummy_canvas.getContext("2d");
  drawCanvas();
  convertToGrayscale(0, 0, canvas.width, canvas.height, dummy_canvas);
  var img = dummy_canvas.toDataURL("image/png");
  imgDiv.innerHTML = '<p></p><p></p>PNG that you can save to your computer:<div><img src="'+img+'"/></div>';
  object_selected = true;
  ctx = canvas.getContext("2d");
  drawCanvas();
  //DELETE FILES?!
}

function convertToGrayscale(low_x, low_y, high_x, high_y) {
  pixels = ctx.getImageData(low_x, low_y, high_x, high_y);
  for (var i = 0; i < pixels.data.length / 4; i++) {
    var r = pixels.data[4*i];
    var g = pixels.data[4*i+1];
    var b = pixels.data[4*i+2];
    var avg = Math.round((r + g + b) / 3.0);
    pixels.data[4*i] = avg;
    pixels.data[4*i+1] = avg;
    pixels.data[4*i+2] = avg;
  }
  ctx.putImageData(pixels, low_x, low_y);
}

function getCursorPosition(e) {
   	var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
		x = e.pageX;
		y = e.pageY;
    } else {
		x = e.clientX + document.body.scrollLeft +
				document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
				document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    return {x:x,y:y};
}
