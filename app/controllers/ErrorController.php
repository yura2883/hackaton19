<?php

class ErrorController extends Controller {
         
   function errorAction($msg) {
      $app = $this->application;
      
      if($app->env == 'DEV') {
         header('Content-Type: text/html; charset=UTF-8');
         echo '<pre style="font-size:11px">';
         print_r($this->exception);
         echo '</pre>';
      } else {
         echo 'Error (PROD env)';
      }
   }
}