<?php

class LayoutController extends Controller {
	
	function _init() {
		session_start();
		$this->view = ($this->caller && $this->caller->view) ? $this->caller->view : new View($this);
	}

	function mainAction() {
		header('Content-type: text/html; charset=UTF-8');
		$view = $this->view;


		$view->placeHolder('basePath', ($v=$view->basePath) ? $v : '/');


		$what = 'header';
		$view->captureStart($what);
		$view->render("$what.phtml");
		$view->captureEnd($what);

		$what = 'body';
		$view->captureStart($what);
		$view->render("$what.phtml");
		$view->captureEnd($what);

		$view->render();
	}
}