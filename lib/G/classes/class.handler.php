<?php

/* --------------------------------------------------------------------

  G\ library
  http://gbackslash.com

  @author	Rodolfo Berrios A. <http://rodolfoberrios.com/>

  Copyright (c) Rodolfo Berrios <inbox@rodolfoberrios.com> All rights reserved.
  
  Licensed under the MIT license
  http://opensource.org/licenses/MIT
  
  --------------------------------------------------------------------- */

namespace G;
use Exception;
 
class Handler {

	public static $route, $route_request, $doctitle, $vars, $cond, $routes;
	
	/**
	 * Build a valid request
	 */
	function __construct($hook=[]) {
		
		if(!defined('G_APP_PATH_THEME')) {
			throw new HandlerException('G_APP_PATH_THEME is not defined', 100);
		}
		
		// Parse the definitions to this object.. This is not necessary but in case of changes...
		$this->relative_root = G_ROOT_PATH_RELATIVE; // nota: realmente necesitamos estos this?
		$this->base_url = G_ROOT_URL;
		$this->path_theme = G_APP_PATH_THEME;

		// Parse the request
		$this->request_uri = $_SERVER['REQUEST_URI'];
		$this->script_name = $_SERVER['SCRIPT_NAME'];
		
		$query_string = '?' . $_SERVER['QUERY_STRING'];
		
		if(!empty($_SERVER['QUERY_STRING'])) {
			$this->request_uri = str_replace($query_string, '/', $this->request_uri);
		}
		
		$this->valid_request = '/' . ltrim(rtrim(sanitize_path_slashes($this->request_uri), '/'), '/');
		
		if(!empty($_SERVER['QUERY_STRING'])) {
			$this->request_uri = $_SERVER['REQUEST_URI'];
			$this->valid_request .= '/' . $query_string;
		}
		
		// Store the canonical request, useful for redirect to a valid request
		$this->canonical_request = $this->valid_request;
		
		if(is_dir(G_ROOT_PATH . $this->valid_request)) {
			$this->canonical_request .= '/';
		}
		
		$this->handled_request = $this->relative_root == '/' ? $this->valid_request : preg_replace('#' . $this->relative_root . '#', '/', $this->request_uri, 1);		
		$this->request_array = explode('/', rtrim(str_replace('//', '/', str_replace('?', '/', ltrim($this->handled_request, '/'))), '/'));
			
		// Index request
		if($this->request_array[0] == '') {
			$this->request_array[0] = '/';
		}
		
		$this->request_array = array_values(array_filter($this->request_array, 'strlen'));	
		$this->base_request = $this->request_array[0];
		
		// Fix the canonical request /something?q= to /something/?q=
		if($this->base_request !== '' && !empty($_SERVER['QUERY_STRING'])) {
			$path_request = add_trailing_slashes(rtrim(str_replace($_SERVER['QUERY_STRING'], '', $this->canonical_request), '?'));
			$fixed_qs_request = $path_request.'?'.$_SERVER['QUERY_STRING'];
			$this->canonical_request = $fixed_qs_request;
		}
		
		// No /index.php request
		if($this->base_request == 'index.php') {
			$this->canonical_request = rtrim($this->canonical_request, '/');
			redirect((sanitize_path_slashes(str_replace('index.php', '', $this->canonical_request))), 301);
		}

		// If the request is invalid we make a 301 redirection to the canonical url.
		if($this->relative_root !== $this->request_uri and $this->canonical_request !== $this->request_uri) {
			$this->baseRedirection($this->canonical_request);
		}
		
		self::$route = $this->template !== 404 ? $this->request_array[0] == '' ? 'index' : $this->request_array : 404;
		self::$route_request = $this->request_array;
		
		// Hook a fn BEFORE the process
		if(is_array($hook) and is_callable($hook['before'])) {
			$hook['before']($this);
		}
		
		// It is a valid request on index.php?
		if($this->isIndex()) $this->processRequest();
		
		// Hook a fn AFTER the process
		if(is_array($hook) and is_callable($hook['after'])) {
			$hook['after']($this);
		}
		
		// Auto-bind the route vars
		if(is_array(self::$vars)) {
			foreach(self::$vars as $k => $v) {
				$this->bindGetFn($k, $v);
			}
		}
		// Auto-bind the route conditionals
		if(is_array(self::$cond)) {
			foreach(self::$cond as $k => $v) {
				$this->bindIsFn($k, $v);
			}
		}
		
		$this->loadTemplate();
		
	}
	
	/**
	 * Iterate over the route app folder
	 * This populates Handler::$routes with all the valid routes
	 */
	private static function routeIterator($path) {
		
		if(!file_exists($path)) return;
		
		foreach(new \DirectoryIterator($path) as $fileInfo) {
			
			if($fileInfo->isDot() or $fileInfo->isDir()) continue;
			
			$route_file = $path . $fileInfo->getFilename();
			$route_override = $path . 'overrides/' . $fileInfo->getFilename();
			
			if(file_exists($route_override)) {
				$route_file = $route_override;
			}
			
			if(file_exists($route_file)) {
				require_once($route_file);
				$route = array(substr(substr($fileInfo->getFilename(), 0, -4), 6) => $route);
				self::$routes += $route;
			}
		}
	}
	
