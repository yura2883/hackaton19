<?php

class QryController extends Controller {
	
	function indexAction() {
		session_start();
		$query = $_POST['__yupQueryName'];
		$vars = $_POST;

		$qm = new QryModel($this);
		$qm->$query($vars);
	}
}