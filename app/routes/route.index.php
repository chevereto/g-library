<?php
$route = function($handler) {
	$handler::$vars['doctitle'] = 'Welcome to G\\';
	
	// We will stock a few system values and bind them to get_system_values();
	$system_values = [
		'g_version' => [
			'label' => 'G\\ version',
			'content' => G\get_version()
		],
		'php_version' => [
			'label' => 'PHP version',
			'content' => PHP_VERSION
		],
		'server' => [
			'label' => 'Server',
			'content' => gethostname() . ' ' . PHP_OS . '/' . PHP_SAPI 
		],
		'pdo' => [
			'label' => 'PDO',
			'content' => !extension_loaded ('PDO') ? 'Disabled' : 'Enabled'
		],
		'pdo_mysql' => [
			'label' => 'PDO MySQL',
			'content' => !extension_loaded ('pdo_mysql') ? 'Disabled' : 'Enabled'
		]
	];
	$handler::$vars['system_values'] = $system_values;
}
?>