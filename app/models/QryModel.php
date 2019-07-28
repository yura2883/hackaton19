<?php

class QryModel {
	
	function __construct($ctl) {
		$this->ctl = $ctl;
	}

	function login($vars) {
		$db = DB::use($this->ctl);

		$snils = $db->filterText($vars['snils']);
		$sql = "SELECT * FROM ucheniki WHERE snils=$snils";
		if($rs = $db->query($sql)) {
			if(!($row = $rs->fetchAssoc())) {
				$_SESSION['id'] = '';
				$this->err('Пользователь не найден');
			} else {
				foreach($row as $k=>$v) $_SESSION[$k] = $v;
				$this->out(['ok'=>1]);
			}
		} else $this->err($db->lastError(), $sql);
		
	}

	function quickFind_uch_zaved($vars) {
		$db = DB::use($this->ctl);

		$ph = $vars['ph'];
		$wh0 = [];
		$limit = '';
		if($ph == 1) {
			// выбор по коду
			$id = $db->filterNumber($vars['v']);
			$wh0[] = "t1.id=$id";

		} elseif($ph == 2) {
			// поиск по тексту
			$v = $db->filterText($vars['v'], 1);
			$wh0[] = $db->sqlPredicateText('t1.uch_zaved', $v);
			$limit = 'limit 500';
		} else {
			// вывод по системе рекомендаций (с limit)
			$limit = 'limit 500';
		}
		
		$where = count($wh0) ? ' WHERE ' . implode(' AND ', $wh0) : '';

		$sql = "SELECT t1.id, t1.uch_zaved, t2.obr_uchr_tip, t1.reiting
		FROM uch_zaved t1 
		inner join obr_uchr_tipy t2 on t1.tip_uchr=t2.id
		$where
		order by reiting desc, t1.uch_zaved
		$limit";
		if($rs=$db->query($sql)) {
			$this->out($rs->fetchAll()->getJsTable());
		} else $this->err($db->lastError(), $sql);
	}

	function quickFind_kursy($vars) {
		$db = DB::use($this->ctl);

		$ph = $vars['ph'];
		$uch_zaved_id = $db->filterNumber($vars['uch_zaved_id'], 1);

		$wh0 = [];

		if($uch_zaved_id) $wh0[] = 't1.uch_zaved_id = ' . $uch_zaved_id;

		$limit = '';
		if($ph == 1) {
			// выбор по коду
			$id = $db->filterNumber($vars['v']);
			$wh0[] = "t1.id=$id";

		} elseif($ph == 2) {
			// поиск по тексту
			$v = $db->filterText($vars['v'], 1);
			$wh0[] = $db->sqlPredicateText('t1.kurs', $v);
			$limit = 'limit 500';
		} else {
			// вывод по системе рекомендаций (с limit)
			$limit = 'limit 500';
		}
		
		$where = count($wh0) ? ' WHERE ' . implode(' AND ', $wh0) : '';

		$sql = "SELECT t1.id, t1.kurs
		FROM kursy t1 
		$where
		order by t1.kurs
		$limit";
		if($rs=$db->query($sql)) {
			$this->out($rs->fetchAll()->getJsTable());
		} else $this->err($db->lastError(), $sql);
	}

	function quickFind_professii($vars) {
		$db = DB::use($this->ctl);

		$ph = $vars['ph'];
		$wh0 = [];
		$limit = '';
		if($ph == 1) {
			// выбор по коду
			$id = $db->filterNumber($vars['v']);
			$wh0[] = "t1.id=$id";

		} elseif($ph == 2) {
			// поиск по тексту
			$v = $db->filterText($vars['v'], 1);
			$wh0[] = $db->sqlPredicateText('t1.professiya', $v);
			$limit = 'limit 500';
		} else {
			// вывод по системе рекомендаций (с limit)
			$limit = 'limit 500';
		}
		
		$where = count($wh0) ? ' WHERE ' . implode(' AND ', $wh0) : '';

		$sql = "SELECT t1.id, t1.professiya
		FROM professii t1 
		$where
		order by t1.professiya
		$limit";
		if($rs=$db->query($sql)) {
			$this->out($rs->fetchAll()->getJsTable());
		} else $this->err($db->lastError(), $sql);
	}

