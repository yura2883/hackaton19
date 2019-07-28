CREATE TABLE "uch_zaved" (
"id" serial4 NOT NULL,
"tip_uchr" int2 NOT NULL,
"reiting" int2,
"uch_zaved" varchar(512) NOT NULL,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "ucheniki" (
"id" serial4 NOT NULL,
"imya" varchar(255),
"otchestvo" varchar(255),
"familiya" varchar(255) NOT NULL,
"snils" varchar(20),
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "kursy" (
"id" serial4 NOT NULL,
"kurs" varchar(512),
"chasov" int2,
"srok_nachala" date NOT NULL,
"srok_okonch" date,
"uch_zaved_id" int4 NOT NULL,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "obr_uchr_tipy" (
"id" int NOT NULL,
"obr_uchr_tip" varchar(255),
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
COMMENT ON TABLE "obr_uchr_tipy" IS 'ВУЗ
Школа
СПО (лицеи, колл.)
Музыкально-спортивно-художеств. школы
Прочие';

CREATE TABLE "professii" (
"id" serial4 NOT NULL,
"professiya" varchar(512) NOT NULL,
"data_izchezn" date,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
COMMENT ON TABLE "professii" IS 'общее образование
профессии';

CREATE TABLE "komp_kursov" (
"id" serial4 NOT NULL,
"vhod" int2 NOT NULL DEFAULT 0,
"kurs_id" int4 NOT NULL,
"kompetencii_id" int4,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
COMMENT ON COLUMN "komp_kursov"."vhod" IS '1 - входящий';

CREATE TABLE "kompetencii" (
"id" serial4 NOT NULL,
"parent_id" int4,
"kompetencia" varchar(512),
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "proydennye_kursy" (
"id" serial4 NOT NULL,
"ucheniki_id" int4 NOT NULL,
"kursy_id" int4 NOT NULL,
"data_okonch" date,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "komp_professii" (
"id" serial4 NOT NULL,
"professii_id" int4 NOT NULL,
"kompetencii_id" int4 NOT NULL,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "zaprosy_uchenikov" (
"id" serial4 NOT NULL,
"ucheniki_id" int4 NOT NULL,
"data_zaprosa" date NOT NULL,
"professii_id" int4 NOT NULL,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "traektorii" (
"id" serial4 NOT NULL,
"zapros_id" int4 NOT NULL,
"ves" int2 NOT NULL,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "kursy_traektoriy" (
"id" serial4 NOT NULL,
"traektorii_id" int4 NOT NULL,
"kursy_id" int4 NOT NULL,
"order_" int2,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;

ALTER TABLE "uch_zaved" ADD CONSTRAINT "fk_obr_uchr_obr_uchr_tipy_1" FOREIGN KEY ("tip_uchr") REFERENCES "obr_uchr_tipy" ("id");
ALTER TABLE "kursy" ADD CONSTRAINT "fk_kursy_uch_zaved_1" FOREIGN KEY ("uch_zaved_id") REFERENCES "uch_zaved" ("id");
ALTER TABLE "komp_kursov" ADD CONSTRAINT "fk_komp_kursov_kursy_1" FOREIGN KEY ("kurs_id") REFERENCES "kursy" ("id");
ALTER TABLE "komp_kursov" ADD CONSTRAINT "fk_komp_kursov_kompetencii_1" FOREIGN KEY ("kompetencii_id") REFERENCES "kompetencii" ("id");
ALTER TABLE "proydennye_kursy" ADD CONSTRAINT "fk_proydennye_kursy_ucheniki_1" FOREIGN KEY ("ucheniki_id") REFERENCES "ucheniki" ("id");
ALTER TABLE "proydennye_kursy" ADD CONSTRAINT "fk_proydennye_kursy_kursy_1" FOREIGN KEY ("kursy_id") REFERENCES "kursy" ("id");
ALTER TABLE "komp_professii" ADD CONSTRAINT "fk_komp_professii_kompetencii_1" FOREIGN KEY ("kompetencii_id") REFERENCES "kompetencii" ("id");
ALTER TABLE "komp_professii" ADD CONSTRAINT "fk_komp_professii_professii_1" FOREIGN KEY ("professii_id") REFERENCES "professii" ("id");
ALTER TABLE "zaprosy_uchenikov" ADD CONSTRAINT "fk_zaprosy_uchenikov_ucheniki_1" FOREIGN KEY ("ucheniki_id") REFERENCES "ucheniki" ("id");
ALTER TABLE "traektorii" ADD CONSTRAINT "fk_traektorii_zaprosy_uchenikov_1" FOREIGN KEY ("zapros_id") REFERENCES "zaprosy_uchenikov" ("id");
ALTER TABLE "kursy_traektoriy" ADD CONSTRAINT "fk_kursy_traektoriy_traektorii_1" FOREIGN KEY ("traektorii_id") REFERENCES "traektorii" ("id");
ALTER TABLE "kursy_traektoriy" ADD CONSTRAINT "fk_kursy_traektoriy_kursy_1" FOREIGN KEY ("kursy_id") REFERENCES "kursy" ("id");
ALTER TABLE "zaprosy_uchenikov" ADD CONSTRAINT "fk_zaprosy_uchenikov_professii_1" FOREIGN KEY ("professii_id") REFERENCES "professii" ("id");

