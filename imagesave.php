<?php
 
  $url = $_GET['url'];
  $ext = substr($url, -3);
  switch ($ext) {
    case 'jpg':
      $mime = 'image/jpeg';
      break;
    case 'gif':
      $mime = 'image/gif';
      break;
    case 'png':
      $mime = 'image/png';
      break;
    default:
      $mime = false;
  }
  $contents = file_get_contents($url);
  if ($mime) {
    header('Content-type: '.$mime);
  }
  echo $contents;
?>

