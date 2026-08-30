DROP INDEX "patients_abha_idx";--> statement-breakpoint
ALTER TABLE "abdm_records" ALTER COLUMN "fhir_json" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "purposes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "clinical_examination" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "abha_number" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "abha_address" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "emergency_contact" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "accessibility_needs" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "red_flag_alerts" ALTER COLUMN "patient_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "user_id" varchar(64);--> statement-breakpoint
CREATE INDEX "patients_user_idx" ON "patients" USING btree ("user_id");