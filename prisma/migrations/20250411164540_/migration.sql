-- AlterTable
CREATE SEQUENCE courseelements_order_seq;
ALTER TABLE "CourseElements" ALTER COLUMN "order" SET DEFAULT nextval('courseelements_order_seq');
ALTER SEQUENCE courseelements_order_seq OWNED BY "CourseElements"."order";
