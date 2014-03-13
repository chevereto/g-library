<?php

/* --------------------------------------------------------------------

  G\ library
  http://gbackslash.com

  @version	1.0.0
  @author	Rodolfo Berrios A. <http://rodolfoberrios.com/>

  Copyright (c) Rodolfo Berrios <inbox@rodolfoberrios.com> All rights reserved.
  
  Licensed under the MIT license
  http://opensource.org/licenses/MIT
  
  --------------------------------------------------------------------- */

namespace G\Render;
use G;

/**
 * INCLUDE TAGS
 * ---------------------------------------------------------------------
 */

function include_theme_file($filename) {
	$file = G_APP_PATH_THEME . $filename;
	if(!file_exists($file)) {
		$file = G_APP_PATH_THEME . $filename . '.php';
	}
	if(file_exists($file)) include($file);
}

function include_theme_header() {
	include_theme_file('header');
}

function include_theme_footer() {
	include_theme_file('footer');
}

function get_theme_file_contents($filename) {
	$file = G_APP_PATH_THEME . $filename;
	return file_exists($file) ? file_get_contents($file) : null;
}

/**
 * THEME DATA FUNCTIONS
 * ---------------------------------------------------------------------
 */

function get_theme_file_url($string) {
	return BASE_URL_THEME . $string;
}

/**
 * ASSETS
 * ---------------------------------------------------------------------
 */

// Return app lib file url
function get_app_lib_file_url($string){
	return G_APP_LIB_URL . $string;
}


/**
 * NON HTML OUTPUT
 * ---------------------------------------------------------------------
 */

// Outputs the REST_API array to xml
function xml_output($array=array()) {
	error_reporting(0);
	header("Last-Modified: ".gmdate("D, d M Y H:i:s")."GMT");
	header("Cache-Control: no-cache, must-revalidate");
	header("Pragma: no-cache");
	header("Content-Type:text/xml; charset=UTF-8");
	$out = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
	$out .= "<response>\n";
	$out .= "	<status_code>$array[status_code]</status_code>\n";
	$out .= "	<status_txt>$array[status_txt]</status_txt>\n";
	if(count($array["data"])>0) {
		$out .= "	<data>\n";
		foreach($array["data"] as $key => $value) {
			$out .= "		<$key>$value</$key>\n";
		}
		$out .= "	</data>\n";
	}
	$out .= "</response>";
	echo $out;
}

// Procedural function to output an array to json
function json_output($data=array(), $callback="") {
	//error_reporting(0);
	//@ini_set('display_errors', false);
	
	header('Last-Modified: '.gmdate('D, d M Y H:i:s').'GMT');
	header('Cache-Control: no-cache, must-revalidate');
	header('Pragma: no-cache');
	header('Content-type: application/json; charset=UTF-8');
	
	// Invalid json request
	if(!G\check_value($data) || (G\check_value($callback) and preg_match('/\W/', $callback))) { // note: revisar los codigos
		G\set_status_header(400);
		$json_fail = array(
			'status_code' => 400,
			'status_txt' => G\get_set_status_header_desc(400),
			'error' => array(
				'message' => 'no request data present',
				'code' => null
			)
		);
		die(json_encode($json_fail));
	}
	
	// Populate missing values
	if($data['status_code'] && !$data['status_txt']){
		$data['status_txt'] = G\get_set_status_header_desc($data['status_code']);
	}
	
	G\set_status_header($data['status_code']);
	
	if(G\check_value($callback)) {
		print sprintf('%s(%s);', $callback, json_encode($data));
	} else {
		print json_encode($data);
	}
	die();
}

?>