<?php


class DB {


    static function use($ctl) {
        if(!$ctl->application->dbdb) {
            $db = new YupDB('pgsql');
            if($db->connect([
                'host'=> 'localhost',
                'uid'=> 'hackers',
                'pwd'=> '12321',
                'db'=> 'hakaton19'
            ])) {
                $ctl->application->db = $db;
            }
        }
        return $ctl->application->db;
    }

}