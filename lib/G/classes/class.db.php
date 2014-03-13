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

namespace G;
use PDO, PDOException, Exception;

class DB {
	
	private $host = G_APP_DB_HOST;
	private $user = G_APP_DB_USER;
	private $pass = G_APP_DB_PASS;
	private $port = G_APP_DB_PORT;
	private $dbname = G_APP_DB_NAME;
	private $driver = G_APP_DB_DRIVER;
	
	private $dbh;
	private $pdo_attrs;
	private $query;
	
	/**
	 * Connect to the DB server
	 * Throws an Exception on error
	 */
	public function __construct() {
		
		try {
			
			// SQL connection is slow if you use a hostname instead of an IP
			// That's why this uses 127.0.0.1 if the host is localhost
			$pdo_connect = $this->driver . ':host='. ($this->host == 'localhost' ? '127.0.0.1' : $this->host) .';dbname=' . $this->dbname;
			if($this->port) {
				$pdo_connect .= ';port=' . $this->port;
			}
			
			// PDO defaults
			$this->pdo_default_attrs = array(
				PDO::ATTR_TIMEOUT	=> 30,
				PDO::ATTR_PERSISTENT	=> true
			);
			
			// Override the PDO defaults ?
			if($this->pdo_attrs) {
				foreach($this->pdo_default_attrs as $key => $value) {
					if($this->pdo_attrs[$key]) {
						$this->pdo_default_attrs[$key] = $this->pdo_attrs[$key];
						unset($this->pdo_attrs[$key]);
					}
				}
				$this->pdo_attrs = $this->pdo_default_attrs + $this->pdo_attrs;
			} else {
				$this->pdo_attrs = $this->pdo_default_attrs;
			}
			
			// PDO overrides
			$this->pdo_attrs[PDO::ATTR_ERRMODE] = PDO::ERRMODE_EXCEPTION;
			$this->pdo_attrs[PDO::ATTR_EMULATE_PREPARES] = true; // Depends on the driver
			
			//if(version_compare(PHP_VERSION, "5.3.6", "<")) {
				$this->pdo_attrs[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES 'UTF8'";
			//}
			
			// Note that PDO::ERRMODE_SILENT has no effect on connection. Connections always throw an exception if it fails
			$this->dbh = new PDO($pdo_connect, $this->user, $this->pass, $this->pdo_attrs);

		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
		
	}
	
	/**
	 * Populates the class dB own PDO attributes array with an entire array
	 * Attribute list here: http://php.net/manual/en/pdo.setattribute.php
	 */
	public function setPDOAttrs($attributes) {
		$this->pdo_attrs = $attributes;
	}
	
	/**
	 * Populates the class dB own PDO attributes array with a single key
	 * Attributes list here: http://php.net/manual/en/pdo.setattribute.php
	 */
	public function setPDOAttr($key, $value) {
		$this->pdo_attrs[$key] = $value;
	}
	
	public function getAttr($attr) {
		return $this->dbh->getAttribute($attr);
	}
	
	/**
	 * Prepares an SQL statement to be executed by the PDOStatement::execute() method
	 * http://php.net/manual/en/pdo.prepare.php
	 */
	public function query($query) {
		$this->query = $this->dbh->prepare($query);
	}
	
	/**
	 * Binds a value to a corresponding named or question mark placeholder in the SQL statement that was used to prepare the statement
	 * http://php.net/manual/en/pdostatement.bindvalue.php
	 */
	public function bind($param, $value, $type = null) {
		if(is_null($type)) {
			switch(true) {
				case is_int($value):
					$type = PDO::PARAM_INT;
				break;
				case is_bool($value):
					$type = PDO::PARAM_BOOL;
				break;
				case is_null($value):
					$type = PDO::PARAM_NULL;
				break;
				default:
					$type = PDO::PARAM_STR;
				break;
			}
		}
		$this->query->bindValue($param, $value, $type);
	}
	
	public function exec(){
		return $this->query->execute();
	}

	public function fetchAll($mode=PDO::FETCH_ASSOC){
		$this->exec();
		return $this->query->fetchAll(is_int($mode) ? $mode : PDO::FETCH_ASSOC);
	}
	
	/**
	 * Execute and returns the single result from the prepared statement
	 * http://php.net/manual/en/pdostatement.fetch.php
	 */
	public function fetchSingle($mode=PDO::FETCH_ASSOC){
		$this->exec();
		return $this->query->fetch(is_int($mode) ? $mode : PDO::FETCH_ASSOC);
	}
	
	/**
	 * Returns the number of rows affected by the last DELETE, INSERT, or UPDATE statement executed
	 * http://php.net/manual/en/pdostatement.rowcount.php
	 */
	public function rowCount(){
		return $this->query->rowCount();
	}
	
	/**
	 * Returns the ID of the last inserted row, or the last value from a sequence object, depending on the underlying driver
	 * http://php.net/manual/en/pdo.lastinsertid.php
	 */
	public function lastInsertId() {
		return $this->dbh->lastInsertId();
	}
	
	/**
	 * Turns off autocommit mode
	 * http://php.net/manual/en/pdo.begintransaction.php
	 */
	public function beginTransaction(){
		return $this->dbh->beginTransaction();
	}
	
	/** 
	 * Commits a transaction, returning the database connection to autocommit mode until the next call to PDO::beginTransaction() starts a new transaction
	 * http://php.net/manual/en/pdo.commit.php
	 */
	public function endTransaction(){
		return $this->dbh->commit();
	}
	
	/**
	 * Rolls back the current transaction, as initiated by PDO::beginTransaction()
	 * http://php.net/manual/en/pdo.rollback.php
	 */
	public function cancelTransaction(){
		return $this->dbh->rollBack();
	}
	
	/**
	 * Dumps the informations contained by a prepared statement directly on the output
	 * http://php.net/manual/en/pdostatement.debugdumpparams.php
	 */
	public function debugDumpParams(){
		return $this->query->debugDumpParams();
	}
	
	/* Now the G\ fast DB methods, presented by Chevereto */
	
	/**
	 * Get the table with its prefix 
	 */
	public static function getTable($table) {
		return get_app_setting('db_table_prefix') . $table;
	}
	
	/**
	 * Get values from DB
	 */
	public static function get($table, $values, $clause='AND', $sort=[], $limit=NULL, $fetch_style=NULL) {
		
		if(!is_array($values) and $values !== 'all') {
			throw new DBException('Expecting array values, '.gettype($values).' given in ' . __METHOD__, 100);
		}
		
		if(!is_null($clause)) {
			$clause = strtoupper($clause);
		}
		
		if(is_array($values)  and !empty($values) and !is_null($clause) and !in_array($clause, array('AND', 'OR'))) {
			throw new DBException('Wrong clause in ' . __METHOD__, 101);
		}
		
		$preffix = rtrim($table, 's');
		$table = DB::getTable($table);
		
		$query = 'SELECT * FROM '.$table;
		
		if(is_array($values) and !empty($values)) {
			$query .= ' WHERE ';
			foreach($values as $k => $v) {
				$query .= $preffix.'_'.$k.'=:'.$preffix.'_'.$k.' '.$clause.' ';
			}
		}
		
		$query = rtrim($query, $clause . ' ');
		
		if(is_array($sort) and !empty($sort)) {
			if(!$sort['field']) {
				$sort['field'] = 'date';
			}
			if(!$sort['order']) {
				$sort['order'] = 'desc';
			}
			$query .= ' ORDER BY '.$preffix.'_'.$sort['field'].' '.strtoupper($sort['order']).' ';
		}

		if($limit and is_int($limit)) {
			$query .= " LIMIT $limit";
		}
				
		try {
			$db = new DB;
			$db->query($query);
			if(is_array($values)) {
				foreach($values as $k => $v) {
					$db->bind(':'.$preffix.'_'.$k, $v);
				}
			}
			$db->exec();
			$user_db = $limit == 1 ? $db->fetchSingle($fetch_style) : $db->fetchAll($fetch_style);
			return $user_db;
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
	}
	
	/**
	 * Query and fetch single record
	 */
	public static function queryFetchSingle($query, $fetch_style=NULL) {
		try {
			return self::queryFetch($query, 1, $fetch_style);
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
	}
	
	/**
	 * Query and fetch all records
	 */
	public static function queryFetchAll($query, $fetch_style=NULL) {
		try {
			return self::queryFetch($query, NULL, $fetch_style);
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
	}
	
	/**
	 * Query fetch (core version)
	 */
	public static function queryFetch($query, $limit=1, $fetch_style=NULL) {
		try {
			$db = new DB;
			$db->query($query);
			return $limit == 1 ? $db->fetchSingle($fetch_style) : $db->fetchAll($fetch_style);
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
	}
	
	/**
	 * Update the target table row(s)
	 */
	public static function update($table, $values, $wheres, $clause='AND') {
		
		if(!is_array($values)) {
			throw new DBException('Expecting array values, '.gettype($values).' given in '. __METHOD__, 100);
		}
		if(!is_array($wheres)) {
			throw new DBException('Expecting array values, '.gettype($wheres).' given in '. __METHOD__, 100);
		}
		
		$clause = strtoupper($clause);
		if(!in_array($clause, array('AND', 'OR'))) {
			throw new DBException('Wrong clause in ' . __METHOD__, 101);
		}
		
		$preffix = rtrim($table, 's');
		$table = DB::getTable($table);
		
		$db = new DB;
		$query = 'UPDATE '.$table.' SET ';
		
		// Set the value pairs
		foreach($values as $k => $v) {
			$query .= $preffix.'_'.$k.'=:'.$preffix.'_'.$k.','; 
		}
		$query = rtrim($query, ',') . ' WHERE ';
		
		// Set the where pairs
		foreach($wheres as $k => $v) {
			$query .= $preffix.'_'.$k.'=:'.$preffix.'_'.$k.' '.$clause.' '; 
		}			
		$query = rtrim($query, $clause.' ');
		
		try {
			$db->query($query);
			// Bind the values
			foreach($values as $k => $v) {
				$db->bind(':'.$preffix.'_'.$k, $v);
			}
			foreach($wheres as $k => $v) {
				$db->bind(':'.$preffix.'_'.$k, $v);
			}
			return $db->exec();
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}

	}
	
	/**
	 * Insert row to the table
	 */
	public static function insert($table, $values) {
		
		if(!is_array($values)) {
			throw new DBException('Expecting array values, '.gettype($values).' given in '. __METHOD__, 100);
		}
		
		$preffix = rtrim($table, 's');
		$table = DB::getTable($table);
		
		$table_fields = array();
		foreach($values as $k => $v) {
			$table_fields[] = $preffix . '_' . $k;
		}
		
		$query = 'INSERT INTO 
					'.$table.' (' . ltrim(implode(',', $table_fields), ',') . ')
					VALUES (' . ':' . str_replace(':', ',:', implode(':', $table_fields)) . ')
				';
				
		try {
			$db = new DB;
			$db->query($query);
			foreach($values as $k => $v) {
				$db->bind(':'.$preffix.'_' . $k, $v);
			}
			$exec = $db->exec();
			return $exec ? $db->lastInsertId() : $exec;
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
		
	}
	
	/**
	 * Delete row(s) from table
	 */
	public static function delete($table, $values, $clause='AND') {
		
		if(!is_array($values)) {
			throw new DBException('Expecting array values, '.gettype($values).' given in '. __METHOD__, 100);
		}
		
		if($clause == NULL) {
			$clause = 'AND';
		}
		
		$preffix = rtrim($table, 's') . '_';
		$table = DB::getTable($table);
		$query = 'DELETE FROM '.$table.' WHERE ';
		
		$table_fields = array();
		foreach($values as $k => $v) {
			$query .= $preffix.$k.'=:'.$preffix.$k.' '.$clause.' ';
		}
		$query = rtrim($query, $clause.' ');
		
		try {
			$db = new DB;
			$db->query($query);
			foreach($values as $k => $v) {
				$db->bind(':'.$preffix.$k, $v);
			}
			return $db->exec();
		} catch(Exception $e) {
			throw new DBException($e->getMessage(), 400);
		}
		
	}
	
}

// dB class own Exception
class DBException extends Exception {}

?>