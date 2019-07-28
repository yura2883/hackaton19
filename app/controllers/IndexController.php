<?php

class IndexController extends Controller {
         
	function indexAction() {
		session_start();
		$view = new View($this);
		$view->firstRoute = ($v = $app->routeChain[0]) ? $v : $app->route;
		
		$view->placeHolder('title', 'Моя траектория.рф');

		$view->captureStart('body_content');
		$view->render();
		$view->captureEnd('body_content');

		$this->view = $view;

		$this->application->routeTo('layout/main', $this);
	}
}