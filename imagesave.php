<?php
  
  $url = $_GET['url'];
  $filenum = $_GET['filenum'];
  $unique_id = $_GET['unid'];
  $filename = 'rebusimages/'.$filenum.$unique_id.'.jpg';
  file_put_contents($filename, file_get_contents($url));

  echo $filename;
?>

