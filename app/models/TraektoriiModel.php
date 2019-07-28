<?php

class TraektoriiModel {
	use MixinDB;

	function __construct($ctl) {
		$this->ctl=$ctl;
		$this->db = DB::use($ctl);
	}

	function getMy($zapros_id) {
		// пройденные учеником курсы
		$db = $this->db;

		// получаем группы (сами траектории) Называем "Траектория 1" и т.д.
		$sql = "SELECT id, ves
		FROM traektorii 
		where zapros_id=$zapros_id
		order by ves";

		$ret = [];
		if($rs = $db->query($sql)) {
			while($traekt = $rs->fetchAssoc()) {
				$traektorii_id = $traekt['id'];
				$sql = "SELECT t2.kurs, t3.uch_zaved
				from kursy_traektoriy t1 
				inner join kursy t2 on t1.kursy_id=t2.id
				inner join uch_zaved t3 on t2.uch_zaved_id=t3.id
				where traektorii_id=$traektorii_id
				order by t1.order_";
				if($rs2 = $db->query($sql)) {
					$traekt['kursy'] = [];
					while($kursy = $rs2->fetchAssoc()) $traekt['kursy'][] = $kursy;
				} else $this->err($db->lastError(), $sql);
				$ret[] = $traekt;
			}

			return $ret;
		} else $this->err($db->lastError(), $sql);
	}

	function getTarget($zapros_id) {
		$db = $this->db;
		$sql = "SELECT professiya from professii t1 inner join zaprosy_uchenikov t2 on t1.id=t2.professii_id where t2.id=$zapros_id";
		if($rs=$db->query($sql)) list($ret) = $rs->fetchRow();
		else $this->err($db->lastError(), $sql);
		return $ret;
	}
}