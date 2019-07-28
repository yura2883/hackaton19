<?php


trait MixinDB {
	function err($msg, $dbg = null) {
		echo $msg . '<br>';
		if($dbg) {
			echo '<pre>';
			print_r($dbg);
			echo '</pre>';
		}
	}
}