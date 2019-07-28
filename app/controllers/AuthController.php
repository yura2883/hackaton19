<?php

class AuthController extends Controller {

	function loginAction() {
		$view = new View($this);
		$app = $this->application;
		$view->firstRoute = ($v = $app->routeChain[0]) ? $v : $app->route;

		$view->placeHolder('title', 'Авторизация');
		
		$view->captureStart('body_content');
		$view->render();
		$view->captureEnd('body_content');

		$this->view = $view;

		$this->application->routeTo('layout/main', $this);
	}

	function logoutAction() {
		session_start();
		$_SESSION['id'] = '';
		header('Location: /');
	}
}