	/**
	 * Stock (save) the valid routes of the G\ app
	 * This method is optional because the routeIterator takes some memory
	 */
	public static function stockRoutes() {
		self::$routes = [];
		self::routeIterator(G_APP_PATH_ROUTES);
		self::routeIterator(G_APP_PATH_ROUTES_OVERRIDES);
	}
		
	/**
	 * Process the dynamic request
	 */
	private function processRequest() {
		
		if(in_array($this->base_request, ['', 'index.php', '/'])) {
			$this->base_request = 'index';
		}
		
		if(is_null(self::$routes)) { // Route array is not set
			$route = $this->getRouteFn($this->base_request);
			if(is_callable($route)) {
				$routes[$this->base_request] = $route; // Build a single $routes array
			}
		} else {
			$routes = self::$routes;
		}
		
		$this->template = $this->base_request;
		$this->request = $this->request_array;
		unset($this->request[0]);
		$this->request = array_values($this->request);
		
		if(is_array($routes) and array_key_exists($this->base_request, $routes)) {
			
			// Autoset some magic
			$magic = array(
				'post'			=> $_POST ? $_POST : NULL,
				'get'			=> $_GET ? $_GET : NULL,
				'request'		=> $_REQUEST ? $_REQUEST : NULL,
				'safe_post'		=> $_POST ? safe_html($_POST) : NULL,
				'safe_get'		=> $_GET ? safe_html($_GET) : NULL,
				'safe_request'	=> $_REQUEST ? safe_html($_REQUEST) : NULL,
			);
			
			if(count(self::$vars) > 0) {
				self::$vars = array_merge(self::$vars, $magic);
			} else {
				self::$vars = $magic;
			}
			
			// Only call a valid route fn
			if(is_callable($routes[$this->base_request])) {	
				$routes[$this->base_request]($this);
			}
			
		} else {
		
			$this->template = 404;
			$this->request = $this->request_array;
		}
		
		self::$cond['404'] = false;
		if($this->template == 404) {
			self::$cond['404'] = true;
			self::$route = 404;
		}
		
		if(self::$vars['pre_doctitle']) {
			$stock_doctitle = self::$vars['doctitle'];
			self::$vars['doctitle'] = self::$vars['pre_doctitle'];
			if($stock_doctitle) {
				 self::$vars['doctitle'] .= ' - ' . $stock_doctitle;
			}
		}
		
	}
	
	/**
	 * Bind route var to global functions
	 */
	public function bindGetFn($var, $value) {
		$fn_name = strtolower(str_replace('-', '_', $var));
		if(!function_exists('get_' . $fn_name)) {
			eval('function get_' . $fn_name . '(){ return G\Handler::$vars["' . $var . '"]; }');
		}
	}
	
	/**
	 * Bind route conditional to global functions
	 */
	public function bindIsFn($var, $value) {
		$fn_name = strtolower(str_replace('-', '_', $var));
		if(!function_exists('is_' . $fn_name)) {
			eval('function is_' . $fn_name . '(){ return G\Handler::$cond["' . $var . '"]; }');
		}
	}
	
	/**
	 * Inject the 404 page
	 */
	public function issue404() {
		$this->template = 404;
	}
	
	/**
	 * Get the route fn for a given route
	 * If the route doesn't exists it will add it to the routes stack
	 */
	public function getRouteFn($route_name) {
		// Route is already in the stack
		if(is_array(self::$routes) and array_key_exists($route_name, Handler::$routes)) {
			return self::$routes[$route_name];
		}
		// Route doesn't exists in the stack
		$route_file = G_APP_PATH_ROUTES . 'route.'.$route_name.'.php';
		if(file_exists($route_file)) {
			require($route_file);
			// Append this new route fn to the Handler::$routes stack
			self::$routes[$route_name] = $route; 
			return $route;
		} else {
			return false;
		}
	}
	
	/**
	 * Return (bool) the request level of the current request
	 */
	public function isRequestLevel($level) {
		return isset($this->request_array[$level - 1]);
	}
	
	/**
	 * Redirect to the base url/request
	 */
	public function baseRedirection($request) {
		$request = trim(sanitize_path_slashes($request), '/');
		$url = preg_replace('{'.$this->relative_root.'}', '/', $this->base_url, 1) . $request;
		redirect($url, 301);
	}
	
	/**
	 * Return (bool) if the request is handled by index.php
	 */
	private function isIndex() {
		return preg_match('{/index.php$}', $this->script_name);
	}
	
	
	/**
	 * load the setted (or argumented) template
	 */
	private function loadTemplate($template=NULL) {
		if(!is_null($template)) {
			$this->template = $template;
		}
		if(file_exists($this->path_theme.'functions.php')) require_once($this->path_theme.'functions.php');
		$template_file = $this->path_theme.$this->template.'.php';
		if(file_exists($template_file)) {
			require_once($template_file);
		} else {
			throw new HandlerException('Missing ' . absolute_to_relative($template_file) . ' template file', 400);
		}
	}

}

class HandlerException extends Exception {}

?>