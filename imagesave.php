<?php
  
  $url = $_GET['url'];
  $contents = file_get_contents($url);
  header('Content-type: image/jpeg');
  echo $contents;
?>