	function addMyKurs($vars) {
		$db = DB::use($this->ctl);
		$data_okonch = $db->filterDate($vars['data_okonch']);
		$kursy_id = $db->filterNumber($vars['kursy_id']);
		$ucheniki_id = $db->filterNumber($_SESSION['id']);
		$sql = "INSERT INTO proydennye_kursy(ucheniki_id, kursy_id, data_okonch) SELECT $ucheniki_id, $kursy_id, $data_okonch";
		if($db->query($sql)) {
			$this->out(['ok'=>1]);
		} else $this->err($db->lastError(), $sql);
	}

	function addMyZapros($vars) {
		$db = DB::use($this->ctl);
		$ucheniki_id = $db->filterNumber($_SESSION['id']);
		$data_zaprosa = 'current_date';
		$professii_id = $db->filterNumber($vars['professii_id']);
		$sql = "INSERT INTO zaprosy_uchenikov(ucheniki_id, data_zaprosa, professii_id) SELECT $ucheniki_id, $data_zaprosa, $professii_id RETURNING id";
		if($rs=$db->query($sql)) {
			list($zapros_id) = $rs->fetchRow();

			// расчет и запись траектории !!!
			$az = new Alexz();
			
			// входной набор компетенций
			$p = [];
			$sql = "SELECT distinct t1.kompetencii_id
			from komp_kursov t1 
			inner join kursy t2 on t1.kurs_id=t2.id
			inner join proydennye_kursy t3 on t2.id=t3.kursy_id
			where t3.ucheniki_id=$ucheniki_id";
			if($rs=$db->query($sql)) while(list($id) = $rs->fetchRow()) $p[] = $id;
			else $this->err($db->lastError(), $sql);
			
			// выходной набор (из запроса)
			$r = [];
			$sql = "SELECT kompetencii_id from komp_professii where professii_id=$professii_id";
			if($rs=$db->query($sql)) while(list($id) = $rs->fetchRow()) $r[] = $id;
			else $this->err($db->lastError(), $sql);

			// матрица всех входов/выходов из курсов                     !! некая функция веса 
			$sql = "SELECT t1.vhod, t1.kurs_id, t1.kompetencii_id, coalesce(t2.chasov, 24) ves from komp_kursov t1 inner join kursy t2 on t1.kurs_id=t2.id";
			if($rs=$db->query($sql)) {
				$kurs = [];
				while($row = $rs->fetchAssoc()) {
					if(!$kurs['kurs_id']) $kurs[$row['kurs_id']] = [
						'vh'=> [],
						'vy'=> [],
						'ves'=> $kurs['ves']
					];
					$kurs[$row['kurs_id']][$row['vhod']==1 ? 'vh' : 'vy'][] = $row['kompetencii_id'];
				}
			} else $this->err($db->lastError(), $sql);
			$trek = $az->trek($p, $r, $kurs);

			// $this->out(['p'=>$p, 'r'=>$r, 'kurs'=>$kurs]); return;

			$mc = 10; $i = 0;
			foreach($trek as $trk) {
				// для каждой траектории
				$i ++;
				$ves = $db->filterNumber($trk['st']);
				$sql = "INSERT INTO traektorii(zapros_id, ves) SELECT $zapros_id, $ves RETURNING id";
				if($rs=$db->query($sql)) list($traektorii_id) = $rs->fetchRow();
				
				$sql = ''; $n = 0; 
				foreach($trk['trek'] as $kursy_id) {
					$n ++;
					$sql .= "INSERT INTO kursy_traektoriy(traektorii_id, kursy_id, order_) SELECT $traektorii_id, $kursy_id, $n;";
				}
				if(!$db->query($sql)) $this->err($db->lastError(), $sql);

				if($i > $mc) break;
			}

			$this->out(['ok'=>1]);
		} else $this->err($db->lastError(), $sql);
	}

	function load_MyZaprosy($vars) {
		$db = DB::use($this->ctl);
		$ucheniki_id = $db->filterNumber($_SESSION['id']);

		$sql = "SELECT t1.id, t1.professii_id, t1.data_zaprosa, t2.professiya, t1.id zapros_id
		from zaprosy_uchenikov t1
		inner join professii t2 on t1.professii_id=t2.id
		where t1.ucheniki_id=$ucheniki_id
		order by t1.data_zaprosa desc limit 501";

		if($rs=$db->query($sql)) {
			$this->out($rs->fetchAll()->getJsTable());
		} else $this->err($db->lastError(), $sql);
	}

	function err($msg = null, $debug = null) {
		$this->out(['errText'=>$msg, 'debug'=>$debug]);
		die();
	}

	function out($ret = null) {
		$view = new View($this->ctl);
		echo $ret ? $view->ToJS($ret) : 'null';
	}
}