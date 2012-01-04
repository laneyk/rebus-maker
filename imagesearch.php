<?php
  
  $query = $_GET['word'];
  $num_results = intval($_GET['numresults']); 

	$url = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q='.$query.'&key=ABQIAAAAnQlJeVUV0i_dm2O2z4-94hSmzGmRmg6UEst9m5TdGw5OShYQdhQu3Dl1RlDo_Li7WbakICcuJtbsAQ&imgtype=clipart&rsz=8';
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$body = curl_exec($ch);
	curl_close($ch);
	$json = json_decode($body, true);
  $results = $json['responseData']['results'];
  $images = array();
  for ($i = 0; $i < min(count($results), $num_results); $i++) {
    $img = array();
    
    $img['url'] = $results[$i]['url'];
    $img['width'] = $results[$i]['width'];
    $img['height'] = $results[$i]['height'];
   
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $img['url']);
    curl_setopt($ch, CURLOPT_FILETIME, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_REFERER, 'http://laneyk.org');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    $header = curl_exec($ch);
    $info = curl_getinfo($ch);

    if ($info['http_code'] < 400) {
      array_push($images, $img);
    }
  }

  echo json_encode($images);
?>
