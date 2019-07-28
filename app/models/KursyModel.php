<?php

class KursyModel {
	use MixinDB;

	function __construct($ctl) {
		$this->ctl=$ctl;
		$this->db = DB::use($ctl);
	}

	function getMy($ucheniki_id) {
		// пройденные учениеом курсы
		$db = $this->db;

		// получаем группы (заведения)
		$sql = "SELECT t2.uch_zaved_id, t3.uch_zaved
		FROM proydennye_kursy t1
		inner join kursy t2 on t1.kursy_id=t2.id
		inner join uch_zaved t3 on t2.uch_zaved_id=t3.id
		where t1.ucheniki_id=$ucheniki_id
		group by t2.uch_zaved_id, t3.uch_zaved
		order by t3.uch_zaved";

		$ret = [];
		if($rs = $db->query($sql)) {
			while($uz = $rs->fetchAssoc()) {

				$sql = "SELECT t1.kurs, t1.chasov, t2.data_okonch
				from kursy t1 inner join proydennye_kursy t2 on t1.id=t2.kursy_id

				where t1.uch_zaved_id=" . $uz['uch_zaved_id'] . " and t2.ucheniki_id=$ucheniki_id
				order by t1.kurs";
				if($rs2 = $db->query($sql)) {
					$uz['kursy'] = [];
					while($kursy = $rs2->fetchAssoc()) $uz['kursy'][] = $kursy;
				} else $this->err($db->lastError(), $sql);
				$ret[] = $uz;
			}

			return $ret;
		} else $this->err($db->lastError(), $sql);
	}
}