<?php

/* --------------------------------------------------------------------

  G\ library
  http://gbackslash.com

  @author	Rodolfo Berrios A. <http://rodolfoberrios.com/>

  Copyright (c) Rodolfo Berrios <inbox@rodolfoberrios.com> All rights reserved.
  
  Licensed under the MIT license
  http://opensource.org/licenses/MIT
  
  --------------------------------------------------------------------- */
  
  # This file is used to set static settings

$settings = [
	'theme'		=> 'default',
	'db_driver' => 'mysql',
	'db_host'	=> 'localhost', // localhost is mostly default on all servers. Try to use an IP instead of a hostname (fastest)
	'db_port'	=> '', // Some servers needs to indicate the port of the database hostname - default: don't set it
	'db_name'	=> 'database', // Database name
	'db_user'	=> 'root', // Database user with access to the above database name
	'db_pass'	=> '', // Database user password
	'db_table_prefix'	=> '' // Table prefix (default chv)
];