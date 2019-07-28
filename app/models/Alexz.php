<?php
class Alexz {

   function trek($p,$r,$kurs){

    function pt($p,$vh,$kurs){
      //print_r($vh);
      $b=array();
      for ($i=0 ; $i<count($vh);$i++){
        $st=$vh[$i];
        if (!in_array($st,$p)){  
          foreach ($kurs as $j=>$kk){
          //for($j=0;$j<count($kurs);$j++){
            if (in_array($st,$kk['vy'])){
              //$b[]=$j;
              //$posl=count($b)-1;
              $b[]=array_merge(pt($p,$kk['vh'],$kurs),array($j));

              //print_r($b);
            }
          }
        }
      }

      return $b;
    }
    $a=pt($p,$r,$kurs);

    for ($i=0;$i<count($a);$i++){

  //print_r($a[$i]);    
      $result = [];
      array_walk_recursive($a[$i], function ($item, $key) use (&$result) {
          $result[] =$item;    
      });
      
      $stoim=0;
      foreach ($result as $j=>$kk)

      //for ($j=0,$stoim=0;$j<count($result);$j++)
      {
        //echo $result[$j];
        //print_r($result);
        $stoim+=$kurs[$result[$j]]['ves'];
        //echo "ooo";
        //$result[$j]=$kurs[$result[$j]]['kod'];
      }

      $a[$i]=array('trek'=>$result,'st'=>$stoim);

    }

    function cmp($a,$b){
        if ($a['st'] == $b['st']) {
            return 0;
        }
        return ($a['st'] < $b['st']) ? -1 : 1;
    }
    
    usort($a, "cmp");
    return $a;
  }


}