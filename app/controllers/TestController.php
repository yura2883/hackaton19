<?php


class TestController extends Controller {
	
	/*
	пробная модель
	 */
	function alexzAction() {
		$az = new Alexz();

		$p=array(1,2,3); // входной набор компетенций
		$r=array(1,2,5); // выходной набор компетенций

		$kurs=[ // набор курсов vh - входные компетенции vy - выходные компетенции , ves - вес
			0=>array('vh'=>[1,3],'vy'=>[4,5],'ves'=>4),
			55=>array('vh'=>[1,7],'vy'=>[3,6],'ves'=>3),
			44=>array('vh'=>[3,8],'vy'=>[18,4,5],'ves'=>2),
			20=>array('vh'=>[2,7],'vy'=>[2,8,5],'ves'=>1),
			150=>array('vh'=>[3,7],'vy'=>[2,4,5],'ves'=>5),
			3=>array('vh'=>[1,3],'vy'=>[1,7],'ves'=>1)
		];




		print_r($az->trek($p,$r,$kurs));

	}

	function dbAction() {
		$db = DB::use($this);
		if(!$db->query("UPDATE proydennye_kursy SET kursy_id=13 where id=1;
		UPDATE proydennye_kursy SET kursy_id=14 where id=1")) echo $db->lastError();

	}
}