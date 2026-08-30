CREATE SEQUENCE "public"."appointment_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."mk_patient_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."queue_token_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "abdm_records" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"fhir_json" jsonb NOT NULL,
	"hip_name" varchar(256) NOT NULL,
	"hip_id" varchar(128) NOT NULL,
	"record_date" date NOT NULL,
	"is_simulated" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_summaries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(32) NOT NULL,
	"patient_snapshot" text NOT NULL,
	"chief_complaint" text NOT NULL,
	"history_of_present_illness" text NOT NULL,
	"relevant_past_history" jsonb NOT NULL,
	"surgical_history" jsonb NOT NULL,
	"medication_history" jsonb NOT NULL,
	"allergies" jsonb NOT NULL,
	"family_history" jsonb NOT NULL,
	"personal_history" jsonb NOT NULL,
	"review_of_systems" jsonb NOT NULL,
	"previous_investigations" jsonb NOT NULL,
	"ayush_assessment_summary" text,
	"red_flags_detected" jsonb NOT NULL,
	"missing_information" jsonb NOT NULL,
	"confidence_overall" double precision NOT NULL,
	"provenance_summary" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"physician_verified_at" timestamp with time zone,
	"verified_by_doctor_id" varchar(128),
	"doctor_notes" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"appointment_number" varchar(64) NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"practitioner_id" varchar(64) NOT NULL,
	"department_id" varchar(64) NOT NULL,
	"hospital_id" varchar(64) NOT NULL,
	"slot_date" date NOT NULL,
	"slot_time" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"booked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "appointments_appointment_number_unique" UNIQUE("appointment_number")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"correlation_id" varchar(128) NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"actor_role" varchar(32) NOT NULL,
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" varchar(128) NOT NULL,
	"details" jsonb NOT NULL,
	"ip_address" varchar(64) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ayush_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"prakriti" jsonb NOT NULL,
	"vikriti" jsonb NOT NULL,
	"dashavidha" jsonb NOT NULL,
	"agni" varchar(32) NOT NULL,
	"koshtha" varchar(32) NOT NULL,
	"ahara" text NOT NULL,
	"vihara" text NOT NULL,
	"nidana" jsonb NOT NULL,
	"samprapti_summary" text
);
--> statement-breakpoint
CREATE TABLE "clinical_answers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"question_id" varchar(128) NOT NULL,
	"question_text" text NOT NULL,
	"answer_text" text NOT NULL,
	"input_mode" varchar(16) NOT NULL,
	"voice_transcript" text,
	"confidence" double precision NOT NULL,
	"red_flag_flagged" boolean DEFAULT false NOT NULL,
	"provenance" varchar(32) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"appointment_id" varchar(64) NOT NULL,
	"department_id" varchar(64) NOT NULL,
	"is_ayush" boolean NOT NULL,
	"status" varchar(32) NOT NULL,
	"chief_complaint" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"red_flag_triggered" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"version" varchar(32) NOT NULL,
	"purposes" jsonb NOT NULL,
	"status" varchar(32) NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(64) NOT NULL,
	"signature_type" varchar(32) NOT NULL,
	CONSTRAINT "consents_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"appointment_id" varchar(64) NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"practitioner_id" varchar(64) NOT NULL,
	"ai_summary_id" varchar(64) NOT NULL,
	"clinical_examination" jsonb NOT NULL,
	"assessment" text NOT NULL,
	"final_diagnosis" jsonb NOT NULL,
	"ayush_chikitsa_sutra" text,
	"follow_up_date" date NOT NULL,
	"diet_lifestyle_advice" jsonb NOT NULL,
	"status" varchar(32) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"hospital_id" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(32) NOT NULL,
	"is_ayush" boolean NOT NULL,
	"ayush_branch" varchar(32),
	"description" text NOT NULL,
	"icon_name" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_ocr_results" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"document_id" varchar(64) NOT NULL,
	"raw_text" text NOT NULL,
	"confidence" double precision NOT NULL,
	"processing_time_ms" integer NOT NULL,
	"extracted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(32) NOT NULL,
	"type" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(32) NOT NULL,
	"active_opd_count" integer NOT NULL,
	"current_queue_length" integer NOT NULL,
	CONSTRAINT "hospitals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"integration_type" varchar(32) NOT NULL,
	"direction" varchar(16) NOT NULL,
	"endpoint" text NOT NULL,
	"status" varchar(32) NOT NULL,
	"latency_ms" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb NOT NULL,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigation_orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"consultation_id" varchar(64) NOT NULL,
	"test_name" varchar(256) NOT NULL,
	"category" varchar(32) NOT NULL,
	"priority" varchar(16) NOT NULL,
	"instructions" text NOT NULL,
	"status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_documents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"file_type" varchar(32) NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"thumbnail_url" text,
	"uploaded_at" timestamp with time zone NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_entities" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"document_id" varchar(64),
	"session_id" varchar(64),
	"patient_id" varchar(64) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"value" varchar(256),
	"unit" varchar(64),
	"dosage" varchar(128),
	"frequency" varchar(128),
	"route" varchar(64),
	"duration" varchar(64),
	"reference_range" varchar(128),
	"is_abnormal" boolean,
	"abnormal_direction" varchar(16),
	"confidence" double precision NOT NULL,
	"source_text_snippet" text NOT NULL,
	"provenance" varchar(32) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by_doctor" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"channel" varchar(16) NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"mk_patient_id" varchar(64) NOT NULL,
	"abha_number" varchar(32) NOT NULL,
	"abha_address" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"age" integer NOT NULL,
	"dob" date NOT NULL,
	"gender" varchar(16) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"emergency_contact" jsonb NOT NULL,
	"language" varchar(16) NOT NULL,
	"accessibility_needs" jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"registered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "patients_mk_patient_id_unique" UNIQUE("mk_patient_id")
);
--> statement-breakpoint
CREATE TABLE "practitioners" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"hospital_id" varchar(64) NOT NULL,
	"department_id" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"title" varchar(64) NOT NULL,
	"specialty" varchar(128) NOT NULL,
	"qualifications" varchar(256) NOT NULL,
	"room_number" varchar(32) NOT NULL,
	"experience_years" integer NOT NULL,
	"opd_timing" varchar(64) NOT NULL,
	"is_available" boolean NOT NULL,
	"avg_consultation_mins" integer NOT NULL,
	"active_queue_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"consultation_id" varchar(64) NOT NULL,
	"medicine_name" varchar(256) NOT NULL,
	"type" varchar(32) NOT NULL,
	"form" varchar(32) NOT NULL,
	"dosage" varchar(128) NOT NULL,
	"frequency" varchar(128) NOT NULL,
	"duration_days" integer NOT NULL,
	"anupana" varchar(128),
	"instructions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_tokens" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"token_number" varchar(32) NOT NULL,
	"appointment_id" varchar(64) NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"practitioner_id" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"priority" varchar(16) NOT NULL,
	"estimated_wait_mins" integer NOT NULL,
	"check_in_time" timestamp with time zone NOT NULL,
	"called_time" timestamp with time zone,
	"completed_time" timestamp with time zone,
	CONSTRAINT "queue_tokens_token_number_unique" UNIQUE("token_number")
);
--> statement-breakpoint
CREATE TABLE "red_flag_alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"token_number" varchar(32) NOT NULL,
	"patient_name" varchar(256) NOT NULL,
	"age" integer NOT NULL,
	"gender" varchar(16) NOT NULL,
	"trigger_rule" varchar(128) NOT NULL,
	"trigger_input" text NOT NULL,
	"severity" varchar(32) NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"status" varchar(32) NOT NULL,
	"acknowledged_by" varchar(256),
	"acknowledged_at" timestamp with time zone,
	"clinical_action_taken" text
);
--> statement-breakpoint
CREATE TABLE "system_health" (
	"service" varchar(128) PRIMARY KEY NOT NULL,
	"status" varchar(32) NOT NULL,
	"latency_ms" integer NOT NULL,
	"last_check" timestamp with time zone NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"patient_id" varchar(64) NOT NULL,
	"date" date NOT NULL,
	"title" varchar(256) NOT NULL,
	"category" varchar(32) NOT NULL,
	"institution" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"key_entities" jsonb NOT NULL,
	"document_id" varchar(64),
	"provenance" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"username" varchar(128) NOT NULL,
	"password_hash" varchar(512) NOT NULL,
	"role" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "abdm_records_patient_idx" ON "abdm_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "ai_summaries_session_idx" ON "ai_summaries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_practitioner_idx" ON "appointments" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "clinical_answers_session_idx" ON "clinical_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "clinical_sessions_patient_idx" ON "clinical_sessions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consultations_patient_idx" ON "consultations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medical_documents_patient_idx" ON "medical_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medical_entities_patient_idx" ON "medical_entities" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medical_entities_document_idx" ON "medical_entities" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "notifications_patient_idx" ON "notifications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patients_abha_idx" ON "patients" USING btree ("abha_number");--> statement-breakpoint
CREATE INDEX "prescription_items_consultation_idx" ON "prescription_items" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "queue_tokens_practitioner_status_idx" ON "queue_tokens" USING btree ("practitioner_id","status");--> statement-breakpoint
CREATE INDEX "red_flag_alerts_status_idx" ON "red_flag_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timeline_events_patient_idx" ON "timeline_events" USING btree ("patient_id");