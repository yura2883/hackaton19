<?php

class MyController extends Controller {
    
	function _init() {
		session_start();
		$view = new View($this);
		$view->firstRoute = ($v = $app->routeChain[0]) ? $v : $app->route;
		// страницы должны быть авторизованы
		if(!$_SESSION['id']) $this->application->routeTo('auth/login', $this)->stop();

		$this->view = $view;
	}

	function kursyAction() {
		
		$view = $this->view;
		$view->placeHolder('title', 'Учебный профиль');

		$km = new KursyModel($this);
		$view->kursy = $km->getMy($_SESSION['id']);

		$view->captureStart('body_content');
		$view->render();
		$view->captureEnd('body_content');

		$this->application->routeTo('layout/main', $this);
	}

	function zaprosyAction() {

		$view = $this->view;
		$view->placeHolder('title', 'Мои запросы');


		$view->captureStart('body_content');
		$view->render();
		$view->captureEnd('body_content');

		$this->application->routeTo('layout/main', $this);
	}

	function traektoryAction($zapros_id) {
		$view = $this->view;
		$view->placeHolder('title', 'Мои траектории');

		$tm = new TraektoriiModel($this);
		$view->traekt = $tm->getMy($zapros_id);
		$view->target = $tm->getTarget($zapros_id);

		$view->captureStart('body_content');
		$view->render();
		$view->captureEnd('body_content');

		$this->application->routeTo('layout/main', $this);
	}
}