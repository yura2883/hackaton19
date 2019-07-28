<?php
define('LIB_PATH', '../../library/');
define('APP_PATH', '../app/');
define('APP_CONFIG', 'app.ini');
define('APP_ENV', (isset($_SERVER['APP_ENV']) ? $_SERVER['APP_ENV'] : "PROD")); 
//define(APP_ENV, 'PROD');

set_include_path(get_include_path().PATH_SEPARATOR.LIB_PATH.PATH_SEPARATOR.APP_PATH.'models/');
include 'YupUTF/Application.php';

try {
   $app = new Application(APP_ENV);
   $app->run();
} catch(Exception $e) {
   $app->handleException($e);
}



